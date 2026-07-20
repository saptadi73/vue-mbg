import { apiRequest } from '@/services/http'
import {
  mockComplaints,
  mockFeedbackDetails,
  mockFeedbackItems,
  mockFeedbackSubmissions,
  mockFeedbackSummary,
  mockServiceQualityScores,
} from '@/services/mock-data'
import type {
  ComplaintRecord,
  FeedbackDetailRecord,
  FeedbackItemRecord,
  FeedbackSubmissionRecord,
  FeedbackSummaryRecord,
  ServiceQualityScoreRecord,
} from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

const recalculateFeedbackSummary = (): FeedbackSummaryRecord => {
  const submissionCount = mockFeedbackSubmissions.length
  const complaintCount = mockComplaints.length
  const serviceQualityScoreCount = mockServiceQualityScores.length
  const averageOverallRating =
    submissionCount > 0
      ? mockFeedbackSubmissions.reduce((sum, item) => sum + item.overall_rating, 0) / submissionCount
      : 0
  const averageAcceptanceRate =
    submissionCount > 0
      ? mockFeedbackSubmissions.reduce((sum, item) => sum + Number(item.acceptance_rate || 0), 0) / submissionCount
      : 0
  const averageFoodWaste =
    submissionCount > 0
      ? mockFeedbackSubmissions.reduce((sum, item) => sum + Number(item.food_waste_portions || 0), 0) / submissionCount
      : 0
  const averageServiceQualityScore =
    serviceQualityScoreCount > 0
      ? mockServiceQualityScores.reduce((sum, item) => sum + item.total_score, 0) / serviceQualityScoreCount
      : 0

  mockFeedbackSummary.submission_count = submissionCount
  mockFeedbackSummary.complaint_count = complaintCount
  mockFeedbackSummary.service_quality_score_count = serviceQualityScoreCount
  mockFeedbackSummary.average_overall_rating = Number(averageOverallRating.toFixed(2))
  mockFeedbackSummary.average_acceptance_rate = Number(averageAcceptanceRate.toFixed(2))
  mockFeedbackSummary.average_food_waste = Number(averageFoodWaste.toFixed(2))
  mockFeedbackSummary.average_service_quality_score = Number(averageServiceQualityScore.toFixed(2))
  mockFeedbackSummary.open_complaint_count = mockComplaints.filter((item) => item.resolution_status === 'OPEN').length
  mockFeedbackSummary.resolved_complaint_count = mockComplaints.filter((item) => item.resolution_status === 'RESOLVED').length
  mockFeedbackSummary.high_severity_complaint_count = mockComplaints.filter((item) => item.severity === 'HIGH').length

  return mockFeedbackSummary
}

const syncFeedbackDetail = (submissionId: string) => {
  const submission = mockFeedbackSubmissions.find((item) => item.id === submissionId)
  if (!submission) return

  const detail = mockFeedbackDetails.find((item) => item.submission.id === submissionId)
  const items = mockFeedbackItems.filter((item) => item.feedback_submission_id === submissionId)
  const complaints = mockComplaints.filter((item) => item.feedback_submission_id === submissionId)

  if (detail) {
    detail.submission = submission
    detail.items = items
    detail.complaints = complaints
    return
  }

  mockFeedbackDetails.unshift({
    submission,
    items,
    complaints,
  })
}

export const getFeedbackSummary = async () => {
  try {
    const payload = await apiRequest<FeedbackSummaryRecord>('/api/v1/feedback/summary')
    return payload.data
  } catch {
    return recalculateFeedbackSummary()
  }
}

export const getFeedbackSubmissions = async () => {
  try {
    const payload = await apiRequest<FeedbackSubmissionRecord[]>('/api/v1/feedback/submissions')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockFeedbackSubmissions, total: mockFeedbackSubmissions.length }
  }
}

export const getFeedbackSubmissionById = async (submissionId: string) => {
  try {
    const payload = await apiRequest<FeedbackDetailRecord>(`/api/v1/feedback/submissions/${submissionId}`)
    return payload.data
  } catch {
    syncFeedbackDetail(submissionId)
    return ensureRecord(
      mockFeedbackDetails.find((item) => item.submission.id === submissionId) || mockFeedbackDetails[0],
      'Feedback submission tidak ditemukan.',
    )
  }
}

export const createFeedbackSubmission = async (input: Omit<FeedbackSubmissionRecord, 'id' | 'school_name'> & { items: Omit<FeedbackItemRecord, 'id' | 'feedback_submission_id'>[] }) => {
  try {
    const payload = await apiRequest<FeedbackDetailRecord>('/api/v1/feedback/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const schoolName =
      mockFeedbackDetails.find((item) => item.submission.school_id === input.school_id)?.submission.school_name ||
      mockComplaints.find((item) => item.school_id === input.school_id)?.school_name ||
      undefined

    const submission: FeedbackSubmissionRecord = {
      ...input,
      id: `feedback-${Date.now()}`,
      school_name: schoolName,
    }
    const items: FeedbackItemRecord[] = input.items.map((item, index) => ({
      ...item,
      id: `feedback-item-${Date.now()}-${index + 1}`,
      feedback_submission_id: submission.id,
    }))

    mockFeedbackSubmissions.unshift(submission)
    mockFeedbackItems.unshift(...items)
    syncFeedbackDetail(submission.id)
    recalculateFeedbackSummary()

    return ensureRecord(
      mockFeedbackDetails.find((item) => item.submission.id === submission.id),
      'Feedback submission gagal disimpan.',
    )
  }
}

export const getComplaints = async () => {
  try {
    const payload = await apiRequest<ComplaintRecord[]>('/api/v1/feedback/complaints')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockComplaints, total: mockComplaints.length }
  }
}

export const createComplaint = async (input: Omit<ComplaintRecord, 'id' | 'school_name'>) => {
  try {
    const payload = await apiRequest<ComplaintRecord>('/api/v1/feedback/complaints', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const submission = input.feedback_submission_id
      ? mockFeedbackSubmissions.find((item) => item.id === input.feedback_submission_id)
      : undefined
    const record: ComplaintRecord = {
      ...input,
      id: `complaint-${Date.now()}`,
      school_name: submission?.school_name || null,
    }

    mockComplaints.unshift(record)
    if (submission) {
      syncFeedbackDetail(submission.id)
    }
    recalculateFeedbackSummary()
    return record
  }
}

export const getServiceQualityScores = async () => {
  try {
    const payload = await apiRequest<ServiceQualityScoreRecord[]>('/api/v1/feedback/service-quality-scores')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockServiceQualityScores, total: mockServiceQualityScores.length }
  }
}

export const createServiceQualityScore = async (input: Omit<ServiceQualityScoreRecord, 'id' | 'sppg_name'>) => {
  try {
    const payload = await apiRequest<ServiceQualityScoreRecord>('/api/v1/feedback/service-quality-scores', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record: ServiceQualityScoreRecord = {
      ...input,
      id: `sqs-${Date.now()}`,
      sppg_name: null,
    }
    mockServiceQualityScores.unshift(record)
    recalculateFeedbackSummary()
    return record
  }
}

import { apiRequest } from '@/services/http'
import {
  mockQualityInspectionDetails,
  mockQualityInspectionLines,
  mockQualityInspections,
} from '@/services/mock-data'
import type {
  QualityInspectionDetailRecord,
  QualityInspectionLineRecord,
  QualityInspectionRecord,
} from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

const syncInspectionDetail = (inspectionId: string) => {
  const inspection = mockQualityInspections.find((item) => item.id === inspectionId)
  if (!inspection) return

  const detail = mockQualityInspectionDetails.find((item) => item.inspection.id === inspectionId)
  const lines = mockQualityInspectionLines.filter((item) => item.inspection_id === inspectionId)

  if (detail) {
    detail.inspection = inspection
    detail.lines = lines
    return
  }

  mockQualityInspectionDetails.unshift({
    inspection,
    lines,
  })
}

const recalculateInspectionResult = (inspectionId: string) => {
  const inspection = mockQualityInspections.find((item) => item.id === inspectionId)
  if (!inspection) return

  const lines = mockQualityInspectionLines.filter((item) => item.inspection_id === inspectionId)
  if (lines.length === 0) {
    inspection.overall_result = null
    inspection.status = 'DRAFT'
  } else if (lines.some((item) => item.result_status === 'FAIL')) {
    inspection.overall_result = 'FAILED'
  } else {
    inspection.overall_result = 'PASSED'
  }

  syncInspectionDetail(inspectionId)
}

export const getQualityInspections = async () => {
  try {
    const payload = await apiRequest<QualityInspectionRecord[]>('/api/v1/quality/inspections/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockQualityInspections, total: mockQualityInspections.length }
  }
}

export const getQualityInspectionById = async (inspectionId: string) => {
  try {
    const payload = await apiRequest<QualityInspectionDetailRecord>(`/api/v1/quality/inspections/${inspectionId}`)
    return payload.data
  } catch {
    syncInspectionDetail(inspectionId)
    return ensureRecord(
      mockQualityInspectionDetails.find((item) => item.inspection.id === inspectionId) || mockQualityInspectionDetails[0],
      'Inspection tidak ditemukan.',
    )
  }
}

export const createQualityInspection = async (input: Omit<QualityInspectionRecord, 'id' | 'inspection_number' | 'status' | 'overall_result'>) => {
  try {
    const payload = await apiRequest<QualityInspectionRecord>('/api/v1/quality/inspections/', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record: QualityInspectionRecord = {
      ...input,
      id: `qc-${Date.now()}`,
      inspection_number: `QC-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(mockQualityInspections.length + 1).padStart(4, '0')}`,
      status: 'DRAFT',
      overall_result: null,
    }

    mockQualityInspections.unshift(record)
    syncInspectionDetail(record.id)
    return record
  }
}

export const addQualityInspectionLine = async (
  inspectionId: string,
  input: Omit<QualityInspectionLineRecord, 'id' | 'inspection_id'>,
) => {
  try {
    const payload = await apiRequest<QualityInspectionDetailRecord>(`/api/v1/quality/inspections/${inspectionId}/lines`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const inspection = ensureRecord(
      mockQualityInspections.find((item) => item.id === inspectionId),
      'Inspection tidak ditemukan.',
    )
    if (inspection.status === 'FINAL') {
      throw new Error('Inspection yang sudah final tidak dapat ditambah line lagi.')
    }

    const line: QualityInspectionLineRecord = {
      ...input,
      id: `qc-line-${Date.now()}`,
      inspection_id: inspectionId,
    }

    mockQualityInspectionLines.unshift(line)
    recalculateInspectionResult(inspectionId)
    return getQualityInspectionById(inspectionId)
  }
}

export const finalizeQualityInspection = async (inspectionId: string) => {
  try {
    const payload = await apiRequest<QualityInspectionDetailRecord>(`/api/v1/quality/inspections/${inspectionId}/finalize`, {
      method: 'POST',
    })
    return payload.data
  } catch {
    const inspection = ensureRecord(
      mockQualityInspections.find((item) => item.id === inspectionId),
      'Inspection tidak ditemukan.',
    )
    const lines = mockQualityInspectionLines.filter((item) => item.inspection_id === inspectionId)
    if (lines.length === 0) {
      throw new Error('Inspection minimal harus memiliki satu line sebelum difinalisasi.')
    }

    inspection.status = 'FINAL'
    inspection.overall_result = lines.some((item) => item.result_status === 'FAIL') ? 'FAILED' : 'PASSED'
    syncInspectionDetail(inspectionId)
    return getQualityInspectionById(inspectionId)
  }
}

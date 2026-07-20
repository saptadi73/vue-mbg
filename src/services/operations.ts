import { apiRequest } from '@/services/http'
import {
  mockBudgets,
  mockCashFlow,
  mockFefoPreviewResults,
  mockGovernmentClaimDetails,
  mockGovernmentClaims,
  mockGovernmentReceivableAging,
  mockInventory,
  mockInventoryBatches,
  mockInvestorFundingPositions,
  mockMealPlans,
  mockRoiBySppg,
} from '@/services/mock-data'
import type {
  BudgetSummary,
  CashFlowRecord,
  FefoPreviewResult,
  GovernmentClaimAdjustmentRecord,
  GovernmentClaimDetailRecord,
  GovernmentClaimPaymentRecord,
  GovernmentClaimRecord,
  GovernmentReceivableAgingRecord,
  InventoryBalance,
  InventoryBatchRecord,
  InvestorFundingPositionRecord,
  MealPlan,
  RoiBySppgRecord,
} from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

export const getMealPlans = async () => {
  try {
    const payload = await apiRequest<MealPlan[]>('/api/v1/meal-plans/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockMealPlans, total: mockMealPlans.length }
  }
}

export const getInventoryBalances = async () => {
  try {
    const payload = await apiRequest<InventoryBalance[]>('/api/v1/inventory/balances/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockInventory, total: mockInventory.length }
  }
}

export const getInventoryExpiryAlerts = async () => {
  try {
    const payload = await apiRequest<InventoryBatchRecord[]>('/api/v1/inventory/expiry-alerts')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    const items = [...mockInventoryBatches].sort((left, right) => left.expiry_date.localeCompare(right.expiry_date))
    return { items, total: items.length }
  }
}

export const previewFefo = async (input: { product_name: string; warehouse_id: string; required_quantity: number }) => {
  try {
    const payload = await apiRequest<FefoPreviewResult>('/api/v1/inventory/issues/fefo-preview', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const fallback =
      mockFefoPreviewResults.find(
        (item) => item.product_name === input.product_name && item.warehouse_id === input.warehouse_id,
      ) || mockFefoPreviewResults[0]

    if (!fallback) {
      throw new Error('FEFO preview mock belum tersedia.')
    }

    let fulfilled = 0
    const candidates = fallback.candidate_batches.map((batch) => {
      const remaining = Math.max(input.required_quantity - fulfilled, 0)
      const allocated = Math.min(batch.quantity_available, remaining)
      fulfilled += allocated
      return {
        ...batch,
        allocated_quantity: allocated,
      }
    })

    return {
      ...fallback,
      product_name: input.product_name,
      warehouse_id: input.warehouse_id,
      warehouse_name: fallback.warehouse_name,
      required_quantity: input.required_quantity,
      fulfilled_quantity: fulfilled,
      shortage_quantity: Math.max(input.required_quantity - fulfilled, 0),
      candidate_batches: candidates.filter((item) => item.allocated_quantity > 0),
    }
  }
}

export const getBudgets = async () => {
  try {
    const payload = await apiRequest<BudgetSummary[]>('/api/v1/budgets')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockBudgets, total: mockBudgets.length }
  }
}

export const getGovernmentClaims = async () => {
  try {
    const payload = await apiRequest<GovernmentClaimRecord[]>('/api/v1/government-claims')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockGovernmentClaims, total: mockGovernmentClaims.length }
  }
}

export const getGovernmentClaimById = async (claimId: string) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>(`/api/v1/government-claims/${claimId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockGovernmentClaimDetails.find((item) => item.claim.id === claimId) || mockGovernmentClaimDetails[0],
      'Government claim tidak ditemukan.',
    )
  }
}

export const createGovernmentClaim = async (input: {
  claim_date: string
  claim_type: string
  notes: string
  delivery_order_ids: string[]
}) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>('/api/v1/government-claims', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const reference = ensureRecord(
      mockGovernmentClaimDetails[0],
      'Government claim mock reference belum tersedia.',
    )
    const nextNumber = `CLM-20260720-${String(mockGovernmentClaims.length + 1).padStart(4, '0')}`
    const id = `claim-${Date.now()}`
    const detail: GovernmentClaimDetailRecord = {
      claim: {
        id,
        claim_number: nextNumber,
        claim_date: input.claim_date,
        claim_type: input.claim_type,
        status: 'DRAFT',
        claimed_amount: reference.claim.claimed_amount,
        approved_amount: 0,
        paid_amount: 0,
        outstanding_amount: reference.claim.claimed_amount,
        delivery_count: input.delivery_order_ids.length,
        notes: input.notes,
      },
      lines: reference.lines.map((line, index) => ({
        ...line,
        id: `${id}-line-${index + 1}`,
        delivery_order_number: input.delivery_order_ids[index] || line.delivery_order_number,
      })),
      evidence: [...reference.evidence],
      adjustments: [],
      payments: [],
      workflow: {
        id: `${id}-workflow`,
        document_type: 'government_claim',
        document_id: id,
        current_state: 'DRAFT',
        business_status: 'DRAFT',
        approval_requests: [],
        history: [
          {
            id: `${id}-history-1`,
            state: 'DRAFT',
            action_name: 'Create Claim',
            actor_name: 'ERP MBG Frontend',
            created_at: '2026-07-20T10:30:00Z',
            notes: 'Draft government claim dibuat dari delivery order terpilih.',
          },
        ],
      },
    }

    mockGovernmentClaims.unshift(detail.claim)
    mockGovernmentClaimDetails.unshift(detail)
    return detail
  }
}

export const submitGovernmentClaim = async (claimId: string) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>(`/api/v1/government-claims/${claimId}/submit`, {
      method: 'POST',
    })
    return payload.data
  } catch {
    const detail = await getGovernmentClaimById(claimId)
    detail.claim.status = 'SUBMITTED'
    if (detail.workflow) {
      detail.workflow.current_state = 'SUBMITTED'
      detail.workflow.business_status = 'SUBMITTED'
      detail.workflow.approval_requests = [
        {
          id: `${claimId}-approval-request`,
          title: `Verifikasi Government Claim ${detail.claim.claim_number}`,
          approver_name: 'Nadia Puspita',
          approver_role: 'finance_manager',
          status: 'PENDING',
          requested_at: '2026-07-20T10:45:00Z',
        },
      ]
      detail.workflow.history.unshift({
        id: `${claimId}-submit-history`,
        state: 'SUBMITTED',
        action_name: 'Submit Claim',
        actor_name: 'ERP MBG Frontend',
        created_at: '2026-07-20T10:45:00Z',
        notes: 'Claim diajukan ke proses verifikasi.',
      })
    }
    const summary = mockGovernmentClaims.find((item) => item.id === claimId)
    if (summary) summary.status = 'SUBMITTED'
    return detail
  }
}

export const verifyGovernmentClaim = async (claimId: string) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>(`/api/v1/government-claims/${claimId}/verify`, {
      method: 'POST',
    })
    return payload.data
  } catch {
    const detail = await getGovernmentClaimById(claimId)
    const approvedAmount = detail.claim.claimed_amount + detail.adjustments.reduce((sum, item) => sum + item.amount, 0)
    detail.claim.status = 'VERIFIED'
    detail.claim.approved_amount = approvedAmount
    detail.claim.outstanding_amount = Math.max(approvedAmount - (detail.claim.paid_amount || 0), 0)
    detail.claim.verified_by = 'Nadia Puspita'
    detail.claim.verified_at = '2026-07-20T11:10:00Z'
    if (detail.workflow) {
      detail.workflow.current_state = 'VERIFIED'
      detail.workflow.business_status = 'VERIFIED'
      detail.workflow.approval_requests = []
      detail.workflow.history.unshift({
        id: `${claimId}-verify-history`,
        state: 'VERIFIED',
        action_name: 'Verify Claim',
        actor_name: 'Nadia Puspita',
        created_at: '2026-07-20T11:10:00Z',
        notes: 'Claim diverifikasi dan disetujui untuk proses pembayaran.',
      })
    }
    const summary = mockGovernmentClaims.find((item) => item.id === claimId)
    if (summary) {
      summary.status = 'VERIFIED'
      summary.approved_amount = approvedAmount
      summary.outstanding_amount = detail.claim.outstanding_amount
    }
    return detail
  }
}

export const addGovernmentClaimAdjustment = async (
  claimId: string,
  input: Omit<GovernmentClaimAdjustmentRecord, 'id'>,
) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>(`/api/v1/government-claims/${claimId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const detail = await getGovernmentClaimById(claimId)
    detail.adjustments.unshift({
      ...input,
      id: `${claimId}-adjustment-${Date.now()}`,
    })
    const approvedBase = detail.claim.status === 'VERIFIED' ? detail.claim.claimed_amount + detail.adjustments.reduce((sum, item) => sum + item.amount, 0) : detail.claim.approved_amount || 0
    if (detail.claim.status === 'VERIFIED') {
      detail.claim.approved_amount = approvedBase
      detail.claim.outstanding_amount = Math.max(approvedBase - (detail.claim.paid_amount || 0), 0)
    }
    const summary = mockGovernmentClaims.find((item) => item.id === claimId)
    if (summary && detail.claim.status === 'VERIFIED') {
      summary.approved_amount = detail.claim.approved_amount
      summary.outstanding_amount = detail.claim.outstanding_amount
    }
    return detail
  }
}

export const addGovernmentClaimPayment = async (
  claimId: string,
  input: Omit<GovernmentClaimPaymentRecord, 'id'>,
) => {
  try {
    const payload = await apiRequest<GovernmentClaimDetailRecord>(`/api/v1/government-claims/${claimId}/payments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const detail = await getGovernmentClaimById(claimId)
    detail.payments.unshift({
      ...input,
      id: `${claimId}-payment-${Date.now()}`,
    })
    detail.claim.paid_amount = (detail.claim.paid_amount || 0) + input.amount
    detail.claim.outstanding_amount = Math.max((detail.claim.approved_amount || detail.claim.claimed_amount) - (detail.claim.paid_amount || 0), 0)
    const summary = mockGovernmentClaims.find((item) => item.id === claimId)
    if (summary) {
      summary.paid_amount = detail.claim.paid_amount
      summary.outstanding_amount = detail.claim.outstanding_amount
    }
    return detail
  }
}

export const getCashFlowReport = async () => {
  try {
    const payload = await apiRequest<CashFlowRecord[]>('/api/v1/reporting/finance/cash-flow')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockCashFlow, total: mockCashFlow.length }
  }
}

export const getGovernmentReceivableAgingReport = async () => {
  try {
    const payload = await apiRequest<GovernmentReceivableAgingRecord[]>('/api/v1/reporting/finance/government-receivable-aging')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockGovernmentReceivableAging, total: mockGovernmentReceivableAging.length }
  }
}

export const getInvestorFundingPositionReport = async () => {
  try {
    const payload = await apiRequest<InvestorFundingPositionRecord[]>('/api/v1/reporting/finance/investor-funding-position')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockInvestorFundingPositions, total: mockInvestorFundingPositions.length }
  }
}

export const getRoiBySppgReport = async () => {
  try {
    const payload = await apiRequest<RoiBySppgRecord[]>('/api/v1/reporting/finance/roi-by-sppg')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockRoiBySppg, total: mockRoiBySppg.length }
  }
}

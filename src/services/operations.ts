import { apiRequest } from '@/services/http'
import {
  mockBudgets,
  mockCashFlow,
  mockDeliveryIncidents,
  mockDeliveryOrders,
  mockDeliveryProofs,
  mockFefoPreviewResults,
  mockGovernmentClaimDetails,
  mockGovernmentClaims,
  mockGovernmentReceivableAging,
  mockInventory,
  mockInventoryBatches,
  mockInvestorFundingPositions,
  mockMealPlans,
  mockRoiBySppg,
  mockSppgs,
} from '@/services/mock-data'
import type {
  BalanceSheetReport,
  BudgetSummary,
  CashFlowReport,
  CashFlowRecord,
  DeliveryPerformanceReportRecord,
  FefoPreviewResult,
  GovernmentClaimAdjustmentRecord,
  GovernmentClaimDetailRecord,
  GovernmentClaimPaymentRecord,
  GovernmentClaimRecord,
  GovernmentReceivableAgingReport,
  GovernmentReceivableAgingRecord,
  InventoryBalance,
  InventoryBatchRecord,
  InvestorFundingPositionReport,
  InvestorFundingPositionRecord,
  MealPlan,
  ProfitLossReport,
  RoiBySppgReport,
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

const buildMockCashFlowReport = (): CashFlowReport => ({
  period: {
    start_date: '2026-07-01',
    end_date: '2026-07-31',
  },
  totals: {
    cash_in: mockCashFlow.reduce((sum, item) => sum + item.cash_in, 0),
    cash_out: mockCashFlow.reduce((sum, item) => sum + item.cash_out, 0),
    net_cash_flow: mockCashFlow.reduce((sum, item) => sum + item.net_cash_flow, 0),
  },
  breakdown: mockCashFlow,
})

const buildMockGovernmentReceivableAgingReport = (): GovernmentReceivableAgingReport => ({
  as_of_date: '2026-07-20',
  totals: {
    open_claims: mockGovernmentReceivableAging.length,
    outstanding_amount: mockGovernmentReceivableAging.reduce((sum, item) => sum + item.outstanding_amount, 0),
    overdue_amount: mockGovernmentReceivableAging
      .filter((item) => item.days_outstanding > 30)
      .reduce((sum, item) => sum + item.outstanding_amount, 0),
  },
  buckets: mockGovernmentReceivableAging.reduce<Record<string, number>>((result, item) => {
    result[item.aging_bucket] = (result[item.aging_bucket] || 0) + item.outstanding_amount
    return result
  }, {}),
  items: mockGovernmentReceivableAging,
})

const buildMockInvestorFundingPositionReport = (): InvestorFundingPositionReport => ({
  as_of_date: '2026-07-20',
  totals: {
    agreements: mockInvestorFundingPositions.length,
    outstanding_principal: mockInvestorFundingPositions.reduce((sum, item) => sum + item.outstanding_principal, 0),
    realized_margin: mockInvestorFundingPositions.reduce((sum, item) => sum + item.realized_margin, 0),
  },
  items: mockInvestorFundingPositions,
})

const buildMockProfitLossReport = (): ProfitLossReport => ({
  period: {
    start_date: '2026-07-01',
    end_date: '2026-07-31',
  },
  scope: {
    tenant_id: 'tenant-demo-mbg',
    sppg_id: null,
  },
  revenue: {
    government_revenue: 42200000,
    government_cash_received: 17100000,
  },
  expenses: {
    direct_service_cost: 35200000,
    operating_expense: 820000,
    financing_expense: 440000,
    total_expense: 36460000,
    categories: [
      { category_code: 'MATERIAL_COST', category_name: 'Biaya Bahan Produksi', amount: 30100000 },
      { category_code: 'LABOR_COST', category_name: 'Biaya Tenaga Kerja', amount: 5100000 },
      { category_code: 'DEPRECIATION_EXPENSE', category_name: 'Beban Depresiasi', amount: 820000 },
      { category_code: 'FINANCING_COST', category_name: 'Biaya Pendanaan', amount: 440000 },
    ],
  },
  totals: {
    gross_surplus: 7000000,
    net_surplus: 5740000,
  },
})

const buildMockBalanceSheetReport = (): BalanceSheetReport => ({
  as_of_date: '2026-07-20',
  scope: {
    tenant_id: 'tenant-demo-mbg',
    sppg_id: null,
  },
  assets: {
    items: [
      { account_code: '110000', account_name: 'Kas dan Bank', category: 'ASSET', amount: 12500000 },
      { account_code: '130200', account_name: 'Piutang Government Claim', category: 'ASSET', amount: 10250000 },
    ],
    total_assets: 22750000,
  },
  liabilities: {
    items: [
      { account_code: '210000', account_name: 'Hutang Supplier', category: 'LIABILITY', amount: 0 },
      { account_code: '230500', account_name: 'Utang Pendanaan Investor', category: 'LIABILITY', amount: 9000000 },
    ],
    total_liabilities: 9000000,
  },
  equity: {
    items: [
      { account_code: 'RETAINED_EARNINGS', account_name: 'Surplus Ditahan', category: 'EQUITY', amount: 13750000 },
    ],
    total_equity: 13750000,
    calculated_surplus: 12000000,
  },
  totals: {
    total_assets: 22750000,
    total_liabilities: 9000000,
    total_equity: 13750000,
    total_liabilities_and_equity: 22750000,
    is_balanced: true,
  },
})

const buildMockRoiBySppgReport = (): RoiBySppgReport => ({
  period: {
    start_date: '2026-07-01',
    end_date: '2026-07-31',
  },
  totals: {
    sppg_count: mockRoiBySppg.length,
    recognized_revenue: mockRoiBySppg.reduce((sum, item) => sum + item.recognized_revenue, 0),
    total_cost: mockRoiBySppg.reduce((sum, item) => sum + item.total_cost, 0),
    gross_surplus: mockRoiBySppg.reduce((sum, item) => sum + item.gross_surplus, 0),
    average_roi_percent:
      mockRoiBySppg.length > 0
        ? mockRoiBySppg.reduce((sum, item) => sum + item.roi_percent, 0) / mockRoiBySppg.length
        : 0,
  },
  items: mockRoiBySppg,
})

export const getCashFlowReport = async (query?: { period_start?: string; period_end?: string }) => {
  try {
    const payload = await apiRequest<CashFlowReport>('/api/v1/reporting/finance/cash-flow', { query })
    return payload.data || buildMockCashFlowReport()
  } catch {
    return buildMockCashFlowReport()
  }
}

export const getProfitLossReport = async (query?: { period_start?: string; period_end?: string }) => {
  try {
    const payload = await apiRequest<ProfitLossReport>('/api/v1/reporting/finance/profit-loss', { query })
    return payload.data || buildMockProfitLossReport()
  } catch {
    return buildMockProfitLossReport()
  }
}

export const getBalanceSheetReport = async (query?: { as_of_date?: string }) => {
  try {
    const payload = await apiRequest<BalanceSheetReport>('/api/v1/reporting/finance/balance-sheet', { query })
    return payload.data || buildMockBalanceSheetReport()
  } catch {
    return buildMockBalanceSheetReport()
  }
}

export const getGovernmentReceivableAgingReport = async (query?: { as_of_date?: string }) => {
  try {
    const payload = await apiRequest<GovernmentReceivableAgingReport>('/api/v1/reporting/finance/government-receivable-aging', { query })
    return payload.data || buildMockGovernmentReceivableAgingReport()
  } catch {
    return buildMockGovernmentReceivableAgingReport()
  }
}

export const getInvestorFundingPositionReport = async (query?: { as_of_date?: string }) => {
  try {
    const payload = await apiRequest<InvestorFundingPositionReport>('/api/v1/reporting/finance/investor-funding-position', { query })
    return payload.data || buildMockInvestorFundingPositionReport()
  } catch {
    return buildMockInvestorFundingPositionReport()
  }
}

export const getRoiBySppgReport = async (query?: { period_start?: string; period_end?: string }) => {
  try {
    const payload = await apiRequest<RoiBySppgReport>('/api/v1/reporting/finance/roi-by-sppg', { query })
    return payload.data || buildMockRoiBySppgReport()
  } catch {
    return buildMockRoiBySppgReport()
  }
}

export const getDeliveryPerformanceReport = async () => {
  try {
    const payload = await apiRequest<DeliveryPerformanceReportRecord[]>('/api/v1/reporting/delivery-performance')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    const bySppg = new Map<string, DeliveryPerformanceReportRecord>()

    for (const order of mockDeliveryOrders) {
      const key = order.sppg_id
      const sppgName = mockSppgs.find((item) => item.id === order.sppg_id)?.name || order.sppg_id
      const current = bySppg.get(key) || {
        id: `delivery-performance-${key}`,
        sppg_id: key,
        sppg_name: sppgName,
        delivery_count: 0,
        delivered_count: 0,
        in_transit_count: 0,
        planned_count: 0,
        school_served_count: 0,
        total_received_portions: 0,
        total_rejected_portions: 0,
        incident_count: 0,
        on_time_count: 0,
        on_time_percentage: 0,
        latest_delivery_at: null,
      }

      current.delivery_count += 1
      if (order.status === 'IN_TRANSIT') current.in_transit_count += 1
      if (order.status === 'PLANNED') current.planned_count += 1
      if (order.status === 'RECEIVED' || order.status === 'PARTIALLY_RECEIVED') current.delivered_count += 1

      const proofs = mockDeliveryProofs.filter((item) => item.delivery_order_id === order.id)
      for (const proof of proofs) {
        current.total_received_portions += proof.received_portions
        current.total_rejected_portions += proof.rejected_portions
      }

      if (order.actual_arrival && order.actual_arrival <= order.planned_arrival) {
        current.on_time_count += 1
      }

      const incidents = mockDeliveryIncidents.filter((item) => item.delivery_order_id === order.id)
      current.incident_count += incidents.length

      const latestPoint = order.actual_arrival || order.planned_arrival
      if (!current.latest_delivery_at || latestPoint > current.latest_delivery_at) {
        current.latest_delivery_at = latestPoint
      }

      bySppg.set(key, current)
    }

    for (const report of bySppg.values()) {
      const schoolIds = new Set(
        mockDeliveryOrders.filter((item) => item.sppg_id === report.sppg_id).map((item) => item.school_id).filter(Boolean),
      )
      report.school_served_count = schoolIds.size
      report.on_time_percentage =
        report.delivered_count > 0 ? Number(((report.on_time_count / report.delivered_count) * 100).toFixed(1)) : 0
    }

    const items = [...bySppg.values()].sort((left, right) => right.delivery_count - left.delivery_count)
    return { items, total: items.length }
  }
}

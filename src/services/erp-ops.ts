import { apiRequest } from '@/services/http'
import {
  mockActualExpenses,
  mockAccounts,
  mockBudgetAvailabilities,
  mockBudgetRecords,
  mockCostPolicies,
  mockFundingAgreementDetails,
  mockFundingAgreements,
  mockFundingDisbursements,
  mockFundingRepayments,
  mockFundingSources,
  mockGoodsReceipts,
  mockGoodsReceiptDetails,
  mockJournalEntries,
  mockJournalEntryDetails,
  mockLaborCosts,
  mockMonthlyBudgetRealizations,
  mockPurchaseOrders,
  mockPurchaseOrderDetails,
  mockPurchaseRequests,
  mockPurchaseRequestDetails,
  mockProductionCostSheets,
  mockProductionOrderDetails,
  mockProductionOrders,
  mockProducts,
  mockSupplierInvoices,
  mockSupplierInvoiceDetails,
  mockSupplierPayments,
  mockSupplierPaymentDetails,
  mockSupplierPriceHistories,
  mockSupplierProducts,
  mockSuppliers,
  mockWorkflowDefinitions,
  mockWorkflowDocuments,
} from '@/services/mock-data'
import type {
  ActualExpenseRecord,
  AccountRecord,
  BudgetAvailabilityRecord,
  BudgetRecord,
  CostPolicyRecord,
  CreateBudgetPayload,
  FundingAgreementDetailRecord,
  FundingAgreementRecord,
  FundingDisbursementRecord,
  FundingRepaymentRecord,
  FundingSourceRecord,
  GoodsReceiptRecord,
  GoodsReceiptDetailRecord,
  JournalEntryDetailRecord,
  JournalEntryRecord,
  LaborCostRecord,
  MonthlyBudgetRealizationRecord,
  PurchaseOrderRecord,
  PurchaseOrderDetailRecord,
  PurchaseRequestRecord,
  PurchaseRequestDetailRecord,
  ProductionCostSheetRecord,
  ProductionOrderDetailRecord,
  ProductionOrderRecord,
  SupplierInvoiceRecord,
  SupplierInvoiceDetailRecord,
  SupplierPaymentRecord,
  SupplierPaymentDetailRecord,
  SupplierDetailRecord,
  SupplierPriceHistoryRecord,
  SupplierProductRecord,
  SupplierRecord,
  WorkflowDefinitionRecord,
  WorkflowDocumentRecord,
} from '@/types/domain'

type DocumentCreationResult<T> = {
  created: boolean
  record: T
}

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureArray = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : [])
const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

const todayIsoDate = () => '2026-07-20'

const addDays = (date: string, days: number) => {
  const base = new Date(`${date}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

const nextDocumentNumber = (prefix: string, values: string[]) => {
  const latestSequence = values.reduce((max, value) => {
    const match = value.match(/(\d{4})$/)
    if (!match) return max
    return Math.max(max, Number(match[1]))
  }, 0)

  return `${prefix}-${todayIsoDate().replaceAll('-', '')}-${String(latestSequence + 1).padStart(4, '0')}`
}

const cloneProcurementLines = (lines: PurchaseRequestDetailRecord['lines'], prefix: string) =>
  lines.map((line, index) => ({
    ...line,
    id: `${prefix}-ln-${Date.now()}-${index + 1}`,
  }))

const syncPurchaseRequestStatus = (purchaseRequestId: string, status: string) => {
  const summary = mockPurchaseRequests.find((item) => item.id === purchaseRequestId)
  if (summary) summary.status = status

  const detail = mockPurchaseRequestDetails.find((item) => item.purchase_request.id === purchaseRequestId)
  if (detail) detail.purchase_request.status = status
}

const syncPurchaseOrderStatus = (purchaseOrderId: string, status: string) => {
  const summary = mockPurchaseOrders.find((item) => item.id === purchaseOrderId)
  if (summary) summary.status = status

  const detail = mockPurchaseOrderDetails.find((item) => item.purchase_order.id === purchaseOrderId)
  if (detail) detail.purchase_order.status = status
}

const syncGoodsReceiptStatus = (goodsReceiptId: string, status: string) => {
  const summary = mockGoodsReceipts.find((item) => item.id === goodsReceiptId)
  if (summary) summary.status = status

  const detail = mockGoodsReceiptDetails.find((item) => item.goods_receipt.id === goodsReceiptId)
  if (detail) detail.goods_receipt.status = status
}

const syncSupplierInvoiceStatus = (supplierInvoiceId: string, status: string) => {
  const summary = mockSupplierInvoices.find((item) => item.id === supplierInvoiceId)
  if (summary) summary.status = status

  const detail = mockSupplierInvoiceDetails.find((item) => item.supplier_invoice.id === supplierInvoiceId)
  if (detail) detail.supplier_invoice.status = status
}

const syncFundingAgreement = (agreementId: string, updater: (agreement: FundingAgreementRecord) => void) => {
  const summary = mockFundingAgreements.find((item) => item.id === agreementId)
  if (summary) updater(summary)

  const detail = mockFundingAgreementDetails.find((item) => item.agreement.id === agreementId)
  if (detail) updater(detail.agreement)
}

const syncBudgetStatus = (budgetId: string, status: string) => {
  const budget = mockBudgetRecords.find((item) => item.id === budgetId)
  if (budget) {
    budget.status = status
  }
}

const findWorkflowDocument = (documentType: string, documentId: string) =>
  mockWorkflowDocuments.find((item) => item.document_type === documentType && item.document_id === documentId)

const ensureWorkflowDocument = (documentType: string, documentId: string, businessStatus: string) => {
  let workflow = findWorkflowDocument(documentType, documentId)
  if (workflow) {
    return workflow
  }

  workflow = {
    id: `wfd-${documentType}-${documentId}`,
    document_type: documentType,
    document_id: documentId,
    current_state: businessStatus,
    business_status: businessStatus,
    approval_requests: [],
    history: [],
  }
  mockWorkflowDocuments.unshift(workflow)
  return workflow
}

const nextApprovalRequestId = () => `apr-${Date.now()}`
const nextWorkflowHistoryId = () => `wfh-${Date.now()}`
const nowIsoDateTime = () => '2026-07-20T10:30:00Z'

export const getCostPolicies = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/costing/policies')
    const items = ensureArray<CostPolicyRecord>(payload.data)
    return { items: items.length ? items : mockCostPolicies, total: totalFromEnvelope(payload, items.length || mockCostPolicies.length) }
  } catch {
    return { items: mockCostPolicies, total: mockCostPolicies.length }
  }
}

export const getAccounts = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/accounts')
    const items = ensureArray<AccountRecord>(payload.data)
    return { items: items.length ? items : mockAccounts, total: totalFromEnvelope(payload, items.length || mockAccounts.length) }
  } catch {
    return { items: mockAccounts, total: mockAccounts.length }
  }
}

export const createAccount = async (input: Omit<AccountRecord, 'id'>) => {
  try {
    const payload = await apiRequest<AccountRecord>('/api/v1/accounts', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record = {
      ...input,
      id: `acc-${input.code}`,
    }
    mockAccounts.unshift(record)
    return record
  }
}

export const getLaborCosts = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/labor-costs')
    const items = ensureArray<LaborCostRecord>(payload.data)
    return { items: items.length ? items : mockLaborCosts, total: totalFromEnvelope(payload, items.length || mockLaborCosts.length) }
  } catch {
    return { items: mockLaborCosts, total: mockLaborCosts.length }
  }
}

export const createLaborCost = async (input: Omit<LaborCostRecord, 'id' | 'total_cost'>) => {
  try {
    const payload = await apiRequest<LaborCostRecord>('/api/v1/workforce/labor-costs', {
      method: 'POST',
      body: JSON.stringify({
        work_date: input.work_date,
        sppg_id: input.sppg_id,
        employee_count: input.employee_count,
        hours_worked: input.hours_worked,
        hourly_rate: input.hourly_rate,
        notes: input.notes,
      }),
    })
    return payload.data
  } catch {
    return {
      ...input,
      id: `mock-labor-${Date.now()}`,
      total_cost: input.hours_worked * input.hourly_rate,
      status: 'DRAFT',
    }
  }
}

export const getActualExpenses = async () => {
  return {
    items: mockActualExpenses,
    total: mockActualExpenses.length,
  }
}

export const createActualExpense = async (input: Omit<ActualExpenseRecord, 'id'>) => {
  return {
    ...input,
    id: `mock-expense-${Date.now()}`,
  }
}

export const getBudgetRecords = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/budgets')
    const items = ensureArray<BudgetRecord>(payload.data)
    return { items: items.length ? items : mockBudgetRecords, total: totalFromEnvelope(payload, items.length || mockBudgetRecords.length) }
  } catch {
    return { items: mockBudgetRecords, total: mockBudgetRecords.length }
  }
}

export const getBudgetById = async (budgetId: string) => {
  try {
    const payload = await apiRequest<BudgetRecord>(`/api/v1/budgets/${budgetId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockBudgetRecords.find((item) => item.id === budgetId) || mockBudgetRecords[0],
      'Budget tidak ditemukan.',
    )
  }
}

export const getBudgetAvailability = async (budgetId: string) => {
  try {
    const payload = await apiRequest<BudgetAvailabilityRecord>(`/api/v1/budgets/${budgetId}/availability`)
    return payload.data
  } catch {
    return ensureRecord(
      mockBudgetAvailabilities.find((item) => item.budget_id === budgetId),
      'Availability budget tidak ditemukan.',
    )
  }
}

export const getMonthlyBudgetRealizations = async (budgetId?: string) => {
  try {
    const query = budgetId ? `?budget_id=${encodeURIComponent(budgetId)}` : ''
    const payload = await apiRequest<unknown>(`/api/v1/platform/read-models/monthly-budget-realizations${query}`)
    const items = ensureArray<MonthlyBudgetRealizationRecord>(payload.data)
    const filteredItems = budgetId ? items.filter((item) => item.budget_id === budgetId) : items
    const fallbackItems = budgetId
      ? mockMonthlyBudgetRealizations.filter((item) => item.budget_id === budgetId)
      : mockMonthlyBudgetRealizations
    return {
      items: filteredItems.length ? filteredItems : fallbackItems,
      total: totalFromEnvelope(payload, filteredItems.length || fallbackItems.length),
    }
  } catch {
    const items = budgetId
      ? mockMonthlyBudgetRealizations.filter((item) => item.budget_id === budgetId)
      : mockMonthlyBudgetRealizations
    return { items, total: items.length }
  }
}

export const refreshMonthlyBudgetRealizations = async () => {
  try {
    await apiRequest('/api/v1/platform/read-models/monthly-budget-realizations/refresh', {
      method: 'POST',
    })
    return { refreshed: true }
  } catch {
    return { refreshed: false }
  }
}

export const createBudgetRecord = async (input: CreateBudgetPayload) => {
  try {
    const payload = await apiRequest<BudgetRecord>('/api/v1/budgets', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const effectiveBudget = input.lines.reduce((sum, line) => sum + line.planned_amount, 0)
    return {
      id: `mock-budget-${Date.now()}`,
      name: input.name,
      date_start: input.date_start,
      date_end: input.date_end,
      status: 'DRAFT',
      effective_budget: effectiveBudget,
      available_budget: effectiveBudget,
      notes: input.notes,
      lines: input.lines.map((line, index) => ({
        id: `mock-budget-line-${index + 1}`,
        account_code: line.account_code,
        account_name: line.account_name,
        planned_amount: line.planned_amount,
        reserved_amount: 0,
        committed_amount: 0,
        actual_amount: 0,
        available_budget: line.planned_amount,
      })),
    }
  }
}

export const submitBudgetRecord = async (budgetId: string) => {
  try {
    const payload = await apiRequest<BudgetRecord>(`/api/v1/budgets/${budgetId}/submit`, {
      method: 'POST',
    })
    return payload.data
  } catch {
    const budget = ensureRecord(
      mockBudgetRecords.find((item) => item.id === budgetId),
      'Budget tidak ditemukan.',
    )

    if (budget.status !== 'DRAFT') {
      throw new Error('Budget hanya bisa disubmit dari status DRAFT.')
    }

    budget.status = 'SUBMITTED'
    const workflow = ensureWorkflowDocument('budget', budgetId, 'SUBMITTED')
    workflow.current_state = 'SUBMITTED'
    workflow.business_status = 'SUBMITTED'

    const existingPending = workflow.approval_requests.find((item) => item.status === 'PENDING')
    if (!existingPending) {
      workflow.approval_requests.unshift({
        id: nextApprovalRequestId(),
        title: budget.name,
        approver_name: 'Nadia Puspita',
        approver_role: 'tenant_admin',
        status: 'PENDING',
        requested_at: nowIsoDateTime(),
        due_at: '2026-07-21T10:00:00Z',
      })
    }

    workflow.history.unshift({
      id: nextWorkflowHistoryId(),
      state: 'SUBMITTED',
      action_name: 'Submit Budget',
      actor_name: 'ERP MBG Frontend',
      created_at: nowIsoDateTime(),
      notes: 'Budget dikirim ke workflow approval.',
    })

    return budget
  }
}

export const approveBudgetRecord = async (budgetId: string, notes?: string) => {
  try {
    const payload = await apiRequest<BudgetRecord>(`/api/v1/budgets/${budgetId}/approve`, {
      method: 'POST',
      body: JSON.stringify(notes ? { notes } : {}),
    })
    return payload.data
  } catch {
    const budget = ensureRecord(
      mockBudgetRecords.find((item) => item.id === budgetId),
      'Budget tidak ditemukan.',
    )

    if (budget.status !== 'SUBMITTED') {
      throw new Error('Budget hanya bisa diapprove dari status SUBMITTED.')
    }

    budget.status = 'APPROVED'
    const workflow = ensureWorkflowDocument('budget', budgetId, 'APPROVED')
    workflow.current_state = 'APPROVED'
    workflow.business_status = 'APPROVED'
    workflow.approval_requests = workflow.approval_requests.map((item) =>
      item.status === 'PENDING'
        ? {
            ...item,
            status: 'APPROVED',
          }
        : item,
    )
    workflow.history.unshift({
      id: nextWorkflowHistoryId(),
      state: 'APPROVED',
      action_name: 'Approve Budget',
      actor_name: 'ERP MBG Frontend',
      created_at: nowIsoDateTime(),
      notes: notes || 'Budget disetujui.',
    })

    return budget
  }
}

export const rejectBudgetRecord = async (budgetId: string, notes?: string) => {
  const budget = ensureRecord(
    mockBudgetRecords.find((item) => item.id === budgetId),
    'Budget tidak ditemukan.',
  )

  if (budget.status !== 'SUBMITTED') {
    throw new Error('Budget hanya bisa direject dari status SUBMITTED.')
  }

  budget.status = 'REJECTED'
  const workflow = ensureWorkflowDocument('budget', budgetId, 'REJECTED')
  workflow.current_state = 'REJECTED'
  workflow.business_status = 'REJECTED'
  workflow.approval_requests = workflow.approval_requests.map((item) =>
    item.status === 'PENDING'
      ? {
          ...item,
          status: 'REJECTED',
        }
      : item,
  )
  workflow.history.unshift({
    id: nextWorkflowHistoryId(),
    state: 'REJECTED',
    action_name: 'Reject Budget',
    actor_name: 'ERP MBG Frontend',
    created_at: nowIsoDateTime(),
    notes: notes || 'Budget perlu revisi.',
  })

  return budget
}

export const getWorkflowDefinitions = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workflows/definitions')
    const items = ensureArray<WorkflowDefinitionRecord>(payload.data)
    return { items: items.length ? items : mockWorkflowDefinitions, total: totalFromEnvelope(payload, items.length || mockWorkflowDefinitions.length) }
  } catch {
    return { items: mockWorkflowDefinitions, total: mockWorkflowDefinitions.length }
  }
}

export const getWorkflowDocuments = async () => {
  return {
    items: mockWorkflowDocuments,
    total: mockWorkflowDocuments.length,
  }
}

export const decideApprovalRequest = async (
  approvalRequestId: string,
  decision: 'APPROVED' | 'REJECTED',
  notes?: string,
) => {
  try {
    const payload = await apiRequest<WorkflowDocumentRecord>(
      `/api/v1/workflows/approval-requests/${approvalRequestId}/decisions`,
      {
        method: 'POST',
        body: JSON.stringify({
          decision,
          notes,
        }),
      },
    )
    return payload.data
  } catch {
    const workflow = ensureRecord(
      mockWorkflowDocuments.find((document) =>
        document.approval_requests.some((request) => request.id === approvalRequestId),
      ),
      'Approval request tidak ditemukan.',
    )

    const request = ensureRecord(
      workflow.approval_requests.find((item) => item.id === approvalRequestId),
      'Approval request tidak ditemukan.',
    )

    if (request.status !== 'PENDING') {
      throw new Error('Approval request sudah tidak pending.')
    }

    request.status = decision
    workflow.current_state = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    workflow.business_status = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    workflow.history.unshift({
      id: nextWorkflowHistoryId(),
      state: workflow.current_state,
      action_name: decision === 'APPROVED' ? 'Approval Decision' : 'Rejection Decision',
      actor_name: 'ERP MBG Frontend',
      created_at: nowIsoDateTime(),
      notes: notes || (decision === 'APPROVED' ? 'Dokumen disetujui.' : 'Dokumen ditolak untuk revisi.'),
    })

    if (workflow.document_type === 'budget') {
      syncBudgetStatus(workflow.document_id, decision)
    }

    return workflow
  }
}

export const getProductionOrders = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/production-orders/')
    const items = ensureArray<ProductionOrderRecord>(payload.data)
    return { items: items.length ? items : mockProductionOrders, total: totalFromEnvelope(payload, items.length || mockProductionOrders.length) }
  } catch {
    return { items: mockProductionOrders, total: mockProductionOrders.length }
  }
}

export const getProductionCostSheet = async (productionOrderId: string) => {
  try {
    const payload = await apiRequest<ProductionCostSheetRecord>(`/api/v1/production-orders/${productionOrderId}/cost-sheet`)
    return payload.data
  } catch {
    return mockProductionCostSheets.find((item) => item.production_order_id === productionOrderId) || mockProductionCostSheets[0]
  }
}

export const getProductionOrderById = async (productionOrderId: string) => {
  try {
    const payload = await apiRequest<ProductionOrderDetailRecord>(`/api/v1/production-orders/${productionOrderId}`)
    return payload.data
  } catch {
    return (
      mockProductionOrderDetails.find((item) => item.production_order.id === productionOrderId) ||
      mockProductionOrderDetails[0]
    )
  }
}

export const getSuppliers = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/suppliers')
    const items = ensureArray<SupplierRecord>(payload.data)
    return { items: items.length ? items : mockSuppliers, total: totalFromEnvelope(payload, items.length || mockSuppliers.length) }
  } catch {
    return { items: mockSuppliers, total: mockSuppliers.length }
  }
}

export const getSupplierById = async (supplierId: string) => {
  try {
    const payload = await apiRequest<SupplierDetailRecord>(
      `/api/v1/procurement/purchase-requests/suppliers/${supplierId}`,
    )
    return payload.data
  } catch {
    const supplier = ensureRecord(
      mockSuppliers.find((item) => item.id === supplierId) || mockSuppliers[0],
      'Supplier tidak ditemukan.',
    )

    return {
      supplier,
      supplier_products: mockSupplierProducts.filter((item) => item.supplier_id === supplier.id),
      price_histories: mockSupplierPriceHistories.filter((history) =>
        mockSupplierProducts.some(
          (supplierProduct) =>
            supplierProduct.id === history.supplier_product_id && supplierProduct.supplier_id === supplier.id,
        ),
      ),
      purchase_orders: mockPurchaseOrders.filter((item) => item.supplier_name === supplier.name),
    }
  }
}

export const createSupplier = async (input: Omit<SupplierRecord, 'id'>) => {
  try {
    const payload = await apiRequest<SupplierRecord>('/api/v1/procurement/purchase-requests/suppliers', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    return { ...input, id: `mock-supplier-${Date.now()}` }
  }
}

export const getSupplierProducts = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/supplier-products')
    const items = ensureArray<SupplierProductRecord>(payload.data)
    return { items: items.length ? items : mockSupplierProducts, total: totalFromEnvelope(payload, items.length || mockSupplierProducts.length) }
  } catch {
    return { items: mockSupplierProducts, total: mockSupplierProducts.length }
  }
}

export const createSupplierProduct = async (
  input: Omit<SupplierProductRecord, 'id' | 'supplier_name' | 'product_code' | 'product_name'>,
) => {
  try {
    const payload = await apiRequest<SupplierProductRecord>('/api/v1/procurement/purchase-requests/supplier-products', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const supplier = ensureRecord(mockSuppliers.find((item) => item.id === input.supplier_id), 'Supplier tidak ditemukan.')
    const product = ensureRecord(mockProducts.find((item) => item.id === input.product_id), 'Produk tidak ditemukan.')

    return {
      ...input,
      id: `mock-supplier-product-${Date.now()}`,
      supplier_name: supplier.name,
      product_code: product.code,
      product_name: product.name,
    }
  }
}

export const getSupplierPriceHistories = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/supplier-price-histories')
    const items = ensureArray<SupplierPriceHistoryRecord>(payload.data)
    return { items: items.length ? items : mockSupplierPriceHistories, total: totalFromEnvelope(payload, items.length || mockSupplierPriceHistories.length) }
  } catch {
    return { items: mockSupplierPriceHistories, total: mockSupplierPriceHistories.length }
  }
}

export const createSupplierPriceHistory = async (
  input: Omit<SupplierPriceHistoryRecord, 'id' | 'supplier_name' | 'product_name'>,
) => {
  try {
    const payload = await apiRequest<SupplierPriceHistoryRecord>('/api/v1/procurement/purchase-requests/supplier-price-histories', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const supplierProduct = ensureRecord(
      mockSupplierProducts.find((item) => item.id === input.supplier_product_id),
      'Supplier product tidak ditemukan.',
    )

    return {
      ...input,
      id: `mock-supplier-price-${Date.now()}`,
      supplier_name: supplierProduct.supplier_name,
      product_name: supplierProduct.product_name,
    }
  }
}

export const getFundingSources = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/funding/sources')
    const items = ensureArray<FundingSourceRecord>(payload.data)
    return { items: items.length ? items : mockFundingSources, total: totalFromEnvelope(payload, items.length || mockFundingSources.length) }
  } catch {
    return { items: mockFundingSources, total: mockFundingSources.length }
  }
}

export const getFundingAgreements = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/funding/agreements')
    const items = ensureArray<FundingAgreementRecord>(payload.data)
    return { items: items.length ? items : mockFundingAgreements, total: totalFromEnvelope(payload, items.length || mockFundingAgreements.length) }
  } catch {
    return { items: mockFundingAgreements, total: mockFundingAgreements.length }
  }
}

export const getFundingDisbursements = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/funding/disbursements')
    const items = ensureArray<FundingDisbursementRecord>(payload.data)
    return { items: items.length ? items : mockFundingDisbursements, total: totalFromEnvelope(payload, items.length || mockFundingDisbursements.length) }
  } catch {
    return { items: mockFundingDisbursements, total: mockFundingDisbursements.length }
  }
}

export const getFundingRepayments = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/funding/repayments')
    const items = ensureArray<FundingRepaymentRecord>(payload.data)
    return { items: items.length ? items : mockFundingRepayments, total: totalFromEnvelope(payload, items.length || mockFundingRepayments.length) }
  } catch {
    return { items: mockFundingRepayments, total: mockFundingRepayments.length }
  }
}

export const getFundingAgreementById = async (agreementId: string) => {
  try {
    const payload = await apiRequest<FundingAgreementDetailRecord>(`/api/v1/funding/agreements/${agreementId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockFundingAgreementDetails.find((item) => item.agreement.id === agreementId) || mockFundingAgreementDetails[0],
      'Funding agreement tidak ditemukan.',
    )
  }
}

export const createFundingAgreement = async (
  input: Omit<FundingAgreementRecord, 'id' | 'agreement_number' | 'funding_source_name'>,
) => {
  try {
    const payload = await apiRequest<FundingAgreementRecord>('/api/v1/funding/agreements', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const source = ensureRecord(
      mockFundingSources.find((item) => item.id === input.funding_source_id),
      'Funding source tidak ditemukan.',
    )

    return {
      ...input,
      id: `funding-agreement-${Date.now()}`,
      agreement_number: nextDocumentNumber(
        'FAGR',
        mockFundingAgreements.map((item) => item.agreement_number),
      ),
      funding_source_name: source.name,
    }
  }
}

export const createFundingDisbursement = async (
  agreementId: string,
  input: Omit<FundingDisbursementRecord, 'id' | 'agreement_id' | 'agreement_number'>,
) => {
  try {
    const payload = await apiRequest<FundingDisbursementRecord>(`/api/v1/funding/agreements/${agreementId}/disbursements`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const agreement = await getFundingAgreementById(agreementId)
    const record: FundingDisbursementRecord = {
      ...input,
      id: `funding-disbursement-${Date.now()}`,
      agreement_id: agreementId,
      agreement_number: agreement.agreement.agreement_number,
    }

    mockFundingDisbursements.unshift(record)
    const detail = mockFundingAgreementDetails.find((item) => item.agreement.id === agreementId)
    if (detail) {
      detail.disbursements.unshift(record)
      detail.principal_disbursed += record.amount
      detail.outstanding_principal += record.amount
    }
    syncFundingAgreement(agreementId, (agreementRecord) => {
      agreementRecord.status = 'ACTIVE'
    })

    return record
  }
}

export const createFundingRepayment = async (
  agreementId: string,
  input: Omit<FundingRepaymentRecord, 'id' | 'agreement_id' | 'agreement_number'>,
) => {
  try {
    const payload = await apiRequest<FundingRepaymentRecord>(`/api/v1/funding/agreements/${agreementId}/repayments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const agreement = await getFundingAgreementById(agreementId)
    const record: FundingRepaymentRecord = {
      ...input,
      id: `funding-repayment-${Date.now()}`,
      agreement_id: agreementId,
      agreement_number: agreement.agreement.agreement_number,
    }

    mockFundingRepayments.unshift(record)
    const detail = mockFundingAgreementDetails.find((item) => item.agreement.id === agreementId)
    if (detail) {
      detail.repayments.unshift(record)
      detail.principal_repaid += record.principal_amount
      detail.outstanding_principal = Math.max(detail.outstanding_principal - record.principal_amount, 0)
      detail.realized_margin += record.margin_amount
    }

    return record
  }
}

export const getPurchaseRequests = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/')
    const items = ensureArray<PurchaseRequestRecord>(payload.data)
    return { items: items.length ? items : mockPurchaseRequests, total: totalFromEnvelope(payload, items.length || mockPurchaseRequests.length) }
  } catch {
    return { items: mockPurchaseRequests, total: mockPurchaseRequests.length }
  }
}

export const getPurchaseRequestById = async (purchaseRequestId: string) => {
  try {
    const payload = await apiRequest<PurchaseRequestDetailRecord>(`/api/v1/procurement/purchase-requests/${purchaseRequestId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockPurchaseRequestDetails.find((item) => item.purchase_request.id === purchaseRequestId) || mockPurchaseRequestDetails[0],
      'Purchase request tidak ditemukan.',
    )
  }
}

export const getPurchaseOrders = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/purchase-orders/')
    const items = ensureArray<PurchaseOrderRecord>(payload.data)
    return { items: items.length ? items : mockPurchaseOrders, total: totalFromEnvelope(payload, items.length || mockPurchaseOrders.length) }
  } catch {
    return { items: mockPurchaseOrders, total: mockPurchaseOrders.length }
  }
}

export const getPurchaseOrderById = async (purchaseOrderId: string) => {
  try {
    const payload = await apiRequest<PurchaseOrderDetailRecord>(`/api/v1/procurement/purchase-requests/purchase-orders/${purchaseOrderId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockPurchaseOrderDetails.find((item) => item.purchase_order.id === purchaseOrderId) || mockPurchaseOrderDetails[0],
      'Purchase order tidak ditemukan.',
    )
  }
}

export const getGoodsReceipts = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/goods-receipts/')
    const items = ensureArray<GoodsReceiptRecord>(payload.data)
    return { items: items.length ? items : mockGoodsReceipts, total: totalFromEnvelope(payload, items.length || mockGoodsReceipts.length) }
  } catch {
    return { items: mockGoodsReceipts, total: mockGoodsReceipts.length }
  }
}

export const getGoodsReceiptById = async (goodsReceiptId: string) => {
  try {
    const payload = await apiRequest<GoodsReceiptDetailRecord>(`/api/v1/procurement/purchase-requests/goods-receipts/${goodsReceiptId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockGoodsReceiptDetails.find((item) => item.goods_receipt.id === goodsReceiptId) || mockGoodsReceiptDetails[0],
      'Goods receipt tidak ditemukan.',
    )
  }
}

export const getSupplierInvoices = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/supplier-invoices/')
    const items = ensureArray<SupplierInvoiceRecord>(payload.data)
    return { items: items.length ? items : mockSupplierInvoices, total: totalFromEnvelope(payload, items.length || mockSupplierInvoices.length) }
  } catch {
    return { items: mockSupplierInvoices, total: mockSupplierInvoices.length }
  }
}

export const getSupplierInvoiceById = async (supplierInvoiceId: string) => {
  try {
    const payload = await apiRequest<SupplierInvoiceDetailRecord>(`/api/v1/procurement/purchase-requests/supplier-invoices/${supplierInvoiceId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockSupplierInvoiceDetails.find((item) => item.supplier_invoice.id === supplierInvoiceId) || mockSupplierInvoiceDetails[0],
      'Supplier invoice tidak ditemukan.',
    )
  }
}

export const getSupplierPayments = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/procurement/purchase-requests/supplier-payments/')
    const items = ensureArray<SupplierPaymentRecord>(payload.data)
    return { items: items.length ? items : mockSupplierPayments, total: totalFromEnvelope(payload, items.length || mockSupplierPayments.length) }
  } catch {
    return { items: mockSupplierPayments, total: mockSupplierPayments.length }
  }
}

export const getSupplierPaymentById = async (supplierPaymentId: string) => {
  try {
    const payload = await apiRequest<SupplierPaymentDetailRecord>(`/api/v1/procurement/purchase-requests/supplier-payments/${supplierPaymentId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockSupplierPaymentDetails.find((item) => item.supplier_payment.id === supplierPaymentId) || mockSupplierPaymentDetails[0],
      'Supplier payment tidak ditemukan.',
    )
  }
}

export const createPurchaseOrderFromPurchaseRequest = async (
  purchaseRequestId: string,
): Promise<DocumentCreationResult<PurchaseOrderDetailRecord>> => {
  try {
    const payload = await apiRequest<PurchaseOrderDetailRecord | { id?: string; purchase_order?: { id?: string } }>(
      `/api/v1/procurement/purchase-requests/purchase-orders/from-purchase-request/${purchaseRequestId}`,
      { method: 'POST' },
    )
    const createdId =
      'purchase_order' in payload.data
        ? payload.data.purchase_order?.id
        : 'id' in payload.data
          ? payload.data.id
          : undefined

    if (createdId) {
      return { created: true, record: await getPurchaseOrderById(createdId) }
    }
  } catch {
    // fallback ke mock lokal
  }

  const source = await getPurchaseRequestById(purchaseRequestId)
  const sourceNumber = source.purchase_request.request_number
  const existing = mockPurchaseOrderDetails.find((item) => item.purchase_order.notes?.includes(sourceNumber))
  if (existing) {
    return { created: false, record: existing }
  }

  const id = `po-${Date.now()}`
  const poNumber = nextDocumentNumber(
    'PO',
    mockPurchaseOrders.map((item) => item.po_number),
  )
  const totalAmount = source.lines.reduce((sum, line) => sum + line.total_amount, 0)
  const lines = cloneProcurementLines(source.lines, 'po')
  const record: PurchaseOrderDetailRecord = {
    purchase_order: {
      id,
      po_number: poNumber,
      po_date: todayIsoDate(),
      supplier_name: source.purchase_request.supplier_name || 'Supplier Procurement',
      status: 'DRAFT',
      total_amount: totalAmount,
      expected_date: addDays(todayIsoDate(), 2),
      order_type: 'PO',
      notes: `Generated from ${sourceNumber}`,
    },
    lines,
  }

  mockPurchaseOrders.unshift({
    id,
    po_number: poNumber,
    po_date: todayIsoDate(),
    supplier_name: record.purchase_order.supplier_name,
    status: 'DRAFT',
    total_amount: totalAmount,
  })
  mockPurchaseOrderDetails.unshift(record)
  syncPurchaseRequestStatus(purchaseRequestId, 'POSTED')

  return { created: true, record }
}

export const getJournalEntries = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/journal-entries')
    const items = ensureArray<JournalEntryRecord>(payload.data)
    return { items: items.length ? items : mockJournalEntries, total: totalFromEnvelope(payload, items.length || mockJournalEntries.length) }
  } catch {
    return { items: mockJournalEntries, total: mockJournalEntries.length }
  }
}

export const getJournalEntryById = async (journalEntryId: string) => {
  try {
    const payload = await apiRequest<JournalEntryDetailRecord>(`/api/v1/journal-entries/${journalEntryId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockJournalEntryDetails.find((item) => item.journal_entry.id === journalEntryId) || mockJournalEntryDetails[0],
      'Journal entry tidak ditemukan.',
    )
  }
}

export const createJournalEntry = async (input: {
  entry_date: string
  reference: string
  description: string
  source_module: string
  source_document_type?: string | null
  source_document_id?: string | null
  lines: Array<{
    account_code: string
    account_name: string
    line_type: 'DEBIT' | 'CREDIT'
    amount: number
    description?: string
  }>
}) => {
  try {
    const payload = await apiRequest<JournalEntryDetailRecord>('/api/v1/journal-entries', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const totalDebit = input.lines.filter((line) => line.line_type === 'DEBIT').reduce((sum, line) => sum + line.amount, 0)
    const totalCredit = input.lines.filter((line) => line.line_type === 'CREDIT').reduce((sum, line) => sum + line.amount, 0)

    if (totalDebit !== totalCredit) {
      throw new Error('Total debit dan credit harus seimbang.')
    }

    const entryNumber = nextDocumentNumber('JE', mockJournalEntries.map((item) => item.entry_number))
    const id = `je-${Date.now()}`
    const record: JournalEntryDetailRecord = {
      journal_entry: {
        id,
        entry_number: entryNumber,
        entry_date: input.entry_date,
        reference: input.reference,
        description: input.description,
        source_module: input.source_module,
        source_document_type: input.source_document_type || null,
        source_document_id: input.source_document_id || null,
        status: 'DRAFT',
        total_debit: totalDebit,
        total_credit: totalCredit,
      },
      lines: input.lines.map((line, index) => ({
        id: `${id}-line-${index + 1}`,
        account_code: line.account_code,
        account_name: line.account_name,
        line_type: line.line_type,
        amount: line.amount,
        description: line.description,
      })),
    }

    mockJournalEntries.unshift(record.journal_entry)
    mockJournalEntryDetails.unshift(record)
    return record
  }
}

export const postJournalEntry = async (journalEntryId: string) => {
  try {
    const payload = await apiRequest<JournalEntryDetailRecord>(`/api/v1/journal-entries/${journalEntryId}/post`, {
      method: 'POST',
    })
    return payload.data
  } catch {
    const detail = ensureRecord(
      mockJournalEntryDetails.find((item) => item.journal_entry.id === journalEntryId),
      'Journal entry tidak ditemukan.',
    )

    detail.journal_entry.status = 'POSTED'
    detail.journal_entry.posted_at = '2026-07-20T14:30:00Z'
    detail.journal_entry.posted_by = 'finance.manager@mbg.local'

    const summary = mockJournalEntries.find((item) => item.id === journalEntryId)
    if (summary) {
      summary.status = 'POSTED'
      summary.posted_at = detail.journal_entry.posted_at
      summary.posted_by = detail.journal_entry.posted_by
    }

    return detail
  }
}

export const createGoodsReceiptFromPurchaseOrder = async (
  purchaseOrderId: string,
): Promise<DocumentCreationResult<GoodsReceiptDetailRecord>> => {
  try {
    const payload = await apiRequest<GoodsReceiptDetailRecord | { id?: string; goods_receipt?: { id?: string } }>(
      `/api/v1/procurement/purchase-requests/goods-receipts/from-purchase-order/${purchaseOrderId}`,
      { method: 'POST' },
    )
    const createdId =
      'goods_receipt' in payload.data
        ? payload.data.goods_receipt?.id
        : 'id' in payload.data
          ? payload.data.id
          : undefined

    if (createdId) {
      return { created: true, record: await getGoodsReceiptById(createdId) }
    }
  } catch {
    // fallback ke mock lokal
  }

  const source = await getPurchaseOrderById(purchaseOrderId)
  const sourceNumber = source.purchase_order.po_number
  const existing = mockGoodsReceiptDetails.find((item) => item.goods_receipt.source_number === sourceNumber)
  if (existing) {
    return { created: false, record: existing }
  }

  const id = `gr-${Date.now()}`
  const receiptNumber = nextDocumentNumber(
    'GR',
    mockGoodsReceipts.map((item) => item.receipt_number),
  )
  const totalAmount = source.lines.reduce((sum, line) => sum + line.total_amount, 0)
  const lines = cloneProcurementLines(source.lines, 'gr')
  const record: GoodsReceiptDetailRecord = {
    goods_receipt: {
      id,
      receipt_number: receiptNumber,
      receipt_date: todayIsoDate(),
      source_number: sourceNumber,
      status: 'DRAFT',
      total_amount: totalAmount,
      warehouse_name: 'Gudang Penerimaan Utama',
      location_name: 'Receiving Dock A',
      notes: `Generated from ${sourceNumber}`,
      committed_amount: 0,
    },
    lines,
  }

  mockGoodsReceipts.unshift({
    id,
    receipt_number: receiptNumber,
    receipt_date: todayIsoDate(),
    source_number: sourceNumber,
    status: 'DRAFT',
    total_amount: totalAmount,
  })
  mockGoodsReceiptDetails.unshift(record)
  syncPurchaseOrderStatus(purchaseOrderId, 'POSTED')

  return { created: true, record }
}

export const createSupplierInvoiceFromGoodsReceipt = async (
  goodsReceiptId: string,
): Promise<DocumentCreationResult<SupplierInvoiceDetailRecord>> => {
  try {
    const payload = await apiRequest<SupplierInvoiceDetailRecord | { id?: string; supplier_invoice?: { id?: string } }>(
      `/api/v1/procurement/purchase-requests/supplier-invoices/from-goods-receipt/${goodsReceiptId}`,
      { method: 'POST' },
    )
    const createdId =
      'supplier_invoice' in payload.data
        ? payload.data.supplier_invoice?.id
        : 'id' in payload.data
          ? payload.data.id
          : undefined

    if (createdId) {
      return { created: true, record: await getSupplierInvoiceById(createdId) }
    }
  } catch {
    // fallback ke mock lokal
  }

  const source = await getGoodsReceiptById(goodsReceiptId)
  const sourceNumber = source.goods_receipt.receipt_number
  const existing = mockSupplierInvoiceDetails.find((item) => item.supplier_invoice.goods_receipt_number === sourceNumber)
  if (existing) {
    return { created: false, record: existing }
  }

  const relatedPurchaseOrder = mockPurchaseOrders.find((item) => item.po_number === source.goods_receipt.source_number)
  const supplierName = relatedPurchaseOrder?.supplier_name || 'Supplier Procurement'
  const id = `si-${Date.now()}`
  const invoiceNumber = nextDocumentNumber(
    'INV',
    mockSupplierInvoices.map((item) => item.invoice_number),
  )
  const totalAmount = source.lines.reduce((sum, line) => sum + line.total_amount, 0)
  const lines = cloneProcurementLines(source.lines, 'si')
  const record: SupplierInvoiceDetailRecord = {
    supplier_invoice: {
      id,
      invoice_number: invoiceNumber,
      invoice_date: todayIsoDate(),
      supplier_name: supplierName,
      status: 'DRAFT',
      total_amount: totalAmount,
      due_date: addDays(todayIsoDate(), 7),
      budget_account_code: '510000',
      goods_receipt_number: sourceNumber,
      notes: `Generated from ${sourceNumber}`,
    },
    lines,
  }

  mockSupplierInvoices.unshift({
    id,
    invoice_number: invoiceNumber,
    invoice_date: todayIsoDate(),
    supplier_name: supplierName,
    status: 'DRAFT',
    total_amount: totalAmount,
  })
  mockSupplierInvoiceDetails.unshift(record)
  syncGoodsReceiptStatus(goodsReceiptId, 'POSTED')

  return { created: true, record }
}

export const createSupplierPaymentFromInvoice = async (
  supplierInvoiceId: string,
): Promise<DocumentCreationResult<SupplierPaymentDetailRecord>> => {
  try {
    const payload = await apiRequest<SupplierPaymentDetailRecord | { id?: string; supplier_payment?: { id?: string } }>(
      `/api/v1/procurement/purchase-requests/supplier-payments/from-supplier-invoice/${supplierInvoiceId}`,
      { method: 'POST' },
    )
    const createdId =
      'supplier_payment' in payload.data
        ? payload.data.supplier_payment?.id
        : 'id' in payload.data
          ? payload.data.id
          : undefined

    if (createdId) {
      return { created: true, record: await getSupplierPaymentById(createdId) }
    }
  } catch {
    // fallback ke mock lokal
  }

  const source = await getSupplierInvoiceById(supplierInvoiceId)
  const sourceNumber = source.supplier_invoice.invoice_number
  const existing = mockSupplierPaymentDetails.find((item) => item.supplier_payment.supplier_invoice_number === sourceNumber)
  if (existing) {
    return { created: false, record: existing }
  }

  const id = `sp-${Date.now()}`
  const paymentNumber = nextDocumentNumber(
    'PAY',
    mockSupplierPayments.map((item) => item.payment_number),
  )
  const record: SupplierPaymentDetailRecord = {
    supplier_payment: {
      id,
      payment_number: paymentNumber,
      payment_date: todayIsoDate(),
      supplier_name: source.supplier_invoice.supplier_name,
      status: 'DRAFT',
      amount: source.supplier_invoice.total_amount,
      supplier_invoice_number: sourceNumber,
      bank_account_code: '110000',
      notes: `Generated from ${sourceNumber}`,
    },
  }

  mockSupplierPayments.unshift({
    id,
    payment_number: paymentNumber,
    payment_date: todayIsoDate(),
    supplier_name: source.supplier_invoice.supplier_name,
    status: 'DRAFT',
    amount: source.supplier_invoice.total_amount,
  })
  mockSupplierPaymentDetails.unshift(record)
  syncSupplierInvoiceStatus(supplierInvoiceId, 'POSTED')

  return { created: true, record }
}

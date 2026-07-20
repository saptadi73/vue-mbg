import { apiRequest } from '@/services/http'
import {
  mockActualExpenses,
  mockBudgetRecords,
  mockCostPolicies,
  mockGoodsReceipts,
  mockGoodsReceiptDetails,
  mockLaborCosts,
  mockPurchaseOrders,
  mockPurchaseOrderDetails,
  mockPurchaseRequests,
  mockPurchaseRequestDetails,
  mockProductionCostSheets,
  mockProductionOrderDetails,
  mockProductionOrders,
  mockSupplierInvoices,
  mockSupplierInvoiceDetails,
  mockSupplierPayments,
  mockSupplierPaymentDetails,
  mockSuppliers,
  mockWorkflowDefinitions,
  mockWorkflowDocuments,
} from '@/services/mock-data'
import type {
  ActualExpenseRecord,
  BudgetRecord,
  CostPolicyRecord,
  CreateBudgetPayload,
  GoodsReceiptRecord,
  GoodsReceiptDetailRecord,
  LaborCostRecord,
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

export const getCostPolicies = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/costing/policies')
    const items = ensureArray<CostPolicyRecord>(payload.data)
    return { items: items.length ? items : mockCostPolicies, total: totalFromEnvelope(payload, items.length || mockCostPolicies.length) }
  } catch {
    return { items: mockCostPolicies, total: mockCostPolicies.length }
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

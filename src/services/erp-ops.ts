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

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureArray = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : [])

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
    return mockPurchaseRequestDetails.find((item) => item.purchase_request.id === purchaseRequestId) || mockPurchaseRequestDetails[0]
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
    return mockPurchaseOrderDetails.find((item) => item.purchase_order.id === purchaseOrderId) || mockPurchaseOrderDetails[0]
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
    return mockGoodsReceiptDetails.find((item) => item.goods_receipt.id === goodsReceiptId) || mockGoodsReceiptDetails[0]
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
    return mockSupplierInvoiceDetails.find((item) => item.supplier_invoice.id === supplierInvoiceId) || mockSupplierInvoiceDetails[0]
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
    return mockSupplierPaymentDetails.find((item) => item.supplier_payment.id === supplierPaymentId) || mockSupplierPaymentDetails[0]
  }
}

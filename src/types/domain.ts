export interface ContextOption {
  id: string
  label: string
  subtitle?: string
}

export interface UserProfile {
  name: string
  role: string
  tenantName: string
  avatar: string
  email?: string
}

export interface IdentityMeResponse {
  id?: string
  full_name?: string
  email?: string
  tenant_id: string
  active_sppg_id: string
  accessible_sppg_ids: string[]
  role_names?: string[]
  roles?: string[]
}

export interface UserRecord {
  id: string
  full_name: string
  email: string
  role_names: string[]
  is_active: boolean
  active_sppg_id?: string | null
  accessible_sppg_ids?: string[]
  created_at?: string
}

export interface CreateUserPayload {
  tenant_id: string
  full_name: string
  email: string
  password: string
  role_names: string[]
  is_active: boolean
  accessible_sppg_ids: string[]
  active_sppg_id: string
}

export interface TenantRecord {
  id: string
  name: string
  code: string
  description?: string
  is_active: boolean
  created_at?: string
}

export interface CreateTenantPayload {
  name: string
  code: string
  description: string
  is_active: boolean
}

export interface SppgRecord {
  id: string
  tenant_id: string
  code: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius_km: number
  is_active: boolean
  created_at?: string
}

export interface CreateSppgPayload {
  tenant_id: string
  code: string
  name: string
  address: string
  latitude: number
  longitude: number
  radius_km: number
  is_active: boolean
}

export interface SchoolRecord {
  id: string
  tenant_id: string
  sppg_id: string
  npsn: string
  name: string
  school_level: string
  address: string
  latitude: number
  longitude: number
  is_active: boolean
  created_at?: string
}

export interface CreateSchoolPayload {
  tenant_id: string
  sppg_id: string
  npsn: string
  name: string
  school_level: string
  address: string
  latitude: number
  longitude: number
  is_active: boolean
}

export interface ProductRecord {
  id: string
  tenant_id: string
  code: string
  name: string
  product_type: string
  uom_id: string
  category_name: string
  is_active: boolean
  created_at?: string
}

export interface CreateProductPayload {
  tenant_id: string
  code: string
  name: string
  product_type: string
  uom_id: string
  category_name: string
  is_active: boolean
}

export interface RecipeRecord {
  id: string
  tenant_id: string
  code: string
  name: string
  yield_portions: number
  notes?: string
  is_active: boolean
  created_at?: string
}

export interface CreateRecipePayload {
  tenant_id: string
  code: string
  name: string
  yield_portions: number
  notes: string
  is_active: boolean
}

export interface RecipeLineRecord {
  id: string
  recipe_id: string
  component_product_id: string
  component_product_name?: string
  quantity: number
  uom_id: string
  waste_percentage: number
  notes?: string
}

export interface CreateRecipeLinePayload {
  component_product_id: string
  quantity: number
  uom_id: string
  waste_percentage: number
  notes: string
}

export interface KpiCard {
  id: string
  label: string
  value: string
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  tone?: 'brand' | 'success' | 'warning' | 'danger'
  caption?: string
}

export interface ChartSeries {
  name: string
  data: number[]
}

export interface DashboardPayload {
  tenantKpis: KpiCard[]
  sppgKpis: KpiCard[]
  financeKpis: KpiCard[]
  mealPlanStatus: ChartSeries[]
  deliveryPerformance: ChartSeries[]
  budgetUtilization: number[]
  receivableBuckets: number[]
  alerts: TimelineItem[]
  approvals: TimelineItem[]
}

export interface TimelineItem {
  id: string
  title: string
  description: string
  time: string
  status: string
}

export interface MealPlan {
  id: string
  plan_date: string
  meal_type: string
  recipe_name: string
  planned_portions: number
  cost_per_portion_budget: number
  status: string
  workflow_status?: string
  notes?: string
}

export interface InventoryBalance {
  id: string
  warehouse_name: string
  location_name: string
  product_name: string
  quantity_on_hand: number
  reserved_quantity: number
  available_quantity: number
  average_cost: number
  quality_status?: string
}

export interface BudgetSummary {
  id: string
  name: string
  date_start: string
  date_end: string
  status: string
  effective_budget: number
  available_budget: number
}

export interface CostPolicyRecord {
  id: string
  code: string
  name: string
  effective_start_date: string
  effective_end_date: string
  labor_cost_per_portion: number
  utility_cost_per_portion: number
  packaging_cost_per_portion: number
  distribution_cost_per_portion: number
  overhead_cost_per_portion: number
  waste_cost_percentage: number
  is_active: boolean
}

export interface LaborCostRecord {
  id: string
  work_date: string
  sppg_id: string
  sppg_name?: string
  employee_count: number
  hours_worked: number
  hourly_rate: number
  total_cost: number
  notes?: string
  status?: string
}

export interface ActualExpenseRecord {
  id: string
  expense_date: string
  sppg_id: string
  sppg_name?: string
  cost_category: 'UTILITY' | 'PACKAGING' | 'DISTRIBUTION' | 'OVERHEAD' | 'WASTE'
  reference_type?: string
  reference_id?: string
  amount: number
  notes?: string
  status?: string
}

export interface BudgetLineRecord {
  id: string
  account_code: string
  account_name: string
  planned_amount: number
  reserved_amount?: number
  committed_amount?: number
  actual_amount?: number
  available_budget?: number
}

export interface BudgetRecord extends BudgetSummary {
  notes?: string
  lines?: BudgetLineRecord[]
}

export interface CreateBudgetPayload {
  name: string
  date_start: string
  date_end: string
  notes: string
  lines: Array<{
    account_code: string
    account_name: string
    planned_amount: number
  }>
}

export interface ApprovalRequestRecord {
  id: string
  title: string
  approver_name: string
  approver_role: string
  status: string
  requested_at: string
  due_at?: string
}

export interface WorkflowDefinitionRecord {
  id: string
  code: string
  name: string
  document_type: string
  status: string
  active_version_number?: number
  notes?: string
}

export interface WorkflowHistoryRecord {
  id: string
  state: string
  action_name: string
  actor_name: string
  created_at: string
  notes?: string
}

export interface WorkflowDocumentRecord {
  id: string
  document_type: string
  document_id: string
  current_state: string
  business_status: string
  approval_requests: ApprovalRequestRecord[]
  history: WorkflowHistoryRecord[]
}

export interface SupplierRecord {
  id: string
  name: string
  supplier_type: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  status?: string
}

export interface PurchaseRequestRecord {
  id: string
  request_number: string
  request_date: string
  meal_plan_id?: string
  status: string
  total_estimated_cost: number
  supplier_name?: string
}

export interface ProcurementLineRecord {
  id: string
  product_code: string
  product_name: string
  quantity: number
  uom_id: string
  unit_price: number
  total_amount: number
  notes?: string
}

export interface PurchaseRequestDetailRecord {
  purchase_request: PurchaseRequestRecord & {
    notes?: string
    budget_account_code?: string
    reserved_amount?: number
  }
  lines: ProcurementLineRecord[]
}

export interface ProductionOrderRecord {
  id: string
  order_number: string
  production_date: string
  meal_plan_id?: string
  meal_plan_name?: string
  sppg_id: string
  sppg_name?: string
  status: string
  planned_portions: number
  actual_portions?: number
  accepted_portions?: number
  rejected_portions?: number
}

export interface ProductionMaterialRecord {
  id: string
  product_code: string
  product_name: string
  planned_quantity: number
  actual_quantity: number
  uom_id: string
  unit_cost: number
  total_cost: number
}

export interface ProductionOrderDetailRecord {
  production_order: ProductionOrderRecord
  meal_plan?: {
    id: string
    recipe_name: string
    meal_type: string
    plan_date: string
    planned_portions: number
    budget_cost_per_portion: number
    status: string
  }
  materials: ProductionMaterialRecord[]
}

export interface ProductionCostSheetRecord {
  production_order_id: string
  order_number: string
  production_date: string
  meal_plan_name?: string
  accepted_portions: number
  budget_cost_per_portion: number
  actual_material_cost: number
  labor_cost_amount: number
  utility_cost_amount: number
  packaging_cost_amount: number
  distribution_cost_amount: number
  overhead_cost_amount: number
  waste_cost_amount: number
  total_actual_cost: number
  actual_cost_per_portion: number
  variance_total: number
  variance_per_portion: number
  labor_cost_source: 'ACTUAL' | 'POLICY' | 'NONE'
}

export interface PurchaseOrderRecord {
  id: string
  po_number: string
  po_date: string
  supplier_name: string
  status: string
  total_amount: number
}

export interface PurchaseOrderDetailRecord {
  purchase_order: PurchaseOrderRecord & {
    expected_date?: string
    order_type?: string
    notes?: string
  }
  lines: ProcurementLineRecord[]
}

export interface GoodsReceiptRecord {
  id: string
  receipt_number: string
  receipt_date: string
  source_number: string
  status: string
  total_amount: number
}

export interface GoodsReceiptDetailRecord {
  goods_receipt: GoodsReceiptRecord & {
    warehouse_name?: string
    location_name?: string
    notes?: string
    committed_amount?: number
  }
  lines: ProcurementLineRecord[]
}

export interface SupplierInvoiceRecord {
  id: string
  invoice_number: string
  invoice_date: string
  supplier_name: string
  status: string
  total_amount: number
}

export interface SupplierInvoiceDetailRecord {
  supplier_invoice: SupplierInvoiceRecord & {
    due_date?: string
    budget_account_code?: string
    goods_receipt_number?: string
    notes?: string
  }
  lines: ProcurementLineRecord[]
}

export interface SupplierPaymentRecord {
  id: string
  payment_number: string
  payment_date: string
  supplier_name: string
  status: string
  amount: number
}

export interface SupplierPaymentDetailRecord {
  supplier_payment: SupplierPaymentRecord & {
    supplier_invoice_number?: string
    bank_account_code?: string
    notes?: string
  }
}

export interface GeoFeatureProperties {
  name?: string
  code?: string
  type?: string
  status?: string
  [key: string]: unknown
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: {
    type: string
    coordinates: unknown
  }
  properties?: GeoFeatureProperties
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export interface GeoPointRecord {
  id: string
  name: string
  latitude: number
  longitude: number
  status?: string
}

export interface MapDataset {
  kitchens: GeoPointRecord[]
  schools: GeoPointRecord[]
  coverage?: GeoJsonFeatureCollection | null
  unserved?: GeoJsonFeatureCollection | null
}

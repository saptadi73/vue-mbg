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

export interface InventoryBatchRecord {
  id: string
  warehouse_id: string
  warehouse_name: string
  location_name: string
  product_name: string
  batch_number: string
  expiry_date: string
  quality_status: string
  blocked?: boolean
  quantity_available: number
}

export interface FefoPreviewCandidate {
  batch_id: string
  batch_number: string
  warehouse_id: string
  warehouse_name: string
  expiry_date: string
  quantity_available: number
  allocated_quantity: number
  blocked?: boolean
  quality_status?: string
}

export interface FefoPreviewResult {
  product_name: string
  warehouse_id: string
  warehouse_name: string
  required_quantity: number
  fulfilled_quantity: number
  shortage_quantity: number
  candidate_batches: FefoPreviewCandidate[]
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

export interface BudgetAvailabilityLineRecord {
  budget_line_id: string
  category_name: string
  effective_budget: number
  reserved_amount: number
  committed_amount: number
  actual_amount: number
  available_budget: number
}

export interface BudgetAvailabilityRecord {
  budget_id: string
  totals: {
    effective_budget: number
    available_budget: number
  }
  lines: BudgetAvailabilityLineRecord[]
}

export interface MonthlyBudgetRealizationRecord {
  id: string
  budget_id: string
  budget_name: string
  month_label: string
  account_code: string
  account_name: string
  planned_amount: number
  reserved_amount: number
  committed_amount: number
  actual_amount: number
  available_budget: number
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

export interface SupplierProductRecord {
  id: string
  supplier_id: string
  supplier_name: string
  product_id: string
  product_code: string
  product_name: string
  purchase_uom_id: string
  supplier_product_code?: string
  minimum_order_qty?: number
  lead_time_days?: number
  is_preferred?: boolean
  is_active?: boolean
}

export interface SupplierPriceHistoryRecord {
  id: string
  supplier_product_id: string
  supplier_name: string
  product_name: string
  price: number
  effective_from: string
  effective_to?: string | null
}

export interface SupplierDetailRecord {
  supplier: SupplierRecord
  supplier_products: SupplierProductRecord[]
  price_histories: SupplierPriceHistoryRecord[]
  purchase_orders: PurchaseOrderRecord[]
}

export interface FundingSourceRecord {
  id: string
  name: string
  source_type: string
  provider_name?: string
  status: string
}

export interface FundingAgreementRecord {
  id: string
  agreement_number: string
  funding_source_id: string
  funding_source_name: string
  agreement_type: string
  principal_amount: number
  margin_method: string
  margin_rate?: number | null
  fixed_margin_amount?: number | null
  status: string
  start_date?: string
  end_date?: string
  notes?: string
}

export interface FundingDisbursementRecord {
  id: string
  agreement_id: string
  agreement_number: string
  sppg_name?: string
  disbursement_date: string
  amount: number
  reference_number?: string
  status: string
  notes?: string
}

export interface FundingRepaymentRecord {
  id: string
  agreement_id: string
  agreement_number: string
  repayment_date: string
  principal_amount: number
  margin_amount: number
  penalty_amount?: number
  payment_reference?: string
  status: string
  notes?: string
}

export interface FundingAgreementDetailRecord {
  agreement: FundingAgreementRecord
  source: FundingSourceRecord
  disbursements: FundingDisbursementRecord[]
  repayments: FundingRepaymentRecord[]
  principal_disbursed: number
  principal_repaid: number
  outstanding_principal: number
  realized_margin: number
}

export interface JournalEntryLineRecord {
  id: string
  account_code: string
  account_name: string
  line_type: 'DEBIT' | 'CREDIT'
  amount: number
  description?: string
}

export interface JournalEntryRecord {
  id: string
  entry_number: string
  entry_date: string
  reference: string
  description: string
  source_module: string
  source_document_type?: string | null
  source_document_id?: string | null
  status: string
  posted_at?: string
  posted_by?: string
  total_debit: number
  total_credit: number
}

export interface JournalEntryDetailRecord {
  journal_entry: JournalEntryRecord
  lines: JournalEntryLineRecord[]
}

export interface AccountRecord {
  id: string
  code: string
  name: string
  category: string
  normal_balance: 'DEBIT' | 'CREDIT'
  allow_posting: boolean
  is_active: boolean
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

export interface GovernmentClaimRecord {
  id: string
  claim_number: string
  claim_date: string
  claim_type: string
  status: string
  claimed_amount: number
  approved_amount?: number
  paid_amount?: number
  outstanding_amount?: number
  delivery_count?: number
}

export interface GovernmentClaimLineRecord {
  id: string
  delivery_order_number: string
  production_order_number: string
  school_name: string
  received_portions: number
  actual_cost_per_portion: number
  line_amount: number
}

export interface GovernmentClaimEvidenceRecord {
  id: string
  label: string
  reference_type: string
  reference_number: string
  status: string
}

export interface GovernmentClaimAdjustmentRecord {
  id: string
  adjustment_date: string
  adjustment_type: string
  amount: number
  notes?: string
}

export interface GovernmentClaimPaymentRecord {
  id: string
  payment_date: string
  payment_number: string
  amount: number
  notes?: string
}

export interface GovernmentClaimDetailRecord {
  claim: GovernmentClaimRecord & {
    notes?: string
    verified_by?: string
    verified_at?: string
  }
  lines: GovernmentClaimLineRecord[]
  evidence: GovernmentClaimEvidenceRecord[]
  adjustments: GovernmentClaimAdjustmentRecord[]
  payments: GovernmentClaimPaymentRecord[]
  workflow?: WorkflowDocumentRecord | null
}

export interface CashFlowRecord {
  id: string
  flow_date: string
  category: string
  description: string
  inflow_amount: number
  outflow_amount: number
  net_amount: number
}

export interface GovernmentReceivableAgingRecord {
  id: string
  claim_number: string
  tenant_name?: string
  sppg_name?: string
  claim_date: string
  days_outstanding: number
  aging_bucket: string
  outstanding_amount: number
  status: string
}

export interface InvestorFundingPositionRecord {
  id: string
  agreement_number: string
  funding_source_name: string
  principal_committed: number
  principal_disbursed: number
  principal_repaid: number
  outstanding_principal: number
  realized_margin: number
  status: string
}

export interface RoiBySppgRecord {
  id: string
  sppg_name: string
  recognized_revenue: number
  total_cost: number
  financing_cost: number
  roi_percentage: number
  period_start: string
  period_end: string
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
  code?: string
  city?: string
  service_radius_meter?: number
  covered_school_count?: number
  school_level?: string
  student_count?: number
  active_beneficiary_count?: number
  delivery_count?: number
  avg_feedback?: number
  complaint_count?: number
  risk_score?: number
  risk_level?: string
  metric_value?: number
}

export interface ServiceCoverageRecord {
  sppg_id: string
  tenant_id?: string
  code: string
  name: string
  service_radius_meter: number
  covered_school_count: number
  out_of_radius_school_count: number
  nearest_school_distance_km: number
  farthest_covered_school_distance_km: number
  average_covered_distance_km: number
}

export interface DeliveryRouteRecord {
  id: string
  delivery_order_id?: string
  delivery_number: string
  status: string
  distance_km: number
  from_coordinate: {
    latitude: number
    longitude: number
  }
  to_coordinate: {
    latitude: number
    longitude: number
  }
  line?: {
    type: 'LineString'
    coordinates: number[][]
  }
}

export interface DeliveryOrderRecord {
  id: string
  tenant_id?: string
  sppg_id: string
  production_order_id?: string
  school_id?: string
  school_name?: string
  delivery_number: string
  status: string
  planned_departure: string
  planned_arrival: string
  actual_departure?: string | null
  actual_arrival?: string | null
  receiver_name?: string | null
}

export interface DeliveryRoutePlanRecord {
  id: string
  tenant_id?: string
  sppg_id: string
  route_code: string
  route_name: string
  route_status: string
  planned_departure: string
  planned_arrival: string
  actual_departure?: string | null
  actual_arrival?: string | null
  origin_gps?: string | null
  destination_gps?: string | null
  total_distance_km?: number
  notes?: string | null
}

export interface DeliveryRouteStopRecord {
  id: string
  delivery_order_id: string
  stop_sequence: number
  status: string
  planned_arrival?: string | null
  actual_arrival?: string | null
  recipient_name?: string | null
  stop_gps?: string | null
  notes?: string | null
}

export interface DeliveryProofRecord {
  id: string
  delivery_order_id: string
  route_stop_id?: string | null
  received_at: string
  receiver_name: string
  receiver_gps?: string | null
  received_portions: number
  rejected_portions: number
  temperature_celsius?: number | null
  condition_status: string
  condition_notes?: string | null
  photo_urls?: string[]
  signature_name?: string | null
  signature_url?: string | null
  signature_signed_at?: string | null
  incident_notes?: string | null
  linked_incident_ids?: string[]
}

export interface DeliveryIncidentRecord {
  id: string
  delivery_order_id: string
  route_stop_id?: string | null
  incident_time: string
  category: string
  severity: string
  title: string
  description?: string | null
  incident_gps?: string | null
  temperature_celsius?: number | null
  media_urls?: string[]
  status: string
}

export interface DeliveryOrderDetailRecord {
  delivery_order: DeliveryOrderRecord
  route?: DeliveryRoutePlanRecord | null
  route_stops: DeliveryRouteStopRecord[]
  proofs: DeliveryProofRecord[]
  incidents: DeliveryIncidentRecord[]
}

export interface ServiceAreaRecord {
  id: string
  sppg_id?: string
  sppg_name?: string
  name: string
  valid_from?: string | null
  valid_to?: string | null
  boundary_geojson?: GeoJsonFeatureCollection | GeoJsonFeature['geometry'] | null
  boundary_wkt?: string | null
  status?: string
}

export interface AssignmentValidationRecord {
  kitchen_id: string
  school_id: string
  planned_portions: number
  is_valid: boolean
  distance_m?: number
  inside_service_area?: boolean
  service_radius_meter?: number
  message?: string
}

export interface NearestKitchenRecord {
  kitchen_id: string
  kitchen_name: string
  code?: string
  distance_m: number
  inside_service_area: boolean
  service_radius_meter?: number
}

export interface MapDataset {
  kitchens: GeoPointRecord[]
  schools: GeoPointRecord[]
  coverage?: GeoJsonFeatureCollection | null
  unserved?: GeoJsonFeatureCollection | null
  distributionHeatmap?: GeoJsonFeatureCollection | null
  serviceAreas?: GeoJsonFeatureCollection | null
  deliveryRoutes?: DeliveryRouteRecord[]
  riskPoints?: GeoPointRecord[]
  coverageSummary?: ServiceCoverageRecord[]
  nearestKitchens?: NearestKitchenRecord[]
  assignmentValidation?: AssignmentValidationRecord | null
}

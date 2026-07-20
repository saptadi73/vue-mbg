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

export interface UpdateUserPayload {
  full_name: string
  role_names: string[]
  is_active: boolean
  password?: string | null
  accessible_sppg_ids: string[]
  active_sppg_id: string
}

export interface UserSppgAccessRecord {
  user_id: string
  tenant_id: string
  active_sppg_id: string
  accessible_sppg_ids: string[]
}

export interface NotificationRecord {
  id: string
  title: string
  message: string
  priority: string
  source_module?: string | null
  source_entity_type?: string | null
  source_entity_id?: string | null
  created_at?: string
}

export interface NotificationRecipientRecord {
  id: string
  notification_id: string
  user_id?: string | null
  channel: string
  read_at?: string | null
  delivery_status?: string | null
}

export interface NotificationInboxRecord {
  id: string
  recipient: NotificationRecipientRecord
  notification: NotificationRecord
}

export interface PlatformHealthRecord {
  id: string
  label: string
  endpoint: string
  status: string
  message: string
  checked_at: string
}

export interface ExternalSystemRecord {
  id: string
  tenant_id?: string
  code: string
  name: string
  system_type: string
  base_url?: string | null
  is_active: boolean
  notes?: string | null
}

export interface IntegrationCredentialRecord {
  id: string
  external_system_id: string
  credential_name: string
  credential_type: string
  secret_masked: string
  config_json?: Record<string, unknown> | null
  is_active: boolean
}

export interface WebhookSubscriptionRecord {
  id: string
  external_system_id: string
  subscription_name: string
  event_type: string
  endpoint_path: string
  signing_secret_masked?: string | null
  headers_json?: Record<string, unknown> | null
  is_active: boolean
  notes?: string | null
}

export interface DataMappingRecord {
  id: string
  external_system_id: string
  mapping_name: string
  source_entity: string
  target_entity: string
  direction: 'INBOUND' | 'OUTBOUND'
  mapping_config_json?: Record<string, unknown> | null
  is_active: boolean
  notes?: string | null
}

export interface SyncJobRecord {
  id: string
  external_system_id: string
  external_system_name?: string | null
  job_name: string
  direction: 'INBOUND' | 'OUTBOUND'
  trigger_mode: string
  entity_type: string
  status: string
  schedule_expression?: string | null
  filter_json?: Record<string, unknown> | null
  last_run_at?: string | null
  notes?: string | null
}

export interface IntegrationMessageRecord {
  id: string
  external_system_id?: string | null
  external_system_name?: string | null
  sync_job_id?: string | null
  message_type: string
  external_reference?: string | null
  idempotency_key: string
  status: string
  payload_json?: Record<string, unknown> | null
  response_json?: Record<string, unknown> | null
  received_at?: string | null
  queued_at?: string | null
  processed_at?: string | null
  destination_url?: string | null
  notes?: string | null
}

export interface SyncLogRecord {
  id: string
  external_system_id: string
  external_system_name?: string | null
  direction: 'INBOUND' | 'OUTBOUND'
  message_type: string
  entity_type?: string | null
  entity_id?: string | null
  external_reference?: string | null
  idempotency_key: string
  status: string
  payload_json?: Record<string, unknown> | null
  response_json?: Record<string, unknown> | null
  processed_at?: string | null
  notes?: string | null
}

export interface ExternalSystemDetailRecord {
  external_system: ExternalSystemRecord
  credentials: IntegrationCredentialRecord[]
  webhook_subscriptions: WebhookSubscriptionRecord[]
  data_mappings: DataMappingRecord[]
  sync_jobs: SyncJobRecord[]
}

export interface BackgroundJobRecord {
  id: string
  tenant_id?: string
  job_name: string
  job_type: string
  status: string
  payload_json?: Record<string, unknown> | null
  result_json?: Record<string, unknown> | null
  started_at?: string | null
  finished_at?: string | null
  notes?: string | null
}

export interface OutboxEventRecord {
  id: string
  tenant_id?: string
  event_name: string
  aggregate_type: string
  aggregate_id?: string | null
  status: string
  payload_json?: Record<string, unknown> | null
  available_at?: string | null
  dispatched_at?: string | null
}

export interface ReadModelRecord {
  id: string
  model_name: string
  source: string
  status: string
  row_count: number
  refreshed_at?: string | null
  notes?: string | null
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
  budgetPlanRealization: ChartSeries[]
  fundingGovernmentTrend: ChartSeries[]
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

export interface WorkforcePositionRecord {
  id: string
  tenant_id?: string
  code: string
  name: string
  department_name?: string | null
  employment_type?: string | null
  default_daily_rate?: number | null
  is_active: boolean
}

export interface WorkforceEmployeeRecord {
  id: string
  tenant_id?: string
  position_id: string
  position_name?: string | null
  employee_code: string
  full_name: string
  employment_type: string
  join_date: string
  phone_number?: string | null
  daily_rate?: number | null
  is_active: boolean
  active_assignment_sppg_id?: string | null
  active_assignment_sppg_name?: string | null
}

export interface WorkforceEmployeeAssignmentRecord {
  id: string
  employee_id: string
  employee_name?: string | null
  sppg_id: string
  sppg_name?: string | null
  start_date: string
  end_date?: string | null
  assignment_role: string
  status: string
  notes?: string | null
}

export interface WorkforceEmployeeDetailRecord {
  employee: WorkforceEmployeeRecord
  assignments: WorkforceEmployeeAssignmentRecord[]
}

export interface WorkforceShiftRecord {
  id: string
  sppg_id?: string | null
  sppg_name?: string | null
  shift_code: string
  shift_name: string
  start_time: string
  end_time: string
  status: string
  assigned_employee_count?: number | null
}

export interface WorkforceAttendanceRecord {
  id: string
  employee_id: string
  employee_name: string
  sppg_id?: string | null
  sppg_name?: string | null
  shift_name?: string | null
  attendance_date: string
  check_in_at?: string | null
  check_out_at?: string | null
  worked_hours?: number | null
  status: string
}

export interface WorkforceTimesheetRecord {
  id: string
  employee_id: string
  employee_name: string
  sppg_id?: string | null
  sppg_name?: string | null
  period_start: string
  period_end: string
  total_days: number
  total_hours: number
  overtime_hours?: number | null
  approved_by?: string | null
  status: string
}

export interface CreateWorkforceEmployeePayload {
  tenant_id: string
  position_id: string
  employee_code: string
  full_name: string
  employment_type: string
  join_date: string
  phone_number?: string
  daily_rate?: number
  is_active: boolean
}

export interface CreateWorkforceAssignmentPayload {
  sppg_id: string
  start_date: string
  end_date?: string
  assignment_role: string
  notes?: string
}

export interface ProgramRecord {
  id: string
  code: string
  name: string
  description?: string
  program_type: string
  funding_source_name?: string | null
  start_date: string
  end_date: string
  status: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProgramPeriodRecord {
  id: string
  program_id: string
  code: string
  name: string
  date_start: string
  date_end: string
  status: string
  notes?: string | null
}

export interface ProgramTenantAssignmentRecord {
  id: string
  program_id: string
  tenant_id: string
  tenant_name?: string | null
  start_date: string
  end_date?: string | null
  is_active: boolean
  notes?: string | null
}

export interface ProgramSppgAssignmentRecord {
  id: string
  program_id: string
  tenant_id: string
  tenant_name?: string | null
  sppg_id: string
  sppg_name?: string | null
  start_date: string
  end_date?: string | null
  is_active: boolean
  notes?: string | null
}

export interface ProgramDetailRecord {
  program: ProgramRecord
  periods: ProgramPeriodRecord[]
  tenant_assignments: ProgramTenantAssignmentRecord[]
  sppg_assignments: ProgramSppgAssignmentRecord[]
}

export interface CreateProgramPayload {
  code: string
  name: string
  description: string
  program_type: string
  funding_source_name: string
  start_date: string
  end_date: string
  status: string
  is_active: boolean
}

export interface CreateProgramPeriodPayload {
  code: string
  name: string
  date_start: string
  date_end: string
  status: string
  notes?: string
}

export interface CreateProgramTenantAssignmentPayload {
  tenant_id: string
  start_date: string
  end_date?: string
  is_active: boolean
  notes?: string
}

export interface CreateProgramSppgAssignmentPayload {
  tenant_id: string
  sppg_id: string
  start_date: string
  end_date?: string
  is_active: boolean
  notes?: string
}

export interface AssetCategoryRecord {
  id: string
  tenant_id?: string
  code: string
  name: string
  asset_account_id: string
  depreciation_expense_account_id: string
  accumulated_depreciation_account_id: string
  useful_life_months: number
  depreciation_method: string
  is_active: boolean
}

export interface AssetRecord {
  id: string
  tenant_id?: string
  sppg_id?: string | null
  sppg_name?: string | null
  asset_category_id: string
  asset_category_name?: string | null
  asset_code: string
  asset_name: string
  acquisition_date: string
  acquisition_cost: number
  residual_value: number
  useful_life_months: number
  depreciation_method: string
  status: string
  serial_number?: string | null
  condition_status: string
  location_name?: string | null
  is_active: boolean
  notes?: string | null
}

export interface AssetAssignmentRecord {
  id: string
  asset_id: string
  asset_code?: string | null
  asset_name?: string | null
  sppg_id: string
  sppg_name?: string | null
  assigned_to_name?: string | null
  assignment_date: string
  end_date?: string | null
  assignment_role: string
  status: string
  is_active: boolean
  notes?: string | null
}

export interface AssetDepreciationRecord {
  id: string
  asset_id: string
  asset_code?: string | null
  asset_name?: string | null
  depreciation_date: string
  depreciation_amount: number
  debit_account_code: string
  credit_account_code: string
  status: string
  notes?: string | null
}

export interface AssetDetailRecord {
  asset: AssetRecord
  assignments: AssetAssignmentRecord[]
  depreciations: AssetDepreciationRecord[]
}

export interface CreateAssetCategoryPayload {
  tenant_id: string
  code: string
  name: string
  asset_account_id: string
  depreciation_expense_account_id: string
  accumulated_depreciation_account_id: string
  useful_life_months: number
  depreciation_method: string
  is_active: boolean
}

export interface CreateAssetPayload {
  tenant_id: string
  sppg_id: string
  asset_category_id: string
  asset_code: string
  asset_name: string
  acquisition_date: string
  acquisition_cost: number
  residual_value: number
  useful_life_months: number
  depreciation_method: string
  status: string
  serial_number?: string
  condition_status: string
  location_name?: string
  is_active: boolean
  notes?: string
}

export interface CreateAssetAssignmentPayload {
  sppg_id: string
  assigned_to_name: string
  assignment_date: string
  end_date?: string
  assignment_role: string
  status: string
  is_active: boolean
  notes?: string
}

export interface CreateAssetDepreciationPayload {
  depreciation_date: string
  depreciation_amount?: number
  debit_account_code: string
  credit_account_code: string
  status: string
  notes?: string
}

export interface BeneficiaryRecord {
  id: string
  tenant_id?: string
  sppg_id: string
  sppg_name?: string | null
  school_id: string
  school_name?: string | null
  full_name: string
  beneficiary_type: string
  gender: string
  date_of_birth: string
  classroom_name?: string | null
  is_active: boolean
  external_reference?: string | null
  created_at?: string
}

export interface CreateBeneficiaryPayload {
  tenant_id: string
  sppg_id: string
  school_id: string
  full_name: string
  beneficiary_type: string
  gender: string
  date_of_birth: string
  classroom_name?: string
  is_active: boolean
}

export interface DocumentRecord {
  id: string
  tenant_id?: string
  sppg_id?: string | null
  sppg_name?: string | null
  document_type: string
  title: string
  description?: string | null
  owner_entity_type?: string | null
  owner_entity_id?: string | null
  tags?: string[]
  status: string
  created_at?: string
  updated_at?: string
}

export interface DocumentVersionRecord {
  id: string
  document_id: string
  version_number: number
  file_name: string
  file_mime_type: string
  file_size_bytes: number
  checksum_sha256?: string | null
  storage_backend: string
  object_key: string
  version_notes?: string | null
  metadata_json?: Record<string, unknown> | null
  uploaded_at: string
}

export interface DocumentLinkRecord {
  id: string
  document_id: string
  linked_entity_type: string
  linked_entity_id: string
  relation_type: string
  created_at?: string
}

export interface DocumentDetailRecord {
  document: DocumentRecord
  versions: DocumentVersionRecord[]
  links: DocumentLinkRecord[]
}

export interface CreateDocumentPayload {
  tenant_id: string
  sppg_id?: string
  document_type: string
  title: string
  description: string
  owner_entity_type: string
  owner_entity_id: string
  tags: string[]
}

export interface CreateDocumentVersionPayload {
  file_name: string
  file_mime_type: string
  file_size_bytes: number
  checksum_sha256?: string
  storage_backend: string
  object_key: string
  version_notes?: string
  metadata_json?: Record<string, unknown>
  uploaded_at: string
}

export interface CreateDocumentLinkPayload {
  linked_entity_type: string
  linked_entity_id: string
  relation_type: string
}

export interface AuditEventRecord {
  id: string
  tenant_id?: string
  sppg_id?: string | null
  actor_user_id?: string | null
  actor_name?: string | null
  event_type: string
  module_name: string
  action_name: string
  entity_type: string
  entity_id: string
  request_id?: string | null
  success: boolean
  ip_address?: string | null
  summary: string
  metadata_json?: Record<string, unknown> | null
  occurred_at: string
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

export interface VehicleTypeRecord {
  id: string
  tenant_id?: string
  code: string
  name: string
  description?: string | null
  capacity_portions?: number | null
  capacity_kg?: number | null
  temperature_controlled: boolean
  is_active: boolean
}

export interface FleetVehicleRecord {
  id: string
  tenant_id?: string
  home_sppg_id?: string | null
  home_sppg_name?: string | null
  vehicle_type_id: string
  vehicle_type_name?: string | null
  vehicle_code: string
  plate_number: string
  ownership_status: string
  brand_name?: string | null
  model_name?: string | null
  manufacture_year?: number | null
  capacity_portions?: number | null
  fuel_type?: string | null
  status: string
  is_active: boolean
  notes?: string | null
}

export interface FleetDriverRecord {
  id: string
  tenant_id?: string
  driver_code: string
  full_name: string
  phone_number?: string | null
  license_number?: string | null
  license_type?: string | null
  license_expiry_date?: string | null
  status: string
  is_active: boolean
  notes?: string | null
}

export interface FleetAssignmentRecord {
  id: string
  vehicle_id: string
  vehicle_code?: string | null
  plate_number?: string | null
  sppg_id: string
  sppg_name?: string | null
  driver_id?: string | null
  driver_name?: string | null
  assignment_date: string
  end_date?: string | null
  assignment_role: string
  status: string
  is_active: boolean
  notes?: string | null
}

export interface FleetMaintenanceRecord {
  id: string
  vehicle_id: string
  vehicle_code?: string | null
  plate_number?: string | null
  sppg_id?: string | null
  sppg_name?: string | null
  maintenance_date: string
  maintenance_type: string
  odometer_km?: number | null
  cost_amount?: number | null
  vendor_name?: string | null
  status: string
  notes?: string | null
}

export interface FleetVehicleDetailRecord {
  vehicle: FleetVehicleRecord
  assignments: FleetAssignmentRecord[]
  maintenances: FleetMaintenanceRecord[]
}

export interface FleetVehicleLocationRecord {
  id: string
  vehicle_id: string
  vehicle_code: string
  plate_number?: string | null
  driver_name?: string | null
  assignment_role?: string | null
  sppg_id?: string | null
  sppg_name?: string | null
  latitude: number
  longitude: number
  status: string
  source?: string | null
  location_recorded_at?: string | null
  speed_kmh?: number | null
  heading_deg?: number | null
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

export interface DeliveryPerformanceReportRecord {
  id: string
  sppg_id: string
  sppg_name: string
  delivery_count: number
  delivered_count: number
  in_transit_count: number
  planned_count: number
  school_served_count: number
  total_received_portions: number
  total_rejected_portions: number
  incident_count: number
  on_time_count: number
  on_time_percentage: number
  latest_delivery_at?: string | null
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

export interface FeedbackSubmissionRecord {
  id: string
  tenant_id?: string
  sppg_id?: string
  school_id?: string
  school_name?: string
  meal_plan_id?: string | null
  delivery_order_id?: string | null
  feedback_date: string
  source_type: string
  respondent_name: string
  respondent_role?: string | null
  overall_rating: number
  acceptance_rate?: number | null
  food_waste_portions?: number | null
  delivery_timeliness_rating?: number | null
  temperature_rating?: number | null
  comment_text?: string | null
  status: string
}

export interface FeedbackItemRecord {
  id: string
  feedback_submission_id: string
  item_type: string
  metric_name: string
  score: number
  sentiment?: string | null
  comment_text?: string | null
}

export interface ComplaintRecord {
  id: string
  feedback_submission_id?: string | null
  tenant_id?: string
  sppg_id?: string
  school_id?: string | null
  school_name?: string | null
  complaint_date: string
  category: string
  severity: string
  complaint_text: string
  resolution_status: string
  resolved_at?: string | null
  notes?: string | null
}

export interface ServiceQualityScoreRecord {
  id: string
  tenant_id?: string
  sppg_id?: string
  sppg_name?: string | null
  score_date: string
  acceptance_score: number
  waste_score: number
  delivery_score: number
  temperature_score: number
  taste_score: number
  nutrition_score: number
  complaint_score: number
  total_score: number
  score_status: string
  notes?: string | null
}

export interface FeedbackSummaryRecord {
  submission_count: number
  complaint_count: number
  service_quality_score_count: number
  average_overall_rating: number
  average_acceptance_rate: number
  average_food_waste: number
  average_service_quality_score: number
  open_complaint_count: number
  resolved_complaint_count: number
  high_severity_complaint_count: number
}

export interface FeedbackDetailRecord {
  submission: FeedbackSubmissionRecord
  items: FeedbackItemRecord[]
  complaints: ComplaintRecord[]
}

export interface QualityInspectionRecord {
  id: string
  tenant_id?: string
  sppg_id?: string
  inspection_number: string
  inspection_type: string
  stage: string
  reference_type: string
  reference_id: string
  inspection_at: string
  inspector_name: string
  status: string
  overall_result?: string | null
  is_mandatory_for_release: boolean
  notes?: string | null
}

export interface QualityInspectionLineRecord {
  id: string
  inspection_id: string
  parameter_name: string
  expected_value?: string | null
  actual_value?: string | null
  result_status: string
  notes?: string | null
}

export interface QualityInspectionDetailRecord {
  inspection: QualityInspectionRecord
  lines: QualityInspectionLineRecord[]
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
  fleetVehicles?: FleetVehicleLocationRecord[]
  coverageSummary?: ServiceCoverageRecord[]
  nearestKitchens?: NearestKitchenRecord[]
  assignmentValidation?: AssignmentValidationRecord | null
}

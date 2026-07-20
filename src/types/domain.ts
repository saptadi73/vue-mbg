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

export type SafetyGate = 'PASS' | 'WARNING' | 'HOLD' | 'BLOCK' | 'REJECT'
export interface TraceEntity {
  id: string
  entity_type: string
  entity_id: string
  trace_code: string
  trace_token?: string
  status: string
  metadata_json?: Record<string, unknown>
}
export interface TraceEvent {
  id: string
  event_type: string
  event_at?: string
  created_at?: string
  notes?: string | null
  metadata_json?: Record<string, unknown>
}
export interface TraceRelation {
  id?: string
  parent_trace_entity_id?: string
  child_trace_entity_id?: string
  parent_trace_code?: string
  child_trace_code?: string
  relation_type: string
  quantity?: number | null
  uom_id?: string | null
}
export interface TraceGraph {
  root: TraceEntity
  entities: TraceEntity[]
  relations: TraceRelation[]
}
export interface FoodSafetyProfile {
  id: string
  profile_code: string
  profile_name: string
  entity_type: string
  temperature_min_c?: number | null
  temperature_max_c?: number | null
  max_time_to_recipient_minutes?: number | null
  warning_buffer_minutes?: number | null
  critical_action: string
  is_active?: boolean
}
export interface FoodSafetyCheckResult {
  gate: SafetyGate
  status: string
  violations: string[]
  safety_buffer_minutes?: number | null
  recommended_action?: string
}
export interface FoodSafetyAlert {
  id: string
  entity_type: string
  entity_id: string
  alert_type?: string
  severity?: string
  alert_status: string
  message?: string
  created_at?: string
}
export interface FoodSafetyHold {
  id: string
  entity_type: string
  entity_id: string
  status?: string
  reason: string
}

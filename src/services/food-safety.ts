import { apiRequest } from '@/services/http'
import type { ApiRequestContext } from '@/services/http'
import type {
  FoodSafetyAlert,
  FoodSafetyCheckResult,
  FoodSafetyHold,
  FoodSafetyProfile,
  DeliveryPackageCreateInput,
  DeliveryPackageLoadInput,
  DeliveryPackageReceiveInput,
  TraceLabel,
  TraceEntity,
  TraceEvent,
  TraceGraph,
} from '@/types/food-safety'
import type { DeliveryPackageLifecycleRecord } from '@/types/domain'

const list = <T>(payload: T[] | { items?: T[]; events?: T[] }) =>
  Array.isArray(payload) ? payload : payload.items || payload.events || []
export const createTraceEntity = async (input: {
  tenant_id: string
  sppg_id?: string
  entity_type: string
  entity_id: string
  status?: string
  metadata_json?: Record<string, unknown>
}) =>
  (
    await apiRequest<TraceEntity>('/api/v1/traceability/entities', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const resolveTrace = async (code: string) =>
  (await apiRequest<TraceEntity>(`/api/v1/traceability/${encodeURIComponent(code)}`)).data
export const getTraceLabel = async (code: string) =>
  (await apiRequest<TraceLabel>(`/api/v1/traceability/entities/${encodeURIComponent(code)}/label`)).data
export const getTraceTimeline = async (code: string) =>
  list(
    (
      await apiRequest<TraceEvent[] | { items?: TraceEvent[]; events?: TraceEvent[] }>(
        `/api/v1/traceability/${encodeURIComponent(code)}/timeline`,
      )
    ).data,
  )
export const getTraceGraph = async (code: string, direction: 'backward' | 'forward') =>
  (await apiRequest<TraceGraph>(`/api/v1/traceability/${encodeURIComponent(code)}/${direction}`))
    .data
export const addTraceEvent = async (
  code: string,
  input: { event_type: string; notes?: string; metadata_json?: Record<string, unknown> },
) =>
  (
    await apiRequest<TraceEvent>(`/api/v1/traceability/${encodeURIComponent(code)}/events`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const createTraceRelation = async (input: {
  parent_trace_code: string
  child_trace_code: string
  relation_type: string
  quantity?: number
  uom_id?: string
}) =>
  (
    await apiRequest<unknown>('/api/v1/traceability/relations', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const getFoodSafetyProfiles = async () =>
  list(
    (
      await apiRequest<FoodSafetyProfile[] | { items?: FoodSafetyProfile[] }>(
        '/api/v1/food-safety/profiles',
      )
    ).data,
  )
export const createFoodSafetyProfile = async (input: Record<string, unknown>) =>
  (
    await apiRequest<FoodSafetyProfile>('/api/v1/food-safety/profiles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const runFoodSafetyCheck = async (input: Record<string, unknown>) =>
  (
    await apiRequest<FoodSafetyCheckResult>('/api/v1/food-safety/checks', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const getFoodSafetyAlerts = async (status = 'OPEN') =>
  list(
    (
      await apiRequest<FoodSafetyAlert[] | { items?: FoodSafetyAlert[] }>(
        '/api/v1/food-safety/alerts',
        { query: { alert_status: status } },
      )
    ).data,
  )
export const acknowledgeFoodSafetyAlert = async (id: string) =>
  (
    await apiRequest<FoodSafetyAlert>(`/api/v1/food-safety/alerts/${id}/acknowledge`, {
      method: 'POST',
    })
  ).data
export const createFoodSafetyHold = async (input: Record<string, unknown>) =>
  (
    await apiRequest<FoodSafetyHold>('/api/v1/food-safety/holds', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const releaseFoodSafetyHold = async (
  id: string,
  input: { reason: string; evidence?: Record<string, unknown> },
) =>
  (
    await apiRequest<FoodSafetyHold>(`/api/v1/food-safety/holds/${id}/release`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const createFoodSafetyRecall = async (input: {
  trace_code: string
  reason: string
  severity: string
}) =>
  (
    await apiRequest<unknown>('/api/v1/food-safety/recalls', {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const recordTemperatureReading = async (input: Record<string, unknown>) =>
  (
    await apiRequest<{ reading: unknown; alert: FoodSafetyAlert | null }>(
      '/api/v1/temperature/readings',
      { method: 'POST', body: JSON.stringify(input) },
    )
  ).data
export const getTemperatureHistory = async (id: string) =>
  (await apiRequest<unknown>(`/api/v1/temperature/entities/${id}/history`)).data
export const createDeliveryPackage = async (input: DeliveryPackageCreateInput, context: ApiRequestContext) =>
  (
    await apiRequest<DeliveryPackageLifecycleRecord>('/api/v1/deliveries/packages', {
      method: 'POST',
      body: JSON.stringify(input),
      context,
    })
  ).data
export const loadDeliveryPackage = async (
  routeId: string,
  input: DeliveryPackageLoadInput,
  context: ApiRequestContext,
) =>
  (
    await apiRequest<DeliveryPackageLifecycleRecord>(`/api/v1/deliveries/${routeId}/packages/load`, {
      method: 'POST',
      body: JSON.stringify(input),
      context,
    })
  ).data
export const receiveDeliveryPackage = async (
  routeId: string,
  packageId: string,
  input: DeliveryPackageReceiveInput,
  context: ApiRequestContext,
) =>
  (
    await apiRequest<DeliveryPackageLifecycleRecord>(`/api/v1/deliveries/${routeId}/packages/${packageId}/receive`, {
      method: 'POST',
      body: JSON.stringify(input),
      context,
    })
  ).data
export const postRouteVehicleTemperature = async (routeId: string, input: Record<string, unknown>) =>
  (
    await apiRequest<unknown>(`/api/v1/food-safety/deliveries/${routeId}/vehicle-temperature`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data
export const postVehicleTemperature = async (vehicleId: string, input: Record<string, unknown>) =>
  (
    await apiRequest<unknown>(`/api/v1/food-safety/vehicles/${vehicleId}/temperature`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  ).data

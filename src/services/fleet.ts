import { apiRequest } from '@/services/http'
import {
  mockDeliveryRoutes,
  mockFleetAssignments,
  mockFleetDrivers,
  mockFleetMaintenances,
  mockFleetVehicleDetails,
  mockFleetVehicles,
  mockSppgs,
  mockVehicleTypes,
} from '@/services/mock-data'
import type {
  FleetAssignmentRecord,
  FleetDriverRecord,
  FleetMaintenanceRecord,
  FleetVehicleDetailRecord,
  FleetVehicleLocationPingPayload,
  FleetVehicleLocationPingRecord,
  FleetVehicleRecord,
  FleetVehicleStatusLiveRecord,
  FleetLatLng,
  VehicleTypeRecord,
} from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) throw new Error(message)
  return value
}

const mockVehicleLocationPings: FleetVehicleLocationPingRecord[] = []

const asRecord = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toLatLng = (input: unknown): FleetLatLng | null => {
  const record = asRecord(input)
  if (!record) return null
  const latitude = toNumber(record.latitude)
  const longitude = toNumber(record.longitude)
  if (latitude === null || longitude === null) return null
  return { latitude, longitude }
}

const parseGpsPair = (value: string | null | undefined): FleetLatLng | null => {
  if (!value) return null
  const [rawLat, rawLng] = value.split(',').map((item) => item.trim())
  const latitude = toNumber(rawLat)
  const longitude = toNumber(rawLng)
  if (latitude === null || longitude === null) return null
  return { latitude, longitude }
}

const normalizeFleetStatusLive = (data: unknown): FleetVehicleStatusLiveRecord[] => {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.items)
      ? (asRecord(data)?.items as unknown[])
      : []

  return list
    .map((item) => {
      const record = asRecord(item)
      if (!record) return null

      const activeRouteRecord = asRecord(record.active_route)
      const currentPosition = toLatLng(record.current_position)
      const origin = toLatLng(activeRouteRecord?.origin)
      const destination = toLatLng(activeRouteRecord?.destination)
      if (!currentPosition || !origin || !destination) return null

      const waypoints = Array.isArray(activeRouteRecord?.waypoints)
        ? activeRouteRecord!.waypoints
            .map((point) => toLatLng(point))
            .filter(Boolean) as FleetLatLng[]
        : []

      const path = Array.isArray(record.path)
        ? record.path.map((point) => toLatLng(point)).filter(Boolean) as FleetLatLng[]
        : []

      const routeId = String(activeRouteRecord?.route_id ?? '').trim()
      const vehicleId = String(record.vehicle_id ?? '').trim()
      if (!routeId || !vehicleId) return null

      return {
        vehicle_id: vehicleId,
        vehicle_code: String(record.vehicle_code ?? vehicleId),
        plate_number: record.plate_number ? String(record.plate_number) : null,
        driver_id: record.driver_id ? String(record.driver_id) : null,
        driver_name: record.driver_name ? String(record.driver_name) : null,
        movement_status: String(record.movement_status ?? activeRouteRecord?.route_status ?? 'IN_TRANSIT'),
        current_position: currentPosition,
        speed_kph: toNumber(record.speed_kph),
        heading_degree: toNumber(record.heading_degree),
        recorded_at: record.recorded_at ? String(record.recorded_at) : null,
        active_route: {
          route_id: routeId,
          route_code: activeRouteRecord?.route_code ? String(activeRouteRecord.route_code) : null,
          route_name: activeRouteRecord?.route_name ? String(activeRouteRecord.route_name) : null,
          route_status: activeRouteRecord?.route_status ? String(activeRouteRecord.route_status) : null,
          origin,
          destination,
          waypoints,
        },
        path,
      } as FleetVehicleStatusLiveRecord
    })
    .filter(Boolean) as FleetVehicleStatusLiveRecord[]
}

const buildFleetStatusFallback = (): FleetVehicleStatusLiveRecord[] => {
  const now = Date.now()
  return mockFleetVehicles
    .slice(0, 6)
    .map((vehicle, index) => {
      const route = mockDeliveryRoutes.find((item) => item.sppg_id === vehicle.home_sppg_id) || mockDeliveryRoutes[index % Math.max(mockDeliveryRoutes.length, 1)]
      if (!route) return null

      const origin = parseGpsPair(route.origin_gps) || { latitude: -6.1775, longitude: 106.8272 }
      const destination = parseGpsPair(route.destination_gps) || { latitude: -6.1883, longitude: 106.8393 }
      const currentPosition: FleetLatLng = {
        latitude: origin.latitude + (destination.latitude - origin.latitude) * (0.35 + index * 0.08),
        longitude: origin.longitude + (destination.longitude - origin.longitude) * (0.35 + index * 0.08),
      }

      return {
        vehicle_id: vehicle.id,
        vehicle_code: vehicle.vehicle_code,
        plate_number: vehicle.plate_number,
        driver_id: null,
        driver_name: vehicle.driver_name || null,
        movement_status: 'IN_TRANSIT',
        current_position: currentPosition,
        speed_kph: 24 + (index % 4) * 5,
        heading_degree: 92 + index * 7,
        recorded_at: new Date(now - index * 4 * 60_000).toISOString(),
        active_route: {
          route_id: route.id,
          route_code: route.route_code,
          route_name: route.route_name,
          route_status: route.route_status,
          origin,
          destination,
          waypoints: [],
        },
        path: [origin, currentPosition],
      } as FleetVehicleStatusLiveRecord
    })
    .filter(Boolean) as FleetVehicleStatusLiveRecord[]
}

const syncVehicleDetail = (vehicleId: string) => {
  const vehicle = mockFleetVehicles.find((item) => item.id === vehicleId)
  if (!vehicle) return
  const detail = mockFleetVehicleDetails.find((item) => item.vehicle.id === vehicleId)
  const assignments = mockFleetAssignments.filter((item) => item.vehicle_id === vehicleId)
  const maintenances = mockFleetMaintenances.filter((item) => item.vehicle_id === vehicleId)

  if (detail) {
    detail.vehicle = vehicle
    detail.assignments = assignments
    detail.maintenances = maintenances
    return
  }

  mockFleetVehicleDetails.unshift({ vehicle, assignments, maintenances })
}

export const getVehicleTypes = async () => {
  try {
    const payload = await apiRequest<VehicleTypeRecord[]>('/api/v1/fleet/vehicle-types')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockVehicleTypes, total: mockVehicleTypes.length }
  }
}

export const createVehicleType = async (input: Omit<VehicleTypeRecord, 'id'>) => {
  try {
    const payload = await apiRequest<VehicleTypeRecord>('/api/v1/fleet/vehicle-types', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record: VehicleTypeRecord = { ...input, id: `vehicle-type-${Date.now()}` }
    mockVehicleTypes.unshift(record)
    return record
  }
}

export const getFleetVehicles = async () => {
  try {
    const payload = await apiRequest<FleetVehicleRecord[]>('/api/v1/fleet/vehicles')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockFleetVehicles, total: mockFleetVehicles.length }
  }
}

export const getFleetVehicleStatusLive = async (options?: { tenantId?: string | null; sppgId?: string | null }) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/fleet/vehicle-status/live', {
      headers: {
        ...(options?.tenantId ? { 'X-Tenant-ID': options.tenantId } : {}),
        ...(options?.sppgId ? { 'X-SPPG-ID': options.sppgId } : {}),
      },
    })
    const items = normalizeFleetStatusLive(payload.data)
    return { items, total: totalFromEnvelope(payload, items.length) }
  } catch {
    const items = buildFleetStatusFallback()
    return { items, total: items.length }
  }
}

export const getFleetVehicleById = async (vehicleId: string) => {
  try {
    const payload = await apiRequest<FleetVehicleDetailRecord>(`/api/v1/fleet/vehicles/${vehicleId}`)
    return payload.data
  } catch {
    syncVehicleDetail(vehicleId)
    return ensureRecord(
      mockFleetVehicleDetails.find((item) => item.vehicle.id === vehicleId) || mockFleetVehicleDetails[0],
      'Vehicle tidak ditemukan.',
    )
  }
}

export const createFleetVehicle = async (input: Omit<FleetVehicleRecord, 'id' | 'home_sppg_name' | 'vehicle_type_name'>) => {
  try {
    const payload = await apiRequest<FleetVehicleRecord>('/api/v1/fleet/vehicles', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record: FleetVehicleRecord = {
      ...input,
      id: `vehicle-${Date.now()}`,
      home_sppg_name: mockSppgs.find((item) => item.id === input.home_sppg_id)?.name || input.home_sppg_id || null,
      vehicle_type_name: mockVehicleTypes.find((item) => item.id === input.vehicle_type_id)?.name || null,
    }
    mockFleetVehicles.unshift(record)
    syncVehicleDetail(record.id)
    return record
  }
}

export const getFleetDrivers = async () => {
  try {
    const payload = await apiRequest<FleetDriverRecord[]>('/api/v1/fleet/drivers')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockFleetDrivers, total: mockFleetDrivers.length }
  }
}

export const createFleetDriver = async (input: Omit<FleetDriverRecord, 'id'>) => {
  try {
    const payload = await apiRequest<FleetDriverRecord>('/api/v1/fleet/drivers', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const record: FleetDriverRecord = { ...input, id: `driver-${Date.now()}` }
    mockFleetDrivers.unshift(record)
    return record
  }
}

export const getFleetAssignments = async () => {
  try {
    const payload = await apiRequest<FleetAssignmentRecord[]>('/api/v1/fleet/assignments')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockFleetAssignments, total: mockFleetAssignments.length }
  }
}

export const createFleetAssignment = async (
  vehicleId: string,
  input: Omit<FleetAssignmentRecord, 'id' | 'vehicle_id' | 'vehicle_code' | 'plate_number' | 'sppg_name' | 'driver_name'>,
) => {
  try {
    const payload = await apiRequest<FleetAssignmentRecord>(`/api/v1/fleet/vehicles/${vehicleId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const vehicle = ensureRecord(mockFleetVehicles.find((item) => item.id === vehicleId), 'Vehicle tidak ditemukan.')
    const record: FleetAssignmentRecord = {
      ...input,
      id: `fleet-assignment-${Date.now()}`,
      vehicle_id: vehicleId,
      vehicle_code: vehicle.vehicle_code,
      plate_number: vehicle.plate_number,
      sppg_name: mockSppgs.find((item) => item.id === input.sppg_id)?.name || null,
      driver_name: mockFleetDrivers.find((item) => item.id === input.driver_id)?.full_name || null,
    }
    mockFleetAssignments.unshift(record)
    syncVehicleDetail(vehicleId)
    return record
  }
}

export const getFleetMaintenances = async () => {
  try {
    const payload = await apiRequest<FleetMaintenanceRecord[]>('/api/v1/fleet/maintenances')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockFleetMaintenances, total: mockFleetMaintenances.length }
  }
}

export const createFleetMaintenance = async (
  vehicleId: string,
  input: Omit<FleetMaintenanceRecord, 'id' | 'vehicle_id' | 'vehicle_code' | 'plate_number' | 'sppg_name'>,
) => {
  try {
    const payload = await apiRequest<FleetMaintenanceRecord>(`/api/v1/fleet/vehicles/${vehicleId}/maintenances`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const vehicle = ensureRecord(mockFleetVehicles.find((item) => item.id === vehicleId), 'Vehicle tidak ditemukan.')
    const record: FleetMaintenanceRecord = {
      ...input,
      id: `fleet-maintenance-${Date.now()}`,
      vehicle_id: vehicleId,
      vehicle_code: vehicle.vehicle_code,
      plate_number: vehicle.plate_number,
      sppg_name: mockSppgs.find((item) => item.id === input.sppg_id)?.name || null,
    }
    mockFleetMaintenances.unshift(record)
    syncVehicleDetail(vehicleId)
    return record
  }
}

export const createFleetVehicleLocationPing = async (
  vehicleId: string,
  input: FleetVehicleLocationPingPayload,
  options?: {
    tenantId?: string | null
    sppgId?: string | null
  },
) => {
  try {
    const payload = await apiRequest<FleetVehicleLocationPingRecord>(`/api/v1/fleet/vehicles/${vehicleId}/locations`, {
      method: 'POST',
      body: JSON.stringify(input),
      headers: {
        ...(options?.tenantId ? { 'X-Tenant-ID': options.tenantId } : {}),
        ...(options?.sppgId ? { 'X-SPPG-ID': options.sppgId } : {}),
      },
    })
    return payload.data
  } catch {
    const vehicle = mockFleetVehicles.find((item) => item.id === vehicleId)
    const record: FleetVehicleLocationPingRecord = {
      id: `vehicle-location-${Date.now()}`,
      vehicle_id: vehicleId,
      vehicle_code: vehicle?.vehicle_code || vehicleId,
      plate_number: vehicle?.plate_number || null,
      sppg_id: input.sppg_id || null,
      assignment_id: input.assignment_id || null,
      recorded_at: input.recorded_at,
      latitude: input.latitude,
      longitude: input.longitude,
      speed_kph: input.speed_kph ?? null,
      heading_degree: input.heading_degree ?? null,
      accuracy_meter: input.accuracy_meter ?? null,
      engine_on: input.engine_on ?? null,
      movement_status: input.movement_status,
      event_type: input.event_type,
      source: input.source,
      address_label: input.address_label ?? null,
      notes: input.notes ?? null,
    }
    mockVehicleLocationPings.unshift(record)
    return record
  }
}

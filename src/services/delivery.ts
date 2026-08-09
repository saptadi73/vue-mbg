import { apiRequest } from '@/services/http'
import {
  mockDeliveryIncidents,
  mockDeliveryOrderDetails,
  mockDeliveryOrders,
  mockDeliveryProofs,
  mockDeliveryRoutes,
  mockDeliveryRouteStops,
  mockFleetVehicles,
  mockMapData,
} from '@/services/mock-data'
import type {
  DeliveryIncidentRecord,
  DeliveryOrderDetailRecord,
  DeliveryOrderRecord,
  DeliveryPackageLifecycleRecord,
  DeliveryProofRecord,
  DeliveryRoutePlanRecord,
} from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

const ensureRecord = <T>(value: T | undefined, message: string): T => {
  if (!value) {
    throw new Error(message)
  }

  return value
}

const asRecord = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null)

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toStringList = (value: unknown) =>
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : []

const resolveReceiveDeadline = (record: Record<string, unknown>) => {
  if (record.receive_deadline_at) return String(record.receive_deadline_at)
  if (!record.cooking_completed_at) return null

  const maxMinutes = toNumber(record.max_time_to_recipient_minutes)
  if (maxMinutes === null) return null
  return new Date(new Date(String(record.cooking_completed_at)).getTime() + maxMinutes * 60_000).toISOString()
}

const normalizeDeliveryPackages = (data: unknown): DeliveryPackageLifecycleRecord[] => {
  const list = Array.isArray(data)
    ? data
    : Array.isArray(asRecord(data)?.items)
      ? (asRecord(data)?.items as unknown[])
      : []

  return list
    .map((item, index) => {
      const record = asRecord(item)
      if (!record) return null

      const packageId = String(record.package_id ?? record.id ?? '').trim()
      if (!packageId) return null

      return {
        package_id: packageId,
        trace_code: String(record.trace_code ?? `PKG-${index + 1}`),
        product_name: String(record.product_name ?? '-'),
        quantity_portions: Math.max(0, Number(record.quantity_portions ?? 0)),
        package_trace_entity_id: record.package_trace_entity_id ? String(record.package_trace_entity_id) : null,
        raw_material_trace_codes: toStringList(record.raw_material_trace_codes),
        production_trace_code: record.production_trace_code ? String(record.production_trace_code) : null,
        production_order_id: record.production_order_id ? String(record.production_order_id) : null,
        production_number: record.production_number ? String(record.production_number) : null,
        cooking_completed_at: record.cooking_completed_at ? String(record.cooking_completed_at) : null,
        packaging_started_at: record.packaging_started_at ? String(record.packaging_started_at) : null,
        delivery_started_at: record.delivery_started_at ? String(record.delivery_started_at) : null,
        received_at: record.received_at ? String(record.received_at) : null,
        receive_deadline_at: resolveReceiveDeadline(record),
        max_time_to_recipient_minutes: toNumber(record.max_time_to_recipient_minutes),
        status: String(record.status ?? 'IN_WAREHOUSE'),
        status_label: record.status_label ? String(record.status_label) : null,
        vehicle_id: record.vehicle_id ? String(record.vehicle_id) : null,
        vehicle_code: record.vehicle_code ? String(record.vehicle_code) : null,
        plate_number: record.plate_number ? String(record.plate_number) : null,
        route_id: record.route_id ? String(record.route_id) : null,
        route_code: record.route_code ? String(record.route_code) : null,
        delivery_stop_id: record.delivery_stop_id ? String(record.delivery_stop_id) : null,
        destination_school_id: record.destination_school_id ? String(record.destination_school_id) : null,
        destination_name: record.destination_name ? String(record.destination_name) : null,
        destination_address: record.destination_address ? String(record.destination_address) : null,
        destination_latitude: toNumber(record.destination_latitude),
        destination_longitude: toNumber(record.destination_longitude),
      } as DeliveryPackageLifecycleRecord
    })
    .filter(Boolean) as DeliveryPackageLifecycleRecord[]
}

const buildDeliveryPackagesFallback = (): DeliveryPackageLifecycleRecord[] => {
  const now = Date.now()
  return mockDeliveryOrders.slice(0, 8).map((delivery, index) => {
    const destination = mockMapData.schools.find((school) => school.id === delivery.school_id) || mockMapData.schools[index % Math.max(mockMapData.schools.length, 1)]
    const route = mockDeliveryRoutes.find((item) => item.sppg_id === delivery.sppg_id) || mockDeliveryRoutes[index % Math.max(mockDeliveryRoutes.length, 1)]
    const vehicle = mockFleetVehicles[index % Math.max(mockFleetVehicles.length, 1)]
    const cookingCompletedAt = new Date(now - (165 - index * 7) * 60_000)
    const maxTimeToRecipientMinutes = 240

    return {
      package_id: `package-mock-${index + 1}`,
      trace_code: `PKG-DEMO-${String(index + 1).padStart(3, '0')}`,
      product_name: `Menu ${delivery.delivery_number}`,
      quantity_portions: 70 + index * 5,
      raw_material_trace_codes: [
        `TRC-RAW-${String(index + 1).padStart(3, '0')}-A`,
        `TRC-RAW-${String(index + 1).padStart(3, '0')}-B`,
      ],
      production_trace_code: `TRC-PROD-${String(index + 1).padStart(3, '0')}`,
      production_order_id: delivery.production_order_id || null,
      production_number: delivery.production_order_id || null,
      cooking_completed_at: cookingCompletedAt.toISOString(),
      packaging_started_at: new Date(now - (145 - index * 7) * 60_000).toISOString(),
      delivery_started_at: ['IN_TRANSIT', 'SENT', 'RECEIVED'].includes(delivery.status)
        ? new Date(now - (95 - index * 5) * 60_000).toISOString()
        : null,
      received_at: delivery.status === 'RECEIVED'
        ? new Date(now - (25 - index * 2) * 60_000).toISOString()
        : null,
      receive_deadline_at: new Date(cookingCompletedAt.getTime() + maxTimeToRecipientMinutes * 60_000).toISOString(),
      max_time_to_recipient_minutes: maxTimeToRecipientMinutes,
      status: delivery.status,
      status_label: delivery.status === 'IN_TRANSIT'
        ? 'Dalam perjalanan'
        : delivery.status === 'RECEIVED'
          ? 'Sudah diterima'
          : delivery.status === 'SENT'
            ? 'Sudah dikirim'
            : delivery.status === 'HOLD'
              ? 'Ditahan'
              : 'Masih di gudang',
      vehicle_id: delivery.status === 'PLANNED' ? null : vehicle?.id || null,
      vehicle_code: delivery.status === 'PLANNED' ? null : vehicle?.vehicle_code || null,
      plate_number: delivery.status === 'PLANNED' ? null : vehicle?.plate_number || null,
      route_id: route?.id || null,
      route_code: route?.route_code || null,
      destination_school_id: delivery.school_id || null,
      destination_name: delivery.school_name || destination?.name || null,
      destination_address: destination ? `${destination.name}, area layanan MBG` : null,
      destination_latitude: destination?.latitude ?? null,
      destination_longitude: destination?.longitude ?? null,
    }
  })
}

export const getDeliveryOrders = async () => {
  try {
    const payload = await apiRequest<DeliveryOrderRecord[]>('/api/v1/delivery-orders/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockDeliveryOrders, total: mockDeliveryOrders.length }
  }
}

export const getDeliveryPackages = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/deliveries/packages')
    const items = normalizeDeliveryPackages(payload.data)
    return { items, total: totalFromEnvelope(payload, items.length) }
  } catch {
    const items = buildDeliveryPackagesFallback()
    return { items, total: items.length }
  }
}

export const getDeliveryRoutes = async () => {
  try {
    const payload = await apiRequest<DeliveryRoutePlanRecord[]>('/api/v1/delivery-orders/routes')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockDeliveryRoutes, total: mockDeliveryRoutes.length }
  }
}

export const getDeliveryOrderById = async (deliveryOrderId: string) => {
  try {
    const payload = await apiRequest<DeliveryOrderDetailRecord>(`/api/v1/delivery-orders/${deliveryOrderId}`)
    return payload.data
  } catch {
    return ensureRecord(
      mockDeliveryOrderDetails.find((item) => item.delivery_order.id === deliveryOrderId) || mockDeliveryOrderDetails[0],
      'Delivery order tidak ditemukan.',
    )
  }
}

export const recordDeliveryProof = async (
  deliveryOrderId: string,
  input: Omit<DeliveryProofRecord, 'id' | 'delivery_order_id'>,
) => {
  try {
    const payload = await apiRequest<DeliveryOrderDetailRecord>(`/api/v1/delivery-orders/${deliveryOrderId}/proof`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const detail = await getDeliveryOrderById(deliveryOrderId)
    const record: DeliveryProofRecord = {
      ...input,
      id: `proof-${Date.now()}`,
      delivery_order_id: deliveryOrderId,
    }

    mockDeliveryProofs.unshift(record)
    const detailRef = mockDeliveryOrderDetails.find((item) => item.delivery_order.id === deliveryOrderId)
    if (detailRef) {
      detailRef.proofs.unshift(record)
      detailRef.delivery_order.status =
        input.rejected_portions > 0 ? 'PARTIALLY_RECEIVED' : 'RECEIVED'
      detailRef.delivery_order.actual_arrival = input.received_at
      detailRef.delivery_order.receiver_name = input.receiver_name
    }

    const summary = mockDeliveryOrders.find((item) => item.id === deliveryOrderId)
    if (summary) {
      summary.status = input.rejected_portions > 0 ? 'PARTIALLY_RECEIVED' : 'RECEIVED'
      summary.actual_arrival = input.received_at
      summary.receiver_name = input.receiver_name
    }

    return detailRef || detail
  }
}

export const recordDeliveryIncident = async (
  deliveryOrderId: string,
  input: Omit<DeliveryIncidentRecord, 'id' | 'delivery_order_id'>,
) => {
  try {
    const payload = await apiRequest<DeliveryOrderDetailRecord>(`/api/v1/delivery-orders/${deliveryOrderId}/incidents`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const detail = await getDeliveryOrderById(deliveryOrderId)
    const record: DeliveryIncidentRecord = {
      ...input,
      id: `incident-${Date.now()}`,
      delivery_order_id: deliveryOrderId,
    }

    mockDeliveryIncidents.unshift(record)
    const detailRef = mockDeliveryOrderDetails.find((item) => item.delivery_order.id === deliveryOrderId)
    if (detailRef) {
      detailRef.incidents.unshift(record)
    }

    return detailRef || detail
  }
}

export const createRoutePlan = async (input: {
  route_name: string
  planned_departure: string
  planned_arrival: string
  notes?: string
  stops: Array<{
    delivery_order_id: string
    planned_arrival: string
    recipient_name: string
    stop_gps: string
    notes?: string
  }>
}) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/delivery-orders/routes', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const firstDelivery = mockDeliveryOrders.find((item) => item.id === input.stops[0]?.delivery_order_id) || mockDeliveryOrders[0]
    const route: DeliveryRoutePlanRecord = {
      id: `route-plan-${Date.now()}`,
      tenant_id: firstDelivery?.tenant_id,
      sppg_id: firstDelivery?.sppg_id || 'sppg-jakarta-pusat-01',
      route_code: `RT-${Date.now()}`,
      route_name: input.route_name,
      route_status: 'PLANNED',
      planned_departure: input.planned_departure,
      planned_arrival: input.planned_arrival,
      actual_departure: null,
      actual_arrival: null,
      origin_gps: '-6.1775,106.8272',
      destination_gps: input.stops[input.stops.length - 1]?.stop_gps || '-6.1883,106.8393',
      total_distance_km: 4.2,
      notes: input.notes || null,
    }

    mockDeliveryRoutes.unshift(route)
    input.stops.forEach((stop, index) => {
      mockDeliveryRouteStops.unshift({
        id: `route-stop-${Date.now()}-${index + 1}`,
        delivery_order_id: stop.delivery_order_id,
        stop_sequence: index + 1,
        status: 'PLANNED',
        planned_arrival: stop.planned_arrival,
        actual_arrival: null,
        recipient_name: stop.recipient_name,
        stop_gps: stop.stop_gps,
        notes: stop.notes || null,
      })
    })

    return {
      route,
      stops: mockDeliveryRouteStops.filter((item) =>
        input.stops.some((stop) => stop.delivery_order_id === item.delivery_order_id),
      ),
      incidents: [],
    }
  }
}

export const updateRouteVehicle = async (routeId: string, vehicleId: string | null) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/delivery-orders/routes/${routeId}/vehicle`, {
      method: 'PATCH',
      body: JSON.stringify({ vehicle_id: vehicleId }),
    })
    return payload.data
  } catch {
    const route = mockDeliveryRoutes.find((item) => item.id === routeId)
    if (route) {
      route.route_status = 'PLANNED'
      route.notes = [route.notes || '', `vehicle_id di-set dari ${vehicleId || 'null'}`].filter(Boolean).join(' | ')
    }
    return { route_id: routeId, vehicle_id: vehicleId }
  }
}

export const sendRouteVehicleLocation = async (
  routeId: string,
  input: {
    latitude: number
    longitude: number
    recorded_at?: string
    accuracy_meter?: number | null
    speed_kph?: number | null
    heading_degree?: number | null
    measurement_method?: string
  },
) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/delivery-orders/routes/${routeId}/vehicle-location`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    return {
      route_id: routeId,
      recorded_at: input.recorded_at || new Date().toISOString(),
    }
  }
}

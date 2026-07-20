import { apiRequest } from '@/services/http'
import {
  mockDeliveryIncidents,
  mockDeliveryOrderDetails,
  mockDeliveryOrders,
  mockDeliveryProofs,
  mockDeliveryRoutes,
  mockDeliveryRouteStops,
} from '@/services/mock-data'
import type {
  DeliveryIncidentRecord,
  DeliveryOrderDetailRecord,
  DeliveryOrderRecord,
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

export const getDeliveryOrders = async () => {
  try {
    const payload = await apiRequest<DeliveryOrderRecord[]>('/api/v1/delivery-orders/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockDeliveryOrders, total: mockDeliveryOrders.length }
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

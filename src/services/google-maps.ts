import { env } from '@/config/env'
import { apiRequest } from '@/services/http'

export interface RouteWaypoint {
  latitude: number
  longitude: number
}

export interface GoogleRouteResult {
  distanceMeters: number
  durationSeconds: number
  estimatedArrivalAt: string
  encodedPolyline: string
}

export interface RouteSnapshotInput {
  route_id: string
  tenant_id: string
  sppg_id?: string
  distance_meters: number
  duration_seconds: number
  estimated_arrival_at: string
  provider: 'GOOGLE_ROUTES'
  encoded_polyline?: string
  provider_response?: Record<string, unknown>
}

const waypoint = (location: RouteWaypoint) => ({
  location: { latLng: { latitude: location.latitude, longitude: location.longitude } },
})

export const computeGoogleRoute = async (
  origin: RouteWaypoint,
  destination: RouteWaypoint,
  intermediates: RouteWaypoint[] = [],
): Promise<GoogleRouteResult> => {
  if (!env.googleMapsApiKey) throw new Error('Google Maps API key belum dikonfigurasi.')

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.googleMapsApiKey,
      'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify({
      origin: waypoint(origin),
      destination: waypoint(destination),
      intermediates: intermediates.map(waypoint),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      languageCode: 'id-ID',
      units: 'METRIC',
    }),
  })

  if (!response.ok) throw new Error(`Google Routes gagal (${response.status}).`)
  const payload = (await response.json()) as {
    routes?: Array<{
      distanceMeters?: number
      duration?: string
      polyline?: { encodedPolyline?: string }
    }>
  }
  const route = payload.routes?.[0]
  if (!route) throw new Error('Rute tidak ditemukan untuk koordinat yang dipilih.')
  const durationSeconds = Math.round(Number.parseFloat(route.duration || '0'))

  return {
    distanceMeters: route.distanceMeters || 0,
    durationSeconds,
    estimatedArrivalAt: new Date(Date.now() + durationSeconds * 1000).toISOString(),
    encodedPolyline: route.polyline?.encodedPolyline || '',
  }
}

export const saveRouteSnapshot = async (snapshot: RouteSnapshotInput) => {
  const { route_id, ...body } = snapshot
  const payload = await apiRequest<unknown>(`/api/v1/food-safety/deliveries/${route_id}/route-snapshot`, {
    method: 'POST',
    body: JSON.stringify(body),
    clearSessionOn401: false,
  })
  return payload.data
}

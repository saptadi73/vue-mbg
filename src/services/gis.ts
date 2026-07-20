import { apiRequest } from '@/services/http'
import { mockMapData } from '@/services/mock-data'
import type {
  AssignmentValidationRecord,
  DeliveryRouteRecord,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoFeatureProperties,
  GeoPointRecord,
  MapDataset,
  NearestKitchenRecord,
  ServiceAreaRecord,
  ServiceCoverageRecord,
} from '@/types/domain'

type GeoBoundaryInput = GeoJsonFeatureCollection | GeoJsonFeature['geometry'] | null | undefined
type GisOverviewFilters = {
  date_from?: string
  date_to?: string
  sppg_id?: string
  bbox?: string
}

const asRecord = (value: unknown) => (value && typeof value === 'object' ? (value as Record<string, unknown>) : null)

const resolveLatLng = (input: Record<string, unknown>) => {
  const coordinate = asRecord(input.coordinate)
  const latitude = Number(
    coordinate?.latitude ??
      input.latitude ??
      input.lat ??
      input.y ??
      (Array.isArray(input.coordinates) ? (input.coordinates as unknown[])[1] : undefined),
  )
  const longitude = Number(
    coordinate?.longitude ??
      input.longitude ??
      input.lng ??
      input.lon ??
      input.x ??
      (Array.isArray(input.coordinates) ? (input.coordinates as unknown[])[0] : undefined),
  )

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null
  }

  return { latitude, longitude }
}

const normalizePoints = (
  input: unknown,
  resolver?: (item: Record<string, unknown>, index: number) => Partial<GeoPointRecord>,
): GeoPointRecord[] => {
  if (!Array.isArray(input)) return []

  return input
    .map((item, index) => {
      const record = asRecord(item)
      if (!record) return null

      const latLng = resolveLatLng(record)
      if (!latLng) return null

      return {
        id: String(record.id ?? record.kitchen_id ?? record.school_id ?? record.sppg_id ?? index),
        name: String(record.name ?? record.code ?? `point-${index + 1}`),
        latitude: latLng.latitude,
        longitude: latLng.longitude,
        status: record.status ? String(record.status) : record.is_active === false ? 'INACTIVE' : 'ACTIVE',
        code: record.code ? String(record.code) : undefined,
        city: record.city ? String(record.city) : undefined,
        ...resolver?.(record, index),
      }
    })
    .filter(Boolean) as GeoPointRecord[]
}

const asFeatureCollection = (input: unknown): GeoJsonFeatureCollection | null => {
  if (!input) return null

  const record = asRecord(input)
  if (record?.type === 'FeatureCollection' && Array.isArray(record.features)) {
    return input as GeoJsonFeatureCollection
  }

  if (record?.data) {
    return asFeatureCollection(record.data)
  }

  if (Array.isArray(input)) {
    return {
      type: 'FeatureCollection',
      features: input.filter(Boolean) as GeoJsonFeature[],
    }
  }

  if (record?.type === 'Feature' && record.geometry) {
    return {
      type: 'FeatureCollection',
      features: [input as GeoJsonFeature],
    }
  }

  if ((record?.type === 'Polygon' || record?.type === 'MultiPolygon') && record.coordinates) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: String(record.type),
            coordinates: record.coordinates,
          },
          properties: {},
        },
      ],
    }
  }

  return null
}

const featurePointsToPointRecords = (
  collection: GeoJsonFeatureCollection | null,
  resolver?: (feature: GeoJsonFeature, index: number) => Partial<GeoPointRecord>,
): GeoPointRecord[] => {
  if (!collection) return []

  return collection.features
    .map((feature, index) => {
      if (feature.geometry.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) return null
      const [longitude, latitude] = feature.geometry.coordinates as number[]
      if (Number.isNaN(Number(latitude)) || Number.isNaN(Number(longitude))) return null

      return {
        id: String(feature.properties?.id ?? feature.properties?.school_id ?? feature.properties?.kitchen_id ?? index),
        name: String(feature.properties?.name ?? feature.properties?.code ?? `feature-${index + 1}`),
        latitude: Number(latitude),
        longitude: Number(longitude),
        status: feature.properties?.status ? String(feature.properties.status) : undefined,
        code: feature.properties?.code ? String(feature.properties.code) : undefined,
        ...resolver?.(feature, index),
      }
    })
    .filter(Boolean) as GeoPointRecord[]
}

const normalizeCoverageSummary = (input: unknown): ServiceCoverageRecord[] => {
  const items = asRecord(input)?.items
  if (!Array.isArray(items)) return []

  return items
    .map((item) => {
      const record = asRecord(item)
      if (!record) return null

      return {
        sppg_id: String(record.sppg_id ?? record.kitchen_id ?? ''),
        tenant_id: record.tenant_id ? String(record.tenant_id) : undefined,
        code: String(record.code ?? '-'),
        name: String(record.name ?? '-'),
        service_radius_meter: Number(record.service_radius_meter ?? 0),
        covered_school_count: Number(record.covered_school_count ?? 0),
        out_of_radius_school_count: Number(record.out_of_radius_school_count ?? 0),
        nearest_school_distance_km: Number(record.nearest_school_distance_km ?? 0),
        farthest_covered_school_distance_km: Number(record.farthest_covered_school_distance_km ?? 0),
        average_covered_distance_km: Number(record.average_covered_distance_km ?? 0),
      }
    })
    .filter(Boolean) as ServiceCoverageRecord[]
}

const normalizeDeliveryRoutes = (input: unknown): DeliveryRouteRecord[] => {
  const list = Array.isArray(input) ? input : Array.isArray(asRecord(input)?.items) ? (asRecord(input)?.items as unknown[]) : []

  return list
    .map((item, index) => {
      const record = asRecord(item)
      if (!record) return null

      const from = asRecord(record.from_coordinate)
      const to = asRecord(record.to_coordinate)
      const fromCoordinate = from ? resolveLatLng(from) : null
      const toCoordinate = to ? resolveLatLng(to) : null
      if (!fromCoordinate || !toCoordinate) return null

      const line = asRecord(record.line)
      return {
        id: String(record.id ?? record.delivery_order_id ?? index),
        delivery_order_id: record.delivery_order_id ? String(record.delivery_order_id) : undefined,
        delivery_number: String(record.delivery_number ?? `DLV-${index + 1}`),
        status: String(record.status ?? 'UNKNOWN'),
        distance_km: Number(record.distance_km ?? 0),
        from_coordinate: fromCoordinate,
        to_coordinate: toCoordinate,
        line:
          line?.type === 'LineString' && Array.isArray(line.coordinates)
            ? {
                type: 'LineString',
                coordinates: line.coordinates as number[][],
              }
            : {
                type: 'LineString',
                coordinates: [
                  [fromCoordinate.longitude, fromCoordinate.latitude],
                  [toCoordinate.longitude, toCoordinate.latitude],
                ],
              },
      }
    })
    .filter(Boolean) as DeliveryRouteRecord[]
}

const normalizeServiceAreas = (input: unknown): ServiceAreaRecord[] => {
  const list = Array.isArray(input) ? input : Array.isArray(asRecord(input)?.items) ? (asRecord(input)?.items as unknown[]) : []

  return list
    .map((item, index) => {
      const record = asRecord(item)
      if (!record) return null

      return {
        id: String(record.id ?? record.service_area_id ?? index),
        sppg_id: record.sppg_id ? String(record.sppg_id) : undefined,
        sppg_name: record.sppg_name ? String(record.sppg_name) : undefined,
        name: String(record.name ?? `Service Area ${index + 1}`),
        valid_from: record.valid_from ? String(record.valid_from) : null,
        valid_to: record.valid_to ? String(record.valid_to) : null,
        boundary_geojson: asFeatureCollection(record.boundary_geojson ?? record.geometry),
        boundary_wkt: record.boundary_wkt ? String(record.boundary_wkt) : null,
        status: record.status ? String(record.status) : undefined,
      }
    })
    .filter(Boolean) as ServiceAreaRecord[]
}

const normalizeNearestKitchens = (input: unknown): NearestKitchenRecord[] => {
  const list = Array.isArray(input) ? input : Array.isArray(asRecord(input)?.items) ? (asRecord(input)?.items as unknown[]) : []

  return list
    .map((item) => {
      const record = asRecord(item)
      if (!record) return null
      return {
        kitchen_id: String(record.kitchen_id ?? ''),
        kitchen_name: String(record.kitchen_name ?? record.name ?? '-'),
        code: record.code ? String(record.code) : undefined,
        distance_m: Number(record.distance_m ?? 0),
        inside_service_area: Boolean(record.inside_service_area),
        service_radius_meter: record.service_radius_meter ? Number(record.service_radius_meter) : undefined,
      }
    })
    .filter(Boolean) as NearestKitchenRecord[]
}

const normalizeAssignmentValidation = (input: unknown): AssignmentValidationRecord | null => {
  const record = asRecord(input)
  if (!record) return null

  return {
    kitchen_id: String(record.kitchen_id ?? ''),
    school_id: String(record.school_id ?? ''),
    planned_portions: Number(record.planned_portions ?? 0),
    is_valid: Boolean(record.is_valid),
    distance_m: record.distance_m ? Number(record.distance_m) : undefined,
    inside_service_area: record.inside_service_area ? Boolean(record.inside_service_area) : undefined,
    service_radius_meter: record.service_radius_meter ? Number(record.service_radius_meter) : undefined,
    message: record.message ? String(record.message) : undefined,
  }
}

const collectionToBoundaryGeometry = (input: GeoBoundaryInput) => {
  if (!input) return null

  const collection = asFeatureCollection(input)
  if (collection?.features.length) {
    const firstGeometry = collection.features[0]?.geometry
    return firstGeometry
      ? {
          type: firstGeometry.type,
          coordinates: firstGeometry.coordinates,
        }
      : null
  }

  const record = asRecord(input)
  if (
    (record?.type === 'Polygon' || record?.type === 'MultiPolygon') &&
    Array.isArray(record.coordinates)
  ) {
    return {
      type: String(record.type),
      coordinates: record.coordinates,
    }
  }

  return null
}

const fallbackServiceAreaSeed = (): ServiceAreaRecord[] =>
  (mockMapData.coverage?.features || []).map((feature, index) => ({
    id: `service-area-${index + 1}`,
    sppg_id: mockMapData.kitchens[index]?.id ?? mockMapData.kitchens[0]?.id ?? 'k-1',
    sppg_name: mockMapData.kitchens[index]?.name ?? mockMapData.kitchens[0]?.name ?? 'SPPG Jakarta Pusat 01',
    name: `Area Layanan ${index + 1}`,
    valid_from: '2026-07-20',
    valid_to: null,
    boundary_geojson: {
      type: 'FeatureCollection',
      features: [
        {
          ...feature,
          properties: {
            ...(feature.properties as GeoFeatureProperties | undefined),
            name: `Area Layanan ${index + 1}`,
            type: 'service_area',
          },
        },
      ],
    },
    status: 'ACTIVE',
  }))

const fallbackServiceAreas = fallbackServiceAreaSeed()

const mapServiceAreasToFeatureCollection = (items: ServiceAreaRecord[]): GeoJsonFeatureCollection | null => {
  const features = items.flatMap((item) => {
    const collection = asFeatureCollection(item.boundary_geojson)
    if (!collection) return []

    return collection.features.map((feature) => ({
      ...feature,
      properties: {
        ...feature.properties,
        id: item.id,
        name: item.name,
        sppg_id: item.sppg_id,
        sppg_name: item.sppg_name,
        valid_from: item.valid_from,
        valid_to: item.valid_to,
        status: item.status,
        type: 'service_area',
      },
    }))
  })

  if (!features.length) return null
  return { type: 'FeatureCollection', features }
}

const buildFallbackDataset = (): MapDataset => {
  const primaryKitchen = mockMapData.kitchens[0] || {
    id: 'k-1',
    name: 'SPPG Jakarta Pusat 01',
    latitude: -6.1775,
    longitude: 106.8272,
    status: 'ACTIVE',
  }

  const coverageSummary: ServiceCoverageRecord[] = mockMapData.kitchens.map((kitchen) => ({
    sppg_id: kitchen.id,
    code: kitchen.name.slice(0, 12).toUpperCase().replaceAll(' ', '-'),
    name: kitchen.name,
    service_radius_meter: 3000,
    covered_school_count: kitchen.id === 'k-1' ? 2 : 1,
    out_of_radius_school_count: kitchen.id === 'k-1' ? 1 : 0,
    nearest_school_distance_km: 0.42,
    farthest_covered_school_distance_km: 2.81,
    average_covered_distance_km: 1.63,
  }))

  const riskPoints = mockMapData.kitchens.map((kitchen, index) => ({
    ...kitchen,
    risk_score: [28, 57, 73][index] ?? 45,
    risk_level: ['LOW', 'MEDIUM', 'HIGH'][index] ?? 'MEDIUM',
  }))

  const distributionHeatmap: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: mockMapData.schools.map((school, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [school.longitude, school.latitude],
      },
      properties: {
        id: school.id,
        name: school.name,
        distribution_count: [18, 7, 12][index] ?? 9,
        type: 'distribution',
      },
    })),
  }

  const deliveryRoutes: DeliveryRouteRecord[] = mockMapData.schools.slice(0, 2).map((school, index) => ({
    id: `route-${index + 1}`,
    delivery_order_id: `do-${index + 1}`,
    delivery_number: `DO-20260720-000${index + 1}`,
    status: index === 0 ? 'DELIVERED' : 'IN_TRANSIT',
    distance_km: index === 0 ? 2.3 : 3.1,
    from_coordinate: {
      latitude: primaryKitchen.latitude,
      longitude: primaryKitchen.longitude,
    },
    to_coordinate: {
      latitude: school.latitude,
      longitude: school.longitude,
    },
    line: {
      type: 'LineString',
      coordinates: [
        [primaryKitchen.longitude, primaryKitchen.latitude],
        [school.longitude, school.latitude],
      ],
    },
  }))

  const serviceAreas = mapServiceAreasToFeatureCollection(fallbackServiceAreas)

  return {
    kitchens: mockMapData.kitchens,
    schools: mockMapData.schools,
    coverage: mockMapData.coverage,
    unserved: mockMapData.unserved,
    distributionHeatmap,
    serviceAreas,
    deliveryRoutes,
    riskPoints,
    coverageSummary,
    nearestKitchens: [
      {
        kitchen_id: mockMapData.kitchens[0]?.id ?? 'k-1',
        kitchen_name: primaryKitchen.name,
        code: 'SPPG-JKT-01',
        distance_m: 950,
        inside_service_area: true,
        service_radius_meter: 3000,
      },
      {
        kitchen_id: mockMapData.kitchens[1]?.id ?? 'k-2',
        kitchen_name: mockMapData.kitchens[1]?.name ?? 'SPPG Tanah Abang 02',
        code: 'SPPG-TAB-02',
        distance_m: 1780,
        inside_service_area: false,
        service_radius_meter: 2500,
      },
    ],
    assignmentValidation: {
      kitchen_id: primaryKitchen.id,
      school_id: mockMapData.schools[0]?.id ?? 's-1',
      planned_portions: 120,
      is_valid: true,
      distance_m: 950,
      inside_service_area: true,
      service_radius_meter: 3000,
      message: 'Sekolah masih berada dalam radius dan service area aktif.',
    },
  }
}

export const getGisOverview = async (filters: GisOverviewFilters = {}): Promise<MapDataset> => {
  try {
    const [
      sppgMapPayload,
      kitchensPayload,
      schoolsPayload,
      coveragePayload,
      unservedPayload,
      riskPayload,
      distributionPayload,
      serviceAreasPayload,
      deliveryRoutesPayload,
    ] = await Promise.all([
      apiRequest<unknown>('/api/v1/gis/sppg-map'),
      apiRequest<unknown>('/api/v1/gis/kitchens', {
        query: {
          bbox: filters.bbox,
          snapshot_date: filters.date_to || filters.date_from,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/schools', {
        query: {
          kitchen_id: filters.sppg_id,
          date_from: filters.date_from,
          date_to: filters.date_to,
          bbox: filters.bbox,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/service-coverage', {
        query: {
          sppg_id: filters.sppg_id,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/unserved-schools', {
        query: {
          date_from: filters.date_from,
          date_to: filters.date_to,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/sppg-risk-heatmap', {
        query: {
          snapshot_date: filters.date_to || filters.date_from,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/heatmaps/distribution', {
        query: {
          date_from: filters.date_from,
          date_to: filters.date_to,
          bbox: filters.bbox,
        },
      }),
      apiRequest<unknown>('/api/v1/gis/service-areas'),
      apiRequest<unknown>('/api/v1/gis/delivery-routes', {
        query: {
          date_from: filters.date_from,
          date_to: filters.date_to,
        },
      }),
    ])

    const kitchenCollection = asFeatureCollection(kitchensPayload.data)
    const schoolCollection = asFeatureCollection(schoolsPayload.data)
    const coverageSummary = normalizeCoverageSummary(coveragePayload.data)
    const coverageFeatures = asFeatureCollection((coveragePayload.data as Record<string, unknown> | null)?.items)
    const unservedFeatures = asFeatureCollection(unservedPayload.data)
    const distributionHeatmap = asFeatureCollection(distributionPayload.data)
    const serviceAreaItems = normalizeServiceAreas(serviceAreasPayload.data)
    const serviceAreas = mapServiceAreasToFeatureCollection(serviceAreaItems)
    const riskItems = normalizePoints((asRecord(riskPayload.data)?.items ?? riskPayload.data) as unknown[], (item) => ({
      risk_score: Number(item.risk_score ?? 0),
      risk_level: item.risk_level ? String(item.risk_level) : undefined,
      metric_value: Number(asRecord(item.metrics)?.radius_utilization_ratio ?? item.risk_score ?? 0),
      covered_school_count: Number(asRecord(item.metrics)?.covered_school_count ?? item.covered_school_count ?? 0),
    }))

    const kitchens =
      featurePointsToPointRecords(kitchenCollection, (feature) => ({
        service_radius_meter: Number(feature.properties?.service_radius_meter ?? 0),
        covered_school_count: Number(feature.properties?.covered_school_count ?? 0),
        city: feature.properties?.city ? String(feature.properties.city) : undefined,
      })) ||
      []

    const schools =
      featurePointsToPointRecords(schoolCollection, (feature) => ({
        school_level: feature.properties?.school_level ? String(feature.properties.school_level) : undefined,
        student_count: Number(feature.properties?.student_count ?? 0),
        active_beneficiary_count: Number(feature.properties?.active_beneficiary_count ?? 0),
        delivery_count: Number(feature.properties?.delivery_count ?? 0),
        avg_feedback: Number(feature.properties?.avg_feedback ?? 0),
        complaint_count: Number(feature.properties?.complaint_count ?? 0),
      })) || []

    const sppgMapItems = normalizePoints((asRecord(sppgMapPayload.data)?.items ?? sppgMapPayload.data) as unknown[], (item) => ({
      code: item.code ? String(item.code) : undefined,
      city: item.city ? String(item.city) : undefined,
      service_radius_meter: Number(item.service_radius_meter ?? 0),
      covered_school_count: Number(item.covered_school_count ?? 0),
    }))

    const normalizedUnserved =
      unservedFeatures && unservedFeatures.features.length
        ? featurePointsToPointRecords(unservedFeatures, (feature) => ({
            status: 'UNSERVED',
            metric_value: Number(feature.properties?.nearest_distance_km ?? 0),
          }))
        : normalizePoints((asRecord(unservedPayload.data)?.items ?? unservedPayload.data) as unknown[], (item) => ({
            status: 'UNSERVED',
            metric_value: Number(item.nearest_distance_km ?? 0),
          }))

    const normalizedDistribution =
      distributionHeatmap && distributionHeatmap.features.length
        ? featurePointsToPointRecords(distributionHeatmap, (feature) => ({
            metric_value: Number(feature.properties?.distribution_count ?? 0),
          }))
        : []

    const dataset: MapDataset = {
      kitchens: kitchens.length ? kitchens : sppgMapItems,
      schools: schools.length ? schools : normalizedDistribution.length ? normalizedDistribution : [],
      coverage: coverageFeatures,
      unserved: unservedFeatures,
      distributionHeatmap,
      serviceAreas,
      deliveryRoutes: normalizeDeliveryRoutes(deliveryRoutesPayload.data),
      riskPoints: riskItems,
      coverageSummary,
    }

    if (!dataset.kitchens.length && !dataset.schools.length) {
      return buildFallbackDataset()
    }

    if (!dataset.unserved && normalizedUnserved.length) {
      dataset.unserved = {
        type: 'FeatureCollection',
        features: normalizedUnserved.map((point) => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude],
          },
          properties: {
            id: point.id,
            name: point.name,
            status: 'UNSERVED',
            nearest_distance_km: point.metric_value,
          },
        })),
      }
    }

    return dataset
  } catch {
    return buildFallbackDataset()
  }
}

export const getNearestKitchens = async (schoolId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/gis/schools/${schoolId}/nearest-kitchens`)
    const items = normalizeNearestKitchens(payload.data)
    return { items, total: items.length }
  } catch {
    const fallback = buildFallbackDataset().nearestKitchens || []
    return { items: fallback, total: fallback.length }
  }
}

export const getDeliveryRouteById = async (deliveryId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/gis/deliveries/${deliveryId}/route`)
    const items = normalizeDeliveryRoutes(payload.data)
    return items[0] || null
  } catch {
    const fallback = buildFallbackDataset().deliveryRoutes || []
    return (
      fallback.find(
        (item) => item.delivery_order_id === deliveryId || item.id === deliveryId || item.delivery_number === deliveryId,
      ) || fallback[0] || null
    )
  }
}

export const validateAssignment = async (input: { kitchen_id: string; school_id: string; planned_portions: number }) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/gis/assignments/validate', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return normalizeAssignmentValidation(payload.data)
  } catch {
    return buildFallbackDataset().assignmentValidation ?? null
  }
}

export const createServiceArea = async (input: {
  sppg_id?: string
  name: string
  valid_from: string
  valid_to?: string | null
  boundary_geojson: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection
}) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/gis/service-areas', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const kitchen = buildFallbackDataset().kitchens.find((item) => item.id === input.sppg_id)
    const geometry = collectionToBoundaryGeometry(input.boundary_geojson)
    const record: ServiceAreaRecord = {
      id: `service-area-${Date.now()}`,
      sppg_id: input.sppg_id,
      sppg_name: kitchen?.name,
      name: input.name,
      valid_from: input.valid_from,
      valid_to: input.valid_to ?? null,
      boundary_geojson: geometry
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry,
                properties: {
                  name: input.name,
                  sppg_id: input.sppg_id,
                  sppg_name: kitchen?.name,
                  type: 'service_area',
                  status: 'ACTIVE',
                },
              },
            ],
          }
        : null,
      status: 'ACTIVE',
    }
    fallbackServiceAreas.unshift(record)
    return record
  }
}

export const updateKitchenServiceArea = async (
  kitchenId: string,
  input: {
    name: string
    valid_from: string
    valid_to?: string | null
    boundary_geojson: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection
  },
) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/gis/kitchens/${kitchenId}/service-area`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    return payload.data
  } catch {
    const kitchen = buildFallbackDataset().kitchens.find((item) => item.id === kitchenId)
    const geometry = collectionToBoundaryGeometry(input.boundary_geojson)
    const existing = fallbackServiceAreas.find((item) => item.sppg_id === kitchenId)

    if (existing) {
      existing.name = input.name
      existing.valid_from = input.valid_from
      existing.valid_to = input.valid_to ?? null
      existing.boundary_geojson = geometry
        ? {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry,
                properties: {
                  name: input.name,
                  sppg_id: kitchenId,
                  sppg_name: kitchen?.name,
                  type: 'service_area',
                  status: 'ACTIVE',
                },
              },
            ],
          }
        : existing.boundary_geojson
      existing.status = 'ACTIVE'
      return existing
    }

    return createServiceArea({
      sppg_id: kitchenId,
      name: input.name,
      valid_from: input.valid_from,
      valid_to: input.valid_to ?? null,
      boundary_geojson: input.boundary_geojson,
    })
  }
}

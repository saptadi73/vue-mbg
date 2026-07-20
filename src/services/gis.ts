import { apiRequest } from '@/services/http'
import { mockMapData } from '@/services/mock-data'
import type { GeoJsonFeatureCollection, GeoPointRecord, MapDataset } from '@/types/domain'

const normalizePoints = (input: unknown): GeoPointRecord[] => {
  if (!Array.isArray(input)) return []

  return input
    .map((item, index) => {
      const record = item as Record<string, unknown>
      const latitude = Number(record.latitude ?? record.lat ?? record.y)
      const longitude = Number(record.longitude ?? record.lng ?? record.lon ?? record.x)

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null
      }

      return {
        id: String(record.id ?? index),
        name: String(record.name ?? record.code ?? `point-${index + 1}`),
        latitude,
        longitude,
        status: record.status ? String(record.status) : undefined,
      }
    })
    .filter(Boolean) as GeoPointRecord[]
}

const asFeatureCollection = (input: unknown): GeoJsonFeatureCollection | null => {
  if (!input || typeof input !== 'object') return null

  const record = input as Record<string, unknown>
  if (record.type === 'FeatureCollection' && Array.isArray(record.features)) {
    return input as unknown as GeoJsonFeatureCollection
  }

  if (Array.isArray(input)) {
    return {
      type: 'FeatureCollection',
      features: input.filter(Boolean) as GeoJsonFeatureCollection['features'],
    }
  }

  return null
}

export const getGisOverview = async (): Promise<MapDataset> => {
  try {
    const [kitchens, schools, coverage, unserved] = await Promise.all([
      apiRequest<unknown>('/api/v1/gis/kitchens'),
      apiRequest<unknown>('/api/v1/gis/schools'),
      apiRequest<unknown>('/api/v1/gis/service-coverage'),
      apiRequest<unknown>('/api/v1/gis/unserved-schools'),
    ])

    const mapped: MapDataset = {
      kitchens: normalizePoints(kitchens.data),
      schools: normalizePoints(schools.data),
      coverage: asFeatureCollection(coverage.data),
      unserved: asFeatureCollection(unserved.data),
    }

    if (!mapped.kitchens.length && !mapped.schools.length) {
      return mockMapData
    }

    return mapped
  } catch {
    return mockMapData
  }
}

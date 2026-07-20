<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'
import type {
  DeliveryRouteRecord,
  FleetVehicleLocationRecord,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoPointRecord,
  MapDataset,
} from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { formatNumber } from '@/utils/format'

type GisLayerMode =
  | 'overview'
  | 'coverage'
  | 'unserved'
  | 'risk'
  | 'distribution'
  | 'serviceAreas'
  | 'routes'
  | 'fleet'

const props = withDefaults(
  defineProps<{
    dataset: MapDataset
    mode?: GisLayerMode
    draftServiceArea?: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection | null
    fleetTrail?: FleetVehicleLocationRecord[] | null
    fleetTrailFocusIndex?: number | null
  }>(),
  {
    mode: 'overview',
    draftServiceArea: null,
    fleetTrail: null,
    fleetTrailFocusIndex: null,
  },
)

const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const mapRef = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let layers: L.Layer[] = []
let tileLayer: L.TileLayer | null = null

type LeafletClusterExtension = typeof L & {
  markerClusterGroup: (options?: Record<string, unknown>) => L.LayerGroup
}

const tileConfig = computed(() =>
  themeMode.value === 'dark'
    ? {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }
    : {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
)

const panelTitle = computed(() => {
  switch (props.mode) {
    case 'coverage':
      return 'Service Coverage Map'
    case 'unserved':
      return 'Unserved Schools Map'
    case 'risk':
      return 'Risk Heatmap'
    case 'distribution':
      return 'Distribution Heatmap'
    case 'serviceAreas':
      return 'Service Areas'
    case 'routes':
      return 'Delivery Routes'
    case 'fleet':
      return 'Fleet Live Tracking'
    default:
      return 'PostGIS Situational Map'
  }
})

const panelSubtitle = computed(() => {
  switch (props.mode) {
    case 'coverage':
      return 'Fokus ke cakupan layanan SPPG, school coverage, dan boundary hasil analisa PostGIS.'
    case 'unserved':
      return 'Menyorot sekolah yang belum masuk radius atau service area aktif.'
    case 'risk':
      return 'Skor risiko operasional spasial per SPPG berdasarkan coverage dan jarak layanan.'
    case 'distribution':
      return 'Hotspot distribusi per sekolah berdasarkan distribution count dari backend.'
    case 'serviceAreas':
      return 'Polygon area layanan yang sudah tersimpan untuk tenant atau SPPG aktif.'
    case 'routes':
      return 'Visualisasi garis rute delivery dari SPPG ke sekolah berdasarkan delivery order.'
    case 'fleet':
      return 'Posisi terbaru armada, status pergerakan, dan titik dispatch terkini pada scope tenant/SPPG aktif.'
    default:
      return 'Layer dapur, sekolah, coverage, gap layanan, dan analisa distribusi dari endpoint GIS backend.'
  }
})

const clearLayers = () => {
  layers.forEach((layer) => layer.remove())
  layers = []
}

const makePointMarker = (point: GeoPointRecord, color: string, size: number, label: string) =>
  L.marker([point.latitude, point.longitude], {
    icon: L.divIcon({
      className: 'mbg-map-marker-shell',
      html: `<span class="mbg-map-marker" style="--marker-color:${color};--marker-size:${size}px;"></span>`,
      iconSize: [size + 12, size + 12],
      iconAnchor: [(size + 12) / 2, (size + 12) / 2],
    }),
  }).bindPopup(
    `<strong>${point.name}</strong><br/>${label}${
      point.code ? `<br/>Code: ${point.code}` : ''
    }${point.city ? `<br/>City: ${point.city}` : ''}${
      typeof point.metric_value === 'number' ? `<br/>Metric: ${formatNumber(point.metric_value)}` : ''
    }`,
  )

const riskColor = (score?: number) => {
  if ((score || 0) >= 70) return '#f97316'
  if ((score || 0) >= 40) return '#facc15'
  return '#34d399'
}

const distributionColor = (value?: number) => {
  if ((value || 0) >= 15) return '#fb7185'
  if ((value || 0) >= 8) return '#38bdf8'
  return '#67e8f9'
}

const fleetStatusColor = (status?: string) => {
  switch (status) {
    case 'IN_TRANSIT':
      return '#38bdf8'
    case 'LOADING':
      return '#f59e0b'
    case 'ARRIVED':
      return '#34d399'
    case 'MAINTENANCE':
      return '#f87171'
    default:
      return '#c084fc'
  }
}

const addLayer = (layer: L.Layer) => {
  if (!map) return
  layer.addTo(map)
  layers.push(layer)
}

const createClusterLayer = () =>
  (L as LeafletClusterExtension).markerClusterGroup({
    showCoverageOnHover: false,
    spiderfyOnMaxZoom: true,
    maxClusterRadius: 42,
    iconCreateFunction: (cluster: { getChildCount: () => number }) =>
      L.divIcon({
        className: 'mbg-map-cluster-shell',
        html: `<span class="mbg-map-cluster">${formatNumber(cluster.getChildCount())}</span>`,
        iconSize: [46, 46],
      }),
  })

const addPointFeaturesToCluster = (
  clusterLayer: L.LayerGroup,
  collection: GeoJsonFeatureCollection,
  color: string,
  size: number,
  labelResolver: (feature: GeoJsonFeature) => string,
  boundsExtender: (lat: number, lng: number) => void,
) => {
  collection.features.forEach((feature) => {
    if (feature.geometry.type !== 'Point' || !Array.isArray(feature.geometry.coordinates)) return
    const [longitude, latitude] = feature.geometry.coordinates as number[]
    const point: GeoPointRecord = {
      id: String(feature.properties?.id ?? feature.properties?.school_id ?? feature.properties?.kitchen_id ?? `${latitude}-${longitude}`),
      name: String(feature.properties?.name ?? feature.properties?.code ?? 'Point'),
      latitude: Number(latitude),
      longitude: Number(longitude),
      code: feature.properties?.code ? String(feature.properties.code) : undefined,
      city: feature.properties?.city ? String(feature.properties.city) : undefined,
      metric_value:
        typeof feature.properties?.distribution_count === 'number'
          ? Number(feature.properties.distribution_count)
          : typeof feature.properties?.nearest_distance_km === 'number'
            ? Number(feature.properties.nearest_distance_km)
            : undefined,
    }
    clusterLayer.addLayer(makePointMarker(point, color, size, labelResolver(feature)))
    boundsExtender(point.latitude, point.longitude)
  })
}

const activePoints = computed(() => {
  switch (props.mode) {
    case 'risk':
      return props.dataset.riskPoints || []
    case 'distribution':
      return []
    case 'unserved':
      return []
    default:
      return []
  }
})

const asFeatureCollection = (
  input: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection | null | undefined,
): GeoJsonFeatureCollection | null => {
  if (!input) return null

  if ('features' in input) {
    return input
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: input,
        properties: {
          name: 'Draft Service Area',
          type: 'draft_service_area',
        },
      },
    ],
  }
}

const renderLayers = () => {
  if (!map) return
  clearLayers()

  const bounds = L.latLngBounds([])
  const extendBounds = (lat: number, lng: number) => bounds.extend([lat, lng])
  const clusterLayer = createClusterLayer()
  let hasClusterMarkers = false

  const renderKitchens =
    props.mode === 'overview' ||
    props.mode === 'coverage' ||
    props.mode === 'routes' ||
    props.mode === 'serviceAreas' ||
    props.mode === 'fleet'
  const renderSchools = props.mode === 'overview' || props.mode === 'coverage'

  if (renderKitchens) {
    props.dataset.kitchens.forEach((point) => {
      clusterLayer.addLayer(makePointMarker(point, '#5cf0c6', 12, 'Kitchen / SPPG'))
      hasClusterMarkers = true
      extendBounds(point.latitude, point.longitude)
    })
  }

  if (renderSchools) {
    props.dataset.schools.forEach((point) => {
      clusterLayer.addLayer(makePointMarker(point, '#8fb8ff', 10, 'School'))
      hasClusterMarkers = true
      extendBounds(point.latitude, point.longitude)
    })
  }

  if ((props.mode === 'overview' || props.mode === 'coverage') && props.dataset.coverage) {
    const layer = L.geoJSON(props.dataset.coverage as never, {
      style: { color: '#4fe3c1', weight: 2, fillOpacity: 0.1 },
    })
    addLayer(layer)
  }

  if ((props.mode === 'overview' || props.mode === 'unserved') && props.dataset.unserved) {
    addPointFeaturesToCluster(
      clusterLayer,
      props.dataset.unserved,
      '#ff7a7a',
      10,
      (feature) => `Unserved School<br/>Nearest Distance: ${String(feature.properties?.nearest_distance_km ?? '-') } km`,
      extendBounds,
    )
    hasClusterMarkers = true
  }

  if (props.mode === 'risk') {
    ;(props.dataset.riskPoints || []).forEach((point) => {
      clusterLayer.addLayer(makePointMarker(point, riskColor(point.risk_score), 14, `Risk ${point.risk_level || 'UNKNOWN'}`))
      hasClusterMarkers = true
      extendBounds(point.latitude, point.longitude)
    })
  }

  if (props.mode === 'distribution' && props.dataset.distributionHeatmap) {
    addPointFeaturesToCluster(
      clusterLayer,
      props.dataset.distributionHeatmap,
      '#38bdf8',
      12,
      (feature) => `Distribution Count: ${String(feature.properties?.distribution_count ?? 0)}`,
      extendBounds,
    )
    hasClusterMarkers = true
  }

  if (props.mode === 'overview' || props.mode === 'fleet') {
    ;(props.dataset.fleetVehicles || []).forEach((vehicle) => {
      clusterLayer.addLayer(
        makePointMarker(
          {
            id: vehicle.id,
            name: vehicle.vehicle_code,
            latitude: vehicle.latitude,
            longitude: vehicle.longitude,
            status: vehicle.status,
            code: vehicle.plate_number || undefined,
            metric_value: vehicle.speed_kmh || undefined,
          },
          fleetStatusColor(vehicle.status),
          13,
          `Fleet ${vehicle.status}${
            vehicle.driver_name ? `<br/>Driver: ${vehicle.driver_name}` : ''
          }${vehicle.sppg_name ? `<br/>SPPG: ${vehicle.sppg_name}` : ''}${
            vehicle.location_recorded_at ? `<br/>Updated: ${vehicle.location_recorded_at}` : ''
          }`,
        ),
      )
      hasClusterMarkers = true
      extendBounds(vehicle.latitude, vehicle.longitude)
    })
  }

  if (props.mode === 'fleet' && props.fleetTrail?.length) {
    const trailCoordinates = props.fleetTrail.map((item) => [item.latitude, item.longitude] as [number, number])
    const trailLine = L.polyline(trailCoordinates, {
      color: '#f59e0b',
      weight: 4,
      opacity: 0.9,
    }).bindPopup(`<strong>Vehicle Trail</strong><br/>Ping count: ${formatNumber(props.fleetTrail.length)}`)
    addLayer(trailLine)

    props.fleetTrail.forEach((point, index) => {
      const isFocused = props.fleetTrailFocusIndex === index
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: isFocused ? 9 : index === props.fleetTrail!.length - 1 ? 7 : 5,
        color: '#fff7ed',
        weight: 2,
        fillColor: isFocused ? '#ef4444' : index === props.fleetTrail!.length - 1 ? '#f97316' : '#fdba74',
        fillOpacity: 0.95,
      }).bindPopup(
        `<strong>${point.vehicle_code}</strong><br/>Trail point ${index + 1}<br/>${
          point.location_recorded_at || '-'
        }${point.speed_kmh ? `<br/>Speed: ${formatNumber(point.speed_kmh)} km/h` : ''}`,
      )
      addLayer(marker)
      extendBounds(point.latitude, point.longitude)
    })
  }

  if (props.mode === 'serviceAreas' && props.dataset.serviceAreas) {
    const layer = L.geoJSON(props.dataset.serviceAreas as never, {
      style: () => ({
        color: '#38bdf8',
        weight: 2,
        fillColor: '#22d3ee',
        fillOpacity: 0.12,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup(
          `<strong>${String(feature.properties?.name ?? 'Service Area')}</strong><br/>${
            feature.properties?.sppg_name ? `SPPG: ${String(feature.properties.sppg_name)}` : ''
          }`,
        )
      },
    })
    addLayer(layer)
  }

  if (props.mode === 'serviceAreas' && props.draftServiceArea) {
    const draftCollection = asFeatureCollection(props.draftServiceArea)
    if (draftCollection) {
      const layer = L.geoJSON(draftCollection as never, {
        style: () => ({
          color: '#f59e0b',
          weight: 3,
          fillColor: '#fbbf24',
          fillOpacity: 0.16,
          dashArray: '10 6',
        }),
        onEachFeature: (_, layer) => {
          layer.bindPopup('<strong>Draft Service Area</strong><br/>Preview polygon sebelum disimpan.')
        },
      })
      addLayer(layer)

      draftCollection.features.forEach((feature) => {
        const geometry = feature.geometry
        if (geometry.type === 'Polygon') {
          const polygonCoordinates = geometry.coordinates as number[][][]
          ;(polygonCoordinates[0] || []).forEach((coordinate) =>
            extendBounds(Number(coordinate[1]), Number(coordinate[0])),
          )
        }
        if (geometry.type === 'MultiPolygon') {
          const multiPolygonCoordinates = geometry.coordinates as number[][][][]
          multiPolygonCoordinates.forEach((polygon) =>
            (polygon[0] || []).forEach((coordinate) =>
              extendBounds(Number(coordinate[1]), Number(coordinate[0])),
            ),
          )
        }
      })
    }
  }

  if (props.mode === 'routes') {
    props.dataset.kitchens.forEach((point) => {
      clusterLayer.addLayer(makePointMarker(point, '#5cf0c6', 12, 'Kitchen / Origin'))
      hasClusterMarkers = true
      extendBounds(point.latitude, point.longitude)
    })

    ;(props.dataset.deliveryRoutes || []).forEach((route: DeliveryRouteRecord) => {
      const polyline = L.polyline(
        (route.line?.coordinates || [
          [route.from_coordinate.longitude, route.from_coordinate.latitude],
          [route.to_coordinate.longitude, route.to_coordinate.latitude],
        ]).map((coordinate) => [coordinate[1], coordinate[0]] as [number, number]),
        {
          color: route.status === 'DELIVERED' ? '#34d399' : '#f59e0b',
          weight: 4,
          opacity: 0.85,
          dashArray: route.status === 'DELIVERED' ? undefined : '10 6',
        },
      ).bindPopup(
        `<strong>${route.delivery_number}</strong><br/>Status: ${route.status}<br/>Distance: ${route.distance_km} km`,
      )
      addLayer(polyline)
      extendBounds(route.from_coordinate.latitude, route.from_coordinate.longitude)
      extendBounds(route.to_coordinate.latitude, route.to_coordinate.longitude)
    })
  }

  if (hasClusterMarkers) {
    addLayer(clusterLayer)
  }

  if (!bounds.isValid()) {
    activePoints.value.forEach((point) => extendBounds(point.latitude, point.longitude))
  }

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.18))
  } else {
    map.setView([-6.18, 106.82], 12)
  }
}

const applyBaseMap = () => {
  if (!map) return

  if (tileLayer) {
    map.removeLayer(tileLayer)
  }

  tileLayer = L.tileLayer(tileConfig.value.url, {
    attribution: tileConfig.value.attribution,
  }).addTo(map)
}

onMounted(() => {
  if (!mapRef.value) return

  map = L.map(mapRef.value, { zoomControl: false }).setView([-6.18, 106.82], 12)
  applyBaseMap()
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  renderLayers()
})

watch(() => props.dataset, renderLayers, { deep: true })
watch(() => props.mode, renderLayers)
watch(() => props.draftServiceArea, renderLayers, { deep: true })
watch(() => props.fleetTrail, renderLayers, { deep: true })
watch(() => props.fleetTrailFocusIndex, renderLayers)
watch(themeMode, applyBaseMap)
</script>

<template>
  <section class="glass-panel p-3">
    <div class="mb-3 flex flex-col gap-3 px-2 pt-2 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 class="font-display text-xl text-app-heading">{{ panelTitle }}</h3>
        <p class="mt-1 text-sm text-app-body">{{ panelSubtitle }}</p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs text-app-body">
        <span class="legend-chip"><i class="legend-dot bg-teal-300"></i> Kitchen</span>
        <span class="legend-chip"><i class="legend-dot bg-sky-300"></i> School</span>
        <span class="legend-chip"><i class="legend-dot bg-rose-300"></i> Gap / Unserved</span>
        <span class="legend-chip"><i class="legend-dot bg-amber-300"></i> Risk / Route</span>
        <span class="legend-chip"><i class="legend-dot bg-violet-300"></i> Fleet Live</span>
        <span v-if="mode === 'fleet'" class="legend-chip"><i class="legend-dot bg-orange-300"></i> Trail History</span>
      </div>
    </div>
    <div ref="mapRef" class="h-[560px] rounded-[28px]"></div>
  </section>
</template>

<style scoped>
:deep(.mbg-map-marker-shell) {
  background: transparent;
  border: 0;
}

:deep(.mbg-map-marker) {
  display: block;
  width: var(--marker-size);
  height: var(--marker-size);
  border-radius: 999px;
  background: var(--marker-color);
  border: 3px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.25);
}

:deep(.mbg-map-cluster-shell) {
  background: transparent;
  border: 0;
}

:deep(.mbg-map-cluster) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(103, 232, 249, 0.95), rgba(8, 145, 178, 0.96));
  border: 3px solid rgba(255, 255, 255, 0.92);
  color: #042f2e;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(8, 145, 178, 0.28);
}
</style>

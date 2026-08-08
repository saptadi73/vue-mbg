<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import MapPanel from '@/components/gis/MapPanel.vue'
import { useGoogleMaps } from '@/composables/useGoogleMaps'
import type {
  FleetVehicleLocationRecord,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  MapDataset,
} from '@/types/domain'
import { formatDateTimeLocal } from '@/utils/format'

type GisLayerMode =
  | 'overview'
  | 'coverage'
  | 'unserved'
  | 'risk'
  | 'distribution'
  | 'serviceAreas'
  | 'routes'
  | 'fleet'
type MapsApi = Record<string, any>

const props = withDefaults(
  defineProps<{
    dataset: MapDataset
    mode?: GisLayerMode
    draftServiceArea?: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection | null
    fleetTrail?: FleetVehicleLocationRecord[] | null
    fleetTrailFocusIndex?: number | null
    focusVehicleId?: string | null
    fleetEtaByVehicle?: Record<string, { minutes: number | null; destinationLabel: string | null; estimatedArrivalAt: string | null }> | null
  }>(),
  {
    mode: 'overview',
    draftServiceArea: null,
    fleetTrail: null,
    fleetTrailFocusIndex: null,
    focusVehicleId: null,
    fleetEtaByVehicle: null,
  },
)

const googleMaps = useGoogleMaps()
const mapRef = ref<HTMLDivElement | null>(null)
const loadError = ref<string | null>(null)
let map: any = null
let overlays: any[] = []

const mapsApi = () => (window as Window & { google?: { maps?: MapsApi } }).google?.maps
const shouldRenderGoogle = computed(() => googleMaps.configured && !loadError.value)
const showOnlyKitchens = ref(false)
const showRadiusCircles = ref(true)
const radiusMinMeters = ref(0)
const radiusMaxMeters = ref(0)

const formatDistance = (meters: number) =>
  meters >= 1000
    ? `${Math.round((meters / 1000) * 100) / 100} km`
    : `${Math.round(meters)} m`

const title = computed(
  () =>
    ({
      overview: 'Google Maps Situational Map',
      coverage: 'Service Coverage Map',
      unserved: 'Unserved Schools Map',
      risk: 'Food Safety Risk Map',
      distribution: 'Distribution Heatmap',
      serviceAreas: 'Service Areas',
      routes: 'Google Delivery Routes',
      fleet: 'Fleet Checkpoint Monitoring',
    })[props.mode],
)

const clear = () => {
  overlays.forEach((overlay) => overlay.setMap?.(null))
  overlays = []
}

const addMarker = (
  position: { lat: number; lng: number },
  titleText: string,
  color: string,
  details: string,
  bounds: any,
) => {
  const gm = mapsApi()!
  const marker = new gm.Marker({
    map,
    position,
    title: titleText,
    icon: {
      path: gm.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 3,
      scale: 8,
    },
  })
  const info = new gm.InfoWindow({ content: `<strong>${titleText}</strong><br>${details}` })
  marker.addListener('click', () => info.open({ anchor: marker, map }))
  overlays.push(marker)
  bounds.extend(position)
}

const addCoverageCircle = (
  position: { lat: number; lng: number },
  radiusMeter: number,
  color: string,
  bounds: any,
) => {
  if (!Number.isFinite(radiusMeter) || radiusMeter <= 0) return

  const gm = mapsApi()!
  const circle = new gm.Circle({
    map,
    center: position,
    radius: radiusMeter,
    fillColor: color,
    fillOpacity: 0.1,
    strokeColor: color,
    strokeOpacity: 0.85,
    strokeWeight: 2,
  })
  overlays.push(circle)
  const circleBounds = circle.getBounds()
  if (circleBounds) bounds.union(circleBounds)
}

const buildKitchenInfo = (name: string, serviceRadius: number, coveredCount: number) => {
  const radiusText = serviceRadius > 0 ? `Radius layanan: ${formatDistance(serviceRadius)}` : null
  const coveredText = `Sekolah tercover: ${coveredCount}`
  return `${name}<br>${radiusText ? `${radiusText}<br>` : ''}${coveredText}`
}

const radiusColorByCoverage = (coveredCount: number) => {
  if (coveredCount <= 0) return '#ef4444'
  if (coveredCount <= 2) return '#f59e0b'
  return '#22c55e'
}

const radiusFilterRange = computed(() => {
  const min = Math.max(0, Number(radiusMinMeters.value) || 0)
  const max = Math.max(0, Number(radiusMaxMeters.value) || 0)
  if (min > 0 && max > 0 && max < min) {
    return { min: min, max: min, minGreaterThanMax: true }
  }
  return { min, max, minGreaterThanMax: false }
})

const isKitchenRadiusVisible = (radiusMeter: number) => {
  const { min: minFilter, max: maxFilter, minGreaterThanMax } = radiusFilterRange.value
  if (minGreaterThanMax) return false
  if (!Number.isFinite(radiusMeter) || radiusMeter < 0) return false
  if (minFilter > 0 && radiusMeter < minFilter) return false
  if (maxFilter > 0 && radiusMeter > maxFilter) return false
  return true
}

const resetKitchenFilters = () => {
  showOnlyKitchens.value = false
  showRadiusCircles.value = true
  radiusMinMeters.value = 0
  radiusMaxMeters.value = 0
  render()
}

const fleetColor = (status?: string) => {
  if (status === 'IN_TRANSIT') return '#0284c7'
  if (status === 'LOADING') return '#f59e0b'
  if (status === 'ARRIVED') return '#16a34a'
  if (status === 'MAINTENANCE') return '#dc2626'
  return '#7c3aed'
}

const addVehicleMarker = (vehicle: FleetVehicleLocationRecord, bounds: any) => {
  const gm = mapsApi()!
  const etaMeta = props.fleetEtaByVehicle?.[vehicle.vehicle_id]
  const position = { lat: vehicle.latitude, lng: vehicle.longitude }
  const marker = new gm.Marker({
    map,
    position,
    title: `${vehicle.vehicle_code} · ${vehicle.status}`,
    zIndex: 20,
    icon: {
      path: 'M -8,-7 L 6,-7 Q 9,-7 9,-4 L 9,5 Q 9,8 6,8 L 4,8 L 4,11 L 0,11 L 0,8 L -4,8 L -4,11 L -8,11 L -8,8 L -10,8 Q -12,8 -12,5 L -12,-4 Q -12,-7 -8,-7 M -7,-4 L 4,-4 L 6,1 L -9,1 Z',
      fillColor: fleetColor(vehicle.status),
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 1.35,
      rotation: Number(vehicle.heading_deg || 0),
      anchor: new gm.Point(0, 2),
    },
  })
  const speed = Number(vehicle.speed_kmh || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })
  const etaMinutes = etaMeta?.minutes ?? vehicle.eta_minutes ?? null
  const etaText = etaMinutes === null || etaMinutes === undefined ? 'ETA belum tersedia' : etaMinutes <= 0 ? 'Sudah tiba di tujuan' : `${etaMinutes} menit lagi`
  const etaTone = etaMinutes === null || etaMinutes === undefined
    ? '#94a3b8'
    : etaMinutes <= 0
      ? '#22c55e'
      : etaMinutes <= 15
        ? '#2dd4bf'
        : etaMinutes <= 30
          ? '#f59e0b'
          : '#ef4444'
  const arrivalText = etaMeta?.estimatedArrivalAt || vehicle.estimated_arrival_at
    ? formatDateTimeLocal(etaMeta?.estimatedArrivalAt || vehicle.estimated_arrival_at)
    : 'Belum tersedia'
  const recordedAtText = formatDateTimeLocal(vehicle.location_recorded_at)
  const info = new gm.InfoWindow({
    content: `<div style="min-width:240px"><strong>${vehicle.vehicle_code}</strong><br>${vehicle.plate_number || '-'}<hr style="margin:8px 0"><b>Status:</b> ${vehicle.status}<br><b>Pengemudi:</b> ${vehicle.driver_name || '-'}<br><b>Kecepatan:</b> ${speed} km/jam<br><b>ETA:</b> <span style="color:${etaTone};font-weight:700">${etaText}</span><br><b>Tujuan:</b> ${etaMeta?.destinationLabel || vehicle.eta_destination || 'Tujuan rute aktif'}<br><b>Estimasi tiba:</b> ${arrivalText}<br><b>Posisi terakhir:</b> ${recordedAtText}<br><small>${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}</small></div>`,
  })
  marker.addListener('click', () => info.open({ anchor: marker, map }))
  overlays.push(marker)
  bounds.extend(position)
}

const addGeoJson = (
  collection: GeoJsonFeatureCollection | null | undefined,
  color: string,
  bounds: any,
) => {
  if (!collection) return
  const gm = mapsApi()!
  collection.features.forEach((feature) => {
    if (feature.geometry.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates as number[]
      if (typeof lat !== 'number' || typeof lng !== 'number') return
      addMarker(
        { lat, lng },
        String(feature.properties?.name || 'Lokasi'),
        color,
        String(feature.properties?.status || ''),
        bounds,
      )
      return
    }
    const data = new gm.Data({ map })
    data.addGeoJson(feature)
    data.setStyle({ strokeColor: color, strokeWeight: 2, fillColor: color, fillOpacity: 0.15 })
    overlays.push(data)
    data.forEach((item: any) =>
      item.getGeometry()?.forEachLatLng?.((point: any) => bounds.extend(point)),
    )
  })
}

const render = () => {
  const gm = mapsApi()
  if (!map || !gm) return
  clear()
  const bounds = new gm.LatLngBounds()
  let focusPosition: { lat: number; lng: number } | null = null
  const kitchenOnly = showOnlyKitchens.value
  const modesWithKitchens = ['overview', 'coverage', 'routes', 'serviceAreas', 'fleet']
  if (modesWithKitchens.includes(props.mode))
    props.dataset.kitchens.forEach((p) => {
      const serviceRadius = Number(p.service_radius_meter || 0)
      if (!isKitchenRadiusVisible(serviceRadius)) return
      const coveredSchoolCount = Number.isFinite(p.covered_school_count || 0)
        ? p.covered_school_count || 0
        : 0
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.name,
        '#14b8a6',
        buildKitchenInfo(p.name, serviceRadius, coveredSchoolCount),
        bounds,
      )
      if (showRadiusCircles.value) {
        addCoverageCircle(
          { lat: p.latitude, lng: p.longitude },
          serviceRadius,
          radiusColorByCoverage(coveredSchoolCount),
          bounds,
        )
      }
    })
  if (!kitchenOnly && ['overview', 'coverage'].includes(props.mode))
    props.dataset.schools.forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.name,
        '#38bdf8',
        'Sekolah / Penerima',
        bounds,
      ),
    )
  if (!kitchenOnly && props.mode === 'overview')
    (props.dataset.fleetVehicles || []).forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.vehicle_code,
        '#8b5cf6',
        `${p.status} · ${formatDateTimeLocal(p.location_recorded_at)}`,
        bounds,
      ),
    )
  if (!kitchenOnly && props.mode === 'fleet')
    (props.dataset.fleetVehicles || []).forEach((vehicle) => {
      addVehicleMarker(vehicle, bounds)
      if (props.focusVehicleId && vehicle.vehicle_id === props.focusVehicleId) {
        focusPosition = { lat: vehicle.latitude, lng: vehicle.longitude }
      }
    })
  if (!kitchenOnly && props.mode === 'risk')
    (props.dataset.riskPoints || []).forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.name,
        (p.risk_score || 0) >= 70 ? '#ef4444' : (p.risk_score || 0) >= 40 ? '#f59e0b' : '#22c55e',
        `Status backend: ${p.risk_level || 'UNKNOWN'}`,
        bounds,
      ),
    )
  if (!kitchenOnly && ['overview', 'coverage'].includes(props.mode))
    addGeoJson(props.dataset.coverage, '#14b8a6', bounds)
  if (!kitchenOnly && ['overview', 'unserved'].includes(props.mode))
    addGeoJson(props.dataset.unserved, '#f43f5e', bounds)
  if (!kitchenOnly && props.mode === 'distribution')
    addGeoJson(props.dataset.distributionHeatmap, '#0ea5e9', bounds)
  if (!kitchenOnly && props.mode === 'serviceAreas') {
    addGeoJson(props.dataset.serviceAreas, '#0ea5e9', bounds)
    const draft =
      props.draftServiceArea &&
      (('features' in props.draftServiceArea
        ? props.draftServiceArea
        : {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: props.draftServiceArea, properties: {} }],
          }) as GeoJsonFeatureCollection | null)
    addGeoJson(draft, '#f59e0b', bounds)
  }
  if (!kitchenOnly && props.mode === 'routes')
    (props.dataset.deliveryRoutes || []).forEach((route) => {
      const path = (
        route.line?.coordinates || [
          [route.from_coordinate.longitude, route.from_coordinate.latitude],
          [route.to_coordinate.longitude, route.to_coordinate.latitude],
        ]
      ).map(([lng, lat]) => ({ lat, lng }))
      const line = new gm.Polyline({
        map,
        path,
        strokeColor: route.status === 'DELIVERED' ? '#22c55e' : '#f59e0b',
        strokeWeight: 5,
      })
      overlays.push(line)
      path.forEach((point) => bounds.extend(point))
    })
  if (!kitchenOnly && props.mode === 'fleet' && props.fleetTrail?.length) {
    const path = props.fleetTrail.map((p) => ({ lat: p.latitude, lng: p.longitude }))
    overlays.push(new gm.Polyline({ map, path, strokeColor: '#f97316', strokeWeight: 4 }))
    path.forEach((point) => bounds.extend(point))
  }
  if (focusPosition) {
    map.panTo(focusPosition)
    map.setZoom(14)
  } else if (!bounds.isEmpty()) {
    map.fitBounds(bounds, 48)
  }
}

onMounted(async () => {
  if (!googleMaps.configured) return
  try {
    await googleMaps.load()
    await nextTick()
    const gm = mapsApi()!
    map = new gm.Map(mapRef.value, {
      center: { lat: -6.18, lng: 106.82 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    })
    render()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Google Maps gagal dimuat.'
  }
})

watch(
  () => [
    props.dataset,
    props.mode,
    props.draftServiceArea,
    props.fleetTrail,
    props.fleetTrailFocusIndex,
    props.focusVehicleId,
    showOnlyKitchens,
    showRadiusCircles,
    radiusMinMeters,
    radiusMaxMeters,
  ],
  render,
  { deep: true },
)
onBeforeUnmount(clear)
</script>

<template>
  <MapPanel v-if="!shouldRenderGoogle" v-bind="props" />
  <section v-else class="glass-panel p-3">
    <div class="mb-3 flex flex-col gap-3 rounded-[24px] border border-[var(--app-panel-border)] bg-white/5 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 class="font-display text-xl text-app-heading">{{ title }}</h3>
        <p class="mt-1 text-sm text-app-body">
          Google Maps Platform · data spasial bersumber dari PostGIS/FastAPI.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="legend-chip"><i class="legend-dot bg-teal-300"></i> Dapur terdaftar</span>
        <span class="legend-chip"><i class="legend-dot bg-sky-300"></i> Radius layanan (lingkaran)</span>
        <span class="legend-chip"><i class="legend-dot bg-red-400"></i> Radius belum optimal</span>
        <span class="legend-chip"><i class="legend-dot bg-amber-400"></i> Radius sedang</span>
        <span class="legend-chip"><i class="legend-dot bg-green-400"></i> Radius optimal</span>
        <span class="legend-chip"><i class="legend-dot bg-sky-200"></i> Sekolah</span>
        <span class="legend-chip"><i class="legend-dot bg-rose-200"></i> Unserved</span>
      </div>
      <div class="mt-2 flex flex-wrap items-center gap-3 text-xs text-app-body">
        <label class="inline-flex items-center gap-2">
          <input v-model="showOnlyKitchens" type="checkbox" />
          <span>Hanya Dapur + Radius</span>
        </label>
        <label class="inline-flex items-center gap-2">
          <input v-model="showRadiusCircles" type="checkbox" />
          <span>Tampilkan Radius</span>
        </label>
        <label class="inline-flex items-center gap-2">
          <span>Radius min (m)</span>
          <input
            v-model.number="radiusMinMeters"
            class="toolbar-input h-8 w-28 px-2"
            min="0"
            placeholder="0"
            type="number"
          />
        </label>
        <label class="inline-flex items-center gap-2">
          <span>Radius max (m)</span>
          <input
            v-model.number="radiusMaxMeters"
            class="toolbar-input h-8 w-28 px-2"
            min="0"
            placeholder="0"
            type="number"
          />
        </label>
        <button class="secondary-button" type="button" @click="resetKitchenFilters">
          Reset layer
        </button>
      </div>
      <p v-if="radiusFilterRange.minGreaterThanMax" class="text-[11px] text-rose-400">
        Min radius tidak boleh lebih besar dari max radius.
      </p>
    </div>
    <div class="overflow-hidden rounded-[32px] border border-[var(--app-panel-border)] bg-slate-950/10">
      <div ref="mapRef" class="h-[560px]"></div>
    </div>
  </section>
</template>

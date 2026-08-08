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
  }>(),
  { mode: 'overview', draftServiceArea: null, fleetTrail: null, fleetTrailFocusIndex: null },
)

const googleMaps = useGoogleMaps()
const mapRef = ref<HTMLDivElement | null>(null)
const loadError = ref<string | null>(null)
let map: any = null
let overlays: any[] = []

const mapsApi = () => (window as Window & { google?: { maps?: MapsApi } }).google?.maps
const shouldRenderGoogle = computed(() => googleMaps.configured && !loadError.value)

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

const fleetColor = (status?: string) => {
  if (status === 'IN_TRANSIT') return '#0284c7'
  if (status === 'LOADING') return '#f59e0b'
  if (status === 'ARRIVED') return '#16a34a'
  if (status === 'MAINTENANCE') return '#dc2626'
  return '#7c3aed'
}

const addVehicleMarker = (vehicle: FleetVehicleLocationRecord, bounds: any) => {
  const gm = mapsApi()!
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
  const info = new gm.InfoWindow({
    content: `<div style="min-width:210px"><strong>${vehicle.vehicle_code}</strong><br>${vehicle.plate_number || '-'}<hr style="margin:8px 0"><b>Status:</b> ${vehicle.status}<br><b>Pengemudi:</b> ${vehicle.driver_name || '-'}<br><b>Kecepatan:</b> ${speed} km/jam<br><b>Posisi terakhir:</b> ${vehicle.location_recorded_at || '-'}<br><small>${vehicle.latitude.toFixed(6)}, ${vehicle.longitude.toFixed(6)}</small></div>`,
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
  const modesWithKitchens = ['overview', 'coverage', 'routes', 'serviceAreas', 'fleet']
  if (modesWithKitchens.includes(props.mode))
    props.dataset.kitchens.forEach((p) =>
      addMarker({ lat: p.latitude, lng: p.longitude }, p.name, '#14b8a6', 'Dapur / SPPG', bounds),
    )
  if (['overview', 'coverage'].includes(props.mode))
    props.dataset.schools.forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.name,
        '#38bdf8',
        'Sekolah / Penerima',
        bounds,
      ),
    )
  if (props.mode === 'overview')
    (props.dataset.fleetVehicles || []).forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.vehicle_code,
        '#8b5cf6',
        `${p.status} · ${p.location_recorded_at || '-'}`,
        bounds,
      ),
    )
  if (props.mode === 'fleet')
    (props.dataset.fleetVehicles || []).forEach((vehicle) => addVehicleMarker(vehicle, bounds))
  if (props.mode === 'risk')
    (props.dataset.riskPoints || []).forEach((p) =>
      addMarker(
        { lat: p.latitude, lng: p.longitude },
        p.name,
        (p.risk_score || 0) >= 70 ? '#ef4444' : (p.risk_score || 0) >= 40 ? '#f59e0b' : '#22c55e',
        `Status backend: ${p.risk_level || 'UNKNOWN'}`,
        bounds,
      ),
    )
  if (['overview', 'coverage'].includes(props.mode))
    addGeoJson(props.dataset.coverage, '#14b8a6', bounds)
  if (['overview', 'unserved'].includes(props.mode))
    addGeoJson(props.dataset.unserved, '#f43f5e', bounds)
  if (props.mode === 'distribution')
    addGeoJson(props.dataset.distributionHeatmap, '#0ea5e9', bounds)
  if (props.mode === 'serviceAreas') {
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
  if (props.mode === 'routes')
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
  if (props.mode === 'fleet' && props.fleetTrail?.length) {
    const path = props.fleetTrail.map((p) => ({ lat: p.latitude, lng: p.longitude }))
    overlays.push(new gm.Polyline({ map, path, strokeColor: '#f97316', strokeWeight: 4 }))
    path.forEach((point) => bounds.extend(point))
  }
  if (!bounds.isEmpty()) map.fitBounds(bounds, 48)
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
  ],
  render,
  { deep: true },
)
onBeforeUnmount(clear)
</script>

<template>
  <MapPanel v-if="!shouldRenderGoogle" v-bind="props" />
  <section v-else class="glass-panel p-3">
    <div class="mb-3 flex flex-col gap-2 px-2 pt-2 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 class="font-display text-xl text-app-heading">{{ title }}</h3>
        <p class="mt-1 text-sm text-app-body">
          Google Maps Platform · data spasial bersumber dari PostGIS/FastAPI.
        </p>
      </div>
      <span class="legend-chip">Google Maps</span>
    </div>
    <div ref="mapRef" class="h-[560px] rounded-[28px]"></div>
  </section>
</template>

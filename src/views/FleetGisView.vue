<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import GoogleDirectionsPanel from '@/components/gis/GoogleDirectionsPanel.vue'
import MapPanel from '@/components/gis/GoogleMapPanel.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getDeliveryPackages } from '@/services/delivery'
import { getFleetVehicleStatusLive } from '@/services/fleet'
import { getFleetVehicleLocationHistory, getGisOverview } from '@/services/gis'
import { saveRouteSnapshot } from '@/services/google-maps'
import { useAppStore } from '@/stores/app'
import type {
  DeliveryPackageLifecycleRecord,
  FleetLatLng,
  FleetVehicleLocationRecord,
  FleetVehicleStatusLiveRecord,
} from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

type FleetGisServiceRow = {
  id: string
  endpoint: string
  purpose: string
  status: string
}

type DirectionWarningCode = 'ON_TRACK' | 'WARNING' | 'LATE' | 'UNKNOWN'

type DirectionInsight = {
  distanceMeters: number
  durationSeconds: number
  estimatedArrivalAt: string
  warningCode: DirectionWarningCode
  warningLabel: string
}

type DirectionTarget = {
  key: string
  routeId: string | null
  title: string
  subtitle: string
  origin: FleetLatLng
  destination: FleetLatLng
  waypoints: FleetLatLng[]
  plannedArrivalAt?: string | null
}

const appStore = useAppStore()
const { activeSppgId } = storeToRefs(appStore)

const filters = reactive({
  date_from: '2026-07-20',
  date_to: '2026-07-20',
  sppg_id: '',
  use_active_sppg: true,
  bbox: '',
})

const resolveFilters = () => ({
  date_from: filters.date_from,
  date_to: filters.date_to,
  sppg_id: filters.use_active_sppg ? activeSppgId.value || undefined : filters.sppg_id || undefined,
  bbox: filters.bbox || undefined,
})

const gisState = useAsyncState(() => getGisOverview(resolveFilters()))
const fleetLiveStatusState = useAsyncState(() =>
  getFleetVehicleStatusLive({
    tenantId: appStore.activeTenantId,
    sppgId: filters.use_active_sppg ? activeSppgId.value || null : filters.sppg_id || null,
  }),
)
const packageLifecycleState = useAsyncState(getDeliveryPackages)
const selectedVehicleId = ref('')
const historyState = useAsyncState(() =>
  getFleetVehicleLocationHistory(selectedVehicleId.value, 12),
)
const trailFocusIndex = ref<number | null>(null)
const playbackRunning = ref(false)
const mapFocusVehicleId = ref<string | null>(null)
const directionTarget = ref<DirectionTarget | null>(null)
const routeInsights = ref<Record<string, DirectionInsight>>({})
let playbackTimer: ReturnType<typeof setInterval> | null = null

const data = computed(() => gisState.data.value ?? null)
const fleetRows = computed<FleetVehicleLocationRecord[]>(() => {
  const vehicles = data.value?.fleetVehicles || []
  return vehicles.map((vehicle) => ({ ...vehicle, ...resolveVehicleEta(vehicle) }))
})
const selectedVehicle = computed(
  () =>
    fleetRows.value.find((item) => item.vehicle_id === selectedVehicleId.value) ||
    fleetRows.value[0] ||
    null,
)
const selectedVehicleEta = computed(() => selectedVehicle.value || null)
const selectedVehicleEtaText = computed(() => getEtaText(selectedVehicleEta.value))
const fleetEtaByVehicle = computed(() =>
  Object.fromEntries(
    fleetRows.value.map((vehicle) => [
      vehicle.vehicle_id,
      {
        minutes: vehicle.eta_minutes ?? null,
        destinationLabel: vehicle.eta_destination ?? null,
        estimatedArrivalAt: vehicle.estimated_arrival_at ?? null,
      },
    ]),
  ),
)
const selectedTrail = computed(() => historyState.data.value?.items || [])
const fleetTransitRows = computed<FleetVehicleStatusLiveRecord[]>(() =>
  fleetLiveStatusState.data.value?.items || [],
)
const packageRows = computed<DeliveryPackageLifecycleRecord[]>(() => packageLifecycleState.data.value?.items || [])
const focusedTrailPoint = computed(
  () =>
    (trailFocusIndex.value !== null ? selectedTrail.value[trailFocusIndex.value] : null) ||
    selectedTrailLatest.value,
)
const inTransitCount = computed(
  () => fleetRows.value.filter((item) => item.status === 'IN_TRANSIT').length,
)
const loadingCount = computed(
  () => fleetRows.value.filter((item) => item.status === 'LOADING').length,
)
const arrivedCount = computed(
  () => fleetRows.value.filter((item) => item.status === 'ARRIVED').length,
)
const maintenanceCount = computed(
  () => fleetRows.value.filter((item) => item.status === 'MAINTENANCE').length,
)
const avgSpeed = computed(() => {
  const moving = fleetRows.value.filter((item) => (item.speed_kmh || 0) > 0)
  if (!moving.length) return 0
  return moving.reduce((sum, item) => sum + (item.speed_kmh || 0), 0) / moving.length
})
const selectedTrailAvgSpeed = computed(() => {
  const moving = selectedTrail.value.filter((item) => (item.speed_kmh || 0) > 0)
  if (!moving.length) return 0
  return moving.reduce((sum, item) => sum + (item.speed_kmh || 0), 0) / moving.length
})
const selectedTrailLatest = computed(
  () => selectedTrail.value[selectedTrail.value.length - 1] || null,
)
const selectedTrailDistance = computed(() => {
  if (selectedTrail.value.length < 2) return 0

  let total = 0
  for (let index = 1; index < selectedTrail.value.length; index += 1) {
    const previous = selectedTrail.value[index - 1]!
    const current = selectedTrail.value[index]!
    const latDiff = current.latitude - previous.latitude
    const lngDiff = current.longitude - previous.longitude
    total += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111
  }
  return total
})

const directionWarningClass = (code?: DirectionWarningCode | null) => {
  if (code === 'LATE') return 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20'
  if (code === 'WARNING') return 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20'
  if (code === 'ON_TRACK') return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20'
  return 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20'
}

const fleetRouteKey = (item: FleetVehicleStatusLiveRecord) =>
  `fleet:${item.vehicle_id}:${item.active_route.route_id}`

const packageRouteKey = (item: DeliveryPackageLifecycleRecord) =>
  `package:${item.package_id}:${item.route_id || 'none'}`

const getDirectionInsight = (key: string) => routeInsights.value[key] || null

const getDirectionSummaryText = (key: string) => {
  const insight = getDirectionInsight(key)
  if (!insight) return 'Klik arah route untuk menghitung ETA.'
  const distanceKm = insight.distanceMeters / 1000
  const durationMinutes = Math.max(1, Math.round(insight.durationSeconds / 60))
  return `${distanceKm.toLocaleString('id-ID', { maximumFractionDigits: 1 })} km · ${durationMinutes.toLocaleString('id-ID')} menit`
}

const getDirectionWarningLabel = (key: string) => getDirectionInsight(key)?.warningLabel || 'Belum dihitung'

const getDirectionWarningCode = (key: string) => getDirectionInsight(key)?.warningCode || 'UNKNOWN'

const resolveVehicleEta = (vehicle: FleetVehicleLocationRecord) => {
  const route = data.value?.deliveryRoutes?.[0] ?? null
  if (!route) {
    return {
      eta_minutes: null,
      eta_destination: null,
      estimated_arrival_at: null,
    }
  }

  const destination = route.to_coordinate
  const deltaLat = vehicle.latitude - destination.latitude
  const deltaLng = vehicle.longitude - destination.longitude
  const distanceKm = Math.max(0, Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 111)
  const speedKmh = Math.max(vehicle.speed_kmh || 0, 8)
  const etaMinutes = vehicle.status === 'ARRIVED' || distanceKm < 0.3 ? 0 : Math.max(1, Math.round((distanceKm / Math.max(speedKmh * 0.7, 1)) * 60))

  return {
    eta_minutes: etaMinutes,
    eta_destination: route.delivery_number ? `Tujuan ${route.delivery_number}` : 'Tujuan rute aktif',
    estimated_arrival_at: new Date(Date.now() + etaMinutes * 60_000).toISOString(),
  }
}

const getEtaText = (item: FleetVehicleLocationRecord | null | undefined) => {
  const minutes = item?.eta_minutes ?? null
  if (minutes === null || minutes === undefined) return 'Estimasi belum tersedia'
  if (minutes <= 0) return 'Sudah tiba di tujuan'
  return `${formatNumber(minutes)} menit lagi`
}

const getEtaToneClasses = (item: FleetVehicleLocationRecord | null | undefined) => {
  const minutes = item?.eta_minutes ?? null
  if (minutes === null || minutes === undefined) return 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20'
  if (minutes <= 0) return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20'
  if (minutes <= 15) return 'bg-teal-500/15 text-teal-700 ring-1 ring-teal-500/20'
  if (minutes <= 30) return 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20'
  return 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20'
}

const getEtaStatusLabel = (item: FleetVehicleLocationRecord | null | undefined) => {
  const minutes = item?.eta_minutes ?? null
  if (minutes === null || minutes === undefined) return 'Belum ada'
  if (minutes <= 0) return 'Tiba'
  if (minutes <= 15) return 'Segera'
  if (minutes <= 30) return 'Waspada'
  return 'Terlambat'
}

const documentationRows = computed<FleetGisServiceRow[]>(() => [
  {
    id: 'fleet-doc-1',
    endpoint: 'GET /api/v1/fleet/vehicle-status/live',
    purpose: 'Armada aktif IN_TRANSIT/DEPARTED lengkap current position, destination, waypoint, dan path.',
    status: 'Active',
  },
  {
    id: 'fleet-doc-2',
    endpoint: 'GET /api/v1/fleet/vehicle-locations/live',
    purpose: 'Posisi terbaru seluruh armada untuk layer peta dan marker fleet.',
    status: 'Active',
  },
  {
    id: 'fleet-doc-3',
    endpoint: 'GET /api/v1/deliveries/packages',
    purpose: 'Lifecycle daftar kemasan dari packaging sampai receiving dengan destination koordinat.',
    status: 'Active',
  },
  {
    id: 'fleet-doc-4',
    endpoint: 'GET /api/v1/fleet/vehicles/{vehicle_id}/locations',
    purpose: 'Mengambil histori GPS kendaraan terpilih untuk trail perjalanan.',
    status: 'Active',
  },
  {
    id: 'fleet-doc-5',
    endpoint: 'POST /api/v1/fleet/vehicles/{vehicle_id}/locations',
    purpose: 'Mencatat atau meng-update lokasi GPS kendaraan dari operasi lapangan.',
    status: 'Active',
  },
  {
    id: 'fleet-doc-6',
    endpoint: 'POST /api/v1/deliveries/{route_id}/route-snapshot',
    purpose: 'Menyimpan snapshot distance, duration, ETA, dan encoded polyline dari provider route.',
    status: 'Active',
  },
])

const fleetSearchText = (item: unknown) => {
  const row = item as FleetVehicleLocationRecord
  return [
    row.vehicle_code,
    row.plate_number,
    row.driver_name,
    row.assignment_role,
    row.status,
    row.sppg_name,
    row.location_recorded_at,
  ]
    .filter(Boolean)
    .join(' ')
}

const documentationSearchText = (item: unknown) => {
  const row = item as FleetGisServiceRow
  return [row.endpoint, row.purpose, row.status].join(' ')
}

const historySearchText = (item: unknown) => {
  const row = item as FleetVehicleLocationRecord
  return [row.vehicle_code, row.status, row.location_recorded_at, row.speed_kmh, row.source]
    .filter(Boolean)
    .join(' ')
}

const fleetTransitSearchText = (item: unknown) => {
  const row = item as FleetVehicleStatusLiveRecord
  return [
    row.vehicle_code,
    row.plate_number,
    row.driver_name,
    row.movement_status,
    row.active_route.route_code,
    row.active_route.route_name,
    row.recorded_at,
  ]
    .filter(Boolean)
    .join(' ')
}

const packageSearchText = (item: unknown) => {
  const row = item as DeliveryPackageLifecycleRecord
  return [
    row.trace_code,
    row.product_name,
    row.status,
    row.status_label,
    row.destination_name,
    row.route_code,
    row.vehicle_code,
  ]
    .filter(Boolean)
    .join(' ')
}

const openFleetDirection = (item: FleetVehicleStatusLiveRecord) => {
  directionTarget.value = {
    key: fleetRouteKey(item),
    routeId: item.active_route.route_id || null,
    title: `Armada ${item.vehicle_code} · ${item.movement_status}`,
    subtitle: `${item.active_route.route_code || '-'} · ${item.active_route.route_name || 'Rute aktif'} · driver ${item.driver_name || '-'}`,
    origin: item.current_position,
    destination: item.active_route.destination,
    waypoints: item.active_route.waypoints || [],
    plannedArrivalAt: null,
  }
}

const resolvePackageOrigin = (item: DeliveryPackageLifecycleRecord): FleetLatLng | null => {
  const byVehicle =
    item.vehicle_id &&
    fleetTransitRows.value.find((fleetItem) => fleetItem.vehicle_id === item.vehicle_id)
  if (byVehicle) return byVehicle.current_position

  const byRoute =
    item.route_id &&
    fleetTransitRows.value.find((fleetItem) => fleetItem.active_route.route_id === item.route_id)
  if (byRoute) return byRoute.current_position

  const kitchen = data.value?.kitchens?.[0]
  if (!kitchen) return null
  return { latitude: kitchen.latitude, longitude: kitchen.longitude }
}

const openPackageDirection = (item: DeliveryPackageLifecycleRecord) => {
  if (item.destination_latitude === null || item.destination_latitude === undefined) return
  if (item.destination_longitude === null || item.destination_longitude === undefined) return

  const origin = resolvePackageOrigin(item)
  if (!origin) return

  directionTarget.value = {
    key: packageRouteKey(item),
    routeId: item.route_id || null,
    title: `Paket ${item.trace_code}`,
    subtitle: `${item.status_label || item.status} · ${item.destination_name || 'Tujuan belum terisi'}`,
    origin,
    destination: {
      latitude: item.destination_latitude,
      longitude: item.destination_longitude,
    },
    waypoints: [],
    plannedArrivalAt: null,
  }
}

const handleDirectionComputed = (insight: DirectionInsight) => {
  if (!directionTarget.value) return
  const target = directionTarget.value
  routeInsights.value = {
    ...routeInsights.value,
    [target.key]: insight,
  }

  if (!target.routeId) return
  void saveRouteSnapshot({
    route_id: target.routeId,
    tenant_id: appStore.activeTenantId,
    sppg_id: activeSppgId.value || undefined,
    distance_meters: insight.distanceMeters,
    duration_seconds: insight.durationSeconds,
    estimated_arrival_at: insight.estimatedArrivalAt,
    provider: 'GOOGLE_ROUTES',
    provider_response: {
      warning_code: insight.warningCode,
      warning_label: insight.warningLabel,
      source: 'fleet_gis_directions_panel',
    },
  }).catch(() => {
    // Snapshot is best-effort; the UI should not fail when backend audit endpoint is unavailable.
  })
}

const selectVehicle = async (vehicleId: string) => {
  stopPlayback()
  selectedVehicleId.value = vehicleId
  mapFocusVehicleId.value = vehicleId
  await historyState.execute()
  trailFocusIndex.value = selectedTrail.value.length ? selectedTrail.value.length - 1 : null
}

const reload = async () => {
  await Promise.all([
    gisState.execute(),
    fleetLiveStatusState.execute(),
    packageLifecycleState.execute(),
  ])
  if (!selectedVehicleId.value && fleetRows.value.length) {
    selectedVehicleId.value = fleetRows.value[0]!.vehicle_id
  }
  if (selectedVehicleId.value) {
    mapFocusVehicleId.value = selectedVehicleId.value
    await historyState.execute()
    trailFocusIndex.value = selectedTrail.value.length ? selectedTrail.value.length - 1 : null
  }
}

const stopPlayback = () => {
  if (playbackTimer) {
    clearInterval(playbackTimer)
    playbackTimer = null
  }
  playbackRunning.value = false
}

const moveTrailFocus = (nextIndex: number) => {
  if (!selectedTrail.value.length) {
    trailFocusIndex.value = null
    return
  }

  trailFocusIndex.value = Math.min(Math.max(nextIndex, 0), selectedTrail.value.length - 1)
}

const goPrevTrail = () => {
  moveTrailFocus((trailFocusIndex.value ?? selectedTrail.value.length - 1) - 1)
}

const goNextTrail = () => {
  moveTrailFocus((trailFocusIndex.value ?? -1) + 1)
}

const togglePlayback = () => {
  if (!selectedTrail.value.length) return

  if (playbackRunning.value) {
    stopPlayback()
    return
  }

  if (trailFocusIndex.value === null || trailFocusIndex.value >= selectedTrail.value.length - 1) {
    trailFocusIndex.value = 0
  }

  playbackRunning.value = true
  playbackTimer = setInterval(() => {
    if (trailFocusIndex.value === null) {
      trailFocusIndex.value = 0
      return
    }

    if (trailFocusIndex.value >= selectedTrail.value.length - 1) {
      stopPlayback()
      return
    }

    trailFocusIndex.value += 1
  }, 1100)
}

const focusSelectedVehicle = async () => {
  if (!selectedVehicle.value) return
  selectedVehicleId.value = selectedVehicle.value.vehicle_id
  mapFocusVehicleId.value = selectedVehicle.value.vehicle_id
  stopPlayback()
  await historyState.execute()
  trailFocusIndex.value = selectedTrail.value.length ? selectedTrail.value.length - 1 : null
}

const centerMapOnSelectedVehicle = async () => {
  await focusSelectedVehicle()
}

const resetTrail = () => {
  stopPlayback()
  trailFocusIndex.value = selectedTrail.value.length ? selectedTrail.value.length - 1 : null
}

watch(
  fleetRows,
  (items) => {
    if (!items.length) return
    if (
      !selectedVehicleId.value ||
      !items.some((item) => item.vehicle_id === selectedVehicleId.value)
    ) {
      selectedVehicleId.value = items[0]!.vehicle_id
      historyState.execute()
    }
  },
  { immediate: true },
)

watch(selectedTrail, (items) => {
  stopPlayback()
  trailFocusIndex.value = items.length ? items.length - 1 : null
})

onUnmounted(() => {
  stopPlayback()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="GIS Fleet"
      subtitle="Workspace spasial khusus armada untuk memantau posisi kendaraan terkini, status perjalanan, dan kesiapan dispatch tanpa bercampur dengan analisa dapur."
      :badges="['Fleet Live Tracking', 'Dispatch Board', 'PostGIS Ready']"
    />

    <section class="grid gap-4 xl:grid-cols-5">
      <article class="glass-panel p-5 transition-transform duration-200 hover:-translate-y-1">
        <p class="text-sm text-app-muted">Fleet live</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ fleetRows.length }}</p>
        <p class="mt-2 text-sm text-app-body">
          Jumlah kendaraan dengan posisi terkini pada scope aktif.
        </p>
      </article>
      <article class="glass-panel p-5 transition-transform duration-200 hover:-translate-y-1">
        <p class="text-sm text-app-muted">In transit</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ inTransitCount }}</p>
        <p class="mt-2 text-sm text-app-body">Unit yang sedang bergerak ke titik distribusi.</p>
      </article>
      <article class="glass-panel p-5 transition-transform duration-200 hover:-translate-y-1">
        <p class="text-sm text-app-muted">Loading</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ loadingCount }}</p>
        <p class="mt-2 text-sm text-app-body">Unit yang masih berada pada tahap muat.</p>
      </article>
      <article class="glass-panel p-5 transition-transform duration-200 hover:-translate-y-1">
        <p class="text-sm text-app-muted">Arrived / maintenance</p>
        <p class="mt-3 font-display text-3xl text-app-heading">
          {{ arrivedCount }} / {{ maintenanceCount }}
        </p>
        <p class="mt-2 text-sm text-app-body">
          Ringkasan kendaraan tiba dan yang sedang di bengkel.
        </p>
      </article>
      <article class="glass-panel p-5 transition-transform duration-200 hover:-translate-y-1">
        <p class="text-sm text-app-muted">Average speed</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(avgSpeed) }} km/h</p>
        <p class="mt-2 text-sm text-app-body">
          Rata-rata kecepatan kendaraan yang sedang bergerak.
        </p>
      </article>
    </section>

    <section class="glass-panel border border-[var(--app-panel-border)] bg-white/5 p-4">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-end">
        <label class="form-field flex-1">
          <span>Date from</span>
          <input v-model="filters.date_from" class="toolbar-input" type="date" />
        </label>
        <label class="form-field flex-1">
          <span>Date to</span>
          <input v-model="filters.date_to" class="toolbar-input" type="date" />
        </label>
        <label class="form-field flex-1">
          <span>SPPG focus</span>
          <input
            v-model="filters.sppg_id"
            class="toolbar-input"
            :disabled="filters.use_active_sppg"
            placeholder="sppg-jakarta-pusat-01"
          />
        </label>
        <label class="form-field flex-[1.2]">
          <span>BBox optional</span>
          <input
            v-model="filters.bbox"
            class="toolbar-input"
            placeholder="106.800,-6.200,106.900,-6.100"
          />
        </label>
        <button class="primary-button xl:min-w-44" type="button" @click="reload">
          Refresh Fleet Map
        </button>
      </div>
      <label class="mt-4 inline-flex items-center gap-3 text-sm text-app-body">
        <input v-model="filters.use_active_sppg" type="checkbox" />
        Gunakan `X-SPPG-ID` aktif dari header sebagai fokus dapur
      </label>
    </section>

    <div v-if="gisState.loading.value" class="loading-panel">Memuat posisi fleet...</div>
    <div v-else-if="gisState.error.value" class="error-panel">
      <p>{{ gisState.error.value }}</p>
      <button class="primary-button mt-3" type="button" @click="gisState.execute">
        Muat ulang
      </button>
    </div>
    <template v-else-if="data">
      <MapPanel
        :dataset="data"
        :fleet-eta-by-vehicle="fleetEtaByVehicle"
        :fleet-trail="selectedTrail"
        :fleet-trail-focus-index="trailFocusIndex"
        :focus-vehicle-id="mapFocusVehicleId"
        mode="fleet"
      />

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="fleetTransitRows"
          :page-size="6"
          :search-text-resolver="fleetTransitSearchText"
          empty-message="Belum ada armada in-transit/departed dari endpoint live status."
          search-placeholder="Cari vehicle, driver, route code, status..."
          title="Armada Dalam Pengiriman"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>ETA & Warning</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="fleetRouteKey(item as FleetVehicleStatusLiveRecord)">
                  <td>
                    <p>{{ (item as FleetVehicleStatusLiveRecord).vehicle_code }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as FleetVehicleStatusLiveRecord).plate_number || '-' }} ·
                      {{ (item as FleetVehicleStatusLiveRecord).driver_name || '-' }}
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as FleetVehicleStatusLiveRecord).active_route.route_code || '-' }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as FleetVehicleStatusLiveRecord).active_route.route_name || 'Rute aktif' }}
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as FleetVehicleStatusLiveRecord).movement_status }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as FleetVehicleStatusLiveRecord).recorded_at ? formatDateTime((item as FleetVehicleStatusLiveRecord).recorded_at as string) : '-' }}
                    </p>
                  </td>
                  <td>
                    <div class="space-y-1">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        :class="directionWarningClass(getDirectionWarningCode(fleetRouteKey(item as FleetVehicleStatusLiveRecord)))"
                      >
                        {{ getDirectionWarningLabel(fleetRouteKey(item as FleetVehicleStatusLiveRecord)) }}
                      </span>
                      <p class="text-xs text-app-muted">
                        {{ getDirectionSummaryText(fleetRouteKey(item as FleetVehicleStatusLiveRecord)) }}
                      </p>
                    </div>
                  </td>
                  <td>
                    <button class="secondary-button" type="button" @click="openFleetDirection(item as FleetVehicleStatusLiveRecord)">
                      Direction
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          :items="packageRows"
          :page-size="6"
          :search-text-resolver="packageSearchText"
          empty-message="Belum ada daftar kemasan dari endpoint package lifecycle."
          search-placeholder="Cari trace code, status, tujuan, route code..."
          title="Daftar Kemasan Pengiriman"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Trace</th>
                  <th>Produk</th>
                  <th>Status</th>
                  <th>Tujuan</th>
                  <th>ETA & Warning</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="packageRouteKey(item as DeliveryPackageLifecycleRecord)">
                  <td>
                    <p>{{ (item as DeliveryPackageLifecycleRecord).trace_code }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ formatNumber((item as DeliveryPackageLifecycleRecord).quantity_portions) }} porsi
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as DeliveryPackageLifecycleRecord).product_name }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as DeliveryPackageLifecycleRecord).vehicle_code || '-' }}
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as DeliveryPackageLifecycleRecord).status_label || (item as DeliveryPackageLifecycleRecord).status }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as DeliveryPackageLifecycleRecord).delivery_started_at ? formatDateTime((item as DeliveryPackageLifecycleRecord).delivery_started_at as string) : '-' }}
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as DeliveryPackageLifecycleRecord).destination_name || '-' }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as DeliveryPackageLifecycleRecord).route_code || '-' }}
                    </p>
                  </td>
                  <td>
                    <div class="space-y-1">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        :class="directionWarningClass(getDirectionWarningCode(packageRouteKey(item as DeliveryPackageLifecycleRecord)))"
                      >
                        {{ getDirectionWarningLabel(packageRouteKey(item as DeliveryPackageLifecycleRecord)) }}
                      </span>
                      <p class="text-xs text-app-muted">
                        {{ getDirectionSummaryText(packageRouteKey(item as DeliveryPackageLifecycleRecord)) }}
                      </p>
                    </div>
                  </td>
                  <td>
                    <button
                      class="secondary-button"
                      :disabled="!(item as DeliveryPackageLifecycleRecord).destination_latitude || !(item as DeliveryPackageLifecycleRecord).destination_longitude"
                      type="button"
                      @click="openPackageDirection(item as DeliveryPackageLifecycleRecord)"
                    >
                      Direction
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>

      <GoogleDirectionsPanel
        v-if="directionTarget"
        :title="directionTarget.title"
        :subtitle="directionTarget.subtitle"
        :origin="directionTarget.origin"
        :destination="directionTarget.destination"
        :waypoints="directionTarget.waypoints"
        :planned-arrival-at="directionTarget.plannedArrivalAt || null"
        @route-computed="handleDirectionComputed"
      />

      <section class="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <DataTableCard
          :items="fleetRows"
          :page-size="8"
          :search-text-resolver="fleetSearchText"
          empty-message="Belum ada data live tracking armada."
          search-placeholder="Cari vehicle, driver, status, SPPG..."
          title="Fleet Live Positions"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>SPPG</th>
                  <th>Status</th>
                  <th>Speed</th>
                  <th>ETA</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as FleetVehicleLocationRecord).id">
                  <td>
                    <p>{{ (item as FleetVehicleLocationRecord).vehicle_code }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as FleetVehicleLocationRecord).plate_number || '-' }}
                    </p>
                  </td>
                  <td>
                    <p>{{ (item as FleetVehicleLocationRecord).driver_name || '-' }}</p>
                    <p class="mt-1 text-xs text-app-muted">
                      {{ (item as FleetVehicleLocationRecord).assignment_role || '-' }}
                    </p>
                  </td>
                  <td>{{ (item as FleetVehicleLocationRecord).sppg_name || '-' }}</td>
                  <td>{{ (item as FleetVehicleLocationRecord).status }}</td>
                  <td>
                    {{ formatNumber((item as FleetVehicleLocationRecord).speed_kmh || 0) }} km/h
                  </td>
                  <td>
                    <div class="space-y-1">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="getEtaToneClasses(item as FleetVehicleLocationRecord)">
                          {{ getEtaStatusLabel(item as FleetVehicleLocationRecord) }}
                        </span>
                        <p class="font-semibold text-app-heading">
                          {{ getEtaText(item as FleetVehicleLocationRecord) }}
                        </p>
                      </div>
                      <p class="text-xs text-app-muted">
                        {{ (item as FleetVehicleLocationRecord).eta_destination || 'Tujuan rute aktif' }}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div class="flex items-center justify-between gap-3">
                      <span>{{
                        (item as FleetVehicleLocationRecord).location_recorded_at || '-'
                      }}</span>
                      <button
                        class="secondary-button"
                        type="button"
                        @click="selectVehicle((item as FleetVehicleLocationRecord).vehicle_id)"
                      >
                        Trail
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6 xl:sticky xl:top-4 xl:self-start">
          <p class="eyebrow-text">Selected Vehicle Trail</p>
          <div class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Vehicle</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">
                {{ selectedVehicle?.vehicle_code || 'Belum dipilih' }}
              </p>
              <p class="mt-2 text-sm text-app-body">
                {{ selectedVehicle?.plate_number || '-' }} |
                {{ selectedVehicle?.driver_name || 'Tanpa driver aktif' }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="inline-flex items-center rounded-full border border-[var(--app-panel-border)] bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
                  GPS live
                </span>
                <span class="inline-flex items-center rounded-full border border-[var(--app-panel-border)] bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
                  ETA • {{ selectedVehicleEtaText }}
                </span>
                <span class="inline-flex items-center rounded-full border border-[var(--app-panel-border)] bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
                  Trail • {{ selectedTrail.length }} titik
                </span>
              </div>
              <div class="mt-3 rounded-2xl border border-[var(--app-panel-border)] bg-white/5 p-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">ETA sampai tujuan</p>
                  <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="getEtaToneClasses(selectedVehicle)">
                    {{ getEtaStatusLabel(selectedVehicle) }}
                  </span>
                </div>
                <p class="mt-2 font-semibold text-app-heading">{{ selectedVehicleEtaText }}</p>
                <p class="mt-1 text-sm text-app-body">
                  {{ selectedVehicle?.eta_destination || 'Tujuan rute aktif' }} •
                  {{ selectedVehicle?.estimated_arrival_at ? formatDateTime(selectedVehicle.estimated_arrival_at) : 'estimasi tiba belum tersedia' }}
                </p>
              </div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Trail summary</p>
              <div class="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Ping</p>
                  <p class="mt-2 text-lg font-semibold text-app-heading">
                    {{ formatNumber(selectedTrail.length) }}
                  </p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Avg Speed</p>
                  <p class="mt-2 text-lg font-semibold text-app-heading">
                    {{ formatNumber(selectedTrailAvgSpeed) }} km/h
                  </p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Latest</p>
                  <p class="mt-2 text-sm font-semibold text-app-heading">
                    {{ selectedTrailLatest?.location_recorded_at || '-' }}
                  </p>
                </div>
              </div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p class="text-sm text-app-muted">Trail playback</p>
                  <p class="mt-2 text-sm text-app-body">
                    Fokus titik aktif:
                    {{ focusedTrailPoint?.location_recorded_at || '-' }}
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="secondary-button"
                    :disabled="!selectedTrail.length"
                    type="button"
                    @click="goPrevTrail"
                  >
                    Prev
                  </button>
                  <button
                    class="secondary-button"
                    :disabled="!selectedTrail.length"
                    type="button"
                    @click="togglePlayback"
                  >
                    {{ playbackRunning ? 'Pause' : 'Play' }}
                  </button>
                  <button
                    class="secondary-button"
                    :disabled="!selectedTrail.length"
                    type="button"
                    @click="goNextTrail"
                  >
                    Next
                  </button>
                  <button class="secondary-button" type="button" @click="centerMapOnSelectedVehicle">
                    Center map
                  </button>
                  <button class="secondary-button" type="button" @click="resetTrail">
                    Reset trail
                  </button>
                </div>
              </div>
              <input
                v-if="selectedTrail.length"
                v-model.number="trailFocusIndex"
                class="mt-4 w-full accent-[var(--color-brand-400)]"
                :max="selectedTrail.length - 1"
                min="0"
                type="range"
              />
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Tracking notes</p>
              <p class="mt-2 text-sm text-app-body">
                Jejak historis memakai endpoint `GET /api/v1/fleet/vehicles/{vehicle_id}/locations`.
                Di fallback mock, trail dibentuk dari posisi live terakhir agar UI tetap terbaca
                saat backend belum memberi histori.
              </p>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article class="glass-panel p-6">
          <p class="eyebrow-text">Vehicle Detail</p>
          <div v-if="selectedVehicle" class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Current operational state</p>
              <p class="mt-2 font-display text-2xl text-app-heading">
                {{ selectedVehicle.status }}
              </p>
              <p class="mt-2 text-sm text-app-body">
                {{ selectedVehicle.sppg_name || '-' }} |
                {{ selectedVehicle.assignment_role || '-' }}
              </p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Driver</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ selectedVehicle.driver_name || '-' }}
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Plate</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ selectedVehicle.plate_number || '-' }}
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Current Speed</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ formatNumber(selectedVehicle.speed_kmh || 0) }} km/h
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Heading</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ formatNumber(selectedVehicle.heading_deg || 0) }} deg
                </p>
              </div>
            </div>
          </div>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Playback Snapshot</p>
          <div class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Focused timestamp</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ focusedTrailPoint?.location_recorded_at || '-' }}
              </p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Focused coordinate</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ formatNumber(focusedTrailPoint?.latitude || 0) }},
                  {{ formatNumber(focusedTrailPoint?.longitude || 0) }}
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Focused speed</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ formatNumber(focusedTrailPoint?.speed_kmh || 0) }} km/h
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Ping distance</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ formatNumber(selectedTrailDistance) }} km
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Trail source</p>
                <p class="mt-2 text-sm font-semibold text-app-heading">
                  {{ focusedTrailPoint?.source || '-' }}
                </p>
              </div>
            </div>
          </div>
        </article>
      </section>

      <DataTableCard
        :items="selectedTrail"
        :page-size="6"
        :search-text-resolver="historySearchText"
        empty-message="Belum ada histori GPS untuk kendaraan ini."
        search-placeholder="Cari status, waktu update, source..."
        title="Selected Vehicle Location History"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Recorded At</th>
                <th>Status</th>
                <th>Coordinate</th>
                <th>Speed</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetVehicleLocationRecord).id">
                <td>{{ (item as FleetVehicleLocationRecord).location_recorded_at || '-' }}</td>
                <td>{{ (item as FleetVehicleLocationRecord).status }}</td>
                <td>
                  {{ formatNumber((item as FleetVehicleLocationRecord).latitude) }},
                  {{ formatNumber((item as FleetVehicleLocationRecord).longitude) }}
                </td>
                <td>
                  {{ formatNumber((item as FleetVehicleLocationRecord).speed_kmh || 0) }} km/h
                </td>
                <td>{{ (item as FleetVehicleLocationRecord).source || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="documentationRows"
        :page-size="5"
        :search-text-resolver="documentationSearchText"
        empty-message="Belum ada endpoint fleet GIS terdokumentasi."
        search-placeholder="Cari endpoint atau fungsi..."
        title="Fleet GIS Endpoints"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetGisServiceRow).id">
                <td>
                  <span class="text-xs text-app-muted">{{
                    (item as FleetGisServiceRow).endpoint
                  }}</span>
                </td>
                <td>{{ (item as FleetGisServiceRow).purpose }}</td>
                <td>{{ (item as FleetGisServiceRow).status }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useGoogleMaps } from '@/composables/useGoogleMaps'
import type { FleetLatLng } from '@/types/domain'

export type DirectionWarningCode = 'ON_TRACK' | 'WARNING' | 'LATE' | 'UNKNOWN'

export type DirectionSummary = {
  distanceMeters: number
  durationSeconds: number
  estimatedArrivalAt: string
  warningCode: DirectionWarningCode
  warningLabel: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    origin: FleetLatLng | null
    destination: FleetLatLng | null
    waypoints?: FleetLatLng[]
    plannedArrivalAt?: string | null
  }>(),
  {
    subtitle: '',
    waypoints: () => [],
    plannedArrivalAt: null,
  },
)

const emit = defineEmits<{
  routeComputed: [summary: DirectionSummary]
}>()

const googleMaps = useGoogleMaps()
const mapRef = ref<HTMLDivElement | null>(null)
const loading = ref(false)
const error = ref('')
const summary = ref<DirectionSummary | null>(null)

let map: any = null
let directionsService: any = null
let directionsRenderer: any = null

const warningToneClass = computed(() => {
  if (!summary.value) return 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20'
  if (summary.value.warningCode === 'LATE') return 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20'
  if (summary.value.warningCode === 'WARNING') return 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-500/20'
  if (summary.value.warningCode === 'ON_TRACK') return 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/20'
  return 'bg-slate-500/15 text-slate-700 ring-1 ring-slate-500/20'
})

const distanceKmText = computed(() => {
  const value = summary.value?.distanceMeters
  if (value === null || value === undefined) return '-'
  return `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} km`
})

const durationText = computed(() => {
  const value = summary.value?.durationSeconds
  if (value === null || value === undefined) return '-'
  const minutes = Math.max(1, Math.round(value / 60))
  return `${minutes.toLocaleString('id-ID')} menit`
})

const etaText = computed(() => {
  if (!summary.value?.estimatedArrivalAt) return '-'
  return new Date(summary.value.estimatedArrivalAt).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
})

const toLatLng = (point: FleetLatLng) => ({ lat: point.latitude, lng: point.longitude })

const resolveWarning = (durationSeconds: number, estimatedArrivalAt: string): Pick<DirectionSummary, 'warningCode' | 'warningLabel'> => {
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60))
  if (props.plannedArrivalAt) {
    const planned = new Date(props.plannedArrivalAt).getTime()
    const estimated = new Date(estimatedArrivalAt).getTime()
    if (Number.isFinite(planned) && Number.isFinite(estimated)) {
      const lateMinutes = Math.round((estimated - planned) / 60000)
      if (lateMinutes > 5) {
        return { warningCode: 'LATE', warningLabel: `Terlambat ${lateMinutes} menit` }
      }
      if (lateMinutes >= -5) {
        return { warningCode: 'WARNING', warningLabel: 'Mepet jadwal tiba' }
      }
      return { warningCode: 'ON_TRACK', warningLabel: 'On-time sesuai jadwal' }
    }
  }

  if (durationMinutes > 45) return { warningCode: 'LATE', warningLabel: 'Potensi terlambat (durasi panjang)' }
  if (durationMinutes > 25) return { warningCode: 'WARNING', warningLabel: 'Perlu perhatian (traffic/padat)' }
  return { warningCode: 'ON_TRACK', warningLabel: 'On-track' }
}

const buildRoute = async () => {
  if (!map || !directionsService || !directionsRenderer) return
  if (!props.origin || !props.destination) {
    summary.value = null
    error.value = 'Koordinat origin/destination belum lengkap.'
    return
  }

  loading.value = true
  error.value = ''
  try {
    const maps = (window as Window & { google?: { maps?: any } }).google?.maps
    const waypointList = (props.waypoints || []).map((point) => ({ location: toLatLng(point), stopover: true }))

    const result = await new Promise<any>((resolve, reject) => {
      directionsService.route(
        {
          origin: toLatLng(props.origin),
          destination: toLatLng(props.destination),
          waypoints: waypointList,
          optimizeWaypoints: false,
          travelMode: maps.TravelMode.DRIVING,
          drivingOptions: {
            departureTime: new Date(),
            trafficModel: maps.TrafficModel.BEST_GUESS,
          },
          provideRouteAlternatives: false,
        },
        (response: any, status: string) => {
          if (status === 'OK' && response) {
            resolve(response)
            return
          }
          reject(new Error(`Directions gagal (${status}).`))
        },
      )
    })

    directionsRenderer.setDirections(result)
    const route = result.routes?.[0]
    const legs = route?.legs || []

    const distanceMeters = legs.reduce(
      (sum: number, leg: any) => sum + Number(leg.distance?.value || 0),
      0,
    )
    const durationSeconds = legs.reduce(
      (sum: number, leg: any) => sum + Number(leg.duration_in_traffic?.value || leg.duration?.value || 0),
      0,
    )

    const estimatedArrivalAt = new Date(Date.now() + durationSeconds * 1000).toISOString()
    const warning = resolveWarning(durationSeconds, estimatedArrivalAt)

    summary.value = {
      distanceMeters,
      durationSeconds,
      estimatedArrivalAt,
      warningCode: warning.warningCode,
      warningLabel: warning.warningLabel,
    }
    emit('routeComputed', summary.value)
  } catch (cause) {
    summary.value = null
    error.value = cause instanceof Error ? cause.message : 'Gagal menghitung rute Google.'
  } finally {
    loading.value = false
  }
}

const setupMap = async () => {
  if (!googleMaps.configured) {
    error.value = 'Google Maps API key belum dikonfigurasi.'
    return
  }

  try {
    await googleMaps.load()
    await nextTick()
    const maps = (window as Window & { google?: { maps?: any } }).google?.maps
    if (!maps || !mapRef.value) {
      error.value = 'Google Maps belum tersedia pada browser.'
      return
    }

    map = new maps.Map(mapRef.value, {
      center: props.origin ? toLatLng(props.origin) : { lat: -6.1775, lng: 106.8272 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    })
    directionsService = new maps.DirectionsService()
    directionsRenderer = new maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#0ea5e9',
        strokeOpacity: 0.95,
        strokeWeight: 6,
      },
    })

    await buildRoute()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Google Maps gagal dimuat.'
  }
}

onMounted(() => {
  void setupMap()
})

watch(
  () => [props.origin, props.destination, props.waypoints, props.plannedArrivalAt],
  () => {
    if (!map) return
    void buildRoute()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  if (directionsRenderer) {
    directionsRenderer.setMap(null)
  }
})
</script>

<template>
  <section class="glass-panel p-5">
    <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p class="eyebrow-text">Google Directions</p>
        <h3 class="font-display text-xl text-app-heading">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-sm text-app-body">{{ subtitle }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="inline-flex items-center rounded-full border border-(--app-panel-border) bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
          Distance: {{ distanceKmText }}
        </span>
        <span class="inline-flex items-center rounded-full border border-(--app-panel-border) bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
          Duration: {{ durationText }}
        </span>
        <span class="inline-flex items-center rounded-full border border-(--app-panel-border) bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-app-heading">
          ETA: {{ etaText }}
        </span>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="warningToneClass">
          {{ summary?.warningLabel || 'Belum dihitung' }}
        </span>
      </div>
    </div>

    <p v-if="loading" class="loading-panel">Menghitung direction dan traffic-aware ETA...</p>
    <p v-if="error" class="error-panel">{{ error }}</p>

    <div class="overflow-hidden rounded-[28px] border border-(--app-panel-border) bg-slate-950/15">
      <div ref="mapRef" class="h-110"></div>
    </div>
  </section>
</template>

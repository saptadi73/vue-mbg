<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import MapPanel from '@/components/gis/MapPanel.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createServiceArea,
  getDeliveryRouteById,
  getGisOverview,
  getNearestKitchens,
  updateKitchenServiceArea,
  validateAssignment,
} from '@/services/gis'
import { useAppStore } from '@/stores/app'
import type {
  AssignmentValidationRecord,
  DeliveryRouteRecord,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  NearestKitchenRecord,
  ServiceAreaRecord,
  ServiceCoverageRecord,
} from '@/types/domain'
import { formatNumber } from '@/utils/format'

type GisMode =
  | 'overview'
  | 'coverage'
  | 'unserved'
  | 'risk'
  | 'distribution'
  | 'serviceAreas'
  | 'routes'

type GisServiceRow = {
  id: string
  screen: string
  endpoint: string
  purpose: string
  status: string
}

const appStore = useAppStore()
const { activeSppgId } = storeToRefs(appStore)
const activeMode = ref<GisMode>('overview')
const nearestRows = ref<NearestKitchenRecord[]>([])
const assignmentResult = ref<AssignmentValidationRecord | null>(null)
const selectedRoute = ref<DeliveryRouteRecord | null>(null)
const toolLoading = ref(false)
const serviceAreaSaving = ref(false)
const serviceAreaMessage = ref('')
const serviceAreaError = ref('')
const gisPreset = ref<'today' | 'last3days' | 'tomorrow' | 'custom'>('today')

const gisFilters = reactive({
  date_from: '2026-07-20',
  date_to: '2026-07-20',
  sppg_id: '',
  use_active_sppg: true,
  bbox: '',
})

const nearestForm = reactive({
  school_id: 'school-1',
})

const validationForm = reactive({
  kitchen_id: 'sppg-jakarta-pusat-01',
  school_id: 'school-1',
  planned_portions: 120,
})

const serviceAreaForm = reactive({
  sppg_id: 'sppg-jakarta-pusat-01',
  name: 'Area Layanan Jakarta Pusat 01',
  valid_from: '2026-07-20',
  valid_to: '',
  mode: 'update' as 'create' | 'update',
  geojsonText: JSON.stringify(
    {
      type: 'Polygon',
      coordinates: [
        [
          [106.8162, -6.1702],
          [106.8423, -6.1702],
          [106.8423, -6.1919],
          [106.8162, -6.1919],
          [106.8162, -6.1702],
        ],
      ],
    },
    null,
    2,
  ),
})

const resolveGisFilters = () => ({
  date_from: gisFilters.date_from,
  date_to: gisFilters.date_to,
  sppg_id: gisFilters.use_active_sppg ? activeSppgId.value || undefined : gisFilters.sppg_id || undefined,
  bbox: gisFilters.bbox || undefined,
})

const gisState = useAsyncState(() => getGisOverview(resolveGisFilters()))

const data = computed(() => gisState.data.value ?? null)
const coverageRows = computed(() => data.value?.coverageSummary || [])
const routeRows = computed(() => data.value?.deliveryRoutes || [])
const serviceAreaRows = computed<ServiceAreaRecord[]>(() => {
  const collection = data.value?.serviceAreas
  if (!collection) return []

  return collection.features.map((feature, index) => ({
    id: String(feature.properties?.id ?? index),
    name: String(feature.properties?.name ?? `Service Area ${index + 1}`),
    sppg_id: feature.properties?.sppg_id ? String(feature.properties.sppg_id) : undefined,
    sppg_name: feature.properties?.sppg_name ? String(feature.properties.sppg_name) : undefined,
    valid_from: feature.properties?.valid_from ? String(feature.properties.valid_from) : null,
    valid_to: feature.properties?.valid_to ? String(feature.properties.valid_to) : null,
    status: feature.properties?.status ? String(feature.properties.status) : 'ACTIVE',
    boundary_geojson: {
      type: 'FeatureCollection',
      features: [feature],
    },
  }))
})

const unservedCount = computed(() => data.value?.unserved?.features.length || 0)
const riskHighCount = computed(
  () => (data.value?.riskPoints || []).filter((item) => (item.risk_score || 0) >= 70).length,
)
const routeDistanceTotal = computed(() =>
  (data.value?.deliveryRoutes || []).reduce((sum, item) => sum + item.distance_km, 0),
)
const kitchenOptions = computed(() => data.value?.kitchens || [])
const draftServiceAreaGeometry = computed(() => parsedServiceArea.value.geometry)
const gisServiceRows = computed<GisServiceRow[]>(() => [
  {
    id: 'svc-1',
    screen: 'SPPG Map',
    endpoint: 'GET /api/v1/gis/sppg-map',
    purpose: 'Marker SPPG, radius layanan, dan covered school count.',
    status: 'Active',
  },
  {
    id: 'svc-2',
    screen: 'Kitchens Layer Map',
    endpoint: 'GET /api/v1/gis/kitchens',
    purpose: 'GeoJSON FeatureCollection untuk layer dapur.',
    status: 'Active',
  },
  {
    id: 'svc-3',
    screen: 'Schools Layer Map',
    endpoint: 'GET /api/v1/gis/schools',
    purpose: 'GeoJSON sekolah dengan filter spasial dan operasional.',
    status: 'Active',
  },
  {
    id: 'svc-4',
    screen: 'Service Coverage Map',
    endpoint: 'GET /api/v1/gis/service-coverage',
    purpose: 'Ringkasan coverage dan jarak layanan sekolah.',
    status: 'Active',
  },
  {
    id: 'svc-5',
    screen: 'Delivery Route Map',
    endpoint: 'GET /api/v1/gis/delivery-routes',
    purpose: 'Line geometry rute distribusi dari SPPG ke sekolah.',
    status: 'Active',
  },
  {
    id: 'svc-6',
    screen: 'Risk Heatmap',
    endpoint: 'GET /api/v1/gis/sppg-risk-heatmap',
    purpose: 'Skor risiko operasional spasial per SPPG.',
    status: 'Active',
  },
  {
    id: 'svc-7',
    screen: 'Distribution Heatmap',
    endpoint: 'GET /api/v1/gis/heatmaps/distribution',
    purpose: 'Heatmap distribusi per sekolah.',
    status: 'Active',
  },
  {
    id: 'svc-8',
    screen: 'Service Area Editor',
    endpoint: 'POST /api/v1/gis/service-areas | PUT /api/v1/gis/kitchens/{kitchen_id}/service-area',
    purpose: 'Create dan update polygon area layanan PostGIS.',
    status: 'Active',
  },
  {
    id: 'svc-9',
    screen: 'Nearest Kitchens Tool',
    endpoint: 'GET /api/v1/gis/schools/{school_id}/nearest-kitchens',
    purpose: 'Cari dapur terdekat ke sekolah.',
    status: 'Active',
  },
  {
    id: 'svc-10',
    screen: 'Assignment Validation Tool',
    endpoint: 'POST /api/v1/gis/assignments/validate',
    purpose: 'Validasi kelayakan assignment sekolah ke dapur.',
    status: 'Active',
  },
])

const parsedServiceArea = computed<{
  valid: boolean
  message: string
  geometry: GeoJsonFeature['geometry'] | GeoJsonFeatureCollection | null
  vertexCount: number
}>(
  () => {
    const source = serviceAreaForm.geojsonText.trim()
    if (!source) {
      return {
        valid: false,
        message: 'GeoJSON belum diisi.',
        geometry: null,
        vertexCount: 0,
      }
    }

    try {
      const parsed = JSON.parse(source) as
        | GeoJsonFeature['geometry']
        | GeoJsonFeatureCollection
        | Record<string, unknown>
      if (
        parsed &&
        typeof parsed === 'object' &&
        'type' in parsed &&
        (parsed.type === 'Polygon' || parsed.type === 'MultiPolygon')
      ) {
        const polygonGeometry = parsed as GeoJsonFeature['geometry'] & { coordinates: unknown[] }
        const vertexCount =
          parsed.type === 'Polygon'
            ? (((polygonGeometry.coordinates[0] as unknown[] | undefined)?.length) || 0)
            : ((((polygonGeometry.coordinates[0] as unknown[] | undefined)?.[0] as unknown[] | undefined)?.length) || 0)
        return {
          valid: true,
          message: 'GeoJSON valid dan siap disimpan.',
          geometry: polygonGeometry,
          vertexCount,
        }
      }

      if (parsed && typeof parsed === 'object' && 'type' in parsed && parsed.type === 'FeatureCollection') {
        const featureCollection = parsed as GeoJsonFeatureCollection
        const firstGeometry = featureCollection.features[0]?.geometry
        const validGeometry =
          firstGeometry?.type === 'Polygon' || firstGeometry?.type === 'MultiPolygon'
        return {
          valid: Boolean(validGeometry),
          message: validGeometry
            ? 'FeatureCollection valid dan siap disimpan.'
            : 'FeatureCollection harus memiliki geometry Polygon atau MultiPolygon.',
          geometry: validGeometry ? featureCollection : null,
          vertexCount:
            firstGeometry?.type === 'Polygon'
              ? ((((firstGeometry.coordinates as unknown[])[0] as unknown[] | undefined)?.length) || 0)
              : firstGeometry?.type === 'MultiPolygon'
                ? (((((firstGeometry.coordinates as unknown[])[0] as unknown[] | undefined)?.[0] as unknown[] | undefined)?.length) || 0)
                : 0,
        }
      }

      return {
        valid: false,
        message: 'Gunakan geometry GeoJSON bertipe Polygon, MultiPolygon, atau FeatureCollection.',
        geometry: null,
        vertexCount: 0,
      }
    } catch (error) {
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'GeoJSON tidak valid.',
        geometry: null,
        vertexCount: 0,
      }
    }
  },
)

const activeServiceArea = computed(() =>
  serviceAreaRows.value.find((item) => item.sppg_id === serviceAreaForm.sppg_id) || null,
)

const modeOptions: Array<{ id: GisMode; label: string; description: string }> = [
  { id: 'overview', label: 'Overview', description: 'Semua layer inti dalam satu peta kontrol.' },
  { id: 'coverage', label: 'Coverage', description: 'Coverage sekolah terhadap radius layanan SPPG.' },
  { id: 'unserved', label: 'Unserved', description: 'Sekolah yang masih di luar jangkauan layanan.' },
  { id: 'risk', label: 'Risk Heatmap', description: 'Skor risiko operasional per node SPPG.' },
  { id: 'distribution', label: 'Distribution', description: 'Hotspot distribusi per sekolah.' },
  { id: 'serviceAreas', label: 'Service Areas', description: 'Polygon area layanan tersimpan.' },
  { id: 'routes', label: 'Routes', description: 'Rute pengiriman dari SPPG ke sekolah.' },
]

const coverageSearchText = (item: unknown) => {
  const row = item as ServiceCoverageRecord
  return [row.code, row.name].filter(Boolean).join(' ')
}

const routeSearchText = (item: unknown) => {
  const row = item as DeliveryRouteRecord
  return [row.delivery_number, row.status].filter(Boolean).join(' ')
}

const serviceAreaSearchText = (item: unknown) => {
  const row = item as ServiceAreaRecord
  return [row.name, row.sppg_name, row.status].filter(Boolean).join(' ')
}

const nearestKitchenSearchText = (item: unknown) => {
  const row = item as NearestKitchenRecord
  return [row.kitchen_name, row.code].filter(Boolean).join(' ')
}

const gisServiceSearchText = (item: unknown) => {
  const row = item as GisServiceRow
  return [row.screen, row.endpoint, row.purpose, row.status].join(' ')
}

const schoolOptions = computed(() => data.value?.schools || [])

const applyPreset = (preset: 'today' | 'last3days' | 'tomorrow' | 'custom') => {
  gisPreset.value = preset

  if (preset === 'today') {
    gisFilters.date_from = '2026-07-20'
    gisFilters.date_to = '2026-07-20'
  }

  if (preset === 'last3days') {
    gisFilters.date_from = '2026-07-18'
    gisFilters.date_to = '2026-07-20'
  }

  if (preset === 'tomorrow') {
    gisFilters.date_from = '2026-07-21'
    gisFilters.date_to = '2026-07-21'
  }
}

const reloadGis = async () => {
  await gisState.execute()
}

const loadNearestKitchens = async () => {
  toolLoading.value = true
  try {
    const response = await getNearestKitchens(nearestForm.school_id)
    nearestRows.value = response.items
  } finally {
    toolLoading.value = false
  }
}

const loadRouteDetail = async (deliveryId: string) => {
  toolLoading.value = true
  try {
    selectedRoute.value = await getDeliveryRouteById(deliveryId)
  } finally {
    toolLoading.value = false
  }
}

const applySchoolToWorkspace = (schoolId: string) => {
  nearestForm.school_id = schoolId
  validationForm.school_id = schoolId
}

const useNearestKitchen = (kitchenId: string) => {
  validationForm.kitchen_id = kitchenId
}

const runAssignmentValidation = async () => {
  toolLoading.value = true
  try {
    assignmentResult.value = await validateAssignment({
      kitchen_id: validationForm.kitchen_id,
      school_id: validationForm.school_id,
      planned_portions: Number(validationForm.planned_portions),
    })
  } finally {
    toolLoading.value = false
  }
}

const loadSelectedServiceArea = () => {
  const selected = activeServiceArea.value
  if (!selected?.boundary_geojson) return
  serviceAreaForm.name = selected.name
  serviceAreaForm.valid_from = selected.valid_from || '2026-07-20'
  serviceAreaForm.valid_to = selected.valid_to || ''
  serviceAreaForm.mode = 'update'

  const feature = 'features' in selected.boundary_geojson ? selected.boundary_geojson.features[0] : null
  const geometry = feature?.geometry
  if (geometry) {
    serviceAreaForm.geojsonText = JSON.stringify(geometry, null, 2)
  }
}

const saveServiceArea = async () => {
  serviceAreaSaving.value = true
  serviceAreaMessage.value = ''
  serviceAreaError.value = ''

  try {
    if (!parsedServiceArea.value.valid || !parsedServiceArea.value.geometry) {
      throw new Error(parsedServiceArea.value.message)
    }

    const payload = {
      name: serviceAreaForm.name,
      valid_from: serviceAreaForm.valid_from,
      valid_to: serviceAreaForm.valid_to || null,
      boundary_geojson: parsedServiceArea.value.geometry,
    }

    if (serviceAreaForm.mode === 'create') {
      await createServiceArea({
        sppg_id: serviceAreaForm.sppg_id,
        ...payload,
      })
      serviceAreaMessage.value = 'Service area baru berhasil dibuat.'
    } else {
      await updateKitchenServiceArea(serviceAreaForm.sppg_id, payload)
      serviceAreaMessage.value = 'Service area kitchen berhasil diperbarui.'
    }

    await gisState.execute()
  } catch (error) {
    serviceAreaError.value = error instanceof Error ? error.message : 'Gagal menyimpan service area.'
  } finally {
    serviceAreaSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="GIS Intelligence"
      subtitle="Permukaan spasial ERP MBG untuk PostGIS: kitchen map, school layer, service coverage, unserved school, risk heatmap, service area, dan delivery route dalam satu workspace modern."
      :badges="['PostGIS', 'Coverage Analysis', 'Full Map Surface']"
    />

    <section class="grid gap-4 xl:grid-cols-5">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Kitchen nodes</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.kitchens.length || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Node SPPG aktif pada peta tenant saat ini.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">School points</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.schools.length || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Titik sekolah dan penerima layanan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Unserved schools</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ unservedCount }}</p>
        <p class="mt-2 text-sm text-app-body">Perlu intervensi route atau ekspansi area layanan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">High risk SPPG</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ riskHighCount }}</p>
        <p class="mt-2 text-sm text-app-body">Node dengan skor risiko spasial tinggi.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total route distance</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ routeDistanceTotal.toFixed(1) }} km</p>
        <p class="mt-2 text-sm text-app-body">Akumulasi jarak delivery route yang sedang tampil.</p>
      </article>
    </section>

    <section class="glass-panel p-4">
      <div class="flex flex-col gap-4 border-b border-[var(--app-panel-border)] pb-4">
        <div>
          <p class="eyebrow-text">Operational Filters</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Preset cepat GIS per 20 Juli 2026</h2>
          <p class="mt-2 text-sm text-app-body">Dokumentasi menyarankan preset seperti Hari ini, 3 hari terakhir, dan Besok. Filter ini diterapkan ke layer sekolah, distribution heatmap, risk map, dan delivery routes.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="gisPreset === 'today' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="applyPreset('today')"
          >
            Hari Ini
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="gisPreset === 'last3days' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="applyPreset('last3days')"
          >
            3 Hari Terakhir
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="gisPreset === 'tomorrow' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="applyPreset('tomorrow')"
          >
            Besok
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="gisPreset === 'custom' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="gisPreset = 'custom'"
          >
            Custom
          </button>
        </div>
        <div class="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.2fr_auto]">
          <label class="form-field">
            <span>Date from</span>
            <input v-model="gisFilters.date_from" class="toolbar-input" type="date" @focus="gisPreset = 'custom'" />
          </label>
          <label class="form-field">
            <span>Date to</span>
            <input v-model="gisFilters.date_to" class="toolbar-input" type="date" @focus="gisPreset = 'custom'" />
          </label>
          <label class="form-field">
            <span>SPPG focus</span>
            <select v-model="gisFilters.sppg_id" class="toolbar-input" :disabled="gisFilters.use_active_sppg">
              <option value="">Semua SPPG</option>
              <option v-for="kitchen in kitchenOptions" :key="kitchen.id" :value="kitchen.id">
                {{ kitchen.name }}
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>BBox optional</span>
            <input
              v-model="gisFilters.bbox"
              class="toolbar-input"
              placeholder="106.800,-6.200,106.900,-6.100"
            />
          </label>
          <div class="flex items-end">
            <button class="primary-button w-full" type="button" @click="reloadGis">Apply Filter</button>
          </div>
        </div>
        <label class="inline-flex items-center gap-3 text-sm text-app-body">
          <input v-model="gisFilters.use_active_sppg" type="checkbox" />
          Gunakan `X-SPPG-ID` aktif dari header sebagai fokus dapur
        </label>
      </div>

      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p class="eyebrow-text">Map Modes</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Layer GIS berbasis backend</h2>
          <p class="mt-2 text-sm text-app-body">Pilih mode untuk melihat bentuk data yang berbeda dari endpoint GIS backend.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="option in modeOptions"
            :key="option.id"
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeMode === option.id ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeMode = option.id"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      <p class="mt-3 text-sm text-app-muted">
        {{ modeOptions.find((item) => item.id === activeMode)?.description }}
      </p>
    </section>

    <div v-if="gisState.loading.value" class="loading-panel">Memuat layer GIS...</div>
    <div v-else-if="gisState.error.value" class="error-panel">
      <p>{{ gisState.error.value }}</p>
      <button class="primary-button mt-3" type="button" @click="gisState.execute">Muat ulang</button>
    </div>
    <template v-else-if="data">
      <MapPanel :dataset="data" :draft-service-area="activeMode === 'serviceAreas' ? draftServiceAreaGeometry : null" :mode="activeMode" />

      <section class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <DataTableCard
          v-if="activeMode === 'coverage' || activeMode === 'overview'"
          :items="coverageRows"
          :page-size="5"
          :search-text-resolver="coverageSearchText"
          empty-message="Belum ada ringkasan coverage."
          search-placeholder="Cari code atau nama SPPG..."
          title="Service Coverage Summary"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SPPG</th>
                  <th>Covered</th>
                  <th>Out of Radius</th>
                  <th>Avg Distance</th>
                  <th>Farthest</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as ServiceCoverageRecord).sppg_id">
                  <td>
                    <p>{{ (item as ServiceCoverageRecord).name }}</p>
                    <p class="mt-1 text-xs text-app-muted">{{ (item as ServiceCoverageRecord).code }}</p>
                  </td>
                  <td>{{ formatNumber((item as ServiceCoverageRecord).covered_school_count) }}</td>
                  <td>{{ formatNumber((item as ServiceCoverageRecord).out_of_radius_school_count) }}</td>
                  <td>{{ (item as ServiceCoverageRecord).average_covered_distance_km.toFixed(2) }} km</td>
                  <td>{{ (item as ServiceCoverageRecord).farthest_covered_school_distance_km.toFixed(2) }} km</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-else-if="activeMode === 'routes'"
          :items="routeRows"
          :page-size="5"
          :search-text-resolver="routeSearchText"
          empty-message="Belum ada delivery route."
          search-placeholder="Cari nomor delivery atau status..."
          title="Delivery Routes"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Distance</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as DeliveryRouteRecord).id">
                  <td>{{ (item as DeliveryRouteRecord).delivery_number }}</td>
                  <td>{{ (item as DeliveryRouteRecord).status }}</td>
                  <td>{{ (item as DeliveryRouteRecord).distance_km.toFixed(2) }} km</td>
                  <td>
                    <button
                      class="secondary-button"
                      :disabled="toolLoading"
                      type="button"
                      @click="loadRouteDetail((item as DeliveryRouteRecord).delivery_order_id || (item as DeliveryRouteRecord).id)"
                    >
                      Detail
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-else-if="activeMode === 'serviceAreas'"
          :items="serviceAreaRows"
          :page-size="5"
          :search-text-resolver="serviceAreaSearchText"
          empty-message="Belum ada service area."
          search-placeholder="Cari area layanan atau SPPG..."
          title="Service Areas"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>SPPG</th>
                  <th>Status</th>
                  <th>Valid From</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as ServiceAreaRecord).id">
                  <td>{{ (item as ServiceAreaRecord).name }}</td>
                  <td>{{ (item as ServiceAreaRecord).sppg_name || '-' }}</td>
                  <td>{{ (item as ServiceAreaRecord).status || 'ACTIVE' }}</td>
                  <td>{{ (item as ServiceAreaRecord).valid_from || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article v-else class="glass-panel p-6">
          <p class="eyebrow-text">Spatial Insight</p>
          <h3 class="mt-2 font-display text-2xl text-app-heading">Mode {{ modeOptions.find((item) => item.id === activeMode)?.label }}</h3>
          <p class="mt-3 text-sm text-app-body">
            Mode ini difokuskan untuk membaca pola spasial langsung dari peta. Jika Anda butuh tabel operasional, gunakan mode Coverage, Routes, atau Service Areas.
          </p>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Quick GIS Tools</p>
          <div class="mt-5 grid gap-6">
            <div class="surface-subtle rounded-3xl p-4">
              <h3 class="font-semibold text-app-heading">School Assignment Workspace</h3>
              <div class="mt-4 grid gap-3">
                <label class="form-field">
                  <span>Select school</span>
                  <select
                    v-model="nearestForm.school_id"
                    class="toolbar-input"
                    @change="applySchoolToWorkspace(nearestForm.school_id)"
                  >
                    <option v-for="school in schoolOptions" :key="school.id" :value="school.id">
                      {{ school.name }}
                    </option>
                  </select>
                </label>
                <p class="text-sm text-app-body">
                  Pilih sekolah lalu cari nearest kitchens, kemudian lanjutkan validasi assignment dari panel yang sama.
                </p>
              </div>
            </div>

            <div class="surface-subtle rounded-3xl p-4">
              <h3 class="font-semibold text-app-heading">Nearest Kitchens</h3>
              <form class="mt-4 grid gap-3" @submit.prevent="loadNearestKitchens">
                <input v-model="nearestForm.school_id" class="toolbar-input" placeholder="School ID" />
                <button class="secondary-button" :disabled="toolLoading" type="submit">
                  {{ toolLoading ? 'Memuat...' : 'Cari Dapur Terdekat' }}
                </button>
              </form>
            </div>

            <div class="surface-subtle rounded-3xl p-4">
              <h3 class="font-semibold text-app-heading">Assignment Validation</h3>
              <form class="mt-4 grid gap-3" @submit.prevent="runAssignmentValidation">
                <input v-model="validationForm.kitchen_id" class="toolbar-input" placeholder="Kitchen ID" />
                <input v-model="validationForm.school_id" class="toolbar-input" placeholder="School ID" />
                <input v-model.number="validationForm.planned_portions" class="toolbar-input" min="0" step="1" type="number" />
                <button class="secondary-button" :disabled="toolLoading" type="submit">
                  {{ toolLoading ? 'Memvalidasi...' : 'Validasi Assignment' }}
                </button>
              </form>
            </div>
          </div>
        </article>
      </section>

      <section
        v-if="activeMode === 'serviceAreas'"
        class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"
      >
        <article class="glass-panel p-6">
          <p class="eyebrow-text">Service Area Editor</p>
          <h3 class="mt-2 font-display text-2xl text-app-heading">Create / Update Polygon</h3>
          <p class="mt-2 text-sm text-app-body">
            Pilih kitchen, impor GeoJSON polygon, lalu simpan sebagai area layanan PostGIS.
          </p>

          <div v-if="serviceAreaMessage" class="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ serviceAreaMessage }}
          </div>
          <div v-if="serviceAreaError" class="mt-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {{ serviceAreaError }}
          </div>

          <form class="mt-5 grid gap-4" @submit.prevent="saveServiceArea">
            <div class="grid gap-4 md:grid-cols-2">
              <label class="form-field">
                <span>Mode simpan</span>
                <select v-model="serviceAreaForm.mode" class="toolbar-input">
                  <option value="update">Update Kitchen Area</option>
                  <option value="create">Create New Area</option>
                </select>
              </label>
              <label class="form-field">
                <span>Select kitchen</span>
                <select v-model="serviceAreaForm.sppg_id" class="toolbar-input" @change="loadSelectedServiceArea">
                  <option v-for="kitchen in kitchenOptions" :key="kitchen.id" :value="kitchen.id">
                    {{ kitchen.name }}
                  </option>
                </select>
              </label>
              <label class="form-field">
                <span>Nama area</span>
                <input v-model="serviceAreaForm.name" class="toolbar-input" required />
              </label>
              <label class="form-field">
                <span>Valid from</span>
                <input v-model="serviceAreaForm.valid_from" class="toolbar-input" type="date" required />
              </label>
              <label class="form-field md:col-span-2">
                <span>Valid to</span>
                <input v-model="serviceAreaForm.valid_to" class="toolbar-input" type="date" />
              </label>
            </div>

            <label class="form-field">
              <span>Boundary GeoJSON</span>
              <textarea
                v-model="serviceAreaForm.geojsonText"
                class="toolbar-input min-h-[280px] font-mono text-xs"
                spellcheck="false"
              />
            </label>

            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm font-semibold text-app-heading">Validation Preview</p>
              <div class="mt-3 grid gap-4 md:grid-cols-3">
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Status</p>
                  <p class="mt-2 text-sm font-semibold text-app-heading">{{ parsedServiceArea.valid ? 'VALID' : 'INVALID' }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Vertices</p>
                  <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(parsedServiceArea.vertexCount) }}</p>
                </div>
                <div>
                  <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Selected kitchen</p>
                  <p class="mt-2 text-sm font-semibold text-app-heading">{{ kitchenOptions.find((item) => item.id === serviceAreaForm.sppg_id)?.name || '-' }}</p>
                </div>
              </div>
              <p class="mt-3 text-sm text-app-body">{{ parsedServiceArea.message }}</p>
            </div>

            <div class="flex justify-end">
              <button class="primary-button" :disabled="serviceAreaSaving || !parsedServiceArea.valid" type="submit">
                {{ serviceAreaSaving ? 'Menyimpan...' : serviceAreaForm.mode === 'create' ? 'Create Service Area' : 'Update Service Area' }}
              </button>
            </div>
          </form>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Selected Kitchen Meta</p>
          <div class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Kitchen</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ kitchenOptions.find((item) => item.id === serviceAreaForm.sppg_id)?.name || '-' }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Service radius</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ formatNumber(kitchenOptions.find((item) => item.id === serviceAreaForm.sppg_id)?.service_radius_meter || 0) }} m
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Covered school count</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ formatNumber(kitchenOptions.find((item) => item.id === serviceAreaForm.sppg_id)?.covered_school_count || 0) }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Polygon existing</p>
              <p class="mt-2 font-semibold text-app-heading">{{ activeServiceArea?.name || 'Belum ada area tersimpan' }}</p>
              <p class="mt-2 text-sm text-app-body">
                {{ activeServiceArea?.valid_from ? `Aktif sejak ${activeServiceArea.valid_from}` : 'Gunakan editor di kiri untuk membuat area baru.' }}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="nearestRows"
          :page-size="4"
          :search-text-resolver="nearestKitchenSearchText"
          empty-message="Belum ada hasil nearest kitchens."
          search-placeholder="Cari nama dapur terdekat..."
          title="Nearest Kitchens Result"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kitchen</th>
                  <th>Distance</th>
                  <th>Inside Area</th>
                  <th>Radius</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as NearestKitchenRecord).kitchen_id">
                  <td>
                    <p>{{ (item as NearestKitchenRecord).kitchen_name }}</p>
                    <p class="mt-1 text-xs text-app-muted">{{ (item as NearestKitchenRecord).code || '-' }}</p>
                  </td>
                  <td>{{ formatNumber((item as NearestKitchenRecord).distance_m) }} m</td>
                  <td>{{ (item as NearestKitchenRecord).inside_service_area ? 'Ya' : 'Tidak' }}</td>
                  <td>
                    <div class="flex items-center justify-between gap-3">
                      <span>{{ formatNumber((item as NearestKitchenRecord).service_radius_meter || 0) }} m</span>
                      <button
                        class="secondary-button"
                        type="button"
                        @click="useNearestKitchen((item as NearestKitchenRecord).kitchen_id)"
                      >
                        Pakai
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Assignment Validation Result</p>
          <div v-if="assignmentResult" class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Status Validasi</p>
              <p class="mt-2 font-display text-2xl text-app-heading">
                {{ assignmentResult.is_valid ? 'VALID' : 'INVALID' }}
              </p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-sm text-app-muted">Distance</p>
                <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(assignmentResult.distance_m || 0) }} m</p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-sm text-app-muted">Inside Service Area</p>
                <p class="mt-2 font-semibold text-app-heading">{{ assignmentResult.inside_service_area ? 'Ya' : 'Tidak' }}</p>
              </div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Catatan</p>
              <p class="mt-2 text-sm text-app-body">{{ assignmentResult.message || 'Tidak ada catatan tambahan.' }}</p>
            </div>
          </div>
          <div v-else class="mt-5 rounded-3xl border border-[var(--app-panel-border)] p-4 text-sm text-app-muted">
            Jalankan validasi assignment untuk melihat hasil kelayakan spasial sekolah ke dapur.
          </div>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <article class="glass-panel p-6">
          <p class="eyebrow-text">Selected Route Detail</p>
          <div v-if="selectedRoute" class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Delivery Number</p>
              <p class="mt-2 font-display text-2xl text-app-heading">{{ selectedRoute.delivery_number }}</p>
              <p class="mt-2 text-sm text-app-body">Status {{ selectedRoute.status }} | Jarak {{ selectedRoute.distance_km.toFixed(2) }} km</p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-sm text-app-muted">From Coordinate</p>
                <p class="mt-2 font-semibold text-app-heading">
                  {{ selectedRoute.from_coordinate.latitude.toFixed(4) }}, {{ selectedRoute.from_coordinate.longitude.toFixed(4) }}
                </p>
              </div>
              <div class="surface-subtle rounded-3xl p-4">
                <p class="text-sm text-app-muted">To Coordinate</p>
                <p class="mt-2 font-semibold text-app-heading">
                  {{ selectedRoute.to_coordinate.latitude.toFixed(4) }}, {{ selectedRoute.to_coordinate.longitude.toFixed(4) }}
                </p>
              </div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Delivery Order ID</p>
              <p class="mt-2 text-sm text-app-body">{{ selectedRoute.delivery_order_id || '-' }}</p>
            </div>
          </div>
          <div v-else class="mt-5 rounded-3xl border border-[var(--app-panel-border)] p-4 text-sm text-app-muted">
            Pilih salah satu route pada tabel `Delivery Routes` untuk melihat detail rute delivery dari backend GIS.
          </div>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Assignment Ready State</p>
          <div class="mt-5 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">School Target</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ schoolOptions.find((item) => item.id === validationForm.school_id)?.name || validationForm.school_id }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Kitchen Candidate</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ kitchenOptions.find((item) => item.id === validationForm.kitchen_id)?.name || validationForm.kitchen_id }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Planned Portions</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(validationForm.planned_portions) }}</p>
            </div>
          </div>
        </article>
      </section>

      <DataTableCard
        :items="gisServiceRows"
        :page-size="6"
        :search-text-resolver="gisServiceSearchText"
        empty-message="Belum ada layanan GIS terdokumentasi."
        search-placeholder="Cari screen, endpoint, atau fungsi..."
        title="GIS Service Coverage From Documentation"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Screen</th>
                <th>Endpoint</th>
                <th>Purpose</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as GisServiceRow).id">
                <td>{{ (item as GisServiceRow).screen }}</td>
                <td><span class="text-xs text-app-muted">{{ (item as GisServiceRow).endpoint }}</span></td>
                <td>{{ (item as GisServiceRow).purpose }}</td>
                <td>{{ (item as GisServiceRow).status }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

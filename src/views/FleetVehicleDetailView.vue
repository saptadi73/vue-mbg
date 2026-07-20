<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getFleetVehicleById } from '@/services/fleet'
import { mockDeliveryOrders, mockDeliveryRoutes } from '@/services/mock-data'
import type {
  DeliveryOrderRecord,
  DeliveryRoutePlanRecord,
  FleetAssignmentRecord,
  FleetMaintenanceRecord,
  FleetVehicleDetailRecord,
} from '@/types/domain'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

type FleetTab = 'summary' | 'assignments' | 'maintenances' | 'deliveries' | 'routes'

const route = useRoute()
const vehicleId = computed(() => String(route.params.vehicleId || ''))
const fleetState = useAsyncState<FleetVehicleDetailRecord>(() => getFleetVehicleById(vehicleId.value))
const activeTab = ref<FleetTab>('summary')

const detail = computed(() => fleetState.data.value || null)
const header = computed(() => detail.value?.vehicle || null)
const coveredSppgIds = computed(() => {
  const ids = new Set<string>()
  if (header.value?.home_sppg_id) ids.add(header.value.home_sppg_id)
  for (const assignment of detail.value?.assignments || []) {
    ids.add(assignment.sppg_id)
  }
  return [...ids]
})
const relatedDeliveries = computed(() =>
  mockDeliveryOrders.filter((item) => coveredSppgIds.value.includes(item.sppg_id)),
)
const relatedRoutes = computed(() =>
  mockDeliveryRoutes.filter((item) => coveredSppgIds.value.includes(item.sppg_id)),
)

const tabs: Array<{ id: FleetTab; label: string }> = [
  { id: 'summary', label: 'Summary' },
  { id: 'assignments', label: 'Assignments' },
  { id: 'maintenances', label: 'Maintenances' },
  { id: 'deliveries', label: 'Deliveries' },
  { id: 'routes', label: 'Routes' },
]

const assignmentSearchText = (item: unknown) => {
  const row = item as FleetAssignmentRecord
  return [row.sppg_name, row.driver_name, row.assignment_role, row.status, row.notes].filter(Boolean).join(' ')
}

const maintenanceSearchText = (item: unknown) => {
  const row = item as FleetMaintenanceRecord
  return [row.maintenance_type, row.vendor_name, row.status, row.notes].filter(Boolean).join(' ')
}

const deliverySearchText = (item: unknown) => {
  const row = item as DeliveryOrderRecord
  return [row.delivery_number, row.school_name, row.status, row.receiver_name].filter(Boolean).join(' ')
}

const routeSearchText = (item: unknown) => {
  const row = item as DeliveryRoutePlanRecord
  return [row.route_code, row.route_name, row.route_status, row.notes].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Fleet Vehicle Detail"
      subtitle="Detail kendaraan menampilkan profil unit, histori assignment, histori maintenance, dan konteks delivery yang tercakup oleh dapur home/assignment armada."
      :badges="[vehicleId || 'vehicle', 'Fleet', 'Vehicle Detail']"
    />

    <div v-if="fleetState.loading.value" class="loading-panel">Memuat detail kendaraan...</div>
    <div v-else-if="fleetState.error.value" class="error-panel">
      <p>{{ fleetState.error.value }}</p>
      <button class="primary-button mt-3" @click="fleetState.execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article class="glass-panel p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Vehicle Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.vehicle_code }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.plate_number }} | {{ header.brand_name || '-' }} {{ header.model_name || '' }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Type</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.vehicle_type_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Home SPPG</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.home_sppg_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Capacity</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(header.capacity_portions || 0) }} porsi</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Fuel</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.fuel_type || '-' }}</p></div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Quick Metrics</p>
          <div class="mt-4 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Assignments</p><p class="mt-2 font-semibold text-app-heading">{{ detail.assignments.length }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Maintenances</p><p class="mt-2 font-semibold text-app-heading">{{ detail.maintenances.length }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Related Deliveries</p><p class="mt-2 font-semibold text-app-heading">{{ relatedDeliveries.length }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Related Routes</p><p class="mt-2 font-semibold text-app-heading">{{ relatedRoutes.length }}</p></div>
          </div>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === tab.id ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body hover:border-[var(--color-brand-300)]'"
            type="button"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <article v-if="activeTab === 'summary'" class="glass-panel p-6">
        <p class="eyebrow-text">Summary</p>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Ownership</p><p class="mt-2 font-semibold text-app-heading">{{ header.ownership_status }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Manufacture Year</p><p class="mt-2 font-semibold text-app-heading">{{ header.manufacture_year || '-' }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Is Active</p><p class="mt-2 font-semibold text-app-heading">{{ header.is_active ? 'Ya' : 'Tidak' }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Covered SPPG</p><p class="mt-2 font-semibold text-app-heading">{{ coveredSppgIds.length }}</p></div>
          <div class="surface-subtle rounded-3xl p-4 md:col-span-2"><p class="text-sm text-app-muted">Notes</p><p class="mt-2 text-sm text-app-body">{{ header.notes || 'Belum ada catatan.' }}</p></div>
        </div>
      </article>

      <DataTableCard
        v-else-if="activeTab === 'assignments'"
        :items="detail.assignments"
        :search-text-resolver="assignmentSearchText"
        empty-message="Belum ada histori assignment kendaraan."
        search-placeholder="Cari SPPG, driver, role..."
        title="Assignment History"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>SPPG</th><th>Driver</th><th>Tanggal</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetAssignmentRecord).id">
                <td>{{ (item as FleetAssignmentRecord).sppg_name || '-' }}</td>
                <td>{{ (item as FleetAssignmentRecord).driver_name || '-' }}</td>
                <td>{{ formatDate((item as FleetAssignmentRecord).assignment_date) }}</td>
                <td>{{ (item as FleetAssignmentRecord).assignment_role }}</td>
                <td><StatusBadge :status="(item as FleetAssignmentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else-if="activeTab === 'maintenances'"
        :items="detail.maintenances"
        :search-text-resolver="maintenanceSearchText"
        empty-message="Belum ada histori maintenance kendaraan."
        search-placeholder="Cari maintenance, vendor, status..."
        title="Maintenance History"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Tanggal</th><th>Tipe</th><th>Vendor</th><th>Biaya</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FleetMaintenanceRecord).id">
                <td>{{ formatDate((item as FleetMaintenanceRecord).maintenance_date) }}</td>
                <td>{{ (item as FleetMaintenanceRecord).maintenance_type }}</td>
                <td>{{ (item as FleetMaintenanceRecord).vendor_name || '-' }}</td>
                <td>{{ formatCurrency((item as FleetMaintenanceRecord).cost_amount || 0) }}</td>
                <td><StatusBadge :status="(item as FleetMaintenanceRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else-if="activeTab === 'deliveries'"
        :items="relatedDeliveries"
        :search-text-resolver="deliverySearchText"
        empty-message="Belum ada delivery terkait coverage kendaraan ini."
        search-placeholder="Cari delivery, sekolah, status..."
        title="Related Deliveries"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Delivery</th><th>Sekolah</th><th>Status</th><th>Planned Arrival</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryOrderRecord).id">
                <td>{{ (item as DeliveryOrderRecord).delivery_number }}</td>
                <td>{{ (item as DeliveryOrderRecord).school_name || '-' }}</td>
                <td><StatusBadge :status="(item as DeliveryOrderRecord).status" /></td>
                <td>{{ formatDate((item as DeliveryOrderRecord).planned_arrival.slice(0, 10)) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else
        :items="relatedRoutes"
        :search-text-resolver="routeSearchText"
        empty-message="Belum ada route terkait coverage kendaraan ini."
        search-placeholder="Cari route, status, notes..."
        title="Related Routes"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Route</th><th>Status</th><th>Distance</th><th>Planned Departure</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryRoutePlanRecord).id">
                <td>
                  <p>{{ (item as DeliveryRoutePlanRecord).route_code }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryRoutePlanRecord).route_name }}</p>
                </td>
                <td><StatusBadge :status="(item as DeliveryRoutePlanRecord).route_status" /></td>
                <td>{{ formatNumber((item as DeliveryRoutePlanRecord).total_distance_km || 0) }} km</td>
                <td>{{ formatDate((item as DeliveryRoutePlanRecord).planned_departure.slice(0, 10)) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

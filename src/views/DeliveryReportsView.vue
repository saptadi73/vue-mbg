<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { ApexOptions } from 'apexcharts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  mockDeliveryIncidents,
  mockDeliveryOrders,
  mockDeliveryProofs,
  mockDeliveryRoutes,
} from '@/services/mock-data'
import { getDeliveryPerformanceReport } from '@/services/operations'
import { useAppStore } from '@/stores/app'
import type {
  DeliveryIncidentRecord,
  DeliveryOrderRecord,
  DeliveryPerformanceReportRecord,
  DeliveryProofRecord,
  DeliveryRoutePlanRecord,
} from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const filters = reactive({
  date_from: '2026-07-18',
  date_to: '2026-07-20',
})

const reportState = useAsyncState(getDeliveryPerformanceReport)
const selectedSppgId = ref('sppg-jakarta-pusat-01')

const reports = computed(() => reportState.data.value?.items || [])
const selectedReport = computed(
  () => reports.value.find((item) => item.sppg_id === selectedSppgId.value) || reports.value[0] || null,
)

const totalDeliveries = computed(() => reports.value.reduce((sum, item) => sum + item.delivery_count, 0))
const totalPortions = computed(() => reports.value.reduce((sum, item) => sum + item.total_received_portions, 0))
const totalIncidents = computed(() => reports.value.reduce((sum, item) => sum + item.incident_count, 0))
const weightedOnTime = computed(() => {
  const delivered = reports.value.reduce((sum, item) => sum + item.delivered_count, 0)
  const onTime = reports.value.reduce((sum, item) => sum + item.on_time_count, 0)
  return delivered > 0 ? Number(((onTime / delivered) * 100).toFixed(1)) : 0
})
const selectedOrders = computed(() =>
  mockDeliveryOrders.filter((item) => item.sppg_id === selectedSppgId.value),
)
const selectedRoutes = computed(() =>
  mockDeliveryRoutes.filter((item) => item.sppg_id === selectedSppgId.value),
)
const selectedProofs = computed(() => {
  const deliveryIds = new Set(selectedOrders.value.map((item) => item.id))
  return mockDeliveryProofs.filter((item) => deliveryIds.has(item.delivery_order_id))
})
const selectedIncidents = computed(() => {
  const deliveryIds = new Set(selectedOrders.value.map((item) => item.id))
  return mockDeliveryIncidents.filter((item) => deliveryIds.has(item.delivery_order_id))
})
const selectedSchoolBreakdown = computed(() => {
  const bySchool = new Map<string, {
    id: string
    school_name: string
    delivery_count: number
    received_portions: number
    rejected_portions: number
    incident_count: number
    latest_status: string
  }>()

  for (const order of selectedOrders.value) {
    const key = order.school_id || order.school_name || order.id
    const current = bySchool.get(key) || {
      id: key,
      school_name: order.school_name || 'Sekolah tanpa nama',
      delivery_count: 0,
      received_portions: 0,
      rejected_portions: 0,
      incident_count: 0,
      latest_status: order.status,
    }

    current.delivery_count += 1
    current.latest_status = order.status

    for (const proof of selectedProofs.value.filter((item) => item.delivery_order_id === order.id)) {
      current.received_portions += proof.received_portions
      current.rejected_portions += proof.rejected_portions
    }

    current.incident_count += selectedIncidents.value.filter((item) => item.delivery_order_id === order.id).length
    bySchool.set(key, current)
  }

  return [...bySchool.values()].sort((left, right) => right.delivery_count - left.delivery_count)
})
const dailyTrendRows = computed(() => {
  const byDate = new Map<string, { date: string; deliveries: number; portions: number; incidents: number }>()

  for (const order of selectedOrders.value) {
    const date = order.planned_departure.slice(0, 10)
    const current = byDate.get(date) || { date, deliveries: 0, portions: 0, incidents: 0 }
    current.deliveries += 1
    current.portions += selectedProofs.value
      .filter((item) => item.delivery_order_id === order.id)
      .reduce((sum, item) => sum + item.received_portions, 0)
    current.incidents += selectedIncidents.value.filter((item) => item.delivery_order_id === order.id).length
    byDate.set(date, current)
  }

  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date))
})
const axisColor = computed(() => (themeMode.value === 'dark' ? '#94a3b8' : '#526072'))
const legendColor = computed(() => (themeMode.value === 'dark' ? '#cbd5e1' : '#334155'))
const gridColor = computed(() =>
  themeMode.value === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(51, 65, 85, 0.12)',
)
const trendChartOptions = computed<ApexOptions>(() => ({
  chart: { toolbar: { show: false }, background: 'transparent', foreColor: axisColor.value },
  colors: ['#5cf0c6', '#6ea8fe', '#ff8f8f'],
  grid: { borderColor: gridColor.value },
  stroke: { width: 3, curve: 'smooth' },
  dataLabels: { enabled: false },
  legend: { labels: { colors: legendColor.value } },
  xaxis: {
    categories: dailyTrendRows.value.map((item) => item.date.slice(5)),
    labels: { style: { colors: axisColor.value } },
  },
  yaxis: { labels: { style: { colors: axisColor.value } } },
  theme: { mode: themeMode.value },
}))
const trendSeries = computed(() => [
  { name: 'Deliveries', data: dailyTrendRows.value.map((item) => item.deliveries) },
  { name: 'Portions', data: dailyTrendRows.value.map((item) => item.portions) },
  { name: 'Incidents', data: dailyTrendRows.value.map((item) => item.incidents) },
])

const reportSearchText = (item: unknown) => {
  const row = item as DeliveryPerformanceReportRecord
  return [
    row.sppg_name,
    row.sppg_id,
    row.delivery_count,
    row.school_served_count,
    row.incident_count,
    row.on_time_percentage,
  ].join(' ')
}

const selectedOrderSearchText = (item: unknown) => {
  const row = item as DeliveryOrderRecord
  return [row.delivery_number, row.school_name, row.status, row.receiver_name].filter(Boolean).join(' ')
}

const selectedRouteSearchText = (item: unknown) => {
  const row = item as DeliveryRoutePlanRecord
  return [row.route_code, row.route_name, row.route_status, row.notes].filter(Boolean).join(' ')
}

const selectedProofSearchText = (item: unknown) => {
  const row = item as DeliveryProofRecord
  return [row.receiver_name, row.condition_status, row.condition_notes].filter(Boolean).join(' ')
}

const selectedIncidentSearchText = (item: unknown) => {
  const row = item as DeliveryIncidentRecord
  return [row.category, row.severity, row.title, row.status].filter(Boolean).join(' ')
}

const selectedSchoolSearchText = (item: unknown) => {
  const row = item as {
    school_name: string
    delivery_count: number
    received_portions: number
    incident_count: number
    latest_status: string
  }
  return [row.school_name, row.delivery_count, row.received_portions, row.incident_count, row.latest_status].join(' ')
}

const selectReport = (sppgId: string) => {
  selectedSppgId.value = sppgId
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Delivery Reports"
      subtitle="Laporan distribusi per dapur/SPPG untuk memantau berapa pengiriman yang berjalan, berapa sekolah terlayani, porsi diterima, incident, dan ketepatan waktu."
      :badges="['Delivery Performance', 'Per SPPG', 'Operations Report']"
    />

    <section class="glass-panel p-6">
      <div class="flex flex-wrap items-end gap-4">
        <label class="form-field">
          <span>Date from</span>
          <input v-model="filters.date_from" class="toolbar-input" type="date" />
        </label>
        <label class="form-field">
          <span>Date to</span>
          <input v-model="filters.date_to" class="toolbar-input" type="date" />
        </label>
      </div>
      <p class="mt-4 text-sm text-app-muted">
        Konteks laporan saat ini memakai rentang {{ filters.date_from }} sampai {{ filters.date_to }}. Struktur ini siap disambungkan ke filter backend report berikutnya.
      </p>
    </section>

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total deliveries</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(totalDeliveries) }}</p>
        <p class="mt-2 text-sm text-app-body">Total order distribusi dalam rentang laporan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total portions received</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(totalPortions) }}</p>
        <p class="mt-2 text-sm text-app-body">Akumulasi porsi yang sudah diterima sekolah.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Incidents</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(totalIncidents) }}</p>
        <p class="mt-2 text-sm text-app-body">Incident distribusi yang tercatat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">On-time rate</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(weightedOnTime) }}%</p>
        <p class="mt-2 text-sm text-app-body">Rasio pengiriman tepat waktu dari delivery yang selesai.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <DataTableCard
        :items="reports"
        :search-text-resolver="reportSearchText"
        search-placeholder="Cari SPPG, jumlah delivery, incident, atau on-time..."
        title="Distribusi per Dapur / SPPG"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>SPPG</th>
                <th>Delivery</th>
                <th>Sekolah</th>
                <th>Porsi Diterima</th>
                <th>On-Time</th>
                <th>Incident</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryPerformanceReportRecord).id">
                <td>
                  <p>{{ (item as DeliveryPerformanceReportRecord).sppg_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryPerformanceReportRecord).sppg_id }}</p>
                </td>
                <td>{{ formatNumber((item as DeliveryPerformanceReportRecord).delivery_count) }}</td>
                <td>{{ formatNumber((item as DeliveryPerformanceReportRecord).school_served_count) }}</td>
                <td>{{ formatNumber((item as DeliveryPerformanceReportRecord).total_received_portions) }}</td>
                <td>{{ formatNumber((item as DeliveryPerformanceReportRecord).on_time_percentage) }}%</td>
                <td>
                  <StatusBadge
                    :status="(item as DeliveryPerformanceReportRecord).incident_count > 0 ? 'PENDING' : 'PASSED'"
                  />
                </td>
                <td>
                  <button class="secondary-button" type="button" @click="selectReport((item as DeliveryPerformanceReportRecord).sppg_id)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Selected SPPG</p>
        <div v-if="selectedReport" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Nama Dapur</p>
            <p class="mt-2 font-display text-2xl text-app-heading">{{ selectedReport.sppg_name }}</p>
            <p class="mt-2 text-sm text-app-body">{{ selectedReport.sppg_id }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Delivered Count</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(selectedReport.delivered_count) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">In Transit</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(selectedReport.in_transit_count) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Planned</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(selectedReport.planned_count) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Rejected Portions</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(selectedReport.total_rejected_portions) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">On-Time Count</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(selectedReport.on_time_count) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Latest Delivery</p>
              <p class="mt-2 font-semibold text-app-heading">{{ selectedReport.latest_delivery_at ? formatDateTime(selectedReport.latest_delivery_at) : '-' }}</p>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section v-if="selectedReport" class="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        title="Trend Distribusi Harian"
        subtitle="Ringkasan delivery, porsi diterima, dan incident per hari untuk dapur yang dipilih."
        type="line"
        :options="trendChartOptions"
        :series="trendSeries"
        :height="320"
      />

      <DataTableCard
        :items="selectedSchoolBreakdown"
        :search-text-resolver="selectedSchoolSearchText"
        search-placeholder="Cari sekolah, delivery, porsi, incident..."
        title="Sekolah yang Dilayani Dapur Terpilih"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Delivery</th>
                <th>Porsi Diterima</th>
                <th>Porsi Reject</th>
                <th>Incident</th>
                <th>Status Terakhir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as { id: string }).id">
                <td>{{ (item as { school_name: string }).school_name }}</td>
                <td>{{ formatNumber((item as { delivery_count: number }).delivery_count) }}</td>
                <td>{{ formatNumber((item as { received_portions: number }).received_portions) }}</td>
                <td>{{ formatNumber((item as { rejected_portions: number }).rejected_portions) }}</td>
                <td>{{ formatNumber((item as { incident_count: number }).incident_count) }}</td>
                <td><StatusBadge :status="(item as { latest_status: string }).latest_status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section v-if="selectedReport" class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="selectedOrders"
        :search-text-resolver="selectedOrderSearchText"
        search-placeholder="Cari nomor delivery, sekolah, status..."
        title="Delivery Orders Dapur Terpilih"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Delivery</th>
                <th>Sekolah</th>
                <th>Planned Arrival</th>
                <th>Actual Arrival</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryOrderRecord).id">
                <td>{{ (item as DeliveryOrderRecord).delivery_number }}</td>
                <td>{{ (item as DeliveryOrderRecord).school_name || '-' }}</td>
                <td>{{ formatDateTime((item as DeliveryOrderRecord).planned_arrival) }}</td>
                <td>{{ (item as DeliveryOrderRecord).actual_arrival ? formatDateTime((item as DeliveryOrderRecord).actual_arrival as string) : '-' }}</td>
                <td><StatusBadge :status="(item as DeliveryOrderRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="selectedRoutes"
        :search-text-resolver="selectedRouteSearchText"
        search-placeholder="Cari route code, route name, status..."
        title="Routes Dapur Terpilih"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Planned</th>
                <th>Actual</th>
                <th>Distance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryRoutePlanRecord).id">
                <td>
                  <p>{{ (item as DeliveryRoutePlanRecord).route_code }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryRoutePlanRecord).route_name }}</p>
                </td>
                <td>{{ formatDateTime((item as DeliveryRoutePlanRecord).planned_departure) }}</td>
                <td>{{ (item as DeliveryRoutePlanRecord).actual_departure ? formatDateTime((item as DeliveryRoutePlanRecord).actual_departure as string) : '-' }}</td>
                <td>{{ formatNumber((item as DeliveryRoutePlanRecord).total_distance_km || 0) }} km</td>
                <td><StatusBadge :status="(item as DeliveryRoutePlanRecord).route_status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section v-if="selectedReport" class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="selectedProofs"
        :search-text-resolver="selectedProofSearchText"
        search-placeholder="Cari receiver, kondisi, notes..."
        title="Proof of Delivery Dapur Terpilih"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Receiver</th>
                <th>Received At</th>
                <th>Portions</th>
                <th>Temperature</th>
                <th>Condition</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryProofRecord).id">
                <td>{{ (item as DeliveryProofRecord).receiver_name }}</td>
                <td>{{ formatDateTime((item as DeliveryProofRecord).received_at) }}</td>
                <td>{{ formatNumber((item as DeliveryProofRecord).received_portions) }}</td>
                <td>{{ formatNumber((item as DeliveryProofRecord).temperature_celsius || 0) }} C</td>
                <td><StatusBadge :status="(item as DeliveryProofRecord).condition_status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="selectedIncidents"
        :search-text-resolver="selectedIncidentSearchText"
        search-placeholder="Cari kategori, severity, judul..."
        title="Delivery Incidents Dapur Terpilih"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Time</th>
                <th>Severity</th>
                <th>Temperature</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryIncidentRecord).id">
                <td>
                  <p>{{ (item as DeliveryIncidentRecord).title }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryIncidentRecord).category }}</p>
                </td>
                <td>{{ formatDateTime((item as DeliveryIncidentRecord).incident_time) }}</td>
                <td><StatusBadge :status="(item as DeliveryIncidentRecord).severity" /></td>
                <td>{{ formatNumber((item as DeliveryIncidentRecord).temperature_celsius || 0) }} C</td>
                <td><StatusBadge :status="(item as DeliveryIncidentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

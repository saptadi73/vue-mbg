<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { ApexOptions } from 'apexcharts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import KpiCard from '@/components/common/KpiCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TimelineList from '@/components/common/TimelineList.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getDashboardOverview } from '@/services/dashboard'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const { data, loading, error, execute } = useAsyncState(getDashboardOverview)

const axisColor = computed(() => (themeMode.value === 'dark' ? '#94a3b8' : '#526072'))
const legendColor = computed(() => (themeMode.value === 'dark' ? '#cbd5e1' : '#334155'))
const gridColor = computed(() =>
  themeMode.value === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(51, 65, 85, 0.12)',
)

const baseChartOptions = computed<ApexOptions>(() => ({
  chart: { toolbar: { show: false }, background: 'transparent', foreColor: axisColor.value },
  grid: { borderColor: gridColor.value },
  stroke: { width: 3, curve: 'smooth' },
  dataLabels: { enabled: false },
  legend: { labels: { colors: legendColor.value } },
  xaxis: {
    categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    labels: { style: { colors: axisColor.value } },
  },
  yaxis: { labels: { style: { colors: axisColor.value } } },
  theme: { mode: themeMode.value },
}))

const statusOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  chart: { ...baseChartOptions.value.chart, type: 'bar' },
  colors: ['#5cf0c6'],
  xaxis: {
    categories: ['Draft', 'Submitted', 'Approved', 'Reserved'],
    labels: { style: { colors: axisColor.value } },
  },
}))

const deliveryOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  colors: ['#5cf0c6', '#ff8f8f'],
}))
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Dashboard Command Center"
      subtitle="Ringkasan tenant, dapur, distribusi, dan finance dalam satu layar keputusan yang cepat."
      :badges="['Tenant Dashboard', 'SPPG Dashboard', 'Finance Dashboard']"
    />

    <div v-if="loading" class="loading-panel">Memuat dashboard MBG...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <template v-else-if="data">
      <section class="grid gap-4 xl:grid-cols-4">
        <KpiCard v-for="item in data.tenantKpis" :key="item.id" :item="item" />
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <ChartPanel
          title="Meal Plan Workflow"
          subtitle="Status operasional meal plan lintas SPPG aktif."
          type="bar"
          :options="statusOptions"
          :series="data.mealPlanStatus"
        />
        <ChartPanel
          title="Delivery Performance"
          subtitle="Pergerakan service level harian dan jumlah issue."
          type="line"
          :options="deliveryOptions"
          :series="data.deliveryPerformance"
        />
      </section>

      <section class="grid gap-4 xl:grid-cols-4">
        <KpiCard v-for="item in data.sppgKpis" :key="item.id" :item="item" />
      </section>

      <section class="grid gap-4 xl:grid-cols-4">
        <KpiCard v-for="item in data.financeKpis" :key="item.id" :item="item" />
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <TimelineList title="Alerts & Risks" :items="data.alerts" />
        <TimelineList title="Pending Approvals" :items="data.approvals" />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const showCharts = ref(false)
let chartTimer: ReturnType<typeof setTimeout> | null = null

const axisColor = computed(() => (themeMode.value === 'dark' ? '#94a3b8' : '#526072'))
const legendColor = computed(() => (themeMode.value === 'dark' ? '#cbd5e1' : '#334155'))
const gridColor = computed(() =>
  themeMode.value === 'dark' ? 'rgba(148, 163, 184, 0.12)' : 'rgba(51, 65, 85, 0.12)',
)
const monthCategories = ['Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul']

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

const budgetPlanRealizationOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  colors: ['#38bdf8', '#5cf0c6'],
  xaxis: {
    categories: monthCategories,
    labels: { style: { colors: axisColor.value } },
  },
  yaxis: {
    labels: {
      style: { colors: axisColor.value },
      formatter: (value) => `Rp${Math.round(Number(value))} jt`,
    },
  },
  tooltip: {
    y: {
      formatter: (value) => `Rp${Math.round(Number(value))} juta`,
    },
  },
}))

const fundingGovernmentOptions = computed<ApexOptions>(() => ({
  ...baseChartOptions.value,
  colors: ['#f59e0b', '#22c55e'],
  xaxis: {
    categories: monthCategories,
    labels: { style: { colors: axisColor.value } },
  },
  yaxis: {
    labels: {
      style: { colors: axisColor.value },
      formatter: (value) => `Rp${Math.round(Number(value))} jt`,
    },
  },
  tooltip: {
    y: {
      formatter: (value) => `Rp${Math.round(Number(value))} juta`,
    },
  },
}))

const scheduleChartsRender = () => {
  if (!data.value || showCharts.value) return

  if (chartTimer) {
    clearTimeout(chartTimer)
  }

  chartTimer = setTimeout(() => {
    showCharts.value = true
  }, 180)
}

watch(
  () => data.value,
  (value) => {
    if (!value) {
      showCharts.value = false
      if (chartTimer) {
        clearTimeout(chartTimer)
        chartTimer = null
      }
      return
    }

    scheduleChartsRender()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Dashboard Command Center"
      subtitle="Ringkasan yayasan, dapur, distribusi, dan finance dalam satu layar keputusan yang cepat."
      :badges="['Dashboard Yayasan', 'SPPG Dashboard', 'Finance Dashboard']"
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

      <section v-if="showCharts" class="grid gap-4 xl:grid-cols-2">
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
        <ChartPanel
          title="Budget Plan vs Realisasi"
          subtitle="Perbandingan rencana anggaran dan realisasi bulanan lintas yayasan aktif."
          type="line"
          :options="budgetPlanRealizationOptions"
          :series="data.budgetPlanRealization"
        />
        <ChartPanel
          title="Modal Tersalurkan vs Anggaran Pemerintah Turun"
          subtitle="Dua garis monitoring modal tersalurkan dan anggaran pemerintah yang sudah turun."
          type="line"
          :options="fundingGovernmentOptions"
          :series="data.fundingGovernmentTrend"
        />
      </section>
      <section v-else class="grid gap-4 xl:grid-cols-2">
        <article v-for="index in 4" :key="index" class="glass-panel p-5">
          <div class="h-[320px] animate-pulse rounded-3xl border border-[var(--app-panel-border)] bg-white/5" />
        </article>
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

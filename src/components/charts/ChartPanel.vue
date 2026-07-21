<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { ApexAxisChartSeries, ApexNonAxisChartSeries, ApexOptions } from 'apexcharts'

const VueApexCharts = defineAsyncComponent(() => import('vue3-apexcharts'))

defineProps<{
  title: string
  subtitle: string
  type: 'bar' | 'line' | 'radar' | 'donut'
  options: ApexOptions
  series: ApexAxisChartSeries | ApexNonAxisChartSeries
  height?: number
}>()
</script>

<template>
  <section class="glass-panel p-5">
    <div class="mb-5">
      <h3 class="font-display text-xl text-app-heading">{{ title }}</h3>
      <p class="mt-1 text-sm text-app-body">{{ subtitle }}</p>
    </div>

    <VueApexCharts :type="type" :height="height || 320" :options="options" :series="series" />
  </section>
</template>

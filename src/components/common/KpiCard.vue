<script setup lang="ts">
import type { KpiCard } from '@/types/domain'

defineProps<{
  item: KpiCard
}>()
</script>

<template>
  <article class="kpi-card glass-panel p-5">
    <div class="kpi-card-accent" :class="`kpi-card-accent-${item.tone || 'brand'}`" />
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <p class="text-sm font-medium text-app-muted">{{ item.label }}</p>
          <span class="kpi-card-dot" :class="`kpi-card-dot-${item.tone || 'brand'}`" />
        </div>
        <p class="mt-3 font-display text-3xl leading-none text-app-heading">{{ item.value }}</p>
      </div>
      <span class="status-pill" :class="`status-pill-${item.tone || 'brand'}`">
        {{ item.change || 'stable' }}
      </span>
    </div>
    <p class="mt-4 text-sm leading-6 text-app-body">{{ item.caption }}</p>
  </article>
</template>

<script setup lang="ts">
import type { KpiCard } from '@/types/domain'

defineProps<{
  item: KpiCard
}>()
</script>

<template>
  <article class="glass-panel p-5">
    <div class="flex items-start justify-between gap-3">
      <div>
        <p class="text-sm text-app-muted">{{ item.label }}</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ item.value }}</p>
      </div>
      <span class="status-pill" :class="`status-pill-${item.tone || 'brand'}`">
        {{ item.change || 'stable' }}
      </span>
    </div>
    <p class="mt-4 text-sm text-app-body">{{ item.caption }}</p>
  </article>
</template>

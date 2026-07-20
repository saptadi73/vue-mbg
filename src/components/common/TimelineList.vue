<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue'
import type { TimelineItem } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

defineProps<{
  title: string
  items: TimelineItem[]
}>()
</script>

<template>
  <section class="glass-panel p-5">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="font-display text-xl text-app-heading">{{ title }}</h3>
      <span class="text-xs uppercase tracking-[0.24em] text-app-muted">{{ items.length }} item</span>
    </div>

    <div class="space-y-4">
      <article v-for="item in items" :key="item.id" class="surface-subtle rounded-2xl p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h4 class="text-sm font-semibold text-app-heading">{{ item.title }}</h4>
            <p class="mt-1 text-sm text-app-body">{{ item.description }}</p>
          </div>
          <StatusBadge :status="item.status" />
        </div>
        <p class="mt-3 text-xs uppercase tracking-[0.2em] text-app-faint">{{ formatDateTime(item.time) }}</p>
      </article>
    </div>
  </section>
</template>

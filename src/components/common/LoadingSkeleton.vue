<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'detail' | 'table' | 'workspace'
    label?: string
    rows?: number
  }>(),
  {
    variant: 'detail',
    label: 'Memuat data...',
    rows: 4,
  },
)
</script>

<template>
  <div class="skeleton-shell" role="status" aria-live="polite" :aria-label="label">
    <div class="flex items-center gap-3">
      <span class="skeleton-pulse-dot"></span>
      <div class="min-w-0 flex-1 space-y-2">
        <div class="skeleton-block h-3 w-28"></div>
        <div class="skeleton-block h-6 w-full max-w-sm"></div>
      </div>
    </div>

    <template v-if="variant === 'workspace'">
      <div class="mt-6 grid gap-3 sm:grid-cols-3">
        <div v-for="index in 3" :key="`metric-${index}`" class="skeleton-surface space-y-3">
          <div class="skeleton-block h-2.5 w-20"></div>
          <div class="skeleton-block h-7 w-24"></div>
        </div>
      </div>
      <div class="mt-6 grid gap-4 xl:grid-cols-3">
        <div v-for="index in 3" :key="`panel-${index}`" class="skeleton-surface space-y-4">
          <div class="skeleton-block h-4 w-32"></div>
          <div v-for="field in 4" :key="field" class="skeleton-block h-11 w-full"></div>
          <div class="skeleton-block h-11 w-full rounded-xl"></div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'detail'">
      <div class="mt-6 grid gap-4 lg:grid-cols-[1.7fr_0.8fr]">
        <div class="skeleton-surface space-y-5">
          <div class="skeleton-block h-8 w-2/3"></div>
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div v-for="index in 4" :key="index" class="skeleton-block h-20 w-full"></div>
          </div>
        </div>
        <div class="skeleton-surface space-y-3">
          <div class="skeleton-block h-4 w-28"></div>
          <div class="skeleton-block h-11 w-full"></div>
          <div class="skeleton-block h-11 w-full"></div>
        </div>
      </div>
      <div class="skeleton-table mt-5">
        <div v-for="index in rows" :key="index" class="grid grid-cols-4 gap-3 border-t border-(--app-panel-border) py-3 first:border-0">
          <div class="skeleton-block h-4 w-full"></div>
          <div class="skeleton-block h-4 w-4/5"></div>
          <div class="skeleton-block h-4 w-3/5"></div>
          <div class="skeleton-block h-4 w-full"></div>
        </div>
      </div>
    </template>

    <div v-else class="skeleton-table mt-6">
      <div v-for="index in rows" :key="index" class="grid grid-cols-4 gap-3 border-t border-(--app-panel-border) py-3 first:border-0">
        <div class="skeleton-block h-4 w-full"></div>
        <div class="skeleton-block h-4 w-4/5"></div>
        <div class="skeleton-block h-4 w-3/5"></div>
        <div class="skeleton-block h-4 w-full"></div>
      </div>
    </div>

    <span class="sr-only">{{ label }}</span>
  </div>
</template>
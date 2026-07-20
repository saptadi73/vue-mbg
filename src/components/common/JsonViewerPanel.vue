<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  title: string
  value?: unknown
}>()

const serialized = computed(() => JSON.stringify(props.value ?? {}, null, 2))
</script>

<template>
  <article class="surface-subtle overflow-hidden rounded-3xl">
    <div class="flex items-center justify-between gap-3 border-b border-[var(--app-panel-border)] px-4 py-3">
      <p class="text-xs uppercase tracking-[0.24em] text-app-muted">{{ title }}</p>
      <span class="status-pill status-pill-neutral">JSON</span>
    </div>
    <pre class="max-h-80 overflow-auto p-4 text-xs leading-6 text-app-heading">{{ serialized }}</pre>
  </article>
</template>

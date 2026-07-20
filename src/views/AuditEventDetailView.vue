<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getAuditEventById } from '@/services/documents-audit'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const eventId = computed(() => String(route.params.eventId || ''))
const detailState = useAsyncState(() => getAuditEventById(eventId.value))
const event = computed(() => detailState.data.value?.item ?? null)
const rawMetadata = computed(() => JSON.stringify(event.value?.metadata_json || {}, null, 2))
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Audit Event Detail"
      subtitle="Detail aktivitas audit dengan actor, entity, request id, hasil proses, dan metadata mentah."
      :badges="[eventId || 'audit-event', 'Audit Detail', 'Metadata JSON']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat audit event...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="event">
      <section class="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">{{ event.module_name }} / {{ event.event_type }}</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ event.summary }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ event.action_name }} pada {{ event.entity_type }} / {{ event.entity_id }}</p>
            </div>
            <StatusBadge :status="event.success ? 'SUCCESS' : 'FAILED'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Actor</p><p class="mt-2 font-semibold text-app-heading">{{ event.actor_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Occurred At</p><p class="mt-2 font-semibold text-app-heading">{{ formatDateTime(event.occurred_at) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Request ID</p><p class="mt-2 font-semibold text-app-heading">{{ event.request_id || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">IP Address</p><p class="mt-2 font-semibold text-app-heading">{{ event.ip_address || '-' }}</p></div>
          </div>
          <RouterLink class="secondary-button mt-5 inline-flex" to="/audit/events">Kembali ke Audit</RouterLink>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Raw Metadata</p>
          <pre class="mt-4 max-h-[32rem] overflow-auto rounded-2xl border border-[var(--app-panel-border)] bg-black/5 p-4 text-xs text-app-body">{{ rawMetadata }}</pre>
        </article>
      </section>
    </template>
  </div>
</template>

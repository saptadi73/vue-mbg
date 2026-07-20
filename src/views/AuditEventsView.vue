<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getAuditEvents } from '@/services/documents-audit'
import type { AuditEventRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const selectedModule = ref('')
const selectedEventType = ref('')
const auditState = useAsyncState(() =>
  getAuditEvents({
    module_name: selectedModule.value || undefined,
    event_type: selectedEventType.value || undefined,
  }),
)

watch([selectedModule, selectedEventType], () => {
  void auditState.execute()
})

const moduleOptions = computed(() =>
  Array.from(new Set((auditState.data.value?.items || []).map((item) => item.module_name))).sort(),
)
const eventTypeOptions = computed(() =>
  Array.from(new Set((auditState.data.value?.items || []).map((item) => item.event_type))).sort(),
)

const auditSearchText = (item: unknown) => {
  const row = item as AuditEventRecord
  return [row.actor_name, row.event_type, row.module_name, row.action_name, row.entity_type, row.entity_id, row.summary, row.request_id]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Audit Events"
      subtitle="Audit trail untuk aktivitas penting identity, meal plan, budget, quality, dan workflow."
      :badges="['Audit', 'Event List', 'Raw Metadata']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <select v-model="selectedModule" class="toolbar-input">
          <option value="">Semua Module</option>
          <option v-for="moduleName in moduleOptions" :key="moduleName" :value="moduleName">{{ moduleName }}</option>
        </select>
        <select v-model="selectedEventType" class="toolbar-input">
          <option value="">Semua Event Type</option>
          <option v-for="eventType in eventTypeOptions" :key="eventType" :value="eventType">{{ eventType }}</option>
        </select>
        <RouterLink class="secondary-button" to="/documents">Documents</RouterLink>
      </div>
      <p v-if="auditState.data.value?.fallback" class="mt-3 text-sm text-app-muted">
        Audit events memakai fallback mock karena backend belum mengembalikan data siap pakai.
      </p>
    </section>

    <div v-if="auditState.loading.value" class="loading-panel">Memuat audit events...</div>
    <div v-else-if="auditState.error.value" class="error-panel">
      <p>{{ auditState.error.value }}</p>
      <button class="primary-button mt-3" @click="auditState.execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else
      :items="auditState.data.value?.items || []"
      :search-text-resolver="auditSearchText"
      search-placeholder="Cari actor, module, action, entity, request id..."
      title="Daftar Audit Event"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Actor</th>
              <th>Module</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Result</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in items" :key="(event as AuditEventRecord).id">
              <td>{{ formatDateTime((event as AuditEventRecord).occurred_at) }}</td>
              <td>{{ (event as AuditEventRecord).actor_name || '-' }}</td>
              <td>{{ (event as AuditEventRecord).module_name }}</td>
              <td>{{ (event as AuditEventRecord).action_name }}</td>
              <td>{{ (event as AuditEventRecord).entity_type }} / {{ (event as AuditEventRecord).entity_id }}</td>
              <td><StatusBadge :status="(event as AuditEventRecord).success ? 'SUCCESS' : 'FAILED'" /></td>
              <td><RouterLink class="secondary-button" :to="`/audit/events/${(event as AuditEventRecord).id}`">Detail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import JsonViewerPanel from '@/components/common/JsonViewerPanel.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  dispatchOutboxEvents,
  getBackgroundJobs,
  getDataMappings,
  getExternalSystems,
  getInboundMessages,
  getOutboxEvents,
  getOutboundMessages,
  getPlatformHealth,
  getReadModels,
  getSyncJobs,
  getSyncLogs,
  getWebhookSubscriptions,
  refreshReadModel,
  runBackgroundJob,
  runSyncJob,
} from '@/services/integration-platform'
import type {
  BackgroundJobRecord,
  DataMappingRecord,
  ExternalSystemRecord,
  IntegrationMessageRecord,
  OutboxEventRecord,
  PlatformHealthRecord,
  ReadModelRecord,
  SyncJobRecord,
  SyncLogRecord,
  WebhookSubscriptionRecord,
} from '@/types/domain'
import { formatDateTime } from '@/utils/format'

type TabKey =
  | 'health'
  | 'external'
  | 'webhooks'
  | 'mappings'
  | 'sync-jobs'
  | 'messages'
  | 'sync-logs'
  | 'platform'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'health', label: 'Health' },
  { key: 'external', label: 'External Systems' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'mappings', label: 'Data Mappings' },
  { key: 'sync-jobs', label: 'Sync Jobs' },
  { key: 'messages', label: 'Messages' },
  { key: 'sync-logs', label: 'Sync Logs' },
  { key: 'platform', label: 'Platform Ops' },
]

const activeTab = ref<TabKey>('health')
const selectedJsonTitle = ref('Payload Preview')
const selectedJson = ref<unknown>({ hint: 'Klik tombol Payload/Response pada tabel untuk melihat JSON.' })
const actionMessage = ref('')
const actionError = ref('')
const actionLoading = ref('')

const healthState = useAsyncState(getPlatformHealth)
const externalState = useAsyncState(getExternalSystems)
const webhookState = useAsyncState(getWebhookSubscriptions)
const mappingState = useAsyncState(getDataMappings)
const syncJobState = useAsyncState(getSyncJobs)
const inboundState = useAsyncState(getInboundMessages)
const outboundState = useAsyncState(getOutboundMessages)
const syncLogState = useAsyncState(getSyncLogs)
const backgroundJobState = useAsyncState(getBackgroundJobs)
const outboxState = useAsyncState(getOutboxEvents)
const readModelState = useAsyncState(getReadModels)

const outboundCount = computed(() => outboundState.data.value?.items.length || 0)
const inboundCount = computed(() => inboundState.data.value?.items.length || 0)
const failedSyncCount = computed(
  () => (syncLogState.data.value?.items || []).filter((item) => item.status === 'FAILED').length,
)
const pendingOutboxCount = computed(
  () => (outboxState.data.value?.items || []).filter((item) => item.status === 'PENDING').length,
)

const showJson = (title: string, value: unknown) => {
  selectedJsonTitle.value = title
  selectedJson.value = value
}

const runAction = async (key: string, action: () => Promise<unknown>, reload?: () => Promise<unknown>) => {
  actionLoading.value = key
  actionMessage.value = ''
  actionError.value = ''

  try {
    await action()
    actionMessage.value = 'Aksi platform berhasil dikirim ke backend.'
    if (reload) await reload()
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Aksi gagal dijalankan.'
  } finally {
    actionLoading.value = ''
  }
}

const searchAny = (item: unknown) => JSON.stringify(item)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Integration & Platform Ops"
      subtitle="Admin workspace untuk external system, webhook, sync orchestration, outbox, background jobs, dan health backend."
      :badges="['Integration', 'Platform Ops', 'JSON Viewer']"
    />

    <section class="grid gap-4 md:grid-cols-4">
      <div class="glass-panel p-5">
        <p class="eyebrow-text">External Systems</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ externalState.data.value?.items.length || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Partner/provider aktif.</p>
      </div>
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Messages</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ inboundCount + outboundCount }}</p>
        <p class="mt-2 text-sm text-app-body">Inbound + outbound queue.</p>
      </div>
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Failed Sync</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ failedSyncCount }}</p>
        <p class="mt-2 text-sm text-app-body">Butuh inspeksi payload.</p>
      </div>
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Pending Outbox</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ pendingOutboxCount }}</p>
        <p class="mt-2 text-sm text-app-body">Menunggu dispatch.</p>
      </div>
    </section>

    <section class="glass-panel p-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="secondary-button"
          :class="{ 'border-teal-300/50 bg-teal-300/15 text-app-heading': activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <p v-if="actionMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
      {{ actionMessage }}
    </p>
    <p v-if="actionError" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
      {{ actionError }}
    </p>

    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.8fr)]">
      <div class="space-y-6">
        <DataTableCard
          v-if="activeTab === 'health' && healthState.data.value"
          :items="healthState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari endpoint atau status..."
          title="Backend Health Checks"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Checked</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as PlatformHealthRecord).id">
                  <td>
                    <p class="font-semibold text-app-heading">{{ (item as PlatformHealthRecord).label }}</p>
                    <p class="mt-1 text-sm text-app-body">{{ (item as PlatformHealthRecord).message }}</p>
                  </td>
                  <td>{{ (item as PlatformHealthRecord).endpoint }}</td>
                  <td><StatusBadge :status="(item as PlatformHealthRecord).status" /></td>
                  <td>{{ formatDateTime((item as PlatformHealthRecord).checked_at) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'external' && externalState.data.value"
          :items="externalState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari system, code, base URL..."
          title="External System List"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>System</th>
                  <th>Type</th>
                  <th>Base URL</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as ExternalSystemRecord).id">
                  <td>
                    <p class="font-semibold text-app-heading">{{ (item as ExternalSystemRecord).name }}</p>
                    <p class="mt-1 text-sm text-app-body">{{ (item as ExternalSystemRecord).code }}</p>
                  </td>
                  <td>{{ (item as ExternalSystemRecord).system_type }}</td>
                  <td>{{ (item as ExternalSystemRecord).base_url || '-' }}</td>
                  <td><StatusBadge :status="(item as ExternalSystemRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'webhooks' && webhookState.data.value"
          :items="webhookState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari subscription, event, endpoint..."
          title="Webhook Subscriptions"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Event</th>
                  <th>Endpoint</th>
                  <th>Status</th>
                  <th>Headers</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as WebhookSubscriptionRecord).id">
                  <td>{{ (item as WebhookSubscriptionRecord).subscription_name }}</td>
                  <td>{{ (item as WebhookSubscriptionRecord).event_type }}</td>
                  <td>{{ (item as WebhookSubscriptionRecord).endpoint_path }}</td>
                  <td><StatusBadge :status="(item as WebhookSubscriptionRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
                  <td>
                    <button class="secondary-button" type="button" @click="showJson('Webhook Headers', (item as WebhookSubscriptionRecord).headers_json)">JSON</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'mappings' && mappingState.data.value"
          :items="mappingState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari mapping, entity, direction..."
          title="Data Mappings"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mapping</th>
                  <th>Direction</th>
                  <th>Source</th>
                  <th>Target</th>
                  <th>Config</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as DataMappingRecord).id">
                  <td>{{ (item as DataMappingRecord).mapping_name }}</td>
                  <td><StatusBadge :status="(item as DataMappingRecord).direction" /></td>
                  <td>{{ (item as DataMappingRecord).source_entity }}</td>
                  <td>{{ (item as DataMappingRecord).target_entity }}</td>
                  <td>
                    <button class="secondary-button" type="button" @click="showJson('Mapping Config', (item as DataMappingRecord).mapping_config_json)">JSON</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'sync-jobs' && syncJobState.data.value"
          :items="syncJobState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari job, status, entity..."
          title="Sync Jobs"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Job</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th>Last Run</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SyncJobRecord).id">
                  <td>
                    <p class="font-semibold text-app-heading">{{ (item as SyncJobRecord).job_name }}</p>
                    <p class="mt-1 text-sm text-app-body">{{ (item as SyncJobRecord).external_system_name || '-' }} | {{ (item as SyncJobRecord).entity_type }}</p>
                  </td>
                  <td><StatusBadge :status="(item as SyncJobRecord).direction" /></td>
                  <td><StatusBadge :status="(item as SyncJobRecord).status" /></td>
                  <td>{{ (item as SyncJobRecord).last_run_at ? formatDateTime((item as SyncJobRecord).last_run_at!) : '-' }}</td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      <button class="secondary-button" type="button" @click="showJson('Sync Job Filter', (item as SyncJobRecord).filter_json)">Filter</button>
                      <button
                        class="primary-button disabled:cursor-not-allowed disabled:opacity-50"
                        :disabled="actionLoading === (item as SyncJobRecord).id"
                        type="button"
                        @click="runAction((item as SyncJobRecord).id, () => runSyncJob((item as SyncJobRecord).id), syncJobState.execute)"
                      >
                        {{ actionLoading === (item as SyncJobRecord).id ? 'Running...' : 'Run' }}
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'messages'"
          :items="[...(inboundState.data.value?.items || []), ...(outboundState.data.value?.items || [])]"
          :search-text-resolver="searchAny"
          search-placeholder="Cari message, reference, idempotency..."
          title="Inbound & Outbound Messages"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Idempotency</th>
                  <th>Processed</th>
                  <th>JSON</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as IntegrationMessageRecord).id">
                  <td>
                    <p class="font-semibold text-app-heading">{{ (item as IntegrationMessageRecord).message_type }}</p>
                    <p class="mt-1 text-sm text-app-body">{{ (item as IntegrationMessageRecord).external_system_name || '-' }}</p>
                  </td>
                  <td><StatusBadge :status="(item as IntegrationMessageRecord).status" /></td>
                  <td>{{ (item as IntegrationMessageRecord).idempotency_key }}</td>
                  <td>{{ (item as IntegrationMessageRecord).processed_at ? formatDateTime((item as IntegrationMessageRecord).processed_at!) : '-' }}</td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      <button class="secondary-button" type="button" @click="showJson('Message Payload', (item as IntegrationMessageRecord).payload_json)">Payload</button>
                      <button class="secondary-button" type="button" @click="showJson('Message Response', (item as IntegrationMessageRecord).response_json)">Response</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          v-if="activeTab === 'sync-logs' && syncLogState.data.value"
          :items="syncLogState.data.value.items"
          :search-text-resolver="searchAny"
          search-placeholder="Cari status, key, message, entity..."
          title="Sync Logs"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Log</th>
                  <th>Direction</th>
                  <th>Status</th>
                  <th>Idempotency</th>
                  <th>JSON</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SyncLogRecord).id">
                  <td>
                    <p class="font-semibold text-app-heading">{{ (item as SyncLogRecord).message_type }}</p>
                    <p class="mt-1 text-sm text-app-body">{{ (item as SyncLogRecord).external_system_name || '-' }}</p>
                  </td>
                  <td><StatusBadge :status="(item as SyncLogRecord).direction" /></td>
                  <td><StatusBadge :status="(item as SyncLogRecord).status" /></td>
                  <td>{{ (item as SyncLogRecord).idempotency_key }}</td>
                  <td>
                    <div class="flex flex-wrap gap-2">
                      <button class="secondary-button" type="button" @click="showJson('Sync Payload', (item as SyncLogRecord).payload_json)">Payload</button>
                      <button class="secondary-button" type="button" @click="showJson('Sync Response', (item as SyncLogRecord).response_json)">Response</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <template v-if="activeTab === 'platform'">
          <DataTableCard
            v-if="backgroundJobState.data.value"
            :items="backgroundJobState.data.value.items"
            :search-text-resolver="searchAny"
            search-placeholder="Cari job platform..."
            title="Background Jobs"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Finished</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as BackgroundJobRecord).id">
                    <td>{{ (item as BackgroundJobRecord).job_name }}</td>
                    <td>{{ (item as BackgroundJobRecord).job_type }}</td>
                    <td><StatusBadge :status="(item as BackgroundJobRecord).status" /></td>
                    <td>{{ (item as BackgroundJobRecord).finished_at ? formatDateTime((item as BackgroundJobRecord).finished_at!) : '-' }}</td>
                    <td>
                      <div class="flex flex-wrap gap-2">
                        <button class="secondary-button" type="button" @click="showJson('Background Job Payload', (item as BackgroundJobRecord).payload_json)">Payload</button>
                        <button class="secondary-button" type="button" @click="showJson('Background Job Result', (item as BackgroundJobRecord).result_json)">Result</button>
                        <button
                          class="primary-button"
                          type="button"
                          @click="runAction((item as BackgroundJobRecord).id, () => runBackgroundJob((item as BackgroundJobRecord).id), backgroundJobState.execute)"
                        >
                          Run
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>

          <DataTableCard
            v-if="outboxState.data.value"
            :items="outboxState.data.value.items"
            :search-text-resolver="searchAny"
            search-placeholder="Cari outbox event..."
            title="Outbox Events"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Aggregate</th>
                    <th>Status</th>
                    <th>Available</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as OutboxEventRecord).id">
                    <td>{{ (item as OutboxEventRecord).event_name }}</td>
                    <td>{{ (item as OutboxEventRecord).aggregate_type }}</td>
                    <td><StatusBadge :status="(item as OutboxEventRecord).status" /></td>
                    <td>{{ (item as OutboxEventRecord).available_at ? formatDateTime((item as OutboxEventRecord).available_at!) : '-' }}</td>
                    <td>
                      <button class="secondary-button" type="button" @click="showJson('Outbox Payload', (item as OutboxEventRecord).payload_json)">JSON</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>

          <div class="glass-panel p-5">
            <button class="primary-button" type="button" @click="runAction('dispatch-outbox', dispatchOutboxEvents, outboxState.execute)">
              Dispatch Pending Outbox
            </button>
          </div>

          <DataTableCard
            v-if="readModelState.data.value"
            :items="readModelState.data.value.items"
            :search-text-resolver="searchAny"
            search-placeholder="Cari read model atau materialized view..."
            title="Read Models & Materialized Views"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Status</th>
                    <th>Rows</th>
                    <th>Refreshed</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as ReadModelRecord).id">
                    <td>
                      <p class="font-semibold text-app-heading">{{ (item as ReadModelRecord).model_name }}</p>
                      <p class="mt-1 text-sm text-app-body">{{ (item as ReadModelRecord).source }}</p>
                    </td>
                    <td><StatusBadge :status="(item as ReadModelRecord).status" /></td>
                    <td>{{ (item as ReadModelRecord).row_count }}</td>
                    <td>{{ (item as ReadModelRecord).refreshed_at ? formatDateTime((item as ReadModelRecord).refreshed_at!) : '-' }}</td>
                    <td>
                      <button class="secondary-button" type="button" @click="runAction((item as ReadModelRecord).id, () => refreshReadModel(item as ReadModelRecord), readModelState.execute)">
                        Refresh
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>
        </template>
      </div>

      <div class="space-y-4">
        <JsonViewerPanel :title="selectedJsonTitle" :value="selectedJson" />
        <div class="glass-panel p-5">
          <p class="eyebrow-text">Ops Notes</p>
          <p class="mt-3 text-sm leading-6 text-app-body">
            Sync log wajib punya idempotency key. Untuk data gagal, inspeksi payload dan response sebelum retry lewat sync job atau background job.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

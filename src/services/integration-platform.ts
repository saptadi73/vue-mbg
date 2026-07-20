import { env } from '@/config/env'
import { apiRequest } from '@/services/http'
import {
  mockBackgroundJobs,
  mockDataMappings,
  mockExternalSystemDetails,
  mockExternalSystems,
  mockInboundMessages,
  mockOutboxEvents,
  mockOutboundMessages,
  mockPlatformHealth,
  mockReadModels,
  mockSyncJobs,
  mockSyncLogs,
  mockWebhookSubscriptions,
} from '@/services/mock-data'
import type {
  BackgroundJobRecord,
  DataMappingRecord,
  ExternalSystemDetailRecord,
  ExternalSystemRecord,
  IntegrationMessageRecord,
  OutboxEventRecord,
  PlatformHealthRecord,
  ReadModelRecord,
  SyncJobRecord,
  SyncLogRecord,
  WebhookSubscriptionRecord,
} from '@/types/domain'

const asList = <T>(data: unknown): T[] => (Array.isArray(data) ? (data as T[]) : [])

const listWithFallback = async <T>(path: string, fallbackItems: T[]) => {
  try {
    const payload = await apiRequest<unknown>(path)
    const items = asList<T>(payload.data)

    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      fallback: true,
    }
  }
}

const readHealthEndpoint = async (endpoint: string, fallback: PlatformHealthRecord) => {
  try {
    const response = await fetch(`${env.apiBaseUrl}${endpoint}`, { headers: { Accept: 'application/json' } })
    const payload = (await response.json().catch(() => ({}))) as { status?: string; message?: string }

    return {
      ...fallback,
      status: response.ok ? payload.status || fallback.status : 'FAILED',
      message: payload.message || (response.ok ? 'Health check sukses.' : `HTTP ${response.status}`),
      checked_at: new Date().toISOString(),
    }
  } catch {
    return {
      ...fallback,
      status: 'UNREACHABLE',
      message: 'Frontend belum bisa menjangkau endpoint health backend.',
      checked_at: new Date().toISOString(),
    }
  }
}

export const getPlatformHealth = async () => {
  const items = await Promise.all(
    mockPlatformHealth.map((item) => readHealthEndpoint(item.endpoint, item)),
  )

  return {
    items,
    total: items.length,
    fallback: items.some((item) => item.status === 'UNREACHABLE'),
  }
}

export const getExternalSystems = () =>
  listWithFallback<ExternalSystemRecord>('/api/v1/integration/external-systems', mockExternalSystems)

export const getExternalSystemById = async (externalSystemId: string) => {
  try {
    const payload = await apiRequest<ExternalSystemDetailRecord>(
      `/api/v1/integration/external-systems/${externalSystemId}`,
    )

    return {
      item:
        payload.data ||
        mockExternalSystemDetails.find((item) => item.external_system.id === externalSystemId) ||
        mockExternalSystemDetails[0],
      fallback: !payload.data,
    }
  } catch {
    return {
      item:
        mockExternalSystemDetails.find((item) => item.external_system.id === externalSystemId) ||
        mockExternalSystemDetails[0],
      fallback: true,
    }
  }
}

export const getWebhookSubscriptions = () =>
  listWithFallback<WebhookSubscriptionRecord>(
    '/api/v1/integration/webhook-subscriptions',
    mockWebhookSubscriptions,
  )

export const getDataMappings = () =>
  listWithFallback<DataMappingRecord>('/api/v1/integration/data-mappings', mockDataMappings)

export const getSyncJobs = () =>
  listWithFallback<SyncJobRecord>('/api/v1/integration/sync-jobs', mockSyncJobs)

export const runSyncJob = async (syncJobId: string) => {
  const response = await apiRequest<unknown>(`/api/v1/integration/sync-jobs/${syncJobId}/run`, {
    method: 'POST',
    body: JSON.stringify({
      message_type: 'manual.sync.run',
      external_reference: `manual-${syncJobId}`,
      idempotency_key: `manual-${syncJobId}-${Date.now()}`,
      destination_url: 'https://partner.example.com/api/manual-sync',
      payload_json: { sync_job_id: syncJobId, requested_from: 'frontend' },
      response_json: { queued: true },
      notes: 'Run sync job manual dari frontend.',
    }),
  })

  return response.data
}

export const getInboundMessages = () =>
  listWithFallback<IntegrationMessageRecord>(
    '/api/v1/integration/inbound-messages',
    mockInboundMessages,
  )

export const getOutboundMessages = () =>
  listWithFallback<IntegrationMessageRecord>(
    '/api/v1/integration/outbound-messages',
    mockOutboundMessages,
  )

export const getSyncLogs = () =>
  listWithFallback<SyncLogRecord>('/api/v1/integration/sync-logs', mockSyncLogs)

export const getBackgroundJobs = () =>
  listWithFallback<BackgroundJobRecord>('/api/v1/platform/background-jobs', mockBackgroundJobs)

export const runBackgroundJob = async (jobId: string) => {
  const response = await apiRequest<unknown>(`/api/v1/platform/background-jobs/${jobId}/run`, {
    method: 'POST',
  })

  return response.data
}

export const getOutboxEvents = () =>
  listWithFallback<OutboxEventRecord>('/api/v1/platform/outbox-events', mockOutboxEvents)

export const dispatchOutboxEvents = async () => {
  const response = await apiRequest<unknown>('/api/v1/platform/outbox-events/dispatch', {
    method: 'POST',
  })

  return response.data
}

export const getReadModels = async () => ({
  items: mockReadModels,
  total: mockReadModels.length,
  fallback: true,
})

export const refreshReadModel = async (record: ReadModelRecord) => {
  const endpoint = record.source.includes('materialized-views')
    ? '/api/v1/platform/materialized-views/delivery-performance/refresh'
    : `${record.source}/refresh`

  const response = await apiRequest<unknown>(endpoint, { method: 'POST' })
  return response.data
}

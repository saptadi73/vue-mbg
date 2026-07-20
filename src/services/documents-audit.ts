import {
  mockAuditEvents,
  mockDocumentDetails,
  mockDocumentLinks,
  mockDocuments,
  mockDocumentVersions,
  mockSppgs,
} from '@/services/mock-data'
import { apiRequest } from '@/services/http'
import type {
  AuditEventRecord,
  CreateDocumentLinkPayload,
  CreateDocumentPayload,
  CreateDocumentVersionPayload,
  DocumentDetailRecord,
  DocumentLinkRecord,
  DocumentRecord,
  DocumentVersionRecord,
} from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

const normalizeDocumentDetail = (data: unknown): DocumentDetailRecord | null => {
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<DocumentDetailRecord>
  if (!candidate.document || !candidate.versions || !candidate.links) return null
  return candidate as DocumentDetailRecord
}

export const getDocuments = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/documents')
    const items = normalizeArray<DocumentRecord>(payload.data)
    return {
      items: items.length ? items : mockDocuments,
      total: payload.meta?.total ?? (items.length || mockDocuments.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockDocuments,
      total: mockDocuments.length,
      fallback: true,
    }
  }
}

export const getDocumentById = async (documentId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/documents/${documentId}`)
    const item = normalizeDocumentDetail(payload.data)
    if (item) {
      return { item, fallback: false }
    }
  } catch {
    // fallback below
  }

  return {
    item: mockDocumentDetails.find((entry) => entry.document.id === documentId) || mockDocumentDetails[0],
    fallback: true,
  }
}

export const createDocument = async (input: CreateDocumentPayload) => {
  try {
    const payload = await apiRequest<DocumentRecord>('/api/v1/documents', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-document-${Date.now()}`,
        tenant_id: input.tenant_id,
        sppg_id: input.sppg_id || null,
        sppg_name: input.sppg_id ? mockSppgs.find((item) => item.id === input.sppg_id)?.name || '-' : null,
        document_type: input.document_type,
        title: input.title,
        description: input.description,
        owner_entity_type: input.owner_entity_type,
        owner_entity_id: input.owner_entity_id,
        tags: input.tags,
        status: 'ACTIVE',
        created_at: '2026-07-20T11:00:00Z',
        updated_at: '2026-07-20T11:00:00Z',
      },
      fallback: true,
    }
  }
}

export const createDocumentVersion = async (documentId: string, input: CreateDocumentVersionPayload) => {
  try {
    const payload = await apiRequest<DocumentVersionRecord>(`/api/v1/documents/${documentId}/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    const nextVersion =
      Math.max(0, ...mockDocumentVersions.filter((item) => item.document_id === documentId).map((item) => item.version_number)) + 1

    return {
      item: {
        id: `mock-document-version-${Date.now()}`,
        document_id: documentId,
        version_number: nextVersion,
        ...input,
      },
      fallback: true,
    }
  }
}

export const createDocumentLink = async (documentId: string, input: CreateDocumentLinkPayload) => {
  try {
    const payload = await apiRequest<DocumentLinkRecord>(`/api/v1/documents/${documentId}/links`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-document-link-${Date.now()}`,
        document_id: documentId,
        linked_entity_type: input.linked_entity_type,
        linked_entity_id: input.linked_entity_id,
        relation_type: input.relation_type,
        created_at: '2026-07-20T11:05:00Z',
      },
      fallback: true,
    }
  }
}

export const getAuditEvents = async (query?: { module_name?: string; event_type?: string }) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/audit/events/', { query })
    const items = normalizeArray<AuditEventRecord>(payload.data)
    const filtered = items.filter(
      (item) =>
        (!query?.module_name || item.module_name === query.module_name) &&
        (!query?.event_type || item.event_type === query.event_type),
    )
    const fallbackItems = mockAuditEvents.filter(
      (item) =>
        (!query?.module_name || item.module_name === query.module_name) &&
        (!query?.event_type || item.event_type === query.event_type),
    )
    return {
      items: filtered.length ? filtered : fallbackItems,
      total: payload.meta?.total ?? (filtered.length || fallbackItems.length),
      fallback: !filtered.length,
    }
  } catch {
    const fallbackItems = mockAuditEvents.filter(
      (item) =>
        (!query?.module_name || item.module_name === query.module_name) &&
        (!query?.event_type || item.event_type === query.event_type),
    )
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      fallback: true,
    }
  }
}

export const getAuditEventById = async (eventId: string) => {
  try {
    const payload = await apiRequest<AuditEventRecord>(`/api/v1/audit/events/${eventId}`)
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: mockAuditEvents.find((item) => item.id === eventId) || mockAuditEvents[0],
      fallback: true,
    }
  }
}

import { apiRequest } from '@/services/http'
import { mockSppgs } from '@/services/mock-data'
import type { CreateSppgPayload, SppgRecord } from '@/types/domain'

const readDrafts = (): Record<string, Partial<SppgRecord>> => {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(window.localStorage.getItem('mbg-sppg-drafts') || '{}') as Record<
      string,
      Partial<SppgRecord>
    >
  } catch {
    return {}
  }
}

const writeDrafts = (drafts: Record<string, Partial<SppgRecord>>) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('mbg-sppg-drafts', JSON.stringify(drafts))
}

const normalizeSppgList = (data: unknown): SppgRecord[] => {
  if (!Array.isArray(data)) return []
  return data as SppgRecord[]
}

export const getSppgs = async (tenantId?: string) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/sppg/')
    const items = normalizeSppgList(payload.data)
    const filtered = tenantId ? items.filter((item) => item.tenant_id === tenantId) : items

    return {
      items: filtered.length ? filtered : mockSppgs.filter((item) => !tenantId || item.tenant_id === tenantId),
      total:
        payload.meta?.total ??
        (filtered.length || mockSppgs.filter((item) => !tenantId || item.tenant_id === tenantId).length),
      fallback: !filtered.length,
    }
  } catch {
    const fallbackItems = mockSppgs.filter((item) => !tenantId || item.tenant_id === tenantId)
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      fallback: true,
    }
  }
}

export const createSppg = async (input: CreateSppgPayload) => {
  const response = await apiRequest<SppgRecord>('/api/v1/sppg/', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return response.data
}

export const getSppgById = async (sppgId: string) => {
  const drafts = readDrafts()
  try {
    const payload = await apiRequest<SppgRecord>(`/api/v1/sppg/${sppgId}`)
    return {
      item: {
        ...payload.data,
        ...(drafts[sppgId] || {}),
      } as SppgRecord,
      fallback: false,
      draft: Boolean(drafts[sppgId]),
    }
  } catch {
    const fallback = mockSppgs.find((item) => item.id === sppgId) || mockSppgs[0]
    return {
      item: {
        ...fallback,
        ...(drafts[sppgId] || {}),
      } as SppgRecord,
      fallback: true,
      draft: Boolean(drafts[sppgId]),
    }
  }
}

export const saveSppgDraft = async (sppgId: string, input: Partial<SppgRecord>) => {
  const drafts = readDrafts()
  drafts[sppgId] = {
    ...(drafts[sppgId] || {}),
    ...input,
  }
  writeDrafts(drafts)
  return drafts[sppgId]
}

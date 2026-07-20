import { apiRequest } from '@/services/http'
import { mockTenants } from '@/services/mock-data'
import type { CreateTenantPayload, TenantRecord } from '@/types/domain'

const normalizeTenantList = (data: unknown): TenantRecord[] => {
  if (!Array.isArray(data)) return []
  return data as TenantRecord[]
}

export const getTenants = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/tenants/')
    const items = normalizeTenantList(payload.data)

    return {
      items: items.length ? items : mockTenants,
      total: payload.meta?.total ?? (items.length || mockTenants.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockTenants,
      total: mockTenants.length,
      fallback: true,
    }
  }
}

export const createTenant = async (input: CreateTenantPayload) => {
  const response = await apiRequest<TenantRecord>('/api/v1/tenants/', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  return response.data
}

export const getTenantById = async (tenantId: string) => {
  try {
    const payload = await apiRequest<TenantRecord>(`/api/v1/tenants/${tenantId}`)
    return {
      item: payload.data,
      fallback: false,
    }
  } catch {
    const fallback = mockTenants.find((tenant) => tenant.id === tenantId) || mockTenants[0]
    return {
      item: fallback,
      fallback: true,
    }
  }
}

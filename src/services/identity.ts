import { env } from '@/config/env'
import { apiRequest } from '@/services/http'
import { mockUsers } from '@/services/mock-data'
import type { CreateUserPayload, UserRecord } from '@/types/domain'

const normalizeUserList = (data: unknown): UserRecord[] => {
  if (!Array.isArray(data)) return []
  return data as UserRecord[]
}

export const getUsers = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/identity/users')
    const items = normalizeUserList(payload.data)

    return {
      items: items.length ? items : mockUsers,
      total: payload.meta?.total ?? (items.length || mockUsers.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockUsers,
      total: mockUsers.length,
      fallback: true,
    }
  }
}

export const createUser = async (input: CreateUserPayload | Omit<CreateUserPayload, 'tenant_id'>) => {
  const payload: CreateUserPayload = {
    ...input,
    tenant_id: 'tenant_id' in input ? input.tenant_id : env.devTenantId,
  }

  const response = await apiRequest<UserRecord>('/api/v1/identity/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

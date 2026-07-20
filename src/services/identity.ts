import { env } from '@/config/env'
import { apiRequest } from '@/services/http'
import { mockUsers } from '@/services/mock-data'
import type { CreateUserPayload, UpdateUserPayload, UserRecord, UserSppgAccessRecord } from '@/types/domain'

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

export const getUserById = async (userId: string) => {
  try {
    const payload = await apiRequest<UserRecord>(`/api/v1/identity/users/${userId}`)
    return {
      item: payload.data || mockUsers.find((item) => item.id === userId) || mockUsers[0],
      fallback: !payload.data,
    }
  } catch {
    return {
      item: mockUsers.find((item) => item.id === userId) || mockUsers[0],
      fallback: true,
    }
  }
}

export const updateUser = async (userId: string, input: UpdateUserPayload) => {
  const response = await apiRequest<UserRecord>(`/api/v1/identity/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  return response.data
}

export const getUserSppgAccess = async (userId: string) => {
  const fallbackUser =
    mockUsers.find((item) => item.id === userId) || {
      id: userId,
      full_name: 'Fallback User',
      email: 'fallback@mbg.local',
      role_names: ['viewer'],
      is_active: true,
      active_sppg_id: env.devSppgId,
      accessible_sppg_ids: [env.devSppgId],
    }

  try {
    const payload = await apiRequest<UserSppgAccessRecord>(`/api/v1/identity/users/${userId}/sppg-access`)
    return {
      item:
        payload.data || {
          user_id: fallbackUser.id,
          tenant_id: env.devTenantId,
          active_sppg_id: fallbackUser.active_sppg_id || env.devSppgId,
          accessible_sppg_ids: fallbackUser.accessible_sppg_ids || [],
        },
      fallback: !payload.data,
    }
  } catch {
    return {
      item: {
        user_id: fallbackUser.id,
        tenant_id: env.devTenantId,
        active_sppg_id: fallbackUser.active_sppg_id || env.devSppgId,
        accessible_sppg_ids: fallbackUser.accessible_sppg_ids || [],
      },
      fallback: true,
    }
  }
}

export const updateUserSppgAccess = async (
  userId: string,
  input: Pick<UserSppgAccessRecord, 'accessible_sppg_ids' | 'active_sppg_id'>,
) => {
  const response = await apiRequest<UserSppgAccessRecord>(`/api/v1/identity/users/${userId}/sppg-access`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  return response.data
}

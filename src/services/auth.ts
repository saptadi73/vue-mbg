import { env } from '@/config/env'
import { apiRequest } from '@/services/http'
import type { IdentityMeResponse } from '@/types/domain'

interface LoginResponse {
  access_token: string
  token_type?: string
}

export const loginWithPassword = async (email: string, password: string) => {
  const body = new URLSearchParams({
    username: email,
    password,
  })

  let response: Response

  try {
    response = await fetch(`${env.apiBaseUrl}/api/v1/identity/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request login melebihi batas waktu. Coba lagi.')
    }

    throw new Error('Frontend belum bisa menjangkau backend login. Restart dev server agar proxy aktif.')
  }

  const payload = (await response.json().catch(() => null)) as { data?: LoginResponse; message?: string; code?: string } | null

  if (!response.ok || !payload?.data?.access_token) {
    throw new Error(payload?.message || 'Login gagal. Periksa email dan password.')
  }

  return payload.data.access_token
}

export const getCurrentProfile = async () => {
  const response = await apiRequest<IdentityMeResponse>('/api/v1/identity/me')
  return response.data
}

export const switchActiveSppg = async (sppgId: string) => {
  const response = await apiRequest<{ access_token?: string; active_sppg_id?: string; accessible_sppg_ids?: string[] }>(
    '/api/v1/identity/switch-active-sppg',
    {
      method: 'POST',
      body: JSON.stringify({ sppg_id: sppgId }),
    },
  )

  return response.data
}

import { env } from '@/config/env'
import type { ApiEnvelope } from '@/types/api'

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions extends RequestInit {
  query?: Record<string, string | number | boolean | undefined>
  headers?: HeadersInit
}

const buildQuery = (query?: RequestOptions['query']) => {
  if (!query) return ''

  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value))
    }
  })

  const serialized = params.toString()
  return serialized ? `?${serialized}` : ''
}

export const apiRequest = async <T>(
  path: string,
  { query, headers, ...init }: RequestOptions = {},
): Promise<ApiEnvelope<T>> => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), env.apiTimeout)

  try {
    const response = await fetch(`${env.apiBaseUrl}${path}${buildQuery(query)}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Tenant-ID': env.devTenantId,
        'X-SPPG-ID': env.devSppgId,
        ...headers,
      },
      signal: controller.signal,
    })

    const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null

    if (!response.ok) {
      throw new ApiError(
        payload?.message || 'Gagal menghubungi backend MBG.',
        response.status,
        payload?.code,
      )
    }

    if (!payload) {
      throw new ApiError('Response backend kosong.', response.status)
    }

    return payload
  } finally {
    clearTimeout(timeout)
  }
}

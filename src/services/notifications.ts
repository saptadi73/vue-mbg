import { apiRequest } from '@/services/http'
import { mockNotificationInbox } from '@/services/mock-data'
import type { NotificationInboxRecord } from '@/types/domain'

const normalizeInbox = (data: unknown): NotificationInboxRecord[] => {
  if (!Array.isArray(data)) return []
  return data as NotificationInboxRecord[]
}

export const getNotificationInbox = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/notifications/inbox')
    const items = normalizeInbox(payload.data)

    return {
      items: items.length ? items : mockNotificationInbox,
      total: payload.meta?.total ?? (items.length || mockNotificationInbox.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockNotificationInbox,
      total: mockNotificationInbox.length,
      fallback: true,
    }
  }
}

export const markNotificationRead = async (recipientId: string) => {
  const response = await apiRequest<NotificationInboxRecord>(
    `/api/v1/notifications/inbox/${recipientId}/mark-read`,
    {
      method: 'POST',
    },
  )

  return response.data
}

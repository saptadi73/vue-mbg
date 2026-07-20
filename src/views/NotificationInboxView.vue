<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getNotificationInbox, markNotificationRead } from '@/services/notifications'
import type { NotificationInboxRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getNotificationInbox)
const selectedReadState = ref('ALL')
const actionMessage = ref('')
const actionError = ref('')
const markingId = ref('')

const filteredItems = computed(() => {
  const items = data.value?.items || []
  if (selectedReadState.value === 'ALL') return items
  return items.filter((item) => (selectedReadState.value === 'UNREAD' ? !item.recipient.read_at : item.recipient.read_at))
})

const unreadCount = computed(() => (data.value?.items || []).filter((item) => !item.recipient.read_at).length)

const notificationSearchText = (item: unknown) => {
  const row = item as NotificationInboxRecord
  return [
    row.notification.title,
    row.notification.message,
    row.notification.priority,
    row.notification.source_module,
    row.recipient.delivery_status,
  ]
    .filter(Boolean)
    .join(' ')
}

const handleMarkRead = async (recipientId: string) => {
  markingId.value = recipientId
  actionMessage.value = ''
  actionError.value = ''

  try {
    await markNotificationRead(recipientId)
    actionMessage.value = 'Notifikasi berhasil ditandai sudah dibaca.'
    await execute()
  } catch (error) {
    actionError.value =
      error instanceof Error ? error.message : 'Gagal menandai notifikasi. Periksa koneksi backend.'
  } finally {
    markingId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Notification Inbox"
      subtitle="Inbox notifikasi user aktif untuk approval, risiko operasional, procurement, dan alert lintas modul."
      :badges="['GET /notifications/inbox', 'Mark Read', 'In-App']"
    />

    <section class="grid gap-4 md:grid-cols-3">
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Unread</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ unreadCount }}</p>
        <p class="mt-2 text-sm text-app-body">Notifikasi belum dibaca.</p>
      </div>
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Total Inbox</p>
        <p class="mt-2 font-display text-3xl text-app-heading">{{ data?.items.length || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Item dari backend atau fallback mock.</p>
      </div>
      <div class="glass-panel p-5">
        <p class="eyebrow-text">Action Endpoint</p>
        <p class="mt-2 text-sm font-semibold text-app-heading">POST mark-read</p>
        <p class="mt-2 text-sm text-app-body">Aksi memakai recipient id, bukan notification id.</p>
      </div>
    </section>

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <div class="toolbar-input flex items-center text-app-muted">Pencarian tersedia di dalam tabel</div>
        <select v-model="selectedReadState" class="toolbar-input">
          <option value="ALL">Semua Inbox</option>
          <option value="UNREAD">Belum Dibaca</option>
          <option value="READ">Sudah Dibaca</option>
        </select>
        <button class="secondary-button" type="button" @click="execute">Refresh</button>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Backend inbox belum mengembalikan data siap pakai, jadi halaman memakai fallback mock.
      </p>
      <p v-if="actionMessage" class="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
        {{ actionMessage }}
      </p>
      <p v-if="actionError" class="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
        {{ actionError }}
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat inbox notifikasi...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredItems"
      :search-text-resolver="notificationSearchText"
      search-placeholder="Cari judul, pesan, priority, module, atau status..."
      title="Inbox"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Notifikasi</th>
              <th>Priority</th>
              <th>Module</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as NotificationInboxRecord).id">
              <td class="max-w-lg">
                <p class="font-semibold text-app-heading">{{ (item as NotificationInboxRecord).notification.title }}</p>
                <p class="mt-1 text-sm text-app-body">{{ (item as NotificationInboxRecord).notification.message }}</p>
              </td>
              <td><StatusBadge :status="(item as NotificationInboxRecord).notification.priority" /></td>
              <td>{{ (item as NotificationInboxRecord).notification.source_module || '-' }}</td>
              <td>
                <StatusBadge :status="(item as NotificationInboxRecord).recipient.read_at ? 'APPROVED' : 'PENDING'" />
              </td>
              <td>
                {{
                  (item as NotificationInboxRecord).notification.created_at
                    ? formatDateTime((item as NotificationInboxRecord).notification.created_at!)
                    : '-'
                }}
              </td>
              <td>
                <button
                  class="secondary-button disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="Boolean((item as NotificationInboxRecord).recipient.read_at) || markingId === (item as NotificationInboxRecord).recipient.id"
                  type="button"
                  @click="handleMarkRead((item as NotificationInboxRecord).recipient.id)"
                >
                  {{ markingId === (item as NotificationInboxRecord).recipient.id ? 'Proses...' : 'Mark Read' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

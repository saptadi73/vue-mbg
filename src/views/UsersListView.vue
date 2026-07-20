<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getUsers } from '@/services/identity'
import type { UserRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getUsers)
const { canManageUsers } = useAccess()
const selectedStatus = ref('ALL')

const filteredUsers = computed(() => {
  const items = data.value?.items || []
  if (selectedStatus.value === 'ALL') return items
  return items.filter((item) => (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active))
})

const userSearchText = (item: unknown) => {
  const row = item as UserRecord
  return [row.full_name, row.email, row.role_names.join(' '), row.active_sppg_id, row.accessible_sppg_ids?.join(' ')].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Users"
      subtitle="Kelola user yayasan, role, dan scope akses SPPG sesuai pola admin di referensi backend MBG."
      :badges="['Identity', 'Admin Yayasan', 'SPPG Access']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <div class="toolbar-input flex items-center text-app-muted">Pencarian tersedia di dalam tabel</div>
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <RouterLink v-if="canManageUsers" class="primary-button" to="/users/create">Registrasi User</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Backend list user belum mengembalikan data yang bisa dipakai, jadi halaman sedang memakai mock data aman untuk pengembangan.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat user yayasan...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredUsers"
      :search-text-resolver="userSearchText"
      search-placeholder="Cari nama, email, role, atau SPPG..."
      title="Daftar Users"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>SPPG Aktif</th>
              <th>Akses SPPG</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in items" :key="(user as UserRecord).id">
              <td>{{ (user as UserRecord).full_name }}</td>
              <td>{{ (user as UserRecord).email }}</td>
              <td>{{ (user as UserRecord).role_names.join(', ') }}</td>
              <td><StatusBadge :status="(user as UserRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ (user as UserRecord).active_sppg_id || '-' }}</td>
              <td>{{ (user as UserRecord).accessible_sppg_ids?.join(', ') || '-' }}</td>
              <td>{{ (user as UserRecord).created_at ? formatDateTime((user as UserRecord).created_at!) : '-' }}</td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <RouterLink class="secondary-button" :to="`/users/${(user as UserRecord).id}`">Detail</RouterLink>
                  <RouterLink v-if="canManageUsers" class="secondary-button" :to="`/users/${(user as UserRecord).id}/edit`">Edit</RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

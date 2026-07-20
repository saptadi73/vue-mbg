<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getUsers } from '@/services/identity'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getUsers)
const { canManageUsers } = useAccess()
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Users"
      subtitle="Kelola user tenant, role, dan scope akses SPPG sesuai pola admin di referensi backend MBG."
      :badges="['Identity', 'Tenant Admin', 'SPPG Access']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <input class="toolbar-input" placeholder="Cari nama, email, atau role" />
        <select class="toolbar-input">
          <option>Semua Status</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
        <RouterLink v-if="canManageUsers" class="primary-button" to="/users/create">Registrasi User</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Backend list user belum mengembalikan data yang bisa dipakai, jadi halaman sedang memakai mock data aman untuk pengembangan.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat user tenant...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <section v-else-if="data" class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
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
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in data.items" :key="user.id">
              <td>{{ user.full_name }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role_names.join(', ') }}</td>
              <td><StatusBadge :status="user.is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ user.active_sppg_id || '-' }}</td>
              <td>{{ user.accessible_sppg_ids?.join(', ') || '-' }}</td>
              <td>{{ user.created_at ? formatDateTime(user.created_at) : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

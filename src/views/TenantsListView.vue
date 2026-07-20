<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getTenants } from '@/services/tenants'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getTenants)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Tenants"
      subtitle="Kelola entitas tenant MBG untuk onboarding wilayah, organisasi, dan scope operasional baru."
      :badges="['Master Data', 'Tenant Admin', 'Platform Setup']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <input class="toolbar-input" placeholder="Cari nama tenant atau code" />
        <select class="toolbar-input">
          <option>Semua Status</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
        <RouterLink class="primary-button" to="/tenants/create">Daftarkan Tenant</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Daftar tenant sedang memakai mock data pengembangan karena backend belum mengembalikan data list siap pakai.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat data tenant...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <section v-else-if="data" class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nama Tenant</th>
              <th>Code</th>
              <th>Deskripsi</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tenant in data.items" :key="tenant.id">
              <td>{{ tenant.name }}</td>
              <td>{{ tenant.code }}</td>
              <td class="max-w-md text-app-body">{{ tenant.description || '-' }}</td>
              <td><StatusBadge :status="tenant.is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ tenant.created_at ? formatDateTime(tenant.created_at) : '-' }}</td>
              <td>
                <RouterLink class="secondary-button" :to="`/tenants/${tenant.id}`">Detail</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

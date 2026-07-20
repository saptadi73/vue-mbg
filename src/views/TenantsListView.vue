<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getTenants } from '@/services/tenants'
import type { TenantRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getTenants)
const { canManageTenants } = useAccess()
const selectedStatus = ref('ALL')

const filteredTenants = computed(() => {
  const items = data.value?.items || []
  if (selectedStatus.value === 'ALL') return items
  return items.filter((item) => (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active))
})

const tenantSearchText = (item: unknown) => {
  const row = item as TenantRecord
  return [row.name, row.code, row.description].filter(Boolean).join(' ')
}
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
        <div class="toolbar-input flex items-center text-app-muted">Pencarian tersedia di dalam tabel</div>
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <RouterLink v-if="canManageTenants" class="primary-button" to="/tenants/create">Daftarkan Tenant</RouterLink>
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
    <DataTableCard
      v-else-if="data"
      :items="filteredTenants"
      :search-text-resolver="tenantSearchText"
      search-placeholder="Cari nama tenant, code, atau deskripsi..."
      title="Daftar Tenants"
    >
      <template #table="{ items }">
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
            <tr v-for="tenant in items" :key="(tenant as TenantRecord).id">
              <td>{{ (tenant as TenantRecord).name }}</td>
              <td>{{ (tenant as TenantRecord).code }}</td>
              <td class="max-w-md text-app-body">{{ (tenant as TenantRecord).description || '-' }}</td>
              <td><StatusBadge :status="(tenant as TenantRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ (tenant as TenantRecord).created_at ? formatDateTime((tenant as TenantRecord).created_at!) : '-' }}</td>
              <td>
                <RouterLink class="secondary-button" :to="`/tenants/${(tenant as TenantRecord).id}`">Detail</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

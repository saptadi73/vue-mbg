<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSppgs } from '@/services/sppg'
import type { SppgRecord } from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => {
  const value = route.query.tenantId
  return typeof value === 'string' ? value : ''
})

const { data, loading, error, execute } = useAsyncState(() => getSppgs(tenantId.value || undefined))
const { canManageSppg } = useAccess()
const selectedStatus = ref('ALL')

const filteredSppgs = computed(() => {
  const items = data.value?.items || []
  if (selectedStatus.value === 'ALL') return items
  return items.filter((item) => (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active))
})

const sppgSearchText = (item: unknown) => {
  const row = item as SppgRecord
  return [row.code, row.name, row.address].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="SPPG"
      subtitle="Daftar dapur operasional per tenant untuk mendukung coverage, distribusi, dan workflow dapur harian."
      :badges="['SPPG Registry', tenantId || 'All Tenants', 'PostGIS Ready']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <div class="toolbar-input flex items-center text-app-muted">Pencarian tersedia di dalam tabel</div>
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <RouterLink v-if="canManageSppg" class="primary-button" :to="tenantId ? `/sppg/create?tenantId=${tenantId}` : '/sppg/create'">
          Daftarkan SPPG
        </RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Daftar SPPG sedang memakai mock data pengembangan karena backend belum mengembalikan list yang siap dipakai.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat daftar SPPG...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredSppgs"
      :search-text-resolver="sppgSearchText"
      search-placeholder="Cari code, nama, atau alamat SPPG..."
      title="Daftar SPPG"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nama</th>
              <th>Alamat</th>
              <th>Radius</th>
              <th>Status</th>
              <th>Dibuat</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as SppgRecord).id">
              <td>{{ (item as SppgRecord).code }}</td>
              <td>{{ (item as SppgRecord).name }}</td>
              <td class="max-w-md text-app-body">{{ (item as SppgRecord).address }}</td>
              <td>{{ formatNumber((item as SppgRecord).radius_km) }} km</td>
              <td><StatusBadge :status="(item as SppgRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ (item as SppgRecord).created_at ? formatDateTime((item as SppgRecord).created_at!) : '-' }}</td>
              <td><RouterLink class="secondary-button" :to="`/sppg/${(item as SppgRecord).id}`">Detail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

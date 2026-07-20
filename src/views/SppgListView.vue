<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSppgs } from '@/services/sppg'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => {
  const value = route.query.tenantId
  return typeof value === 'string' ? value : ''
})

const { data, loading, error, execute } = useAsyncState(() => getSppgs(tenantId.value || undefined))
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
        <input class="toolbar-input" placeholder="Cari nama atau code SPPG" />
        <select class="toolbar-input">
          <option>Semua Status</option>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
        <RouterLink class="primary-button" :to="tenantId ? `/sppg/create?tenantId=${tenantId}` : '/sppg/create'">
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
    <section v-else-if="data" class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
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
            <tr v-for="item in data.items" :key="item.id">
              <td>{{ item.code }}</td>
              <td>{{ item.name }}</td>
              <td class="max-w-md text-app-body">{{ item.address }}</td>
              <td>{{ formatNumber(item.radius_km) }} km</td>
              <td><StatusBadge :status="item.is_active ? 'APPROVED' : 'REJECTED'" /></td>
              <td>{{ item.created_at ? formatDateTime(item.created_at) : '-' }}</td>
              <td><RouterLink class="secondary-button" :to="`/sppg/${item.id}`">Detail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

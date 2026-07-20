<script setup lang="ts">
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkforcePositions } from '@/services/workforce'
import type { WorkforcePositionRecord } from '@/types/domain'
import { formatCurrency } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getWorkforcePositions)

const positionSearchText = (item: unknown) => {
  const row = item as WorkforcePositionRecord
  return [row.code, row.name, row.department_name, row.employment_type].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workforce Positions"
      subtitle="Master posisi kerja untuk operasi dapur, distribusi, dan quality. Halaman ini menjadi fondasi employee dan labor planning."
      :badges="['Workforce', 'Position List', 'Master Data']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <div class="toolbar-input flex items-center text-app-muted">Cari posisi tersedia di dalam tabel</div>
        <RouterLink class="secondary-button" to="/workforce/employees">Lihat Employees</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Backend positions belum mengembalikan data siap pakai, jadi halaman memakai mock workforce untuk pengembangan.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat master posisi kerja...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="data.items"
      :search-text-resolver="positionSearchText"
      search-placeholder="Cari code, posisi, department, atau tipe kerja..."
      title="Daftar Posisi Kerja"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Posisi</th>
              <th>Department</th>
              <th>Tipe Kerja</th>
              <th>Default Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="position in items" :key="(position as WorkforcePositionRecord).id">
              <td>{{ (position as WorkforcePositionRecord).code }}</td>
              <td>{{ (position as WorkforcePositionRecord).name }}</td>
              <td>{{ (position as WorkforcePositionRecord).department_name || '-' }}</td>
              <td>{{ (position as WorkforcePositionRecord).employment_type || '-' }}</td>
              <td>{{ formatCurrency((position as WorkforcePositionRecord).default_daily_rate || 0) }}</td>
              <td>
                <StatusBadge :status="(position as WorkforcePositionRecord).is_active ? 'APPROVED' : 'REJECTED'" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

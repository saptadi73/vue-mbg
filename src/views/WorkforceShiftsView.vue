<script setup lang="ts">
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkforceShifts } from '@/services/workforce'
import type { WorkforceShiftRecord } from '@/types/domain'

const { data, loading, error, execute } = useAsyncState(getWorkforceShifts)

const shiftSearchText = (item: unknown) => {
  const row = item as WorkforceShiftRecord
  return [row.shift_code, row.shift_name, row.sppg_name, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workforce Shifts"
      subtitle="Daftar shift kerja lintas SPPG untuk membantu sinkronisasi produksi, packaging, QC, dan dispatch."
      :badges="['Workforce', 'Shift List', 'Operations']"
    />

    <div v-if="loading" class="loading-panel">Memuat shift kerja...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="data.items"
      :search-text-resolver="shiftSearchText"
      search-placeholder="Cari shift code, nama shift, SPPG, atau status..."
      title="Daftar Shift Kerja"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Shift</th>
              <th>SPPG</th>
              <th>Jam Mulai</th>
              <th>Jam Selesai</th>
              <th>Assigned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="shift in items" :key="(shift as WorkforceShiftRecord).id">
              <td>
                {{ (shift as WorkforceShiftRecord).shift_name }}
                <div class="text-xs text-app-muted">{{ (shift as WorkforceShiftRecord).shift_code }}</div>
              </td>
              <td>{{ (shift as WorkforceShiftRecord).sppg_name || '-' }}</td>
              <td>{{ (shift as WorkforceShiftRecord).start_time }}</td>
              <td>{{ (shift as WorkforceShiftRecord).end_time }}</td>
              <td>{{ (shift as WorkforceShiftRecord).assigned_employee_count || 0 }}</td>
              <td><StatusBadge :status="(shift as WorkforceShiftRecord).status" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

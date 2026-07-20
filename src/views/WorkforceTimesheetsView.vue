<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkforceTimesheets } from '@/services/workforce'
import type { WorkforceTimesheetRecord } from '@/types/domain'
import { formatDate } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getWorkforceTimesheets)
const selectedSppg = ref('ALL')
const selectedPeriod = ref('')

const filteredItems = computed(() => {
  const items = data.value?.items || []
  return items.filter((item) => {
    const sppgMatch = selectedSppg.value === 'ALL' || item.sppg_id === selectedSppg.value
    const periodMatch =
      !selectedPeriod.value ||
      (item.period_start <= selectedPeriod.value && item.period_end >= selectedPeriod.value)
    return sppgMatch && periodMatch
  })
})

const sppgOptions = computed(() =>
  Array.from(new Map((data.value?.items || []).map((item) => [item.sppg_id || '', item.sppg_name || '-'])).entries()),
)

const timesheetSearchText = (item: unknown) => {
  const row = item as WorkforceTimesheetRecord
  return [row.employee_name, row.sppg_name, row.approved_by, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workforce Timesheets"
      subtitle="Timesheet periodik untuk validasi jam kerja, overtime, dan kesiapan labor cost lintas SPPG."
      :badges="['Workforce', 'Timesheet List', 'Finance Ready']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <select v-model="selectedSppg" class="toolbar-input">
          <option value="ALL">Semua SPPG</option>
          <option v-for="[id, name] in sppgOptions" :key="id || name" :value="id">
            {{ name }}
          </option>
        </select>
        <input v-model="selectedPeriod" class="toolbar-input" type="date" />
        <button class="secondary-button" type="button" @click="selectedPeriod = ''">Reset Periode</button>
      </div>
    </section>

    <div v-if="loading" class="loading-panel">Memuat timesheet...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredItems"
      :search-text-resolver="timesheetSearchText"
      search-placeholder="Cari employee, SPPG, approver, atau status..."
      title="Daftar Timesheet"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>SPPG</th>
              <th>Periode</th>
              <th>Hari</th>
              <th>Total Jam</th>
              <th>Overtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="timesheet in items" :key="(timesheet as WorkforceTimesheetRecord).id">
              <td>
                {{ (timesheet as WorkforceTimesheetRecord).employee_name }}
                <div class="text-xs text-app-muted">
                  Approved by {{ (timesheet as WorkforceTimesheetRecord).approved_by || '-' }}
                </div>
              </td>
              <td>{{ (timesheet as WorkforceTimesheetRecord).sppg_name || '-' }}</td>
              <td>
                {{ formatDate((timesheet as WorkforceTimesheetRecord).period_start) }} -
                {{ formatDate((timesheet as WorkforceTimesheetRecord).period_end) }}
              </td>
              <td>{{ (timesheet as WorkforceTimesheetRecord).total_days }}</td>
              <td>{{ (timesheet as WorkforceTimesheetRecord).total_hours }}</td>
              <td>{{ (timesheet as WorkforceTimesheetRecord).overtime_hours || 0 }}</td>
              <td><StatusBadge :status="(timesheet as WorkforceTimesheetRecord).status" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

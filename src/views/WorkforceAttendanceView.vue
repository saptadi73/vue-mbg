<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkforceAttendance } from '@/services/workforce'
import type { WorkforceAttendanceRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getWorkforceAttendance)
const selectedSppg = ref('ALL')
const selectedDate = ref('')

const filteredItems = computed(() => {
  const items = data.value?.items || []
  return items.filter((item) => {
    const sppgMatch = selectedSppg.value === 'ALL' || item.sppg_id === selectedSppg.value
    const dateMatch = !selectedDate.value || item.attendance_date === selectedDate.value
    return sppgMatch && dateMatch
  })
})

const sppgOptions = computed(() =>
  Array.from(new Map((data.value?.items || []).map((item) => [item.sppg_id || '', item.sppg_name || '-'])).entries()),
)

const attendanceSearchText = (item: unknown) => {
  const row = item as WorkforceAttendanceRecord
  return [row.employee_name, row.sppg_name, row.shift_name, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workforce Attendance"
      subtitle="Monitoring attendance harian per SPPG untuk memastikan kapasitas operasional dan validitas jam kerja."
      :badges="['Workforce', 'Attendance List', 'Daily Ops']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <select v-model="selectedSppg" class="toolbar-input">
          <option value="ALL">Semua SPPG</option>
          <option v-for="[id, name] in sppgOptions" :key="id || name" :value="id">
            {{ name }}
          </option>
        </select>
        <input v-model="selectedDate" class="toolbar-input" type="date" />
        <button class="secondary-button" type="button" @click="selectedDate = ''">Reset Tanggal</button>
      </div>
    </section>

    <div v-if="loading" class="loading-panel">Memuat attendance...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredItems"
      :search-text-resolver="attendanceSearchText"
      search-placeholder="Cari nama employee, SPPG, shift, atau status..."
      title="Daftar Attendance"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>SPPG</th>
              <th>Shift</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Jam Kerja</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="attendance in items" :key="(attendance as WorkforceAttendanceRecord).id">
              <td>{{ (attendance as WorkforceAttendanceRecord).employee_name }}</td>
              <td>{{ (attendance as WorkforceAttendanceRecord).sppg_name || '-' }}</td>
              <td>{{ (attendance as WorkforceAttendanceRecord).shift_name || '-' }}</td>
              <td>
                {{
                  (attendance as WorkforceAttendanceRecord).check_in_at
                    ? formatDateTime((attendance as WorkforceAttendanceRecord).check_in_at!)
                    : '-'
                }}
              </td>
              <td>
                {{
                  (attendance as WorkforceAttendanceRecord).check_out_at
                    ? formatDateTime((attendance as WorkforceAttendanceRecord).check_out_at!)
                    : '-'
                }}
              </td>
              <td>{{ (attendance as WorkforceAttendanceRecord).worked_hours || 0 }}</td>
              <td><StatusBadge :status="(attendance as WorkforceAttendanceRecord).status" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

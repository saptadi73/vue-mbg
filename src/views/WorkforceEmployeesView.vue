<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkforceEmployees } from '@/services/workforce'
import type { WorkforceEmployeeRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getWorkforceEmployees)
const selectedStatus = ref('ALL')
const selectedEmploymentType = ref('ALL')

const filteredItems = computed(() => {
  const items = data.value?.items || []

  return items.filter((item) => {
    const statusMatch =
      selectedStatus.value === 'ALL' ||
      (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active)
    const typeMatch =
      selectedEmploymentType.value === 'ALL' || item.employment_type === selectedEmploymentType.value
    return statusMatch && typeMatch
  })
})

const employeeSearchText = (item: unknown) => {
  const row = item as WorkforceEmployeeRecord
  return [
    row.employee_code,
    row.full_name,
    row.position_name,
    row.employment_type,
    row.active_assignment_sppg_name,
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workforce Employees"
      subtitle="Kelola tenaga kerja aktif per yayasan dan SPPG, termasuk status kerja, posisi, dan penempatan operasional."
      :badges="['Workforce', 'Employee List', 'Assignment Ready']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
        <select v-model="selectedEmploymentType" class="toolbar-input">
          <option value="ALL">Semua Tipe Kerja</option>
          <option value="DAILY">DAILY</option>
          <option value="MONTHLY">MONTHLY</option>
        </select>
        <RouterLink class="primary-button" to="/workforce/employees/create">Tambah Employee</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        Daftar employee sedang memakai fallback mock karena backend workforce belum mengembalikan list yang siap dipakai frontend.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat daftar employee...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredItems"
      :search-text-resolver="employeeSearchText"
      search-placeholder="Cari code, nama, posisi, tipe kerja, atau SPPG..."
      title="Daftar Employee"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Posisi</th>
              <th>Tipe</th>
              <th>Join Date</th>
              <th>Daily Rate</th>
              <th>SPPG Aktif</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in items" :key="(employee as WorkforceEmployeeRecord).id">
              <td>
                <RouterLink
                  class="font-medium text-app-heading transition hover:text-[var(--color-brand-strong)]"
                  :to="`/workforce/employees/${(employee as WorkforceEmployeeRecord).id}`"
                >
                  {{ (employee as WorkforceEmployeeRecord).full_name }}
                </RouterLink>
                <div class="text-xs text-app-muted">{{ (employee as WorkforceEmployeeRecord).employee_code }}</div>
              </td>
              <td>{{ (employee as WorkforceEmployeeRecord).position_name || '-' }}</td>
              <td>{{ (employee as WorkforceEmployeeRecord).employment_type }}</td>
              <td>{{ formatDate((employee as WorkforceEmployeeRecord).join_date) }}</td>
              <td>{{ formatCurrency((employee as WorkforceEmployeeRecord).daily_rate || 0) }}</td>
              <td>{{ (employee as WorkforceEmployeeRecord).active_assignment_sppg_name || '-' }}</td>
              <td>
                <StatusBadge :status="(employee as WorkforceEmployeeRecord).is_active ? 'APPROVED' : 'REJECTED'" />
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

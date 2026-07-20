<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getPrograms } from '@/services/programs'
import type { ProgramRecord } from '@/types/domain'
import { formatDate } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getPrograms)
const selectedStatus = ref('ALL')
const selectedType = ref('ALL')

const filteredPrograms = computed(() => {
  const items = data.value?.items || []
  return items.filter((item) => {
    const statusMatch = selectedStatus.value === 'ALL' || item.status === selectedStatus.value
    const typeMatch = selectedType.value === 'ALL' || item.program_type === selectedType.value
    return statusMatch && typeMatch
  })
})

const programSearchText = (item: unknown) => {
  const row = item as ProgramRecord
  return [row.code, row.name, row.description, row.program_type, row.funding_source_name, row.status]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Programs"
      subtitle="Kelola program lintas tenant dan SPPG sebagai payung operasional untuk periode, assignment, dan sumber pendanaan."
      :badges="['Program Module', 'List & Detail', 'Assignment Flow']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <select v-model="selectedType" class="toolbar-input">
          <option value="ALL">Semua Tipe Program</option>
          <option value="PUBLIC">PUBLIC</option>
          <option value="PRIVATE">PRIVATE</option>
          <option value="PILOT">PILOT</option>
        </select>
        <RouterLink class="primary-button" to="/programs/create">Buat Program</RouterLink>
      </div>
      <p v-if="data?.fallback" class="mt-3 text-sm text-app-muted">
        List program sedang memakai fallback mock karena backend program belum mengembalikan daftar siap pakai untuk frontend.
      </p>
    </section>

    <div v-if="loading" class="loading-panel">Memuat daftar program...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredPrograms"
      :search-text-resolver="programSearchText"
      search-placeholder="Cari kode, nama program, pendanaan, tipe, atau status..."
      title="Daftar Program"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Program</th>
              <th>Tipe</th>
              <th>Funding</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="program in items" :key="(program as ProgramRecord).id">
              <td>
                <div class="font-medium text-app-heading">{{ (program as ProgramRecord).name }}</div>
                <div class="text-xs text-app-muted">{{ (program as ProgramRecord).code }}</div>
              </td>
              <td>{{ (program as ProgramRecord).program_type }}</td>
              <td>{{ (program as ProgramRecord).funding_source_name || '-' }}</td>
              <td>
                {{ formatDate((program as ProgramRecord).start_date) }} -
                {{ formatDate((program as ProgramRecord).end_date) }}
              </td>
              <td><StatusBadge :status="(program as ProgramRecord).status" /></td>
              <td>
                <RouterLink class="secondary-button" :to="`/programs/${(program as ProgramRecord).id}`">Detail</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

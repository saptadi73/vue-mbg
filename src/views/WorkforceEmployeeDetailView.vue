<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { mockSppgs } from '@/services/mock-data'
import { assignWorkforceEmployee, getWorkforceEmployeeById } from '@/services/workforce'
import type { WorkforceEmployeeAssignmentRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const loading = ref(true)
const error = ref('')
const fallback = ref(false)
const assignmentLoading = ref(false)
const assignmentSuccess = ref('')
const assignmentError = ref('')
const detail = ref<Awaited<ReturnType<typeof getWorkforceEmployeeById>>['item'] | null>(null)

const assignmentForm = reactive({
  sppg_id: mockSppgs[0]?.id || '',
  start_date: '2026-07-20',
  end_date: '',
  assignment_role: '',
  notes: '',
})

const loadDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await getWorkforceEmployeeById(String(route.params.employeeId))
    detail.value = response.item
    fallback.value = response.fallback

    if (!assignmentForm.assignment_role && response.item?.assignments[0]?.assignment_role) {
      assignmentForm.assignment_role = response.item.assignments[0].assignment_role
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat detail employee.'
  } finally {
    loading.value = false
  }
}

void loadDetail()

const assignmentSearchText = (item: unknown) => {
  const row = item as WorkforceEmployeeAssignmentRecord
  return [row.sppg_name, row.assignment_role, row.status, row.notes].filter(Boolean).join(' ')
}

const activeAssignmentCount = computed(
  () => detail.value?.assignments.filter((assignment) => assignment.status === 'ACTIVE').length || 0,
)

const submitAssignment = async () => {
  if (!detail.value) return

  assignmentLoading.value = true
  assignmentSuccess.value = ''
  assignmentError.value = ''

  try {
    const response = await assignWorkforceEmployee(detail.value.employee.id, {
      sppg_id: assignmentForm.sppg_id,
      start_date: assignmentForm.start_date,
      end_date: assignmentForm.end_date || undefined,
      assignment_role: assignmentForm.assignment_role,
      notes: assignmentForm.notes || undefined,
    })

    detail.value = {
      ...detail.value,
      assignments: [response.item, ...detail.value.assignments],
    }

    assignmentSuccess.value = response.fallback
      ? 'Assignment disimpan sebagai fallback mock karena backend belum merespons endpoint assignment.'
      : 'Assignment employee berhasil dikirim ke backend.'
    assignmentForm.end_date = ''
    assignmentForm.notes = ''
  } catch (err) {
    assignmentError.value = err instanceof Error ? err.message : 'Assignment employee gagal dikirim.'
  } finally {
    assignmentLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="loading-panel">Memuat detail employee...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="loadDetail">Muat ulang</button>
    </div>
    <template v-else-if="detail">
      <PageHeader
        :title="detail.employee.full_name"
        subtitle="Detail employee menampilkan posisi aktif, status kerja, dan riwayat assignment ke SPPG sesuai referensi workforce."
        :badges="['Workforce', detail.employee.employee_code, detail.employee.position_name || 'Employee Detail']"
      />

      <section class="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">{{ detail.employee.employee_code }}</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ detail.employee.full_name }}</h2>
              <p class="mt-2 text-sm text-app-body">
                {{ detail.employee.position_name || '-' }} · {{ detail.employee.employment_type }}
              </p>
            </div>
            <StatusBadge :status="detail.employee.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Join Date</p>
              <p class="mt-2 text-lg text-app-heading">{{ formatDate(detail.employee.join_date) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Daily Rate</p>
              <p class="mt-2 text-lg text-app-heading">{{ formatCurrency(detail.employee.daily_rate || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">SPPG Aktif</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.employee.active_assignment_sppg_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Assignment Aktif</p>
              <p class="mt-2 text-lg text-app-heading">{{ activeAssignmentCount }}</p>
            </div>
          </div>

          <p v-if="fallback" class="mt-4 text-sm text-app-muted">
            Detail ini sedang menggunakan fallback mock agar flow workforce tetap bisa ditinjau walau backend belum lengkap.
          </p>
        </article>

        <article class="glass-panel p-6">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="eyebrow-text">Assignment Form</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">Penempatan ke SPPG</h2>
            </div>
            <RouterLink class="secondary-button" to="/workforce/employees">Kembali</RouterLink>
          </div>

          <form class="mt-6 grid gap-4" @submit.prevent="submitAssignment">
            <label class="form-field">
              <span>SPPG</span>
              <select v-model="assignmentForm.sppg_id" class="toolbar-input" required>
                <option v-for="sppg in mockSppgs" :key="sppg.id" :value="sppg.id">
                  {{ sppg.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Assignment Role</span>
              <input v-model="assignmentForm.assignment_role" class="toolbar-input" placeholder="Kitchen Lead" required />
            </label>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="form-field">
                <span>Tanggal Mulai</span>
                <input v-model="assignmentForm.start_date" class="toolbar-input" type="date" required />
              </label>
              <label class="form-field">
                <span>Tanggal Selesai</span>
                <input v-model="assignmentForm.end_date" class="toolbar-input" type="date" />
              </label>
            </div>
            <label class="form-field">
              <span>Catatan</span>
              <textarea v-model="assignmentForm.notes" class="toolbar-input min-h-28" placeholder="Catatan rotasi, cakupan shift, atau alasan assignment." />
            </label>
            <button class="primary-button" :disabled="assignmentLoading" type="submit">
              {{ assignmentLoading ? 'Menyimpan...' : 'Simpan Assignment' }}
            </button>
            <p v-if="assignmentSuccess" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
              {{ assignmentSuccess }}
            </p>
            <p v-if="assignmentError" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
              {{ assignmentError }}
            </p>
          </form>
        </article>
      </section>

      <DataTableCard
        :items="detail.assignments"
        :search-text-resolver="assignmentSearchText"
        search-placeholder="Cari SPPG, role assignment, status, atau catatan..."
        title="Assignment History"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>SPPG</th>
                <th>Role</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in items" :key="(assignment as WorkforceEmployeeAssignmentRecord).id">
                <td>{{ (assignment as WorkforceEmployeeAssignmentRecord).sppg_name || '-' }}</td>
                <td>{{ (assignment as WorkforceEmployeeAssignmentRecord).assignment_role }}</td>
                <td>{{ formatDate((assignment as WorkforceEmployeeAssignmentRecord).start_date) }}</td>
                <td>
                  {{
                    (assignment as WorkforceEmployeeAssignmentRecord).end_date
                      ? formatDate((assignment as WorkforceEmployeeAssignmentRecord).end_date!)
                      : '-'
                  }}
                </td>
                <td><StatusBadge :status="(assignment as WorkforceEmployeeAssignmentRecord).status" /></td>
                <td>{{ (assignment as WorkforceEmployeeAssignmentRecord).notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

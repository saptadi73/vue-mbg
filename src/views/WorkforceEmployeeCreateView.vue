<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createWorkforceEmployee, getWorkforcePositions } from '@/services/workforce'
import { env } from '@/config/env'

const form = reactive({
  position_id: '',
  employee_code: '',
  full_name: '',
  employment_type: 'DAILY',
  join_date: '2026-07-20',
  phone_number: '',
  daily_rate: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const { data: positionsState } = useAsyncState(getWorkforcePositions)

const positions = computed(() => positionsState.value?.items || [])

watch(
  positions,
  (items) => {
    const firstPosition = items[0]
    if (!form.position_id && firstPosition) {
      form.position_id = firstPosition.id
    }
  },
  { immediate: true },
)

const resetForm = () => {
  form.position_id = positions.value[0]?.id || ''
  form.employee_code = ''
  form.full_name = ''
  form.employment_type = 'DAILY'
  form.join_date = '2026-07-20'
  form.phone_number = ''
  form.daily_rate = ''
  form.is_active = true
}

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createWorkforceEmployee({
      tenant_id: env.devTenantId,
      position_id: form.position_id,
      employee_code: form.employee_code,
      full_name: form.full_name,
      employment_type: form.employment_type,
      join_date: form.join_date,
      phone_number: form.phone_number || undefined,
      daily_rate: form.daily_rate ? Number(form.daily_rate) : undefined,
      is_active: form.is_active,
    })

    successMessage.value = response.fallback
      ? `Employee ${response.item.full_name} tersimpan sebagai fallback mock karena backend create employee belum merespons.`
      : `Employee ${response.item.full_name} berhasil dibuat di backend.`
    resetForm()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pendaftaran employee gagal. Periksa payload atau koneksi backend.'
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Tambah Employee"
      subtitle="Form employee mengikuti payload `POST /api/v1/workforce/employees` dengan struktur sederhana agar onboarding tenaga kerja tetap cepat."
      :badges="['Workforce', 'Employee Form', 'POST /employees']"
    />

    <section class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field">
          <span>Posisi</span>
          <select v-model="form.position_id" class="toolbar-input" required>
            <option value="" disabled>Pilih posisi</option>
            <option v-for="position in positions" :key="position.id" :value="position.id">
              {{ position.name }}
            </option>
          </select>
        </label>

        <label class="form-field">
          <span>Employee Code</span>
          <input v-model="form.employee_code" class="toolbar-input" placeholder="EMP-0005" required />
        </label>

        <label class="form-field">
          <span>Nama Lengkap</span>
          <input v-model="form.full_name" class="toolbar-input" placeholder="Siti Rahmawati" required />
        </label>

        <label class="form-field">
          <span>Tipe Kerja</span>
          <select v-model="form.employment_type" class="toolbar-input" required>
            <option value="DAILY">DAILY</option>
            <option value="MONTHLY">MONTHLY</option>
          </select>
        </label>

        <label class="form-field">
          <span>Tanggal Bergabung</span>
          <input v-model="form.join_date" class="toolbar-input" type="date" required />
        </label>

        <label class="form-field">
          <span>No. Telepon</span>
          <input v-model="form.phone_number" class="toolbar-input" placeholder="081234567890" />
        </label>

        <label class="form-field">
          <span>Daily Rate</span>
          <input v-model="form.daily_rate" class="toolbar-input" min="0" placeholder="150000" type="number" />
        </label>

        <label class="form-field">
          <span>Status Employee</span>
          <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan employee setelah dibuat</span>
          </label>
        </label>

        <div class="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button class="primary-button" :disabled="loading" type="submit">
            {{ loading ? 'Menyimpan...' : 'Simpan Employee' }}
          </button>
          <RouterLink class="secondary-button" to="/workforce/employees">Kembali ke Employees</RouterLink>
        </div>

        <p
          v-if="successMessage"
          class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 lg:col-span-2"
        >
          {{ successMessage }}
        </p>
        <p
          v-if="errorMessage"
          class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 lg:col-span-2"
        >
          {{ errorMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

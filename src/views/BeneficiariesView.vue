<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createBeneficiary, getBeneficiaries } from '@/services/beneficiaries'
import { getSchools } from '@/services/master-data'
import type { BeneficiaryRecord } from '@/types/domain'
import { useAppStore } from '@/stores/app'
import { formatDate, formatDateTime } from '@/utils/format'

const appStore = useAppStore()
const { activeTenantId, activeSppgId } = storeToRefs(appStore)

const beneficiariesState = useAsyncState(() => getBeneficiaries(activeTenantId.value, activeSppgId.value || undefined))
const schoolsState = useAsyncState(() => getSchools(activeTenantId.value, activeSppgId.value || undefined))
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const selectedStatus = ref('ALL')
const selectedGender = ref('ALL')

const form = reactive({
  school_id: '',
  full_name: '',
  beneficiary_type: 'STUDENT',
  gender: 'M',
  date_of_birth: '2015-01-10',
  classroom_name: '',
  is_active: true,
})

const filteredBeneficiaries = computed(() => {
  const items = beneficiariesState.data.value?.items || []
  return items.filter((item) => {
    const statusMatch =
      selectedStatus.value === 'ALL' ||
      (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active)
    const genderMatch = selectedGender.value === 'ALL' || item.gender === selectedGender.value
    return statusMatch && genderMatch
  })
})

const schoolOptions = computed(() => schoolsState.data.value?.items || [])

const beneficiarySearchText = (item: unknown) => {
  const row = item as BeneficiaryRecord
  return [
    row.full_name,
    row.school_name,
    row.sppg_name,
    row.beneficiary_type,
    row.gender,
    row.classroom_name,
    row.external_reference,
  ]
    .filter(Boolean)
    .join(' ')
}

const submit = async () => {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createBeneficiary({
      tenant_id: activeTenantId.value,
      sppg_id: activeSppgId.value,
      school_id: form.school_id,
      full_name: form.full_name,
      beneficiary_type: form.beneficiary_type,
      gender: form.gender,
      date_of_birth: form.date_of_birth,
      classroom_name: form.classroom_name || undefined,
      is_active: form.is_active,
    })

    if (beneficiariesState.data.value) {
      beneficiariesState.data.value = {
        ...beneficiariesState.data.value,
        items: [response.item, ...beneficiariesState.data.value.items],
        total: beneficiariesState.data.value.total + 1,
      }
    }

    successMessage.value = response.fallback
      ? `Penerima manfaat ${response.item.full_name} tersimpan sebagai fallback mock karena backend belum merespons.`
      : `Penerima manfaat ${response.item.full_name} berhasil dibuat di backend.`

    form.full_name = ''
    form.classroom_name = ''
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pendaftaran penerima manfaat gagal. Periksa payload atau koneksi backend.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Penerima Manfaat"
      subtitle="Daftar penerima manfaat per yayasan, sekolah, dan SPPG agar cakupan layanan bisa ditautkan rapi ke operasi."
      :badges="['Penerima Manfaat', 'List & Create', activeSppgId || activeTenantId]"
    />

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-4">
        <section class="glass-panel p-5">
          <div class="toolbar-grid">
            <select v-model="selectedStatus" class="toolbar-input">
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
            <select v-model="selectedGender" class="toolbar-input">
              <option value="ALL">Semua Gender</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
            <div class="toolbar-input flex items-center text-app-muted">Pencarian tersedia di dalam tabel</div>
          </div>
          <p v-if="beneficiariesState.data.value?.fallback" class="mt-3 text-sm text-app-muted">
            Daftar penerima manfaat sedang memakai fallback mock karena backend belum mengembalikan daftar siap pakai untuk frontend.
          </p>
        </section>

        <DataTableCard
          :items="filteredBeneficiaries"
          :search-text-resolver="beneficiarySearchText"
          search-placeholder="Cari nama, sekolah, SPPG, kelas, atau external reference..."
          title="Daftar Penerima Manfaat"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Sekolah</th>
                  <th>SPPG</th>
                  <th>Gender</th>
                  <th>Kelas</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as BeneficiaryRecord).id">
                  <td>
                    {{ (item as BeneficiaryRecord).full_name }}
                    <div class="text-xs text-app-muted">{{ (item as BeneficiaryRecord).external_reference || '-' }}</div>
                  </td>
                  <td>{{ (item as BeneficiaryRecord).school_name || '-' }}</td>
                  <td>{{ (item as BeneficiaryRecord).sppg_name || '-' }}</td>
                  <td>{{ (item as BeneficiaryRecord).gender }}</td>
                  <td>{{ (item as BeneficiaryRecord).classroom_name || '-' }}</td>
                  <td><StatusBadge :status="(item as BeneficiaryRecord).is_active ? 'ACTIVE' : 'INACTIVE'" /></td>
                  <td><RouterLink class="secondary-button" :to="`/beneficiaries/${(item as BeneficiaryRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </div>

      <section class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Tambah Penerima Manfaat</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah penerima manfaat</h2>
          </div>
          <span class="status-pill">POST /beneficiaries</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="submit">
          <label class="form-field">
            <span>Sekolah</span>
            <select v-model="form.school_id" class="toolbar-input" required>
              <option value="" disabled>Pilih sekolah</option>
              <option v-for="school in schoolOptions" :key="school.id" :value="school.id">
                {{ school.name }}
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>Nama Lengkap</span>
            <input v-model="form.full_name" class="toolbar-input" placeholder="Siswa Demo" required />
          </label>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Tipe Penerima Manfaat</span>
              <select v-model="form.beneficiary_type" class="toolbar-input" required>
                <option value="STUDENT">STUDENT</option>
              </select>
            </label>
            <label class="form-field">
              <span>Gender</span>
              <select v-model="form.gender" class="toolbar-input" required>
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </label>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Tanggal Lahir</span>
              <input v-model="form.date_of_birth" class="toolbar-input" type="date" required />
            </label>
            <label class="form-field">
              <span>Kelas</span>
              <input v-model="form.classroom_name" class="toolbar-input" placeholder="3A" />
            </label>
          </div>
          <label class="surface-subtle inline-flex items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan penerima manfaat</span>
          </label>
          <button class="primary-button" :disabled="saving" type="submit">
            {{ saving ? 'Menyimpan...' : 'Simpan Penerima Manfaat' }}
          </button>
          <p v-if="successMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {{ errorMessage }}
          </p>
        </form>
      </section>
    </section>
  </div>
</template>

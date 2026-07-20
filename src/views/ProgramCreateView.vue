<script setup lang="ts">
import { reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { createProgram } from '@/services/programs'

const form = reactive({
  code: '',
  name: '',
  description: '',
  program_type: 'PUBLIC',
  funding_source_name: '',
  start_date: '2026-07-20',
  end_date: '2026-12-31',
  status: 'DRAFT',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resetForm = () => {
  form.code = ''
  form.name = ''
  form.description = ''
  form.program_type = 'PUBLIC'
  form.funding_source_name = ''
  form.start_date = '2026-07-20'
  form.end_date = '2026-12-31'
  form.status = 'DRAFT'
  form.is_active = true
}

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createProgram({
      code: form.code,
      name: form.name,
      description: form.description,
      program_type: form.program_type,
      funding_source_name: form.funding_source_name,
      start_date: form.start_date,
      end_date: form.end_date,
      status: form.status,
      is_active: form.is_active,
    })

    successMessage.value = response.fallback
      ? `Program ${response.item.name} tersimpan sebagai fallback mock karena backend create program belum merespons.`
      : `Program ${response.item.name} berhasil dibuat di backend.`
    resetForm()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pembuatan program gagal. Periksa payload atau koneksi backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Buat Program"
      subtitle="Form program mengikuti payload `POST /api/v1/programs/` agar program baru bisa langsung menjadi payung tenant, SPPG, dan periode."
      :badges="['Program', 'Create Program', 'POST /programs']"
    />

    <section class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field">
          <span>Kode Program</span>
          <input v-model="form.code" class="toolbar-input" placeholder="PRG-MBG-APBD-2026" required />
        </label>

        <label class="form-field">
          <span>Nama Program</span>
          <input v-model="form.name" class="toolbar-input" placeholder="Program MBG APBD 2026" required />
        </label>

        <label class="form-field lg:col-span-2">
          <span>Deskripsi</span>
          <textarea v-model="form.description" class="toolbar-input min-h-28" placeholder="Program bantuan gizi daerah" required />
        </label>

        <label class="form-field">
          <span>Tipe Program</span>
          <select v-model="form.program_type" class="toolbar-input" required>
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
            <option value="PILOT">PILOT</option>
          </select>
        </label>

        <label class="form-field">
          <span>Sumber Pendanaan</span>
          <input v-model="form.funding_source_name" class="toolbar-input" placeholder="APBD Provinsi" required />
        </label>

        <label class="form-field">
          <span>Tanggal Mulai</span>
          <input v-model="form.start_date" class="toolbar-input" type="date" required />
        </label>

        <label class="form-field">
          <span>Tanggal Selesai</span>
          <input v-model="form.end_date" class="toolbar-input" type="date" required />
        </label>

        <label class="form-field">
          <span>Status</span>
          <select v-model="form.status" class="toolbar-input" required>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
          </select>
        </label>

        <label class="form-field">
          <span>Status Aktivasi</span>
          <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan program setelah dibuat</span>
          </label>
        </label>

        <div class="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button class="primary-button" :disabled="loading" type="submit">
            {{ loading ? 'Menyimpan...' : 'Simpan Program' }}
          </button>
          <RouterLink class="secondary-button" to="/programs">Kembali ke Programs</RouterLink>
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

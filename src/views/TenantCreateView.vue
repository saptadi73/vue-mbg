<script setup lang="ts">
import { reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { createTenant } from '@/services/tenants'

const form = reactive({
  name: '',
  code: '',
  description: '',
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resetForm = () => {
  form.name = ''
  form.code = ''
  form.description = ''
  form.is_active = true
}

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await createTenant({
      name: form.name,
      code: form.code,
      description: form.description,
      is_active: form.is_active,
    })

    successMessage.value = 'Tenant baru berhasil didaftarkan.'
    resetForm()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pendaftaran tenant gagal. Periksa payload atau akses backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Pendaftaran Tenant"
      subtitle="Form onboarding tenant baru mengikuti payload backend untuk master data tenant MBG."
      :badges="['POST /tenants', 'Onboarding', 'Master Data']"
    />

    <section class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field lg:col-span-2">
          <span>Nama Tenant</span>
          <input v-model="form.name" class="toolbar-input" placeholder="Yayasan MBG Jawa Barat" required />
        </label>

        <label class="form-field">
          <span>Code Tenant</span>
          <input v-model="form.code" class="toolbar-input" placeholder="MBG-JABAR" required />
        </label>

        <label class="form-field">
          <span>Status Tenant</span>
          <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan tenant setelah pendaftaran</span>
          </label>
        </label>

        <label class="form-field lg:col-span-2">
          <span>Deskripsi</span>
          <textarea
            v-model="form.description"
            class="toolbar-input min-h-32"
            placeholder="Tenant operasional wilayah Jawa Barat"
            required
          />
        </label>

        <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button class="primary-button" :disabled="loading" type="submit">
            {{ loading ? 'Mendaftarkan...' : 'Daftarkan Tenant' }}
          </button>
          <RouterLink class="secondary-button" to="/tenants">Kembali ke Tenants</RouterLink>
        </div>

        <p
          v-if="successMessage"
          class="lg:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </p>
        <p
          v-if="errorMessage"
          class="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700"
        >
          {{ errorMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

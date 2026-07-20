<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { createUser } from '@/services/identity'
import { createSppg } from '@/services/sppg'
import { createTenant } from '@/services/tenants'

const step = ref(1)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  tenant: {
    name: '',
    code: '',
    description: '',
    is_active: true,
  },
  user: {
    full_name: '',
    email: '',
    password: '',
    role_name: 'tenant_admin',
    is_active: true,
  },
  sppg: {
    code: '',
    name: '',
    address: '',
    latitude: -6.2,
    longitude: 106.816666,
    radius_km: 5,
    is_active: true,
  },
})

const next = () => {
  if (step.value < 3) step.value += 1
}

const previous = () => {
  if (step.value > 1) step.value -= 1
}

const stepLabel = computed(() => ['Tenant', 'Admin User', 'SPPG'][step.value - 1])

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const tenant = await createTenant(form.tenant)
    const sppg = await createSppg({
      tenant_id: tenant.id,
      ...form.sppg,
    })
    await createUser({
      tenant_id: tenant.id,
      full_name: form.user.full_name,
      email: form.user.email,
      password: form.user.password,
      role_names: [form.user.role_name],
      is_active: form.user.is_active,
      accessible_sppg_ids: [sppg.id],
      active_sppg_id: sppg.id,
    })

    successMessage.value =
      'Onboarding selesai: tenant, admin user, dan SPPG berhasil dibentuk dalam satu flow.'
    step.value = 1
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Onboarding wizard gagal dijalankan.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Onboarding Wizard"
      subtitle="Flow terpadu untuk membangun Tenant, Admin User, dan SPPG tanpa loncat-loncat halaman."
      :badges="['Wizard', `${step}/3`, stepLabel]"
    />

    <section class="glass-panel p-6">
      <div class="mb-6 grid gap-3 md:grid-cols-3">
        <div v-for="index in 3" :key="index" class="surface-subtle rounded-2xl p-4" :class="{ 'ring-2 ring-teal-300/40': step === index }">
          <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Step {{ index }}</p>
          <p class="mt-2 text-sm font-semibold text-app-heading">{{ ['Tenant', 'Admin User', 'SPPG'][index - 1] }}</p>
        </div>
      </div>

      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <template v-if="step === 1">
          <label class="form-field lg:col-span-2">
            <span>Nama Tenant</span>
            <input v-model="form.tenant.name" class="toolbar-input" required />
          </label>
          <label class="form-field">
            <span>Code Tenant</span>
            <input v-model="form.tenant.code" class="toolbar-input" required />
          </label>
          <label class="form-field">
            <span>Status Tenant</span>
            <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="form.tenant.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan tenant</span>
            </label>
          </label>
          <label class="form-field lg:col-span-2">
            <span>Deskripsi</span>
            <textarea v-model="form.tenant.description" class="toolbar-input min-h-28" required />
          </label>
        </template>

        <template v-else-if="step === 2">
          <label class="form-field lg:col-span-2">
            <span>Nama Admin</span>
            <input v-model="form.user.full_name" class="toolbar-input" required />
          </label>
          <label class="form-field">
            <span>Email</span>
            <input v-model="form.user.email" class="toolbar-input" type="email" required />
          </label>
          <label class="form-field">
            <span>Password</span>
            <input v-model="form.user.password" class="toolbar-input" type="password" required />
          </label>
          <label class="form-field">
            <span>Role</span>
            <select v-model="form.user.role_name" class="toolbar-input">
              <option value="tenant_admin">tenant_admin</option>
              <option value="operations_manager">operations_manager</option>
              <option value="finance_manager">finance_manager</option>
            </select>
          </label>
          <label class="form-field">
            <span>Status User</span>
            <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="form.user.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan user</span>
            </label>
          </label>
        </template>

        <template v-else>
          <label class="form-field">
            <span>Code SPPG</span>
            <input v-model="form.sppg.code" class="toolbar-input" required />
          </label>
          <label class="form-field">
            <span>Nama SPPG</span>
            <input v-model="form.sppg.name" class="toolbar-input" required />
          </label>
          <label class="form-field lg:col-span-2">
            <span>Alamat</span>
            <textarea v-model="form.sppg.address" class="toolbar-input min-h-28" required />
          </label>
          <label class="form-field">
            <span>Latitude</span>
            <input v-model="form.sppg.latitude" class="toolbar-input" step="0.000001" type="number" required />
          </label>
          <label class="form-field">
            <span>Longitude</span>
            <input v-model="form.sppg.longitude" class="toolbar-input" step="0.000001" type="number" required />
          </label>
          <label class="form-field">
            <span>Radius (km)</span>
            <input v-model="form.sppg.radius_km" class="toolbar-input" min="0" step="0.1" type="number" required />
          </label>
          <label class="form-field">
            <span>Status SPPG</span>
            <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="form.sppg.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan SPPG</span>
            </label>
          </label>
        </template>

        <div class="lg:col-span-2 flex flex-wrap gap-3">
          <button v-if="step > 1" class="secondary-button" type="button" @click="previous">Kembali</button>
          <button v-if="step < 3" class="primary-button" type="button" @click="next">Lanjut</button>
          <button v-else class="primary-button" :disabled="loading" type="submit">
            {{ loading ? 'Menjalankan...' : 'Selesaikan Onboarding' }}
          </button>
        </div>

        <p v-if="successMessage" class="lg:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
          {{ errorMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

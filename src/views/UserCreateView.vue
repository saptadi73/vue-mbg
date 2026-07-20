<script setup lang="ts">
import { reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/common/PageHeader.vue'
import { createUser } from '@/services/identity'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { sppgOptions } = storeToRefs(appStore)

const form = reactive({
  full_name: '',
  email: '',
  password: '',
  role_name: 'tenant_admin',
  is_active: true,
  active_sppg_id: sppgOptions.value[0]?.id || '',
  accessible_sppg_ids: [sppgOptions.value[0]?.id || ''].filter(Boolean),
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const toggleSppgAccess = (sppgId: string) => {
  if (form.accessible_sppg_ids.includes(sppgId)) {
    form.accessible_sppg_ids = form.accessible_sppg_ids.filter((id) => id !== sppgId)
    if (form.active_sppg_id === sppgId) {
      form.active_sppg_id = form.accessible_sppg_ids[0] || ''
    }
    return
  }

  form.accessible_sppg_ids = [...form.accessible_sppg_ids, sppgId]
  if (!form.active_sppg_id) {
    form.active_sppg_id = sppgId
  }
}

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await createUser({
      tenant_id: appStore.activeTenantId,
      full_name: form.full_name,
      email: form.email,
      password: form.password,
      role_names: [form.role_name],
      is_active: form.is_active,
      accessible_sppg_ids: form.accessible_sppg_ids,
      active_sppg_id: form.active_sppg_id,
    })

    successMessage.value = 'User baru berhasil didaftarkan ke yayasan MBG.'
    form.full_name = ''
    form.email = ''
    form.password = ''
    form.role_name = 'tenant_admin'
    form.is_active = true
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Registrasi user gagal. Periksa payload atau akses backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Registrasi User"
      subtitle="Form admin untuk membuat user yayasan baru beserta role dan akses SPPG aktif."
      :badges="['POST /identity/users', 'Role-based', 'SPPG Access']"
    />

    <section class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field">
          <span>Nama Lengkap</span>
          <input v-model="form.full_name" class="toolbar-input" placeholder="QA Admin User" required />
        </label>

        <label class="form-field">
          <span>Email</span>
          <input v-model="form.email" class="toolbar-input" placeholder="qa-admin@example.com" type="email" required />
        </label>

        <label class="form-field">
          <span>Password</span>
          <input v-model="form.password" class="toolbar-input" placeholder="Minimal sesuai kebijakan tenant" type="password" required />
        </label>

        <label class="form-field">
          <span>Role</span>
          <select v-model="form.role_name" class="toolbar-input" required>
            <option value="tenant_admin">tenant_admin</option>
            <option value="super_admin">super_admin</option>
            <option value="operations_manager">operations_manager</option>
            <option value="finance_manager">finance_manager</option>
            <option value="quality_officer">quality_officer</option>
            <option value="delivery_officer">delivery_officer</option>
          </select>
        </label>

        <label class="form-field lg:col-span-2">
          <span>SPPG Aktif</span>
          <select v-model="form.active_sppg_id" class="toolbar-input" required>
            <option v-for="sppg in sppgOptions" :key="sppg.id" :value="sppg.id">{{ sppg.label }}</option>
          </select>
        </label>

        <div class="form-field lg:col-span-2">
          <span>Akses SPPG</span>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <label v-for="sppg in sppgOptions" :key="sppg.id" class="surface-subtle flex items-start gap-3 rounded-2xl p-4">
              <input
                :checked="form.accessible_sppg_ids.includes(sppg.id)"
                class="mt-1"
                type="checkbox"
                @change="toggleSppgAccess(sppg.id)"
              />
              <span>
                <span class="block text-sm font-medium text-app-heading">{{ sppg.label }}</span>
                <span class="mt-1 block text-sm text-app-muted">{{ sppg.subtitle }}</span>
              </span>
            </label>
          </div>
        </div>

        <label class="form-field lg:col-span-2">
          <span>Status User</span>
          <label class="surface-subtle inline-flex w-fit items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan user setelah registrasi</span>
          </label>
        </label>

        <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button class="primary-button" :disabled="loading || !form.accessible_sppg_ids.length || !form.active_sppg_id" type="submit">
            {{ loading ? 'Mendaftarkan...' : 'Daftarkan User' }}
          </button>
          <RouterLink class="secondary-button" to="/users">Kembali ke Users</RouterLink>
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

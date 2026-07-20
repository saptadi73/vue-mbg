<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getUserById, getUserSppgAccess, updateUser, updateUserSppgAccess } from '@/services/identity'
import { useAppStore } from '@/stores/app'

const roleOptions = [
  'super_admin',
  'tenant_admin',
  'operations_manager',
  'finance_manager',
  'procurement_officer',
  'quality_officer',
  'delivery_officer',
  'viewer',
]

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { sppgOptions } = storeToRefs(appStore)
const userId = computed(() => String(route.params.userId || ''))

const userState = useAsyncState(() => getUserById(userId.value))
const accessState = useAsyncState(() => getUserSppgAccess(userId.value))
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const form = reactive({
  full_name: '',
  password: '',
  role_names: [] as string[],
  is_active: true,
  active_sppg_id: '',
  accessible_sppg_ids: [] as string[],
})

watch(
  () => [userState.data.value?.item, accessState.data.value?.item] as const,
  ([user, access]) => {
    if (!user) return
    form.full_name = user.full_name
    form.role_names = [...user.role_names]
    form.is_active = user.is_active
    form.active_sppg_id = access?.active_sppg_id || user.active_sppg_id || sppgOptions.value[0]?.id || ''
    form.accessible_sppg_ids = [
      ...(access?.accessible_sppg_ids || user.accessible_sppg_ids || [form.active_sppg_id]),
    ].filter(Boolean)
  },
  { immediate: true },
)

const toggleRole = (role: string) => {
  form.role_names = form.role_names.includes(role)
    ? form.role_names.filter((item) => item !== role)
    : [...form.role_names, role]
}

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
    await updateUser(userId.value, {
      full_name: form.full_name,
      role_names: form.role_names,
      is_active: form.is_active,
      password: form.password.trim() ? form.password : null,
      accessible_sppg_ids: form.accessible_sppg_ids,
      active_sppg_id: form.active_sppg_id,
    })

    await updateUserSppgAccess(userId.value, {
      accessible_sppg_ids: form.accessible_sppg_ids,
      active_sppg_id: form.active_sppg_id,
    })

    successMessage.value = 'User, role, dan akses SPPG berhasil diperbarui.'
    form.password = ''
    await userState.execute()
    await accessState.execute()
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Update user gagal. Periksa role, scope SPPG, atau koneksi backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Edit User"
      subtitle="Ubah profil user, role, status akun, password opsional, dan daftar SPPG yang dapat diakses."
      :badges="['PUT /identity/users/{id}', 'PUT SPPG Access', 'Admin']"
    />

    <div v-if="userState.loading.value || accessState.loading.value" class="loading-panel">Memuat form user...</div>
    <div v-else-if="userState.error.value || accessState.error.value" class="error-panel">
      <p>{{ userState.error.value || accessState.error.value }}</p>
      <button class="primary-button mt-3" @click="userState.execute(); accessState.execute()">Muat ulang</button>
    </div>

    <section v-else class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field">
          <span>Nama Lengkap</span>
          <input v-model="form.full_name" class="toolbar-input" required />
        </label>

        <label class="form-field">
          <span>Password Baru Opsional</span>
          <input v-model="form.password" class="toolbar-input" placeholder="Kosongkan jika tidak diganti" type="password" />
        </label>

        <div class="form-field lg:col-span-2">
          <span>Role</span>
          <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label v-for="role in roleOptions" :key="role" class="surface-subtle flex items-center gap-3 rounded-2xl p-4">
              <input
                :checked="form.role_names.includes(role)"
                type="checkbox"
                @change="toggleRole(role)"
              />
              <span class="text-sm font-medium text-app-heading">{{ role }}</span>
            </label>
          </div>
        </div>

        <label class="form-field">
          <span>Status User</span>
          <label class="surface-subtle inline-flex w-fit items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">User aktif</span>
          </label>
        </label>

        <label class="form-field">
          <span>SPPG Aktif</span>
          <select v-model="form.active_sppg_id" class="toolbar-input" required>
            <option v-for="sppg in sppgOptions" :key="sppg.id" :value="sppg.id" :disabled="!form.accessible_sppg_ids.includes(sppg.id)">
              {{ sppg.label }}
            </option>
          </select>
        </label>

        <div class="form-field lg:col-span-2">
          <span>User SPPG Access</span>
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
          <p class="mt-3 text-sm text-app-muted">
            Backend mewajibkan `active_sppg_id` berada di dalam `accessible_sppg_ids`.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 lg:col-span-2">
          <button
            class="primary-button disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loading || !form.full_name || !form.role_names.length || !form.accessible_sppg_ids.length || !form.active_sppg_id"
            type="submit"
          >
            {{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
          <button class="secondary-button" type="button" @click="router.push(`/users/${userId}`)">Kembali ke Detail</button>
          <RouterLink class="secondary-button" to="/users">Kembali ke Users</RouterLink>
        </div>

        <p v-if="successMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 lg:col-span-2">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 lg:col-span-2">
          {{ errorMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

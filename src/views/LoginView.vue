<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginWithPassword, getCurrentProfile } from '@/services/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const appStore = useAppStore()

const form = reactive({
  email: 'operator@example.com',
  password: 'mbg12345',
})

const loading = ref(false)
const errorMessage = ref('')

const submit = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const token = await loginWithPassword(form.email, form.password)
    appStore.setAccessToken(token)
    const me = await getCurrentProfile()
    appStore.applyProfile(me)
    router.push('/')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Login gagal.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-shell min-h-screen px-4 py-8">
    <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <section class="glass-panel login-hero p-8 lg:p-10">
        <p class="eyebrow-text">ERP MBG</p>
        <h1 class="mt-4 font-display text-4xl text-app-heading lg:text-6xl">Operational Command Center</h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-app-body">
          Masuk ke dashboard MBG untuk mengelola tenant, SPPG, distribusi, finance, GIS, dan master data dengan satu konteks kerja yang konsisten.
        </p>
        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Auth Mode</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">JWT Backend</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Dev API</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">127.0.0.1:8000</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Demo User</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">operator@example.com</p>
          </div>
        </div>
      </section>

      <section class="glass-panel p-8 lg:p-10">
        <p class="eyebrow-text">Sign In</p>
        <h2 class="mt-4 font-display text-3xl text-app-heading">Login ke ERP MBG</h2>
        <p class="mt-3 text-sm text-app-body">Gunakan akun backend aktif untuk memuat role, tenant, dan SPPG context yang valid.</p>

        <form class="mt-8 grid gap-4" @submit.prevent="submit">
          <label class="form-field">
            <span>Email</span>
            <input v-model="form.email" class="toolbar-input" type="email" required />
          </label>
          <label class="form-field">
            <span>Password</span>
            <input v-model="form.password" class="toolbar-input" type="password" required />
          </label>
          <button class="primary-button w-full" :disabled="loading" type="submit">
            {{ loading ? 'Masuk...' : 'Login' }}
          </button>
          <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {{ errorMessage }}
          </p>
        </form>

        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p class="text-app-body">
            Belum punya akun?
            <RouterLink class="font-semibold text-cyan-600 transition hover:text-cyan-500" to="/register">Lihat opsi registrasi</RouterLink>
          </p>
          <RouterLink class="font-semibold text-app-muted transition hover:text-app-heading" to="/users/create">
            Buka form admin
          </RouterLink>
        </div>

        <div class="mt-6 rounded-3xl border border-[var(--app-panel-border)] bg-[var(--app-subtle-bg)] p-4">
          <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Demo Accounts</p>
          <p class="mt-2 text-sm text-app-heading">super_admin: `operator@example.com` / `mbg12345`</p>
          <p class="mt-1 text-sm text-app-body">operations_manager: `demo.ops@example.com` / `demo12345`</p>
        </div>
      </section>
    </div>
  </div>
</template>

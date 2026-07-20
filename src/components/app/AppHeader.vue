<script setup lang="ts">
import { Bell, LogOut, Menu, Moon, Sun } from '@lucide/vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const router = useRouter()
const {
  activeTenant,
  activeTenantId,
  activeSppg,
  activeSppgId,
  profile,
  sppgOptions,
  tenants,
  themeMode,
  unreadNotifications,
} = storeToRefs(appStore)

const handleLogout = () => {
  appStore.logout()
  router.push('/login')
}
</script>

<template>
  <header class="glass-panel sticky top-0 z-20 flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <div class="mb-3 flex items-center gap-3 lg:hidden">
        <button class="mobile-menu-button" type="button" aria-label="Buka menu navigasi" title="Buka menu navigasi" @click="appStore.toggleMobileSidebar()">
          <Menu :size="21" stroke-width="2" />
        </button>
        <span class="text-sm font-medium text-app-heading">Menu Navigasi</span>
      </div>
      <p class="eyebrow-text">Realtime orchestration</p>
      <h2 class="font-display text-2xl text-app-heading">Modern MBG Operations Cockpit</h2>
    </div>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="context-field">
        <span>Tenant</span>
        <select v-model="activeTenantId" @change="appStore.switchContext({ tenantId: activeTenantId })">
          <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">{{ tenant.label }}</option>
        </select>
      </label>

      <label class="context-field">
        <span>SPPG</span>
        <select v-model="activeSppgId" @change="appStore.switchContext({ sppgId: activeSppgId })">
          <option v-for="sppg in sppgOptions" :key="sppg.id" :value="sppg.id">{{ sppg.label }}</option>
        </select>
      </label>

      <button
        class="theme-toggle theme-toggle-square"
        type="button"
        :aria-label="themeMode === 'dark' ? 'Aktifkan light mode' : 'Aktifkan dark mode'"
        :title="themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="appStore.toggleTheme()"
      >
        <Sun v-if="themeMode === 'dark'" :size="20" stroke-width="2" />
        <Moon v-else :size="20" stroke-width="2" />
      </button>

      <button
        class="theme-toggle theme-toggle-square relative"
        type="button"
        :aria-label="`${unreadNotifications} notifikasi inbox`"
        :title="`${unreadNotifications} notifikasi inbox`"
      >
        <Bell :size="20" stroke-width="2" />
        <span v-if="unreadNotifications" class="header-icon-badge">{{ unreadNotifications }}</span>
      </button>

      <div class="grid h-[52px] w-[52px] place-items-center rounded-2xl bg-teal-300 text-sm font-semibold text-slate-950" :title="profile.name">
        {{ profile.avatar }}
      </div>

      <button class="theme-toggle theme-toggle-square" type="button" aria-label="Logout" title="Logout" @click="handleLogout">
        <LogOut :size="20" stroke-width="2" />
      </button>
    </div>
  </header>

  <section class="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
    <div class="glass-panel p-5">
      <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Context aktif</p>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <span class="status-pill status-pill-brand">{{ activeTenant?.label }}</span>
        <span class="status-pill status-pill-info">{{ activeSppg?.label }}</span>
        <span class="status-pill">{{ profile.role }}</span>
      </div>
      <p class="mt-3 text-sm text-app-body">
        Shell ini mengikuti pola context-first, workflow visible, dan action-by-role dari referensi `docs`.
      </p>
    </div>

    <div class="glass-panel p-5">
      <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Design direction</p>
      <p class="mt-3 text-sm leading-6 text-app-body">
        Neon slate, gradient atmosphere, dense operational cards, reusable panels, dan fokus cepat ke keputusan lintas dapur.
      </p>
    </div>
  </section>
</template>

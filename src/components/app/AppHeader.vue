<script setup lang="ts">
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
  desktopSidebarCollapsed,
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
        <button class="mobile-menu-button" type="button" @click="appStore.toggleMobileSidebar()">
          <span class="mobile-menu-lines"></span>
          <span class="mobile-menu-lines"></span>
          <span class="mobile-menu-lines"></span>
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

      <button class="theme-toggle hidden lg:inline-flex" type="button" @click="appStore.toggleDesktopSidebar()">
        <span class="theme-toggle-icon">{{ desktopSidebarCollapsed ? 'EX' : 'CL' }}</span>
        <span>
          <span class="block text-xs uppercase tracking-[0.24em] text-app-muted">Sidebar</span>
          <span class="text-sm font-medium text-app-heading">{{ desktopSidebarCollapsed ? 'Expand Menu' : 'Collapse Menu' }}</span>
        </span>
      </button>

      <button class="theme-toggle" type="button" @click="appStore.toggleTheme()">
        <span class="theme-toggle-icon">{{ themeMode === 'dark' ? 'LT' : 'DK' }}</span>
        <span>
          <span class="block text-xs uppercase tracking-[0.24em] text-app-muted">Theme</span>
          <span class="text-sm font-medium text-app-heading">{{ themeMode === 'dark' ? 'Dark Mode' : 'Light Mode' }}</span>
        </span>
      </button>

      <div class="surface-subtle flex items-center gap-3 rounded-2xl px-4 py-3">
        <div>
          <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Inbox</p>
          <p class="text-sm font-medium text-app-heading">{{ unreadNotifications }} notifikasi</p>
        </div>
        <div class="grid h-10 w-10 place-items-center rounded-2xl bg-teal-300 text-sm font-semibold text-slate-950">
          {{ profile.avatar }}
        </div>
      </div>

      <button class="secondary-button" type="button" @click="handleLogout">
        Logout
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

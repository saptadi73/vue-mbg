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
  <header class="glass-panel sticky top-0 z-20 flex flex-col gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <div class="mb-2 flex items-center gap-2.5 lg:hidden">
        <button class="mobile-menu-button" type="button" aria-label="Buka menu navigasi" title="Buka menu navigasi" @click="appStore.toggleMobileSidebar()">
          <Menu :size="21" stroke-width="2" />
        </button>
        <span class="text-sm font-medium text-app-heading">Menu Navigasi</span>
      </div>
      <p class="eyebrow-text">Realtime orchestration</p>
      <h2 class="font-display text-xl leading-tight text-app-heading sm:text-2xl">Pusat Pengelolaan Dapur MBG</h2>
    </div>

    <div class="flex flex-col gap-2.5 sm:gap-3">
      <div class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
        <label class="context-field context-field-mobile-compact">
          <span>Yayasan</span>
          <select v-model="activeTenantId" @change="appStore.switchContext({ tenantId: activeTenantId })">
            <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">{{ tenant.label }}</option>
          </select>
        </label>

        <label class="context-field context-field-mobile-compact">
          <span>SPPG</span>
          <select v-model="activeSppgId" @change="appStore.switchContext({ sppgId: activeSppgId })">
            <option v-for="sppg in sppgOptions" :key="sppg.id" :value="sppg.id">{{ sppg.label }}</option>
          </select>
        </label>
      </div>

      <div class="header-quick-actions">
        <button
          class="theme-toggle theme-toggle-square header-action-icon"
          type="button"
          :aria-label="themeMode === 'dark' ? 'Aktifkan light mode' : 'Aktifkan dark mode'"
          :title="themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="appStore.toggleTheme()"
        >
          <Sun v-if="themeMode === 'dark'" :size="20" stroke-width="2" />
          <Moon v-else :size="20" stroke-width="2" />
        </button>

        <RouterLink
          class="theme-toggle theme-toggle-square header-action-icon relative"
          to="/notifications/inbox"
          :aria-label="`${unreadNotifications} notifikasi inbox`"
          :title="`${unreadNotifications} notifikasi inbox`"
        >
          <Bell :size="20" stroke-width="2" />
          <span v-if="unreadNotifications" class="header-icon-badge">{{ unreadNotifications }}</span>
        </RouterLink>

        <RouterLink class="header-avatar-chip" to="/profile" :title="profile.name">
          {{ profile.avatar }}
        </RouterLink>

        <button class="theme-toggle theme-toggle-square header-action-icon" type="button" aria-label="Logout" title="Logout" @click="handleLogout">
          <LogOut :size="20" stroke-width="2" />
        </button>
      </div>
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

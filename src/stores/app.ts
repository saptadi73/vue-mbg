import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { env } from '@/config/env'
import type { ContextOption, UserProfile } from '@/types/domain'

type ThemeMode = 'dark' | 'light'

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark'

  const saved = window.localStorage.getItem('mbg-theme')
  if (saved === 'dark' || saved === 'light') return saved

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useAppStore = defineStore('app', () => {
  const tenants = ref<ContextOption[]>([
    { id: env.devTenantId, label: 'Tenant MBG Nasional', subtitle: '24 SPPG aktif' },
  ])
  const sppgOptions = ref<ContextOption[]>([
    { id: env.devSppgId, label: 'SPPG Jakarta Pusat 01', subtitle: 'Cluster pusat distribusi utama' },
    { id: 'sppg-tanah-abang-02', label: 'SPPG Tanah Abang 02', subtitle: 'Fokus pengiriman sekolah padat' },
    { id: 'sppg-menteng-03', label: 'SPPG Menteng 03', subtitle: 'Pilot dapur efisiensi tinggi' },
  ])
  const activeTenantId = ref(env.devTenantId)
  const activeSppgId = ref(env.devSppgId)
  const unreadNotifications = ref(7)
  const themeMode = ref<ThemeMode>(resolveInitialTheme())
  const mobileSidebarOpen = ref(false)
  const profile = ref<UserProfile>({
    name: 'Raka Mahendra',
    role: 'Operations Manager',
    tenantName: 'Tenant MBG Nasional',
    avatar: 'RM',
  })

  const activeTenant = computed(() => tenants.value.find((item) => item.id === activeTenantId.value))
  const activeSppg = computed(() => sppgOptions.value.find((item) => item.id === activeSppgId.value))

  const switchContext = (payload: { tenantId?: string; sppgId?: string }) => {
    if (payload.tenantId) activeTenantId.value = payload.tenantId
    if (payload.sppgId) activeSppgId.value = payload.sppgId
  }

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mbg-theme', mode)
    }
  }

  const toggleTheme = () => {
    setTheme(themeMode.value === 'dark' ? 'light' : 'dark')
  }

  const openMobileSidebar = () => {
    mobileSidebarOpen.value = true
  }

  const closeMobileSidebar = () => {
    mobileSidebarOpen.value = false
  }

  const toggleMobileSidebar = () => {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }

  return {
    tenants,
    sppgOptions,
    activeTenantId,
    activeSppgId,
    unreadNotifications,
    themeMode,
    mobileSidebarOpen,
    profile,
    activeTenant,
    activeSppg,
    switchContext,
    setTheme,
    toggleTheme,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
  }
})

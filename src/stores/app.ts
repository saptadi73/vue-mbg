import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { env } from '@/config/env'
import { getCurrentProfile, switchActiveSppg } from '@/services/auth'
import type { ContextOption, IdentityMeResponse, UserProfile } from '@/types/domain'
import { clearStoredSession, readStoredSession, writeStoredSession } from '@/utils/auth-storage'

type ThemeMode = 'dark' | 'light'

const resolveDesktopSidebarCollapsed = () => {
  if (typeof window === 'undefined') return false

  return window.localStorage.getItem('mbg-sidebar-collapsed') === 'true'
}

const resolveInitialTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'dark'

  const saved = window.localStorage.getItem('mbg-theme')
  if (saved === 'dark' || saved === 'light') return saved

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export const useAppStore = defineStore('app', () => {
  const existingSession = readStoredSession()
  const tenants = ref<ContextOption[]>([
    { id: env.devTenantId, label: 'Yayasan MBG Nasional', subtitle: '24 SPPG aktif' },
  ])
  const sppgOptions = ref<ContextOption[]>([
    { id: env.devSppgId, label: 'SPPG Jakarta Pusat 01', subtitle: 'Cluster pusat distribusi utama' },
    { id: 'sppg-tanah-abang-02', label: 'SPPG Tanah Abang 02', subtitle: 'Fokus pengiriman sekolah padat' },
    { id: 'sppg-menteng-03', label: 'SPPG Menteng 03', subtitle: 'Pilot dapur efisiensi tinggi' },
  ])
  const activeTenantId = ref(existingSession?.tenantId || env.devTenantId)
  const activeSppgId = ref(existingSession?.activeSppgId || '')
  const unreadNotifications = ref(7)
  const themeMode = ref<ThemeMode>(resolveInitialTheme())
  const mobileSidebarOpen = ref(false)
  const desktopSidebarCollapsed = ref(resolveDesktopSidebarCollapsed())
  const accessToken = ref(existingSession?.accessToken || '')
  const roles = ref<string[]>(existingSession?.roles || ['operations_manager'])
  const accessibleSppgIds = ref<string[]>(existingSession?.accessibleSppgIds || [])
  const authReady = ref(false)
  const profile = ref<UserProfile>({
    name: existingSession?.userName || 'Raka Mahendra',
    role: existingSession?.roles?.[0] || 'Operations Manager',
    tenantName: 'Yayasan MBG Nasional',
    avatar: (existingSession?.userName || 'Raka Mahendra')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    email: existingSession?.email || 'operator@example.com',
  })

  const activeTenant = computed(() => tenants.value.find((item) => item.id === activeTenantId.value))
  const activeSppg = computed(() => sppgOptions.value.find((item) => item.id === activeSppgId.value))
  const isAuthenticated = computed(() => Boolean(accessToken.value))

  const persistSession = () => {
    if (!accessToken.value) return

    writeStoredSession({
      accessToken: accessToken.value,
      tenantId: activeTenantId.value,
      activeSppgId: activeSppgId.value,
      accessibleSppgIds: accessibleSppgIds.value,
      roles: roles.value,
      userName: profile.value.name,
      email: profile.value.email || '',
    })
  }

  const applyProfile = (me: IdentityMeResponse) => {
    activeTenantId.value = me.tenant_id || env.devTenantId
    activeSppgId.value = me.active_sppg_id || env.devSppgId
    accessibleSppgIds.value = me.accessible_sppg_ids?.length ? me.accessible_sppg_ids : [activeSppgId.value]
    roles.value = me.role_names?.length ? me.role_names : me.roles?.length ? me.roles : roles.value
    profile.value = {
      name: me.full_name || profile.value.name,
      role: roles.value[0] || profile.value.role,
      tenantName: tenants.value.find((item) => item.id === activeTenantId.value)?.label || profile.value.tenantName,
      avatar: (me.full_name || profile.value.name)
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      email: me.email || profile.value.email,
    }
    persistSession()
  }

  const switchContext = (payload: { tenantId?: string; sppgId?: string }) => {
    if (payload.tenantId) activeTenantId.value = payload.tenantId
    if (payload.sppgId) {
      activeSppgId.value = payload.sppgId
      if (accessToken.value) {
        switchActiveSppg(payload.sppgId)
          .then((response) => {
            if (response.access_token) {
              accessToken.value = response.access_token
            }
            if (response.active_sppg_id) {
              activeSppgId.value = response.active_sppg_id
            }
            if (response.accessible_sppg_ids?.length) {
              accessibleSppgIds.value = response.accessible_sppg_ids
            }
            persistSession()
          })
          .catch(() => undefined)
      }
    }
    persistSession()
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

  const setDesktopSidebarCollapsed = (value: boolean) => {
    desktopSidebarCollapsed.value = value
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mbg-sidebar-collapsed', String(value))
    }
  }

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(!desktopSidebarCollapsed.value)
  }

  const setAccessToken = (token: string) => {
    accessToken.value = token
    writeStoredSession({
      accessToken: token,
      tenantId: '',
      activeSppgId: '',
      accessibleSppgIds: [],
      roles: [],
      userName: profile.value.name,
      email: profile.value.email || '',
    })
  }

  const initializeAuth = async () => {
    if (!accessToken.value) {
      authReady.value = true
      return
    }

    try {
      const me = await getCurrentProfile()
      applyProfile(me)
    } catch {
      clearStoredSession()
      accessToken.value = ''
    } finally {
      authReady.value = true
    }
  }

  const logout = () => {
    clearStoredSession()
    accessToken.value = ''
    roles.value = []
    accessibleSppgIds.value = []
    closeMobileSidebar()
  }

  return {
    tenants,
    sppgOptions,
    activeTenantId,
    activeSppgId,
    unreadNotifications,
    themeMode,
    mobileSidebarOpen,
    desktopSidebarCollapsed,
    accessToken,
    roles,
    accessibleSppgIds,
    authReady,
    profile,
    activeTenant,
    activeSppg,
    isAuthenticated,
    switchContext,
    setTheme,
    toggleTheme,
    openMobileSidebar,
    closeMobileSidebar,
    toggleMobileSidebar,
    setDesktopSidebarCollapsed,
    toggleDesktopSidebar,
    setAccessToken,
    applyProfile,
    initializeAuth,
    logout,
  }
})

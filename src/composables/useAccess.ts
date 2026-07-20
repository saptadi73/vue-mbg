import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'

export const useAccess = () => {
  const appStore = useAppStore()
  const { roles } = storeToRefs(appStore)

  const hasAnyRole = (allowed: string[]) => {
    if (!allowed.length) return true
    return allowed.some((role) => roles.value.includes(role))
  }

  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))
  const isTenantAdmin = computed(() => roles.value.includes('tenant_admin'))
  const canManageUsers = computed(() => hasAnyRole(['super_admin', 'tenant_admin']))
  const canManageTenants = computed(() => hasAnyRole(['super_admin']))
  const canManageSppg = computed(() => hasAnyRole(['super_admin', 'tenant_admin', 'operations_manager']))
  const canUseOnboardingWizard = computed(() => hasAnyRole(['super_admin', 'tenant_admin']))
  const canUseFinance = computed(() =>
    hasAnyRole(['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager']),
  )

  return {
    roles,
    hasAnyRole,
    isSuperAdmin,
    isTenantAdmin,
    canManageUsers,
    canManageTenants,
    canManageSppg,
    canUseOnboardingWizard,
    canUseFinance,
  }
}

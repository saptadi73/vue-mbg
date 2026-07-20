<script setup lang="ts">
import {
  Archive,
  BarChart3,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Building2,
  Calculator,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Database,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Map,
  Menu,
  MessageSquare,
  PackageCheck,
  PackageSearch,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Soup,
  SquareKanban,
  Truck,
  UserCog,
  UserRoundCheck,
  Users,
  Utensils,
  WalletCards,
  Warehouse,
  Workflow,
} from '@lucide/vue'
import { computed, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import iconMbgChrome from '@/assets/images/icon_mbg_chrome.png'
import iconMbgWarna from '@/assets/images/icon_mbg_warna.png'
import {
  mockInventory,
  mockPurchaseOrders,
  mockPurchaseRequests,
  mockWorkflowDocuments,
} from '@/services/mock-data'
import { useAppStore } from '@/stores/app'

const SIDEBAR_GROUP_STORAGE_KEY = 'erp-mbg-sidebar-groups'

type NavItem = {
  label: string
  to: string
  icon: Component
  roles?: string[]
  matchPrefixes?: string[]
  badge?: 'workflowPending' | 'procurementOpen' | 'inventoryAttention'
}

type NavSection = {
  id: string
  title: string
  icon: Component
  items: NavItem[]
}

const props = withDefaults(
  defineProps<{
    mobile?: boolean
  }>(),
  {
    mobile: false,
  },
)

const appStore = useAppStore()
const route = useRoute()
const allowedRoles = computed(() => appStore.roles)
const logoSrc = computed(() => (appStore.themeMode === 'dark' ? iconMbgChrome : iconMbgWarna))
const desktopCollapsed = computed(() => !props.mobile && appStore.desktopSidebarCollapsed)
const pendingApprovalCount = computed(() =>
  mockWorkflowDocuments.flatMap((item) => item.approval_requests).filter((item) => item.status === 'PENDING').length,
)
const procurementOpenCount = computed(
  () =>
    mockPurchaseRequests.filter((item) => item.status !== 'POSTED').length +
    mockPurchaseOrders.filter((item) => item.status !== 'POSTED').length,
)
const inventoryAttentionCount = computed(
  () =>
    mockInventory.filter(
      (item) => item.quality_status === 'PENDING' || item.available_quantity <= 100,
    ).length,
)

const sections: NavSection[] = [
  {
    id: 'command-center',
    title: 'Command Center',
    icon: LayoutDashboard,
    items: [
      { label: 'Overview', to: '/', icon: LayoutDashboard, matchPrefixes: ['/'] },
      { label: 'GIS Intelligence', to: '/gis', icon: Map },
      { label: 'GIS Fleet', to: '/gis/fleet', icon: Truck, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'delivery_officer'], matchPrefixes: ['/gis/fleet'] },
      { label: 'Finance', to: '/finance', icon: WalletCards, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] },
      { label: 'Finance Reports', to: '/finance/reports', icon: BarChart3, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'], matchPrefixes: ['/finance/reports'] },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    icon: ClipboardList,
    items: [
      { label: 'Meal Plans', to: '/meal-plans', icon: Utensils },
      { label: 'Inventory', to: '/inventory', icon: Boxes, badge: 'inventoryAttention' },
      { label: 'Fleet', to: '/fleet', icon: Truck, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/fleet'] },
      { label: 'Delivery', to: '/delivery', icon: PackageCheck, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'delivery_officer', 'quality_officer'], matchPrefixes: ['/delivery'] },
      { label: 'Delivery Reports', to: '/delivery/reports', icon: ClipboardList, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'delivery_officer', 'quality_officer'], matchPrefixes: ['/delivery/reports'] },
      { label: 'Feedback', to: '/feedback', icon: MessageSquare, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'delivery_officer', 'quality_officer'], matchPrefixes: ['/feedback'] },
      { label: 'Quality QC', to: '/quality/inspections', icon: ShieldCheck, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'quality_officer'], matchPrefixes: ['/quality'] },
      { label: 'Procurement', to: '/procurement', icon: ShoppingCart, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'], matchPrefixes: ['/procurement'], badge: 'procurementOpen' },
      { label: 'Costing', to: '/costing', icon: Calculator, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] },
    ],
  },
  {
    id: 'governance',
    title: 'Governance',
    icon: ShieldCheck,
    items: [
      { label: 'Budget Planning', to: '/budgets', icon: WalletCards, roles: ['super_admin', 'tenant_admin', 'finance_manager'] },
      { label: 'Workflow Approval', to: '/workflow-approvals', icon: Workflow, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'], badge: 'workflowPending' },
      { label: 'Documents', to: '/documents', icon: FileText, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'quality_officer', 'finance_manager'], matchPrefixes: ['/documents'] },
      { label: 'Audit Events', to: '/audit/events', icon: ScrollText, roles: ['super_admin', 'tenant_admin'], matchPrefixes: ['/audit'] },
      { label: 'Government Claims', to: '/government-claims', icon: Landmark, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'], matchPrefixes: ['/government-claims'] },
      { label: 'Funding', to: '/funding', icon: Landmark, roles: ['super_admin', 'tenant_admin', 'finance_manager'], matchPrefixes: ['/funding'] },
      { label: 'Chart of Accounts', to: '/accounting/accounts', icon: BookOpen, roles: ['super_admin', 'tenant_admin', 'finance_manager'], matchPrefixes: ['/accounting/accounts'] },
      { label: 'Journal Entries', to: '/accounting/journal-entries', icon: ClipboardCheck, roles: ['super_admin', 'tenant_admin', 'finance_manager'], matchPrefixes: ['/accounting/journal-entries'] },
    ],
  },
  {
    id: 'workforce',
    title: 'Workforce',
    icon: Users,
    items: [
      { label: 'Positions', to: '/workforce/positions', icon: BriefcaseBusiness, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/workforce/positions'] },
      { label: 'Employees', to: '/workforce/employees', icon: Users, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/workforce/employees'] },
      { label: 'Shifts', to: '/workforce/shifts', icon: CalendarDays, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/workforce/shifts'] },
      { label: 'Attendance', to: '/workforce/attendance', icon: ClipboardCheck, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/workforce/attendance'] },
      { label: 'Timesheets', to: '/workforce/timesheets', icon: CalendarDays, roles: ['super_admin', 'tenant_admin', 'operations_manager', 'finance_manager'], matchPrefixes: ['/workforce/timesheets'] },
    ],
  },
  {
    id: 'assets',
    title: 'Assets',
    icon: Archive,
    items: [
      { label: 'Asset Register', to: '/assets', icon: Archive, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'], matchPrefixes: ['/assets'] },
      { label: 'Asset Categories', to: '/assets/categories', icon: Boxes, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'], matchPrefixes: ['/assets/categories'] },
    ],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    icon: Database,
    items: [
      { label: 'Programs', to: '/programs', icon: SquareKanban, roles: ['super_admin', 'tenant_admin'], matchPrefixes: ['/programs'] },
      { label: 'Beneficiaries', to: '/beneficiaries', icon: UserRoundCheck, roles: ['super_admin', 'tenant_admin', 'operations_manager'], matchPrefixes: ['/beneficiaries'] },
      { label: 'Tenants', to: '/tenants', icon: Building2, roles: ['super_admin'], matchPrefixes: ['/tenants'] },
      { label: 'SPPG', to: '/sppg', icon: Soup, matchPrefixes: ['/sppg'] },
      { label: 'Schools', to: '/schools', icon: GraduationCap, matchPrefixes: ['/schools'] },
      { label: 'Products', to: '/products', icon: PackageSearch, matchPrefixes: ['/products'] },
      { label: 'Recipes', to: '/recipes', icon: BookOpen, matchPrefixes: ['/recipes'] },
      { label: 'Users', to: '/users', icon: UserCog, roles: ['super_admin', 'tenant_admin'], matchPrefixes: ['/users'] },
      { label: 'Onboarding Wizard', to: '/onboarding/wizard', icon: Warehouse, roles: ['super_admin', 'tenant_admin'], matchPrefixes: ['/onboarding'] },
    ],
  },
]

const visibleSections = computed(() =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!item.roles?.length) return true
        return item.roles.some((role) => allowedRoles.value.includes(role))
      }),
    }))
    .filter((section) => section.items.length),
)

const isItemActive = (item: NavItem) => {
  if (item.to === '/') {
    return route.path === '/'
  }

  if (route.path === item.to) {
    return true
  }

  return (item.matchPrefixes || [item.to]).some((prefix) => prefix !== '/' && route.path.startsWith(prefix))
}

const getDefaultOpenState = () =>
  Object.fromEntries(
    sections.map((section, index) => [
      section.id,
      section.id === 'operations' || section.id === 'master-data' ? true : index === 0,
    ]),
  ) as Record<string, boolean>

const openGroups = ref<Record<string, boolean>>(getDefaultOpenState())

const saveOpenGroups = () => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SIDEBAR_GROUP_STORAGE_KEY, JSON.stringify(openGroups.value))
}

const hydrateOpenGroups = () => {
  if (typeof window === 'undefined') return

  const storedValue = window.localStorage.getItem(SIDEBAR_GROUP_STORAGE_KEY)
  if (!storedValue) return

  try {
    openGroups.value = {
      ...getDefaultOpenState(),
      ...(JSON.parse(storedValue) as Record<string, boolean>),
    }
  } catch {
    openGroups.value = getDefaultOpenState()
  }
}

const ensureActiveGroupOpen = () => {
  const nextState = { ...openGroups.value }

  for (const section of visibleSections.value) {
    if (section.items.some((item) => isItemActive(item))) {
      nextState[section.id] = true
    }
  }

  openGroups.value = nextState
}

hydrateOpenGroups()
ensureActiveGroupOpen()

watch(
  visibleSections,
  () => {
    const visibleIds = new Set(visibleSections.value.map((section) => section.id))
    openGroups.value = Object.fromEntries(
      Object.entries({
        ...getDefaultOpenState(),
        ...openGroups.value,
      }).filter(([id]) => visibleIds.has(id)),
    )
    ensureActiveGroupOpen()
    saveOpenGroups()
  },
  { deep: true },
)

watch(
  () => route.path,
  () => {
    ensureActiveGroupOpen()
    saveOpenGroups()
  },
)

const toggleGroup = (sectionId: string) => {
  if (desktopCollapsed.value) {
    appStore.setDesktopSidebarCollapsed(false)
  }

  openGroups.value = {
    ...openGroups.value,
    [sectionId]: !openGroups.value[sectionId],
  }
  saveOpenGroups()
}

const handleNavigate = () => {
  ensureActiveGroupOpen()

  if (props.mobile) {
    appStore.closeMobileSidebar()
  }
}

const resolveBadge = (item: NavItem) => {
  if (item.badge === 'workflowPending') {
    return pendingApprovalCount.value
  }

  if (item.badge === 'procurementOpen') {
    return procurementOpenCount.value
  }

  if (item.badge === 'inventoryAttention') {
    return inventoryAttentionCount.value
  }

  return 0
}

const resolveItemTitle = (item: NavItem) => {
  const badge = resolveBadge(item)
  if (!desktopCollapsed.value) return undefined

  if (item.badge === 'workflowPending' && badge) {
    return `${item.label} (${badge} approval pending)`
  }

  if (item.badge === 'procurementOpen' && badge) {
    return `${item.label} (${badge} dokumen procurement terbuka)`
  }

  if (item.badge === 'inventoryAttention' && badge) {
    return `${item.label} (${badge} item perlu perhatian)`
  }

  return item.label
}
</script>

<template>
  <aside
    class="glass-panel shrink-0 flex-col p-5 transition-[width] duration-300"
    :class="[
      props.mobile ? 'flex h-full rounded-none border-l-0 border-t-0 border-b-0 w-72' : 'hidden lg:flex',
      !props.mobile && desktopCollapsed ? 'w-24' : !props.mobile ? 'w-72' : '',
      desktopCollapsed ? 'sidebar-collapsed' : '',
    ]"
  >
    <div class="mb-8 flex items-center gap-3" :class="desktopCollapsed ? 'flex-col justify-center' : 'justify-between'">
      <div class="flex min-w-0 items-center gap-3" :class="{ 'justify-center': desktopCollapsed }">
        <div class="overflow-hidden rounded-2xl border border-[var(--app-panel-border)] bg-white/80 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
          <img :src="logoSrc" alt="ERP MBG logo" class="h-14 w-14 object-cover" />
        </div>
        <div v-if="!desktopCollapsed">
          <p class="eyebrow-text tracking-[0.34em]">ERP MBG</p>
          <h1 v-if="!props.mobile" class="font-display text-xl text-app-heading">Control Grid</h1>
        </div>
      </div>

      <button
        v-if="!props.mobile"
        class="sidebar-collapse-button"
        type="button"
        :aria-label="desktopCollapsed ? 'Extend menu sidebar' : 'Collapse menu sidebar'"
        :title="desktopCollapsed ? 'Extend menu' : 'Collapse menu'"
        @click="appStore.toggleDesktopSidebar()"
      >
        <PanelLeftOpen v-if="desktopCollapsed" :size="18" stroke-width="2" />
        <Menu v-else :size="18" stroke-width="2" />
      </button>
    </div>

    <div class="space-y-3">
      <section v-for="section in visibleSections" :key="section.id" class="sidebar-group">
        <button
          class="sidebar-group-toggle"
          type="button"
          :aria-expanded="openGroups[section.id] ? 'true' : 'false'"
          :title="desktopCollapsed ? section.title : undefined"
          @click="toggleGroup(section.id)"
        >
          <span class="flex items-center gap-3">
            <span class="sidebar-item-icon">
              <component :is="section.icon" class="sidebar-svg-icon" :size="17" stroke-width="2" />
            </span>
            <span v-if="!desktopCollapsed" class="sidebar-group-label">{{ section.title }}</span>
          </span>
          <span
            v-if="!desktopCollapsed"
            class="sidebar-group-icon"
            :class="{ 'sidebar-group-icon-open': openGroups[section.id] }"
          >
            <ChevronDown :size="15" stroke-width="2.3" />
          </span>
        </button>

        <div v-if="openGroups[section.id]" class="sidebar-group-body">
          <RouterLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="nav-link"
            :title="resolveItemTitle(item)"
            :class="{ 'nav-link-active': isItemActive(item) }"
            @click="handleNavigate"
          >
            <span class="flex items-center gap-3" :class="{ 'justify-center': desktopCollapsed }">
              <span class="sidebar-item-icon">
                <component :is="item.icon" class="sidebar-svg-icon" :size="17" stroke-width="2" />
              </span>
              <span v-if="!desktopCollapsed">{{ item.label }}</span>
            </span>
            <span v-if="resolveBadge(item)" class="sidebar-item-badge" :class="{ 'sidebar-item-badge-floating': desktopCollapsed }">
              {{ resolveBadge(item) }}
            </span>
          </RouterLink>
        </div>
      </section>
    </div>

    <div v-if="!desktopCollapsed" class="surface-subtle mt-auto rounded-3xl p-4">
      <p class="eyebrow-text tracking-[0.24em]">Backend Dev</p>
      <p class="mt-2 text-sm text-app-heading">Terhubung via `.env.development` ke `127.0.0.1:8000`.</p>
      <p class="mt-3 text-xs text-app-muted">Service layer akan fallback ke mock state saat backend belum siap.</p>
    </div>
  </aside>
</template>

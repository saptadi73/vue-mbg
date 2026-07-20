<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'

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

const sections = [
  {
    title: 'Command Center',
    items: [
      { label: 'Overview', to: '/' },
      { label: 'Meal Plans', to: '/meal-plans' },
      { label: 'Inventory', to: '/inventory' },
      { label: 'Finance', to: '/finance' },
      { label: 'GIS Intelligence', to: '/gis' },
      { label: 'Tenants', to: '/tenants' },
      { label: 'SPPG', to: '/sppg' },
      { label: 'Users', to: '/users' },
      { label: 'Onboarding Wizard', to: '/onboarding/wizard' },
    ],
  },
  {
    title: 'Master Data',
    items: [
      { label: 'Schools', to: '/schools' },
      { label: 'Products', to: '/products' },
      { label: 'Recipes', to: '/recipes' },
    ],
  },
  {
    title: 'System Pulse',
    items: [
      { label: 'Workflow', to: '/finance' },
      { label: 'Analytics', to: '/gis' },
    ],
  },
]

const isActive = (path: string) => computed(() => route.path === path)
const handleNavigate = () => {
  if (props.mobile) {
    appStore.closeMobileSidebar()
  }
}
</script>

<template>
  <aside
    class="glass-panel w-72 shrink-0 flex-col p-5"
    :class="props.mobile ? 'flex h-full rounded-none border-l-0 border-t-0 border-b-0' : 'hidden lg:flex'"
  >
    <div class="mb-8 flex items-center gap-3">
      <div class="grid h-11 w-11 place-items-center rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(92,240,198,0.9),_rgba(10,23,45,0.6))] text-sm font-semibold text-slate-950">
        MB
      </div>
      <div>
        <p class="eyebrow-text tracking-[0.34em]">ERP MBG</p>
        <h1 v-if="!props.mobile" class="font-display text-xl text-app-heading">Control Grid</h1>
      </div>
    </div>

    <div v-for="section in sections" :key="section.title" class="mb-6">
      <p v-if="!props.mobile" class="mb-3 text-xs uppercase tracking-[0.24em] text-app-muted">
        {{ section.title }}
      </p>
      <nav class="space-y-2">
        <RouterLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'nav-link-active': isActive(item.to).value }"
          @click="handleNavigate"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </div>

    <div class="surface-subtle mt-auto rounded-3xl p-4">
      <p class="eyebrow-text tracking-[0.24em]">Backend Dev</p>
      <p class="mt-2 text-sm text-app-heading">Terhubung via `.env.development` ke `127.0.0.1:8000`.</p>
      <p class="mt-3 text-xs text-app-muted">Service layer akan fallback ke mock state saat backend belum siap.</p>
    </div>
  </aside>
</template>

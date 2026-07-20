<script setup lang="ts">
import { storeToRefs } from 'pinia'
import AppHeader from '@/components/app/AppHeader.vue'
import AppSidebar from '@/components/app/AppSidebar.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { mobileSidebarOpen, themeMode } = storeToRefs(appStore)
</script>

<template>
  <div class="app-bg min-h-screen" :data-theme="themeMode">
    <div
      v-if="mobileSidebarOpen"
      class="mobile-sidebar-overlay lg:hidden"
      @click="appStore.closeMobileSidebar()"
    >
      <div class="mobile-sidebar-panel" @click.stop>
        <div class="flex items-center justify-between border-b border-[var(--app-panel-border)] px-5 py-4">
          <div>
            <p class="eyebrow-text">Navigation</p>
            <p class="text-sm text-app-heading">ERP MBG Menu</p>
          </div>
          <button class="mobile-close-button" type="button" @click="appStore.closeMobileSidebar()">Tutup</button>
        </div>
        <AppSidebar mobile />
      </div>
    </div>

    <div class="mx-auto flex min-h-screen max-w-[1680px] gap-6 px-4 py-4 lg:px-6">
      <AppSidebar />

      <main class="min-w-0 flex-1 pb-10">
        <AppHeader />
        <section class="mt-6">
          <RouterView />
        </section>
      </main>
    </div>
  </div>
</template>

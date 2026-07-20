<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const { activeSppgId, activeTenant, activeTenantId, accessibleSppgIds, profile, roles, sppgOptions } =
  storeToRefs(appStore)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="My Profile"
      subtitle="Lihat identitas login, role aktif, context yayasan, dan scope SPPG yang dibawa token saat ini."
      :badges="['GET /identity/me', 'Context', 'Access Scope']"
    />

    <section class="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center gap-4">
          <div class="grid h-16 w-16 place-items-center rounded-3xl bg-teal-300 text-xl font-semibold text-slate-950">
            {{ profile.avatar }}
          </div>
          <div>
            <p class="eyebrow-text">Signed In User</p>
            <h2 class="mt-2 font-display text-3xl text-app-heading">{{ profile.name }}</h2>
            <p class="mt-1 text-sm text-app-body">{{ profile.email || '-' }}</p>
          </div>
        </div>

        <div class="mt-6 grid gap-3">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Yayasan</p>
            <p class="mt-2 text-lg font-semibold text-app-heading">{{ activeTenant?.label || activeTenantId }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Primary Role</p>
            <p class="mt-2 text-lg font-semibold text-app-heading">{{ profile.role }}</p>
          </div>
        </div>
      </article>

      <article class="glass-panel p-6">
        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="eyebrow-text">Access Scope</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Yayasan & SPPG Context</h2>
            <p class="mt-2 text-sm text-app-body">
              Context switcher memakai endpoint `POST /identity/switch-active-sppg` dan token baru dari backend.
            </p>
          </div>
          <StatusBadge status="APPROVED" />
        </div>

        <div class="mt-5 grid gap-4">
          <label class="form-field">
            <span>Yayasan Aktif</span>
            <select v-model="activeTenantId" class="toolbar-input" @change="appStore.switchContext({ tenantId: activeTenantId })">
              <option v-for="tenant in appStore.tenants" :key="tenant.id" :value="tenant.id">{{ tenant.label }}</option>
            </select>
          </label>

          <label class="form-field">
            <span>SPPG Aktif</span>
            <select v-model="activeSppgId" class="toolbar-input" @change="appStore.switchContext({ sppgId: activeSppgId })">
              <option v-for="sppg in sppgOptions" :key="sppg.id" :value="sppg.id">{{ sppg.label }}</option>
            </select>
          </label>
        </div>

        <div class="mt-6">
          <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Roles</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <span v-for="role in roles" :key="role" class="status-pill status-pill-info">{{ role }}</span>
          </div>
        </div>

        <div class="mt-6">
          <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Accessible SPPG</p>
          <div class="mt-3 grid gap-3 md:grid-cols-2">
            <div v-for="sppg in sppgOptions" :key="sppg.id" class="surface-subtle rounded-2xl p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-app-heading">{{ sppg.label }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ sppg.subtitle }}</p>
                </div>
                <StatusBadge
                  :status="accessibleSppgIds.includes(sppg.id) || activeSppgId === sppg.id ? 'APPROVED' : 'REJECTED'"
                />
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

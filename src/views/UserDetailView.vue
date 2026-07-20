<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getUserById, getUserSppgAccess } from '@/services/identity'
import { useAppStore } from '@/stores/app'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const appStore = useAppStore()
const { sppgOptions } = storeToRefs(appStore)

const userId = computed(() => String(route.params.userId || ''))
const userState = useAsyncState(() => getUserById(userId.value))
const accessState = useAsyncState(() => getUserSppgAccess(userId.value))

const user = computed(() => userState.data.value?.item ?? null)
const access = computed(() => accessState.data.value?.item ?? null)
const accessibleSppgRows = computed(() =>
  sppgOptions.value.map((sppg) => ({
    ...sppg,
    is_accessible: access.value?.accessible_sppg_ids.includes(sppg.id) || false,
    is_active: access.value?.active_sppg_id === sppg.id,
  })),
)

const sppgSearchText = (item: unknown) => {
  const row = item as { label: string; subtitle?: string; id: string }
  return [row.id, row.label, row.subtitle].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="User Detail"
      subtitle="Detail identity user, role aktif, status akun, dan scope akses SPPG sesuai kontrak backend."
      :badges="['GET /identity/users/{id}', 'SPPG Access', 'RBAC']"
    />

    <div v-if="userState.loading.value || accessState.loading.value" class="loading-panel">Memuat detail user...</div>
    <div v-else-if="userState.error.value || accessState.error.value" class="error-panel">
      <p>{{ userState.error.value || accessState.error.value }}</p>
      <button class="primary-button mt-3" @click="userState.execute(); accessState.execute()">Muat ulang</button>
    </div>

    <template v-else-if="user">
      <section class="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="eyebrow-text">Identity Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ user.full_name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ user.email }}</p>
            </div>
            <StatusBadge :status="user.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>

          <div class="mt-6 grid gap-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-app-muted">User ID</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ user.id }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Created</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">
                {{ user.created_at ? formatDateTime(user.created_at) : '-' }}
              </p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="primary-button" :to="`/users/${user.id}/edit`">Edit User & Access</RouterLink>
            <RouterLink class="secondary-button" to="/users">Kembali ke Users</RouterLink>
          </div>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Roles</p>
          <h3 class="mt-2 font-display text-2xl text-app-heading">Role Assignment</h3>
          <div class="mt-4 flex flex-wrap gap-2">
            <span v-for="role in user.role_names" :key="role" class="status-pill status-pill-info">{{ role }}</span>
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-app-muted">SPPG Aktif</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ access?.active_sppg_id || user.active_sppg_id || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.24em] text-app-muted">Jumlah Akses</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ access?.accessible_sppg_ids.length || user.accessible_sppg_ids?.length || 0 }} SPPG</p>
            </div>
          </div>

          <p v-if="userState.data.value?.fallback || accessState.data.value?.fallback" class="mt-4 text-sm text-app-muted">
            Detail memakai fallback mock karena backend identity belum mengembalikan payload lengkap.
          </p>
        </article>
      </section>

      <DataTableCard
        :items="accessibleSppgRows"
        :search-text-resolver="sppgSearchText"
        search-placeholder="Cari SPPG, id, atau deskripsi..."
        title="User SPPG Access"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>SPPG</th>
                <th>ID</th>
                <th>Akses</th>
                <th>Aktif</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="sppg in items" :key="(sppg as { id: string }).id">
                <td>
                  <p class="font-semibold text-app-heading">{{ (sppg as { label: string }).label }}</p>
                  <p class="mt-1 text-sm text-app-body">{{ (sppg as { subtitle?: string }).subtitle || '-' }}</p>
                </td>
                <td>{{ (sppg as { id: string }).id }}</td>
                <td><StatusBadge :status="(sppg as { is_accessible: boolean }).is_accessible ? 'APPROVED' : 'REJECTED'" /></td>
                <td><StatusBadge :status="(sppg as { is_active: boolean }).is_active ? 'APPROVED' : 'PENDING'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

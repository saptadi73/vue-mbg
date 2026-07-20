<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSppgs } from '@/services/sppg'
import { getTenantById } from '@/services/tenants'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId || ''))
const { data, loading, error, execute } = useAsyncState(() => getTenantById(tenantId.value))
const sppgState = useAsyncState(() => getSppgs(tenantId.value))
const tenant = computed(() => data.value?.item ?? null)
const isFallback = computed(() => data.value?.fallback ?? false)
const { canManageSppg, canManageTenants, canManageUsers, canUseOnboardingWizard } = useAccess()
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Tenant Detail"
      subtitle="Ringkasan profil tenant, status aktivasi, dan langkah onboarding berikutnya untuk mempercepat setup operasional."
      :badges="[tenantId || 'tenant', 'Detail View', 'Onboarding']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail tenant...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <template v-else-if="tenant">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="eyebrow-text">Tenant Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ tenant.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ tenant.description || 'Belum ada deskripsi tenant.' }}</p>
            </div>
            <StatusBadge :status="tenant.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Code</p>
              <p class="mt-2 text-lg font-semibold text-app-heading">{{ tenant.code }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Created At</p>
              <p class="mt-2 text-sm font-medium text-app-heading">
                {{ tenant.created_at ? formatDateTime(tenant.created_at) : '-' }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Data Source</p>
              <p class="mt-2 text-sm font-medium text-app-heading">
                {{ isFallback ? 'Mock fallback' : 'Backend detail API' }}
              </p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Quick Actions</p>
          <div class="mt-4 grid gap-3">
            <RouterLink v-if="canManageUsers" class="primary-button" to="/users/create">Tambah Admin Tenant</RouterLink>
            <RouterLink v-if="canManageSppg" class="secondary-button" :to="`/sppg/create?tenantId=${tenantId}`">Daftarkan SPPG</RouterLink>
            <RouterLink class="secondary-button" :to="`/sppg?tenantId=${tenantId}`">Lihat SPPG Tenant</RouterLink>
            <RouterLink v-if="canUseOnboardingWizard" class="secondary-button" to="/onboarding/wizard">Wizard Onboarding</RouterLink>
            <RouterLink v-if="canManageTenants" class="secondary-button" to="/tenants/create">Daftarkan Tenant Baru</RouterLink>
            <RouterLink v-if="canManageUsers" class="secondary-button" to="/users">Lihat Users</RouterLink>
          </div>
          <p class="mt-4 text-sm leading-6 text-app-body">
            Endpoint update tenant belum terdokumentasi di referensi backend saat ini, jadi halaman ini fokus pada detail dan alur onboarding lanjutannya.
          </p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Onboarding Checklist</h3>
          <div class="mt-4 space-y-3">
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">1. Verifikasi profil tenant</p>
              <p class="mt-1 text-sm text-app-body">Pastikan nama, code, dan deskripsi tenant sudah sesuai organisasi operasional.</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">2. Buat admin tenant pertama</p>
              <p class="mt-1 text-sm text-app-body">Lanjut ke registrasi user tenant admin agar akses governance dan workflow bisa dibuka.</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">3. Lanjutkan setup SPPG dan master data</p>
              <p class="mt-1 text-sm text-app-body">Setelah admin siap, lanjutkan onboarding SPPG, products, recipe, dan workflow definition.</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">SPPG Tenant</h3>
          <div v-if="sppgState.loading.value" class="mt-4 text-sm text-app-muted">Memuat daftar SPPG tenant...</div>
          <div v-else class="mt-4 space-y-3">
            <div
              v-for="item in sppgState.data.value?.items || []"
              :key="item.id"
              class="surface-subtle rounded-2xl p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-app-heading">{{ item.name }}</p>
                  <p class="mt-1 text-sm text-app-body">{{ item.code }} • {{ item.radius_km }} km</p>
                  <p class="mt-1 text-sm text-app-muted">{{ item.address }}</p>
                </div>
                <StatusBadge :status="item.is_active ? 'APPROVED' : 'REJECTED'" />
              </div>
            </div>
            <p v-if="!(sppgState.data.value?.items || []).length" class="text-sm text-app-muted">
              Belum ada SPPG terdaftar untuk tenant ini.
            </p>
          </div>
        </article>

        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Catatan Integrasi</h3>
          <div class="mt-4 space-y-3 text-sm leading-6 text-app-body">
            <p>
              Halaman ini memakai `GET /api/v1/tenants/{tenant_id}` bila tersedia. Jika backend belum mengembalikan detail yang siap dipakai,
              frontend akan fallback ke mock data pengembangan.
            </p>
            <p>
              Karena referensi API saat ini hanya mendokumentasikan `GET` dan `POST` tenant, tombol edit persisten belum saya aktifkan agar kita
              tidak mengandalkan endpoint yang belum pasti.
            </p>
            <p>
              Begitu endpoint update tenant tersedia, kita bisa tambah halaman edit dengan pola form yang sama seperti registrasi user dan tenant.
            </p>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

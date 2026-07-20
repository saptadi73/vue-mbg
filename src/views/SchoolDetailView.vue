<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSchoolById } from '@/services/master-data'
import { mockSppgs, mockTenants } from '@/services/mock-data'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const schoolId = computed(() => String(route.params.schoolId || ''))
const { data, loading, error, execute } = useAsyncState(() => getSchoolById(schoolId.value))
const school = computed(() => data.value?.item ?? null)
const tenantName = computed(() => mockTenants.find((tenant) => tenant.id === school.value?.tenant_id)?.name || '-')
const sppgName = computed(() => mockSppgs.find((item) => item.id === school.value?.sppg_id)?.name || '-')
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="School Detail"
      subtitle="Profil sekolah penerima manfaat, relasi tenant-SPPG, dan informasi lokasi untuk distribusi serta coverage."
      :badges="[schoolId || 'school', 'Detail', 'Beneficiary Point']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail school...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <template v-else-if="school">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">School Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ school.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ school.address }}</p>
            </div>
            <StatusBadge :status="school.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">NPSN</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ school.npsn }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Level</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ school.school_level }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Latitude</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(school.latitude) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Longitude</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(school.longitude) }}</p></div>
          </div>
        </article>
        <article class="glass-panel p-5">
          <p class="eyebrow-text">Linked Context</p>
          <div class="mt-4 space-y-3">
            <div class="surface-subtle rounded-2xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Tenant</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ tenantName }}</p></div>
            <div class="surface-subtle rounded-2xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">SPPG</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ sppgName }}</p></div>
            <div class="surface-subtle rounded-2xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Created</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ school.created_at ? formatDateTime(school.created_at) : '-' }}</p></div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

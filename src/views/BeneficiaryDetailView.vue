<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getBeneficiaryById } from '@/services/beneficiaries'
import { formatDate, formatDateTime } from '@/utils/format'

const route = useRoute()
const beneficiaryId = computed(() => String(route.params.beneficiaryId || ''))
const detailState = useAsyncState(() => getBeneficiaryById(beneficiaryId.value))
const beneficiary = computed(() => detailState.data.value?.item ?? null)
const isFallback = computed(() => detailState.data.value?.fallback ?? false)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Beneficiary Detail"
      subtitle="Ringkasan penerima manfaat menampilkan hubungan beneficiary dengan sekolah dan SPPG agar validasi cakupan layanan lebih mudah."
      :badges="[beneficiaryId || 'beneficiary', 'Detail View', 'School Linked']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat detail beneficiary...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="beneficiary">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="eyebrow-text">Beneficiary Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ beneficiary.full_name }}</h2>
              <p class="mt-2 text-sm text-app-body">
                {{ beneficiary.beneficiary_type }} · {{ beneficiary.gender }} ·
                {{ beneficiary.classroom_name || 'Kelas belum diisi' }}
              </p>
            </div>
            <StatusBadge :status="beneficiary.is_active ? 'ACTIVE' : 'INACTIVE'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">School</p>
              <p class="mt-2 text-lg font-semibold text-app-heading">{{ beneficiary.school_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">SPPG</p>
              <p class="mt-2 text-lg font-semibold text-app-heading">{{ beneficiary.sppg_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Date of Birth</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ formatDate(beneficiary.date_of_birth) }}</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Reference</p>
          <div class="mt-4 grid gap-3">
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm text-app-muted">External Reference</p>
              <p class="mt-2 font-semibold text-app-heading">{{ beneficiary.external_reference || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm text-app-muted">Created At</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ beneficiary.created_at ? formatDateTime(beneficiary.created_at) : '-' }}
              </p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-sm text-app-muted">Data Source</p>
              <p class="mt-2 font-semibold text-app-heading">
                {{ isFallback ? 'Mock fallback' : 'Backend detail API' }}
              </p>
            </div>
          </div>
          <RouterLink class="secondary-button mt-4 inline-flex" to="/beneficiaries">Kembali ke Beneficiaries</RouterLink>
        </article>
      </section>
    </template>
  </div>
</template>

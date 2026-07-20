<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAccess } from '@/composables/useAccess'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSchools, getProducts, getRecipes } from '@/services/master-data'
import { getSppgById } from '@/services/sppg'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const sppgId = computed(() => String(route.params.sppgId || ''))
const { data, loading, error, execute } = useAsyncState(() => getSppgById(sppgId.value))
const sppg = computed(() => data.value?.item ?? null)
const schoolState = useAsyncState(() => getSchools(undefined, sppgId.value))
const productState = useAsyncState(() => getProducts(sppg.value?.tenant_id))
const recipeState = useAsyncState(() => getRecipes(sppg.value?.tenant_id))
const { canManageSppg } = useAccess()
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="SPPG Detail"
      subtitle="Profil dapur, lokasi spasial, coverage layanan, dan shortcut ke master data operasional tenant."
      :badges="[sppgId || 'sppg', 'Kitchen Profile', 'Operational Setup']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail SPPG...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <template v-else-if="sppg">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="eyebrow-text">Kitchen Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ sppg.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ sppg.address }}</p>
            </div>
            <StatusBadge :status="sppg.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Code</p>
              <p class="mt-2 text-lg font-semibold text-app-heading">{{ sppg.code }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Latitude</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ formatNumber(sppg.latitude) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Longitude</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ formatNumber(sppg.longitude) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Radius</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ sppg.radius_km }} km</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Quick Actions</p>
          <div class="mt-4 grid gap-3">
            <RouterLink v-if="canManageSppg" class="primary-button" :to="`/sppg/${sppg.id}/edit`">Edit SPPG</RouterLink>
            <RouterLink class="secondary-button" :to="`/schools?tenantId=${sppg.tenant_id}&sppgId=${sppg.id}`">Schools</RouterLink>
            <RouterLink class="secondary-button" :to="`/products?tenantId=${sppg.tenant_id}`">Products</RouterLink>
            <RouterLink class="secondary-button" :to="`/recipes?tenantId=${sppg.tenant_id}`">Recipes</RouterLink>
          </div>
          <p class="mt-4 text-sm text-app-body">
            Draft perubahan SPPG bisa disimpan dari halaman edit walau endpoint update backend belum terdokumentasi.
          </p>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Schools Served</h3>
          <div class="mt-4 space-y-3">
            <div v-for="school in schoolState.data.value?.items || []" :key="school.id" class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">{{ school.name }}</p>
              <p class="mt-1 text-sm text-app-body">{{ school.school_level }} • {{ school.npsn }}</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Tenant Products</h3>
          <div class="mt-4 space-y-3">
            <div v-for="product in (productState.data.value?.items || []).slice(0, 4)" :key="product.id" class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">{{ product.name }}</p>
              <p class="mt-1 text-sm text-app-body">{{ product.code }} • {{ product.category_name }}</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Tenant Recipes</h3>
          <div class="mt-4 space-y-3">
            <div v-for="recipe in (recipeState.data.value?.items || []).slice(0, 4)" :key="recipe.id" class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">{{ recipe.name }}</p>
              <p class="mt-1 text-sm text-app-body">{{ recipe.code }} • {{ recipe.yield_portions }} porsi</p>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

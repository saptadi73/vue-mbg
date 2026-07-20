<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getProductById, getRecipes } from '@/services/master-data'
import { mockTenants } from '@/services/mock-data'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const productId = computed(() => String(route.params.productId || ''))
const { data, loading, error, execute } = useAsyncState(() => getProductById(productId.value))
const product = computed(() => data.value?.item ?? null)
const recipeState = useAsyncState(() => getRecipes(product.value?.tenant_id))
const tenantName = computed(() => mockTenants.find((tenant) => tenant.id === product.value?.tenant_id)?.name || '-')
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Product Detail"
      subtitle="Detail bahan atau produk yayasan yang dipakai di inventory, procurement, dan recipe composition."
      :badges="[productId || 'product', 'Detail', 'Master Product']"
    />
    <div v-if="loading" class="loading-panel">Memuat detail product...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="product">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Product Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ product.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ product.code }} • {{ product.category_name }}</p>
            </div>
            <StatusBadge :status="product.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Product Type</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ product.product_type }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">UoM</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ product.uom_id }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Yayasan</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ tenantName }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Created</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ product.created_at ? formatDateTime(product.created_at) : '-' }}</p></div>
          </div>
        </article>
        <article class="glass-panel p-5">
          <p class="eyebrow-text">Recipe Usage</p>
          <div class="mt-4 space-y-3">
            <div v-for="recipe in (recipeState.data.value?.items || []).slice(0, 4)" :key="recipe.id" class="surface-subtle rounded-2xl p-4">
              <p class="text-sm font-semibold text-app-heading">{{ recipe.name }}</p>
              <p class="mt-1 text-sm text-app-body">{{ recipe.code }}</p>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

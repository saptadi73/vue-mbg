<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockProducts, mockTenants } from '@/services/mock-data'
import { createRecipeLine, getRecipeById, getRecipeLines } from '@/services/master-data'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const recipeId = computed(() => String(route.params.recipeId || ''))
const { data, loading, error, execute } = useAsyncState(() => getRecipeById(recipeId.value))
const lineState = useAsyncState(() => getRecipeLines(recipeId.value))
const recipe = computed(() => data.value?.item ?? null)
const tenantName = computed(() => mockTenants.find((tenant) => tenant.id === recipe.value?.tenant_id)?.name || '-')
const availableProducts = computed(() =>
  mockProducts.filter((item) => item.tenant_id === recipe.value?.tenant_id),
)

const form = reactive({
  component_product_id: mockProducts[0]?.id || '',
  quantity: 1,
  uom_id: 'uom-kg',
  waste_percentage: 0,
  notes: '',
})
const formLoading = ref(false)
const formMessage = ref('')

const submitLine = async () => {
  formLoading.value = true
  formMessage.value = ''
  try {
    await createRecipeLine(recipeId.value, {
      component_product_id: form.component_product_id,
      quantity: Number(form.quantity),
      uom_id: form.uom_id,
      waste_percentage: Number(form.waste_percentage),
      notes: form.notes,
    })
    formMessage.value = 'Komponen recipe berhasil ditambahkan.'
    lineState.execute()
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Recipe Detail"
      subtitle="Detail header recipe dan komponen bahan untuk kebutuhan meal planning, costing, dan produksi."
      :badges="[recipeId || 'recipe', 'Recipe Detail', 'Recipe Lines']"
    />
    <div v-if="loading" class="loading-panel">Memuat detail recipe...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="recipe">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Recipe Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ recipe.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ recipe.notes || 'Belum ada catatan recipe.' }}</p>
            </div>
            <StatusBadge :status="recipe.is_active ? 'APPROVED' : 'REJECTED'" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Code</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ recipe.code }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Yield</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(recipe.yield_portions) }} porsi</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Yayasan</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ tenantName }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Created</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ recipe.created_at ? formatDateTime(recipe.created_at) : '-' }}</p></div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <h3 class="font-display text-xl text-app-heading">Tambah Recipe Line</h3>
          <form class="mt-4 grid gap-4" @submit.prevent="submitLine">
            <select v-model="form.component_product_id" class="toolbar-input">
              <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                {{ product.name }}
              </option>
            </select>
            <input v-model="form.quantity" class="toolbar-input" min="0" step="0.01" type="number" placeholder="Quantity" required />
            <input v-model="form.uom_id" class="toolbar-input" placeholder="uom-kg" required />
            <input v-model="form.waste_percentage" class="toolbar-input" min="0" step="0.1" type="number" placeholder="Waste %" required />
            <textarea v-model="form.notes" class="toolbar-input min-h-24" placeholder="Catatan komponen" required />
            <button class="primary-button" :disabled="formLoading" type="submit">{{ formLoading ? 'Menambah...' : 'Tambah Komponen' }}</button>
            <p v-if="formMessage" class="text-sm text-emerald-700">{{ formMessage }}</p>
          </form>
        </article>
      </section>

      <section class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Product</th><th>Quantity</th><th>UoM</th><th>Waste %</th><th>Notes</th></tr></thead>
            <tbody>
              <tr v-for="line in lineState.data.value?.items || []" :key="line.id">
                <td>{{ line.component_product_name || line.component_product_id }}</td>
                <td>{{ formatNumber(line.quantity) }}</td>
                <td>{{ line.uom_id }}</td>
                <td>{{ formatNumber(line.waste_percentage) }}</td>
                <td class="max-w-md text-app-body">{{ line.notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

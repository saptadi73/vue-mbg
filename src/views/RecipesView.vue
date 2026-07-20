<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockTenants } from '@/services/mock-data'
import { createRecipe, getRecipes } from '@/services/master-data'
import type { RecipeRecord } from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => (typeof route.query.tenantId === 'string' ? route.query.tenantId : mockTenants[0]?.id || ''))
const { data, loading, error, execute } = useAsyncState(() => getRecipes(tenantId.value))

const form = reactive({
  tenant_id: tenantId.value,
  code: '',
  name: '',
  yield_portions: 100,
  notes: '',
  is_active: true,
})
const formLoading = ref(false)
const formMessage = ref('')
const selectedStatus = ref('ALL')

const filteredRecipes = computed(() => {
  const items = data.value?.items || []
  if (selectedStatus.value === 'ALL') return items
  return items.filter((item) => (selectedStatus.value === 'ACTIVE' ? item.is_active : !item.is_active))
})

const recipeSearchText = (item: unknown) => {
  const row = item as RecipeRecord
  return [row.code, row.name, row.notes].filter(Boolean).join(' ')
}

const submit = async () => {
  formLoading.value = true
  formMessage.value = ''
  try {
    await createRecipe({ ...form, yield_portions: Number(form.yield_portions) })
    formMessage.value = 'Recipe baru berhasil didaftarkan.'
    execute()
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Recipes" subtitle="Master data recipe yayasan untuk planning menu dan costing produksi." :badges="['Recipes', tenantId, 'Master Data']" />
    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-4">
        <section class="glass-panel p-5">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="eyebrow-text">Filter</p>
              <p class="mt-2 text-sm text-app-body">Fokuskan recipe aktif atau nonaktif sambil tetap bisa melakukan pencarian cepat.</p>
            </div>
            <select v-model="selectedStatus" class="toolbar-input md:w-56">
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
        </section>

        <DataTableCard
          :items="filteredRecipes"
          :search-text-resolver="recipeSearchText"
          search-placeholder="Cari code, nama recipe, atau catatan..."
          title="Daftar Recipes"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Code</th><th>Nama</th><th>Yield</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as RecipeRecord).id">
                  <td>{{ (item as RecipeRecord).code }}</td>
                  <td>{{ (item as RecipeRecord).name }}</td>
                  <td>{{ formatNumber((item as RecipeRecord).yield_portions) }} porsi</td>
                  <td><StatusBadge :status="(item as RecipeRecord).is_active ? 'APPROVED' : 'REJECTED'" /></td>
                  <td>{{ (item as RecipeRecord).created_at ? formatDateTime((item as RecipeRecord).created_at!) : '-' }}</td>
                  <td><RouterLink class="secondary-button" :to="`/recipes/${(item as RecipeRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </div>
      <section class="glass-panel p-5">
        <h3 class="font-display text-xl text-app-heading">Tambah Recipe</h3>
        <form class="mt-4 grid gap-4" @submit.prevent="submit">
          <input v-model="form.code" class="toolbar-input" placeholder="Code recipe" required />
          <input v-model="form.name" class="toolbar-input" placeholder="Nama recipe" required />
          <input v-model="form.yield_portions" class="toolbar-input" min="1" type="number" required />
          <textarea v-model="form.notes" class="toolbar-input min-h-24" placeholder="Catatan recipe" required />
          <button class="primary-button" :disabled="formLoading || loading" type="submit">{{ formLoading ? 'Menyimpan...' : 'Daftarkan Recipe' }}</button>
          <p v-if="formMessage" class="text-sm text-emerald-700">{{ formMessage }}</p>
          <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
        </form>
      </section>
    </section>
  </div>
</template>

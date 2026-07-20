<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockTenants } from '@/services/mock-data'
import { createRecipe, getRecipes } from '@/services/master-data'
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
    <PageHeader title="Recipes" subtitle="Master data recipe tenant untuk planning menu dan costing produksi." :badges="['Recipes', tenantId, 'Master Data']" />
    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Code</th><th>Nama</th><th>Yield</th><th>Status</th><th>Dibuat</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in data?.items || []" :key="item.id">
                <td>{{ item.code }}</td><td>{{ item.name }}</td><td>{{ formatNumber(item.yield_portions) }} porsi</td>
                <td><StatusBadge :status="item.is_active ? 'APPROVED' : 'REJECTED'" /></td>
                <td>{{ item.created_at ? formatDateTime(item.created_at) : '-' }}</td>
                <td><RouterLink class="secondary-button" :to="`/recipes/${item.id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockTenants } from '@/services/mock-data'
import { createProduct, getProducts } from '@/services/master-data'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => (typeof route.query.tenantId === 'string' ? route.query.tenantId : mockTenants[0]?.id || ''))
const { data, loading, error, execute } = useAsyncState(() => getProducts(tenantId.value))

const form = reactive({
  tenant_id: tenantId.value,
  code: '',
  name: '',
  product_type: 'RAW_MATERIAL',
  uom_id: 'uom-kg',
  category_name: '',
  is_active: true,
})
const formLoading = ref(false)
const formMessage = ref('')

const submit = async () => {
  formLoading.value = true
  formMessage.value = ''
  try {
    await createProduct(form)
    formMessage.value = 'Produk baru berhasil didaftarkan.'
    execute()
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Products" subtitle="Master data bahan dan produk tenant untuk meal plan, procurement, dan inventory." :badges="['Products', tenantId, 'Master Data']" />
    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>Code</th><th>Nama</th><th>Type</th><th>Kategori</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in data?.items || []" :key="item.id">
                <td>{{ item.code }}</td><td>{{ item.name }}</td><td>{{ item.product_type }}</td><td>{{ item.category_name }}</td>
                <td><StatusBadge :status="item.is_active ? 'APPROVED' : 'REJECTED'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="glass-panel p-5">
        <h3 class="font-display text-xl text-app-heading">Tambah Product</h3>
        <form class="mt-4 grid gap-4" @submit.prevent="submit">
          <input v-model="form.code" class="toolbar-input" placeholder="Code produk" required />
          <input v-model="form.name" class="toolbar-input" placeholder="Nama produk" required />
          <select v-model="form.product_type" class="toolbar-input"><option>RAW_MATERIAL</option><option>FINISHED_GOOD</option></select>
          <input v-model="form.uom_id" class="toolbar-input" placeholder="uom-kg" required />
          <input v-model="form.category_name" class="toolbar-input" placeholder="Kategori" required />
          <button class="primary-button" :disabled="formLoading || loading" type="submit">{{ formLoading ? 'Menyimpan...' : 'Daftarkan Product' }}</button>
          <p v-if="formMessage" class="text-sm text-emerald-700">{{ formMessage }}</p>
          <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
        </form>
      </section>
    </section>
  </div>
</template>

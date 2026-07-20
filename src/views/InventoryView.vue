<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getInventoryBalances, getInventoryExpiryAlerts, previewFefo } from '@/services/operations'
import type { FefoPreviewCandidate, FefoPreviewResult, InventoryBalance, InventoryBatchRecord } from '@/types/domain'
import { formatCurrency, formatNumber } from '@/utils/format'

const balancesState = useAsyncState(getInventoryBalances)
const expiryState = useAsyncState(getInventoryExpiryAlerts)

const fefoForm = reactive({
  product_name: 'Ayam Fillet',
  warehouse_id: 'wh-main-1',
  required_quantity: 80,
})

const fefoLoading = ref(false)
const fefoError = ref('')
const fefoResult = ref<FefoPreviewResult | null>(null)

const inventorySearchText = (item: unknown) => {
  const row = item as InventoryBalance
  return [row.warehouse_name, row.location_name, row.product_name, row.quality_status].filter(Boolean).join(' ')
}

const expirySearchText = (item: unknown) => {
  const row = item as InventoryBatchRecord
  return [row.batch_number, row.product_name, row.warehouse_name, row.location_name, row.quality_status].filter(Boolean).join(' ')
}

const fefoCandidateSearchText = (item: unknown) => {
  const row = item as FefoPreviewCandidate
  return [row.batch_number, row.warehouse_name, row.expiry_date, row.quality_status].filter(Boolean).join(' ')
}

const warehouseOptions = computed(() => {
  const map = new Map<string, string>()
  for (const item of expiryState.data.value?.items || []) {
    map.set(item.warehouse_id, item.warehouse_name)
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const productOptions = computed(() => {
  const names = new Set((expiryState.data.value?.items || []).map((item) => item.product_name))
  return Array.from(names)
})

const expiryAttentionCount = computed(
  () => (expiryState.data.value?.items || []).filter((item) => item.quality_status === 'PENDING' || item.blocked).length,
)

const runFefoPreview = async () => {
  fefoLoading.value = true
  fefoError.value = ''

  try {
    fefoResult.value = await previewFefo({
      product_name: fefoForm.product_name,
      warehouse_id: fefoForm.warehouse_id,
      required_quantity: Number(fefoForm.required_quantity),
    })
  } catch (err) {
    fefoError.value = err instanceof Error ? err.message : 'FEFO preview gagal dijalankan.'
  } finally {
    fefoLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Inventory Pulse"
      subtitle="Konsolidasi balance, risiko stok, expiry, dan kesiapan FEFO agar operasi dapur tetap aman dan cepat."
      :badges="['Warehouse', 'Balances', 'Expiry Alert', 'FEFO Preview']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Inventory items</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ balancesState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Saldo stok aktif lintas warehouse dan location.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Expiry tracked batches</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ expiryState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Batch yang dipantau untuk expiry dan quality status.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Need attention</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ expiryAttentionCount }}</p>
        <p class="mt-2 text-sm text-app-body">Batch pending quality atau blocked agar tidak terpakai sembarangan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Last FEFO check</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ fefoResult ? formatNumber(fefoResult.fulfilled_quantity) : '-' }}</p>
        <p class="mt-2 text-sm text-app-body">Jumlah yang dapat dipenuhi dari preview batch FEFO terakhir.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <DataTableCard
        :items="balancesState.data.value?.items || []"
        :search-text-resolver="inventorySearchText"
        search-placeholder="Cari warehouse, lokasi, produk, atau quality..."
        title="Inventory Balances"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Location</th>
                <th>Product</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Available</th>
                <th>Avg Cost</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as InventoryBalance).id">
                <td>{{ (item as InventoryBalance).warehouse_name }}</td>
                <td>{{ (item as InventoryBalance).location_name }}</td>
                <td>{{ (item as InventoryBalance).product_name }}</td>
                <td>{{ formatNumber((item as InventoryBalance).quantity_on_hand) }}</td>
                <td>{{ formatNumber((item as InventoryBalance).reserved_quantity) }}</td>
                <td>{{ formatNumber((item as InventoryBalance).available_quantity) }}</td>
                <td>{{ formatCurrency((item as InventoryBalance).average_cost) }}</td>
                <td><StatusBadge :status="(item as InventoryBalance).quality_status || 'OPEN'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">FEFO Preview</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Simulasi pemilihan batch</h2>
          </div>
          <span class="status-pill">POST /inventory/issues/fefo-preview</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="runFefoPreview">
          <label class="form-field">
            <span>Produk</span>
            <select v-model="fefoForm.product_name" class="toolbar-input">
              <option v-for="item in productOptions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Warehouse</span>
            <select v-model="fefoForm.warehouse_id" class="toolbar-input">
              <option v-for="item in warehouseOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Required quantity</span>
            <input v-model.number="fefoForm.required_quantity" class="toolbar-input" min="1" step="1" type="number" required />
          </label>
          <button class="primary-button" :disabled="fefoLoading" type="submit">
            {{ fefoLoading ? 'Menjalankan...' : 'Jalankan FEFO Preview' }}
          </button>
        </form>

        <div v-if="fefoError" class="error-panel mt-5">
          <p>{{ fefoError }}</p>
        </div>

        <div v-if="fefoResult" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">{{ fefoResult.product_name }} | {{ fefoResult.warehouse_name }}</p>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <p class="text-sm text-app-body">Required: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.required_quantity) }}</span></p>
              <p class="text-sm text-app-body">Fulfilled: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.fulfilled_quantity) }}</span></p>
              <p class="text-sm text-app-body">Shortage: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.shortage_quantity) }}</span></p>
            </div>
          </div>

          <DataTableCard
            :items="fefoResult.candidate_batches"
            :page-size="4"
            :search-text-resolver="fefoCandidateSearchText"
            empty-message="Tidak ada batch kandidat untuk preview ini."
            search-placeholder="Cari batch, warehouse, expiry..."
            title="Candidate Batches"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead><tr><th>Batch</th><th>Expiry</th><th>Available</th><th>Allocated</th><th>Quality</th></tr></thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as FefoPreviewCandidate).batch_id">
                    <td>{{ (item as FefoPreviewCandidate).batch_number }}</td>
                    <td>{{ (item as FefoPreviewCandidate).expiry_date }}</td>
                    <td>{{ formatNumber((item as FefoPreviewCandidate).quantity_available) }}</td>
                    <td>{{ formatNumber((item as FefoPreviewCandidate).allocated_quantity) }}</td>
                    <td><StatusBadge :status="(item as FefoPreviewCandidate).quality_status || 'OPEN'" /></td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>
        </div>
      </article>
    </section>

    <DataTableCard
      :items="expiryState.data.value?.items || []"
      :search-text-resolver="expirySearchText"
      search-placeholder="Cari batch, produk, warehouse, atau quality..."
      title="Expiry Alerts"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Batch No</th>
              <th>Product</th>
              <th>Warehouse</th>
              <th>Location</th>
              <th>Expiry Date</th>
              <th>Qty Available</th>
              <th>Blocked</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as InventoryBatchRecord).id">
              <td>{{ (item as InventoryBatchRecord).batch_number }}</td>
              <td>{{ (item as InventoryBatchRecord).product_name }}</td>
              <td>{{ (item as InventoryBatchRecord).warehouse_name }}</td>
              <td>{{ (item as InventoryBatchRecord).location_name }}</td>
              <td>{{ (item as InventoryBatchRecord).expiry_date }}</td>
              <td>{{ formatNumber((item as InventoryBatchRecord).quantity_available) }}</td>
              <td>
                <StatusBadge :status="(item as InventoryBatchRecord).blocked ? 'FAILED' : 'APPROVED'" />
              </td>
              <td><StatusBadge :status="(item as InventoryBatchRecord).quality_status" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

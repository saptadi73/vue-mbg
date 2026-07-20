<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getPurchaseOrderById } from '@/services/erp-ops'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const purchaseOrderId = computed(() => String(route.params.purchaseOrderId || ''))
const { data, loading, error, execute } = useAsyncState(() => getPurchaseOrderById(purchaseOrderId.value))
const detail = computed(() => data.value ?? null)
const header = computed(() => detail.value?.purchase_order ?? null)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Purchase Order Detail"
      subtitle="PO memperjelas supplier, expected date, dan nilai komitmen pembelian sebelum barang diterima di gudang."
      :badges="[purchaseOrderId || 'purchase-order', 'PO', 'Supplier Commitment']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail purchase order...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Order Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.po_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.supplier_name }} · {{ header.order_type || 'PO' }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Order Date</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(header.po_date) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Expected</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.expected_date ? formatDate(header.expected_date) : '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Total</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.total_amount) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Type</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.order_type || 'PO' }}</p></div>
          </div>
        </article>
        <article class="glass-panel p-5">
          <p class="eyebrow-text">Notes</p>
          <p class="mt-4 text-sm text-app-body">{{ header.notes }}</p>
          <RouterLink class="primary-button mt-5" to="/procurement">Kembali ke Procurement</RouterLink>
        </article>
      </section>

      <section class="glass-panel overflow-hidden">
        <div class="overflow-x-auto p-6">
          <table class="data-table">
            <thead><tr><th>Product</th><th>Qty</th><th>UoM</th><th>Unit Price</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="line in detail.lines" :key="line.id">
                <td>{{ line.product_code }} - {{ line.product_name }}</td>
                <td>{{ formatNumber(line.quantity) }}</td>
                <td>{{ line.uom_id }}</td>
                <td>{{ formatCurrency(line.unit_price) }}</td>
                <td>{{ formatCurrency(line.total_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

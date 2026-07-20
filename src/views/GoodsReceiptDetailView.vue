<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocumentActionCard from '@/components/common/DocumentActionCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createSupplierInvoiceFromGoodsReceipt, getGoodsReceiptById } from '@/services/erp-ops'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const goodsReceiptId = computed(() => String(route.params.goodsReceiptId || ''))
const { data, loading, error, execute } = useAsyncState(() => getGoodsReceiptById(goodsReceiptId.value))
const detail = computed(() => data.value ?? null)
const header = computed(() => detail.value?.goods_receipt ?? null)
const actionLoading = ref(false)
const actionError = ref('')

const handleCreateInvoice = async () => {
  actionLoading.value = true
  actionError.value = ''

  try {
    const result = await createSupplierInvoiceFromGoodsReceipt(goodsReceiptId.value)
    await router.push(`/procurement/supplier-invoices/${result.record.supplier_invoice.id}`)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Gagal membuat supplier invoice dari goods receipt.'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Goods Receipt Detail"
      subtitle="Goods receipt adalah titik transisi dari reserved ke committed budget dan dari komitmen pembelian ke stok gudang."
      :badges="[goodsReceiptId || 'goods-receipt', 'GR', 'Committed Budget']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail goods receipt...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Receipt Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.receipt_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.source_number }} · {{ header.warehouse_name || '-' }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Receipt Date</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(header.receipt_date) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Warehouse</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.warehouse_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Location</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.location_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Committed</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.committed_amount || 0) }}</p></div>
          </div>
        </article>
        <div class="space-y-4">
          <DocumentActionCard
            action-label="Create Supplier Invoice"
            :description="`Buat invoice supplier dari ${header.receipt_number} agar actual budget dan hutang supplier bisa mulai dicatat.`"
            :helper-text="actionError || 'Jika invoice untuk goods receipt ini sudah ada, sistem akan membuka dokumen invoice yang sudah tersedia.'"
            :loading="actionLoading"
            title="Lanjut ke Supplier Invoice"
            @action="handleCreateInvoice"
          >
            <div class="mt-4 flex items-center justify-between rounded-3xl border border-[var(--app-panel-border)] px-4 py-3 text-sm">
              <span class="text-app-muted">GR status</span>
              <StatusBadge :status="header.status" />
            </div>
          </DocumentActionCard>

          <article class="glass-panel p-5">
            <p class="eyebrow-text">Notes</p>
            <p class="mt-4 text-sm text-app-body">{{ header.notes }}</p>
            <RouterLink class="secondary-button mt-5 w-full" to="/procurement">Kembali ke Procurement</RouterLink>
          </article>
        </div>
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

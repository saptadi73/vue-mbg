<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocumentActionCard from '@/components/common/DocumentActionCard.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createSupplierInvoiceFromGoodsReceipt, getGoodsReceiptById } from '@/services/erp-ops'
import { getTraceLabel } from '@/services/food-safety'
import { isQzReady, printQrLabel } from '@/services/thermal-printer'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const goodsReceiptId = computed(() => String(route.params.goodsReceiptId || ''))
const { data, loading, error, execute } = useAsyncState(() => getGoodsReceiptById(goodsReceiptId.value))
const detail = computed(() => data.value ?? null)
const header = computed(() => detail.value?.goods_receipt ?? null)
const actionLoading = ref(false)
const actionError = ref('')
const printLoading = ref(false)
const printMessage = ref('')
const printError = ref('')

const browserPrintQr = (qrValue: string, text: string) => {
  const w = window.open('', '_blank')
  if (!w) throw new Error('Popup print diblokir. Aktifkan popup browser untuk fallback print.')
  const encoded = encodeURIComponent(qrValue)
  w.document.write(`
    <html>
      <body style="font-family:Arial,sans-serif;padding:20px;text-align:center;">
        <h3>QR Label Goods Receipt</h3>
        <img src="https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encoded}&choe=UTF-8" alt="QR Label" />
        <p style="margin-top:12px;">${text}</p>
      </body>
    </html>
  `)
  w.document.close()
  w.print()
}

const printGoodsReceiptLabel = async () => {
  if (!header.value) return
  printLoading.value = true
  printError.value = ''
  printMessage.value = ''

  const baseText = header.value.receipt_number
  try {
    let labelText = baseText
    try {
      const traceLabel = await getTraceLabel(baseText)
      if (traceLabel?.label?.content) {
        labelText = `${baseText} - ${traceLabel.label.content}`
      }
    } catch {
      // Trace label endpoint belum siap untuk semua kasus; fallback ke number receipt.
    }

    if (await isQzReady()) {
      await printQrLabel({ value: labelText })
      printMessage.value = 'Label berhasil dikirim ke printer thermal.'
    } else {
      browserPrintQr(labelText, baseText)
      printMessage.value = 'Fallback browser print dipanggil.'
    }
  } catch (err) {
    printError.value = err instanceof Error ? err.message : 'Gagal mencetak label QR.'
  } finally {
    printLoading.value = false
  }
}

const printBatchLabel = async (traceCode: string) => {
  printLoading.value = true
  printError.value = ''
  printMessage.value = ''
  try {
    const traceLabel = await getTraceLabel(traceCode)
    const value = traceLabel?.label?.content
      ? `${traceCode} - ${traceLabel.label.content}`
      : traceCode
    if (await isQzReady()) {
      await printQrLabel({ value })
      printMessage.value = `Label ${traceCode} dikirim ke printer thermal.`
    } else {
      browserPrintQr(value, traceCode)
      printMessage.value = `Fallback browser print untuk ${traceCode} dipanggil.`
    }
  } catch (err) {
    printError.value = err instanceof Error ? err.message : 'Gagal mencetak label batch.'
  } finally {
    printLoading.value = false
  }
}

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

    <LoadingSkeleton v-if="loading" variant="detail" label="Memuat detail goods receipt" />
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
            <div class="mt-4 flex items-center justify-between rounded-3xl border border-(--app-panel-border) px-4 py-3 text-sm">
              <span class="text-app-muted">GR status</span>
              <StatusBadge :status="header.status" />
            </div>
          </DocumentActionCard>

          <article class="glass-panel p-5">
            <p class="eyebrow-text">Notes</p>
            <p class="mt-4 text-sm text-app-body">{{ header.notes }}</p>
            <button
              class="primary-button mt-4 w-full"
              :disabled="printLoading"
              type="button"
              @click="printGoodsReceiptLabel"
            >
              {{ printLoading ? 'Mencetak...' : 'Cetak QR saat penerimaan' }}
            </button>
            <p v-if="printMessage" class="mt-2 text-sm text-emerald-700">{{ printMessage }}</p>
            <p v-if="printError" class="mt-2 text-sm text-rose-700">{{ printError }}</p>
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

      <section v-if="detail.inventory_batches?.length" class="glass-panel overflow-hidden">
        <div class="px-6 pt-6">
          <p class="eyebrow-text">Received Batch Traceability</p>
          <h3 class="mt-2 font-display text-2xl text-app-heading">Batch, expiry, quality, dan QR lineage</h3>
        </div>
        <div class="overflow-x-auto p-6 pt-4">
          <table class="data-table">
            <thead>
              <tr><th>Batch / Trace</th><th>Product</th><th>Received / Expiry</th><th>Quality</th><th>Available</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <tr v-for="batch in detail.inventory_batches" :key="batch.id">
                <td>
                  <p class="font-medium text-app-heading">{{ batch.batch_number }}</p>
                  <p class="mt-1 font-mono text-xs text-app-muted">{{ batch.trace_code || '-' }}</p>
                </td>
                <td>{{ batch.product_name }}</td>
                <td>
                  <p>{{ batch.received_date ? formatDate(batch.received_date) : '-' }}</p>
                  <p class="mt-1 text-xs text-app-muted">Exp. {{ formatDate(batch.expiry_date) }}</p>
                </td>
                <td>
                  <div class="flex flex-wrap items-center gap-2">
                    <StatusBadge :status="batch.quality_status" />
                    <StatusBadge v-if="batch.is_blocked || batch.blocked" status="BLOCKED" />
                  </div>
                </td>
                <td>{{ formatNumber(batch.quantity_available) }}</td>
                <td>
                  <div v-if="batch.trace_code" class="flex flex-wrap gap-2">
                    <button class="secondary-button" :disabled="printLoading" @click="printBatchLabel(batch.trace_code)">Print QR</button>
                    <RouterLink class="secondary-button" :to="{ path: '/quality/food-safety', query: { trace: batch.trace_code, direction: 'forward' } }">Forward Trace</RouterLink>
                  </div>
                  <span v-else class="text-xs text-app-muted">Trace unavailable</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

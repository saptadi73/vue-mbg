<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DocumentActionCard from '@/components/common/DocumentActionCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createPurchaseOrderFromPurchaseRequest, getPurchaseRequestById } from '@/services/erp-ops'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const purchaseRequestId = computed(() => String(route.params.purchaseRequestId || ''))
const { data, loading, error, execute } = useAsyncState(() => getPurchaseRequestById(purchaseRequestId.value))
const detail = computed(() => data.value ?? null)
const header = computed(() => detail.value?.purchase_request ?? null)
const actionLoading = ref(false)
const actionError = ref('')

const handleCreatePurchaseOrder = async () => {
  actionLoading.value = true
  actionError.value = ''

  try {
    const result = await createPurchaseOrderFromPurchaseRequest(purchaseRequestId.value)
    await router.push(`/procurement/purchase-orders/${result.record.purchase_order.id}`)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Gagal membuat purchase order dari purchase request.'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Purchase Request Detail"
      subtitle="PR adalah titik awal procurement. Di sini terlihat kebutuhan material, reserve budget, dan konteks meal plan atau shortage operasional."
      :badges="[purchaseRequestId || 'purchase-request', 'PR', 'Reserved Budget']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail purchase request...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Request Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.request_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.supplier_name || '-' }} | Meal Plan {{ header.meal_plan_id || '-' }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Tanggal</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(header.request_date) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Estimasi</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.total_estimated_cost) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Budget Account</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.budget_account_code || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Reserved</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.reserved_amount || 0) }}</p></div>
          </div>
        </article>

        <div class="space-y-4">
          <DocumentActionCard
            action-label="Create PO from PR"
            :description="`Konversi ${header.request_number} menjadi purchase order supaya supplier commitment dan expected receiving bisa dikelola.`"
            :helper-text="actionError || 'Jika PO untuk PR ini sudah pernah dibuat, sistem akan membuka dokumen yang sudah ada.'"
            :loading="actionLoading"
            title="Lanjut ke Purchase Order"
            @action="handleCreatePurchaseOrder"
          >
            <div class="mt-4 flex items-center justify-between rounded-3xl border border-[var(--app-panel-border)] px-4 py-3 text-sm">
              <span class="text-app-muted">Source status</span>
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

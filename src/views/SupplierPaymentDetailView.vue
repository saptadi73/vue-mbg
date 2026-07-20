<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSupplierPaymentById } from '@/services/erp-ops'
import { formatCurrency, formatDate } from '@/utils/format'

const route = useRoute()
const supplierPaymentId = computed(() => String(route.params.supplierPaymentId || ''))
const { data, loading, error, execute } = useAsyncState(() => getSupplierPaymentById(supplierPaymentId.value))
const detail = computed(() => data.value ?? null)
const header = computed(() => detail.value?.supplier_payment ?? null)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Supplier Payment Detail"
      subtitle="Payment menutup hutang supplier dan memindahkan transaksi dari payable menjadi kas/bank keluar."
      :badges="[supplierPaymentId || 'supplier-payment', 'Payment', 'Cash Out']"
    />

    <div v-if="loading" class="loading-panel">Memuat detail supplier payment...</div>
    <div v-else-if="error" class="error-panel"><p>{{ error }}</p><button class="primary-button mt-3" @click="execute">Muat ulang</button></div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Payment Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.payment_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.supplier_name }} · {{ header.supplier_invoice_number || '-' }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Payment Date</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(header.payment_date) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Amount</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.amount) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Bank Account</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.bank_account_code || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Invoice</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.supplier_invoice_number || '-' }}</p></div>
          </div>
        </article>
        <article class="glass-panel p-5">
          <p class="eyebrow-text">Notes</p>
          <p class="mt-4 text-sm text-app-body">{{ header.notes }}</p>
          <RouterLink class="primary-button mt-5" to="/procurement">Kembali ke Procurement</RouterLink>
        </article>
      </section>
    </template>
  </div>
</template>

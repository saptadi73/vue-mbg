<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSupplierById } from '@/services/erp-ops'
import type {
  PurchaseOrderRecord,
  SupplierPriceHistoryRecord,
  SupplierProductRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

type SupplierTab = 'profile' | 'supplier-products' | 'price-histories' | 'purchase-orders'

const route = useRoute()
const supplierId = computed(() => String(route.params.supplierId || ''))
const supplierState = useAsyncState(() => getSupplierById(supplierId.value))
const activeTab = ref<SupplierTab>('profile')

const detail = computed(() => supplierState.data.value ?? null)
const header = computed(() => detail.value?.supplier ?? null)

const tabs: Array<{ id: SupplierTab; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'supplier-products', label: 'Supplier Products' },
  { id: 'price-histories', label: 'Price Histories' },
  { id: 'purchase-orders', label: 'Purchase Orders' },
]

const supplierProductSearchText = (item: unknown) => {
  const row = item as SupplierProductRecord
  return [row.product_code, row.product_name, row.supplier_product_code, row.purchase_uom_id].filter(Boolean).join(' ')
}

const supplierPriceHistorySearchText = (item: unknown) => {
  const row = item as SupplierPriceHistoryRecord
  return [row.product_name, row.effective_from, row.effective_to].filter(Boolean).join(' ')
}

const purchaseOrderSearchText = (item: unknown) => {
  const row = item as PurchaseOrderRecord
  return [row.po_number, row.supplier_name, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Supplier Detail"
      subtitle="Detail supplier merangkum profil vendor, mapping produk, histori harga, dan purchase order terkait agar tim procurement bisa menilai kesiapan dan performa supplier dari satu layar."
      :badges="[supplierId || 'supplier', 'Vendor Relationship', 'Procurement Master']"
    />

    <div v-if="supplierState.loading.value" class="loading-panel">Memuat detail supplier...</div>
    <div v-else-if="supplierState.error.value" class="error-panel">
      <p>{{ supplierState.error.value }}</p>
      <button class="primary-button mt-3" @click="supplierState.execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article class="glass-panel p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Supplier Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.supplier_type }} | {{ header.contact_person || 'Tanpa PIC' }}</p>
            </div>
            <StatusBadge :status="header.status || 'ACTIVE'" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Products</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ detail.supplier_products.length }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Price History</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ detail.price_histories.length }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Purchase Orders</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ detail.purchase_orders.length }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Email</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ header.email || '-' }}</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Quick Contact</p>
          <div class="mt-4 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Contact person</p>
              <p class="mt-2 font-semibold text-app-heading">{{ header.contact_person || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Phone</p>
              <p class="mt-2 font-semibold text-app-heading">{{ header.phone || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Address</p>
              <p class="mt-2 text-sm text-app-body">{{ header.address || '-' }}</p>
            </div>
          </div>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="
              activeTab === tab.id
                ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading'
                : 'border-[var(--app-panel-border)] text-app-body hover:border-[var(--color-brand-300)]'
            "
            type="button"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </section>

      <article v-if="activeTab === 'profile'" class="glass-panel p-6">
        <p class="eyebrow-text">Profile</p>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Supplier name</p>
            <p class="mt-2 font-semibold text-app-heading">{{ header.name }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Supplier type</p>
            <p class="mt-2 font-semibold text-app-heading">{{ header.supplier_type }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Email</p>
            <p class="mt-2 font-semibold text-app-heading">{{ header.email || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Phone</p>
            <p class="mt-2 font-semibold text-app-heading">{{ header.phone || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4 md:col-span-2">
            <p class="text-sm text-app-muted">Address</p>
            <p class="mt-2 text-sm text-app-body">{{ header.address || '-' }}</p>
          </div>
        </div>
      </article>

      <DataTableCard
        v-else-if="activeTab === 'supplier-products'"
        :items="detail.supplier_products"
        :search-text-resolver="supplierProductSearchText"
        empty-message="Belum ada mapping supplier-produk."
        search-placeholder="Cari kode produk, nama, atau SKU..."
        title="Supplier Products"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Produk</th><th>UOM</th><th>MOQ</th><th>Lead Time</th><th>Preferred</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as SupplierProductRecord).id">
                <td>
                  {{ (item as SupplierProductRecord).product_code }} - {{ (item as SupplierProductRecord).product_name }}
                  <p class="mt-1 text-xs text-app-muted">{{ (item as SupplierProductRecord).supplier_product_code || '-' }}</p>
                </td>
                <td>{{ (item as SupplierProductRecord).purchase_uom_id }}</td>
                <td>{{ (item as SupplierProductRecord).minimum_order_qty || 0 }}</td>
                <td>{{ (item as SupplierProductRecord).lead_time_days || 0 }} hari</td>
                <td>{{ (item as SupplierProductRecord).is_preferred ? 'Ya' : 'Tidak' }}</td>
                <td><StatusBadge :status="(item as SupplierProductRecord).is_active ? 'ACTIVE' : 'INACTIVE'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else-if="activeTab === 'price-histories'"
        :items="detail.price_histories"
        :search-text-resolver="supplierPriceHistorySearchText"
        empty-message="Belum ada histori harga supplier."
        search-placeholder="Cari produk atau periode harga..."
        title="Price Histories"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Produk</th><th>Harga</th><th>Effective From</th><th>Effective To</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as SupplierPriceHistoryRecord).id">
                <td>{{ (item as SupplierPriceHistoryRecord).product_name }}</td>
                <td>{{ formatCurrency((item as SupplierPriceHistoryRecord).price) }}</td>
                <td>{{ formatDate((item as SupplierPriceHistoryRecord).effective_from) }}</td>
                <td>{{ (item as SupplierPriceHistoryRecord).effective_to ? formatDate((item as SupplierPriceHistoryRecord).effective_to || '') : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else
        :items="detail.purchase_orders"
        :search-text-resolver="purchaseOrderSearchText"
        empty-message="Belum ada purchase order terkait supplier ini."
        search-placeholder="Cari nomor PO atau status..."
        title="Purchase Orders"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Nomor</th><th>Tanggal</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as PurchaseOrderRecord).id">
                <td>{{ (item as PurchaseOrderRecord).po_number }}</td>
                <td>{{ formatDate((item as PurchaseOrderRecord).po_date) }}</td>
                <td>{{ formatCurrency((item as PurchaseOrderRecord).total_amount) }}</td>
                <td><StatusBadge :status="(item as PurchaseOrderRecord).status" /></td>
                <td><RouterLink class="secondary-button" :to="`/procurement/purchase-orders/${(item as PurchaseOrderRecord).id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createSupplier,
  createSupplierPriceHistory,
  createSupplierProduct,
  getGoodsReceipts,
  getPurchaseOrders,
  getPurchaseRequests,
  getSupplierInvoices,
  getSupplierPayments,
  getSupplierPriceHistories,
  getSupplierProducts,
  getSuppliers,
} from '@/services/erp-ops'
import type {
  GoodsReceiptRecord,
  PurchaseOrderRecord,
  PurchaseRequestRecord,
  SupplierInvoiceRecord,
  SupplierPaymentRecord,
  SupplierPriceHistoryRecord,
  SupplierProductRecord,
  SupplierRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const suppliersState = useAsyncState(getSuppliers)
const supplierProductsState = useAsyncState(getSupplierProducts)
const supplierPriceHistoriesState = useAsyncState(getSupplierPriceHistories)
const prState = useAsyncState(getPurchaseRequests)
const poState = useAsyncState(getPurchaseOrders)
const grState = useAsyncState(getGoodsReceipts)
const invoiceState = useAsyncState(getSupplierInvoices)
const paymentState = useAsyncState(getSupplierPayments)

const saving = ref(false)
const supplierProductSaving = ref(false)
const supplierPriceSaving = ref(false)
const supplierForm = reactive({
  name: 'Supplier Bahan Segar Baru',
  supplier_type: 'VENDOR',
  contact_person: 'Dewi Lestari',
  phone: '081288899900',
  email: 'dewi.lestari@supplier.local',
  address: 'Jl. Ketahanan Pangan No. 12, Jakarta',
  status: 'ACTIVE',
})
const supplierProductForm = reactive({
  supplier_id: 'sup-1',
  product_id: 'product-1',
  purchase_uom_id: 'uom-kg',
  supplier_product_code: 'NEW-SKU-001',
  minimum_order_qty: 25,
  lead_time_days: 2,
  is_preferred: true,
  is_active: true,
})
const supplierPriceForm = reactive({
  supplier_product_id: 'sup-prod-1',
  price: 14900,
  effective_from: '2026-07-20',
  effective_to: '',
})

const totalOpenProcurement = computed(
  () =>
    (prState.data.value?.items || []).filter((item) => item.status !== 'POSTED').length +
    (poState.data.value?.items || []).filter((item) => item.status !== 'POSTED').length,
)

const submitSupplier = async () => {
  saving.value = true
  try {
    const created = await createSupplier(supplierForm)
    if (suppliersState.data.value) {
      suppliersState.data.value = {
        ...suppliersState.data.value,
        items: [created, ...suppliersState.data.value.items],
        total: suppliersState.data.value.total + 1,
      }
    }
  } finally {
    saving.value = false
  }
}

const submitSupplierProduct = async () => {
  supplierProductSaving.value = true
  try {
    const created = await createSupplierProduct({
      supplier_id: supplierProductForm.supplier_id,
      product_id: supplierProductForm.product_id,
      purchase_uom_id: supplierProductForm.purchase_uom_id,
      supplier_product_code: supplierProductForm.supplier_product_code,
      minimum_order_qty: Number(supplierProductForm.minimum_order_qty),
      lead_time_days: Number(supplierProductForm.lead_time_days),
      is_preferred: supplierProductForm.is_preferred,
      is_active: supplierProductForm.is_active,
    })
    if (supplierProductsState.data.value) {
      supplierProductsState.data.value = {
        ...supplierProductsState.data.value,
        items: [created, ...supplierProductsState.data.value.items],
        total: supplierProductsState.data.value.total + 1,
      }
    }
  } finally {
    supplierProductSaving.value = false
  }
}

const submitSupplierPrice = async () => {
  supplierPriceSaving.value = true
  try {
    const created = await createSupplierPriceHistory({
      supplier_product_id: supplierPriceForm.supplier_product_id,
      price: Number(supplierPriceForm.price),
      effective_from: supplierPriceForm.effective_from,
      effective_to: supplierPriceForm.effective_to || null,
    })
    if (supplierPriceHistoriesState.data.value) {
      supplierPriceHistoriesState.data.value = {
        ...supplierPriceHistoriesState.data.value,
        items: [created, ...supplierPriceHistoriesState.data.value.items],
        total: supplierPriceHistoriesState.data.value.total + 1,
      }
    }
  } finally {
    supplierPriceSaving.value = false
  }
}

const supplierSearchText = (item: unknown) => {
  const row = item as SupplierRecord
  return [row.name, row.supplier_type, row.contact_person, row.email, row.status].filter(Boolean).join(' ')
}

const supplierProductSearchText = (item: unknown) => {
  const row = item as SupplierProductRecord
  return [row.supplier_name, row.product_code, row.product_name, row.purchase_uom_id, row.supplier_product_code].filter(Boolean).join(' ')
}

const supplierPriceHistorySearchText = (item: unknown) => {
  const row = item as SupplierPriceHistoryRecord
  return [row.supplier_name, row.product_name, row.effective_from, row.effective_to].filter(Boolean).join(' ')
}

const purchaseRequestSearchText = (item: unknown) => {
  const row = item as PurchaseRequestRecord
  return [row.request_number, row.meal_plan_id, row.supplier_name, row.status].filter(Boolean).join(' ')
}

const purchaseOrderSearchText = (item: unknown) => {
  const row = item as PurchaseOrderRecord
  return [row.po_number, row.supplier_name, row.status].filter(Boolean).join(' ')
}

const goodsReceiptSearchText = (item: unknown) => {
  const row = item as GoodsReceiptRecord
  return [row.receipt_number, row.source_number, row.status].filter(Boolean).join(' ')
}

const supplierInvoiceSearchText = (item: unknown) => {
  const row = item as SupplierInvoiceRecord
  return [row.invoice_number, row.supplier_name, row.status].filter(Boolean).join(' ')
}

const supplierPaymentSearchText = (item: unknown) => {
  const row = item as SupplierPaymentRecord
  return [row.payment_number, row.supplier_name, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Procurement Flow"
      subtitle="Modul ini memperlihatkan alur procurement sesuai dokumentasi: supplier, purchase request, purchase order, goods receipt, supplier invoice, hingga supplier payment. Perubahan budget reserved, committed, dan actual terjadi mengikuti tahapan ini."
      :badges="['Supplier', 'PR -> PO -> GR', 'Invoice & Payment']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Supplier aktif</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ suppliersState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Vendor dan distributor yang siap dipakai pengadaan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Open procurement</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ totalOpenProcurement }}</p>
        <p class="mt-2 text-sm text-app-body">PR dan PO yang masih bergerak di flow procurement.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Supplier products</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ supplierProductsState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Mapping supplier ke produk agar shortlist vendor dan PO lebih cepat dipilih.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Price histories</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ supplierPriceHistoriesState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Histori harga membantu negosiasi supplier dan evaluasi cost trend procurement.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Master Supplier</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Daftarkan supplier baru</h2>
          </div>
          <span class="status-pill">POST /procurement/.../suppliers</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitSupplier">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Nama supplier</span>
              <input v-model="supplierForm.name" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Tipe</span>
              <select v-model="supplierForm.supplier_type" class="toolbar-input">
                <option value="VENDOR">VENDOR</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </label>
            <label class="form-field">
              <span>Contact person</span>
              <input v-model="supplierForm.contact_person" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Telepon</span>
              <input v-model="supplierForm.phone" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Email</span>
              <input v-model="supplierForm.email" class="toolbar-input" type="email" required />
            </label>
            <label class="form-field">
              <span>Status</span>
              <select v-model="supplierForm.status" class="toolbar-input">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </label>
          </div>
          <label class="form-field">
            <span>Alamat</span>
            <textarea v-model="supplierForm.address" class="toolbar-input min-h-24" />
          </label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Supplier' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Flow Ringkas</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Bagaimana procurement berjalan</h2>
        <div class="mt-6 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">1. Purchase Request</p>
            <p class="mt-2 text-sm text-app-body">PR bisa berasal dari shortage meal plan. Jika budget approved tersedia, sistem menambah <strong>reserved_amount</strong>.</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">2. Purchase Order / RFQ</p>
            <p class="mt-2 text-sm text-app-body">PR dipilih suppliernya lalu diubah menjadi PO agar komitmen pembelian bisa dikontrol.</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">3. Goods Receipt</p>
            <p class="mt-2 text-sm text-app-body">Saat barang diterima, inventory bertambah dan budget pindah dari <strong>reserved</strong> ke <strong>committed</strong>.</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">4. Invoice & Payment</p>
            <p class="mt-2 text-sm text-app-body">Invoice supplier mem-post hutang dan bisa mengaktualkan budget. Payment lalu menutup hutang menjadi kas keluar.</p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Supplier Product</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Mapping supplier ke produk</h2>
          </div>
          <span class="status-pill">POST /supplier-products</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitSupplierProduct">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Supplier</span>
              <select v-model="supplierProductForm.supplier_id" class="toolbar-input">
                <option v-for="supplier in suppliersState.data.value?.items || []" :key="supplier.id" :value="supplier.id">{{ supplier.name }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Produk</span>
              <select v-model="supplierProductForm.product_id" class="toolbar-input">
                <option value="product-1">Beras Medium</option>
                <option value="product-2">Ayam Fillet</option>
                <option value="product-3">Susu UHT</option>
              </select>
            </label>
            <label class="form-field">
              <span>Purchase UOM</span>
              <input v-model="supplierProductForm.purchase_uom_id" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Supplier SKU</span>
              <input v-model="supplierProductForm.supplier_product_code" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Minimum order qty</span>
              <input v-model.number="supplierProductForm.minimum_order_qty" class="toolbar-input" min="1" type="number" />
            </label>
            <label class="form-field">
              <span>Lead time (hari)</span>
              <input v-model.number="supplierProductForm.lead_time_days" class="toolbar-input" min="0" type="number" />
            </label>
            <label class="form-field">
              <span>Preferred</span>
              <select v-model="supplierProductForm.is_preferred" class="toolbar-input">
                <option :value="true">Ya</option>
                <option :value="false">Tidak</option>
              </select>
            </label>
            <label class="form-field">
              <span>Aktif</span>
              <select v-model="supplierProductForm.is_active" class="toolbar-input">
                <option :value="true">Aktif</option>
                <option :value="false">Nonaktif</option>
              </select>
            </label>
          </div>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="supplierProductSaving" type="submit">{{ supplierProductSaving ? 'Menyimpan...' : 'Simpan Mapping' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Price History</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Catat histori harga supplier</h2>
          </div>
          <span class="status-pill">POST /supplier-price-histories</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitSupplierPrice">
          <label class="form-field">
            <span>Supplier product</span>
            <select v-model="supplierPriceForm.supplier_product_id" class="toolbar-input">
              <option v-for="supplierProduct in supplierProductsState.data.value?.items || []" :key="supplierProduct.id" :value="supplierProduct.id">
                {{ supplierProduct.supplier_name }} - {{ supplierProduct.product_name }}
              </option>
            </select>
          </label>
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Harga</span>
              <input v-model.number="supplierPriceForm.price" class="toolbar-input" min="0" step="100" type="number" />
            </label>
            <label class="form-field">
              <span>Effective from</span>
              <input v-model="supplierPriceForm.effective_from" class="toolbar-input" type="date" />
            </label>
            <label class="form-field md:col-span-2">
              <span>Effective to</span>
              <input v-model="supplierPriceForm.effective_to" class="toolbar-input" type="date" />
            </label>
          </div>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="supplierPriceSaving" type="submit">{{ supplierPriceSaving ? 'Menyimpan...' : 'Simpan Harga' }}</button>
          </div>
        </form>
      </article>
    </section>

    <section class="grid gap-6">
      <DataTableCard
        :items="suppliersState.data.value?.items || []"
        :search-text-resolver="supplierSearchText"
        empty-message="Belum ada supplier."
        search-placeholder="Cari supplier, kontak, email..."
        title="Supplier"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Nama</th><th>Tipe</th><th>Kontak</th><th>Email</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as SupplierRecord).id">
                <td>{{ (item as SupplierRecord).name }}</td>
                <td>{{ (item as SupplierRecord).supplier_type }}</td>
                <td>{{ (item as SupplierRecord).contact_person }}</td>
                <td>{{ (item as SupplierRecord).email }}</td>
                <td><StatusBadge :status="(item as SupplierRecord).status || 'ACTIVE'" /></td>
                <td><RouterLink class="secondary-button" :to="`/procurement/suppliers/${(item as SupplierRecord).id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="supplierProductsState.data.value?.items || []"
          :search-text-resolver="supplierProductSearchText"
          empty-message="Belum ada mapping supplier-produk."
          search-placeholder="Cari supplier, produk, atau SKU..."
          title="Supplier Products"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Supplier</th><th>Produk</th><th>UOM</th><th>MOQ</th><th>Lead Time</th><th>Preferred</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SupplierProductRecord).id">
                  <td>{{ (item as SupplierProductRecord).supplier_name }}</td>
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
          :items="supplierPriceHistoriesState.data.value?.items || []"
          :search-text-resolver="supplierPriceHistorySearchText"
          empty-message="Belum ada histori harga supplier."
          search-placeholder="Cari supplier, produk, atau periode..."
          title="Supplier Price Histories"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Supplier</th><th>Produk</th><th>Harga</th><th>Effective From</th><th>Effective To</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SupplierPriceHistoryRecord).id">
                  <td>{{ (item as SupplierPriceHistoryRecord).supplier_name }}</td>
                  <td>{{ (item as SupplierPriceHistoryRecord).product_name }}</td>
                  <td>{{ formatCurrency((item as SupplierPriceHistoryRecord).price) }}</td>
                  <td>{{ formatDate((item as SupplierPriceHistoryRecord).effective_from) }}</td>
                  <td>{{ (item as SupplierPriceHistoryRecord).effective_to ? formatDate((item as SupplierPriceHistoryRecord).effective_to || '') : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>

      <DataTableCard
        :items="prState.data.value?.items || []"
        :search-text-resolver="purchaseRequestSearchText"
        empty-message="Belum ada purchase request."
        search-placeholder="Cari nomor PR, meal plan, supplier..."
        title="Purchase Request"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Nomor</th><th>Tanggal</th><th>Meal Plan</th><th>Supplier</th><th>Estimasi</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as PurchaseRequestRecord).id">
                <td>{{ (item as PurchaseRequestRecord).request_number }}</td>
                <td>{{ formatDate((item as PurchaseRequestRecord).request_date) }}</td>
                <td>{{ (item as PurchaseRequestRecord).meal_plan_id || '-' }}</td>
                <td>{{ (item as PurchaseRequestRecord).supplier_name || '-' }}</td>
                <td>{{ formatCurrency((item as PurchaseRequestRecord).total_estimated_cost) }}</td>
                <td><StatusBadge :status="(item as PurchaseRequestRecord).status" /></td>
                <td><RouterLink class="secondary-button" :to="`/procurement/purchase-requests/${(item as PurchaseRequestRecord).id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="poState.data.value?.items || []"
          :search-text-resolver="purchaseOrderSearchText"
          empty-message="Belum ada purchase order."
          search-placeholder="Cari nomor PO atau supplier..."
          title="Purchase Order"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as PurchaseOrderRecord).id">
                  <td>{{ (item as PurchaseOrderRecord).po_number }}</td>
                  <td>{{ formatDate((item as PurchaseOrderRecord).po_date) }}</td>
                  <td>{{ (item as PurchaseOrderRecord).supplier_name }}</td>
                  <td>{{ formatCurrency((item as PurchaseOrderRecord).total_amount) }}</td>
                  <td><StatusBadge :status="(item as PurchaseOrderRecord).status" /></td>
                  <td><RouterLink class="secondary-button" :to="`/procurement/purchase-orders/${(item as PurchaseOrderRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          :items="grState.data.value?.items || []"
          :search-text-resolver="goodsReceiptSearchText"
          empty-message="Belum ada goods receipt."
          search-placeholder="Cari nomor GR atau sumber..."
          title="Goods Receipt"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Sumber</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as GoodsReceiptRecord).id">
                  <td>{{ (item as GoodsReceiptRecord).receipt_number }}</td>
                  <td>{{ formatDate((item as GoodsReceiptRecord).receipt_date) }}</td>
                  <td>{{ (item as GoodsReceiptRecord).source_number }}</td>
                  <td>{{ formatCurrency((item as GoodsReceiptRecord).total_amount) }}</td>
                  <td><StatusBadge :status="(item as GoodsReceiptRecord).status" /></td>
                  <td><RouterLink class="secondary-button" :to="`/procurement/goods-receipts/${(item as GoodsReceiptRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="invoiceState.data.value?.items || []"
          :search-text-resolver="supplierInvoiceSearchText"
          empty-message="Belum ada supplier invoice."
          search-placeholder="Cari nomor invoice atau supplier..."
          title="Supplier Invoice"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SupplierInvoiceRecord).id">
                  <td>{{ (item as SupplierInvoiceRecord).invoice_number }}</td>
                  <td>{{ formatDate((item as SupplierInvoiceRecord).invoice_date) }}</td>
                  <td>{{ (item as SupplierInvoiceRecord).supplier_name }}</td>
                  <td>{{ formatCurrency((item as SupplierInvoiceRecord).total_amount) }}</td>
                  <td><StatusBadge :status="(item as SupplierInvoiceRecord).status" /></td>
                  <td><RouterLink class="secondary-button" :to="`/procurement/supplier-invoices/${(item as SupplierInvoiceRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <DataTableCard
          :items="paymentState.data.value?.items || []"
          :search-text-resolver="supplierPaymentSearchText"
          empty-message="Belum ada supplier payment."
          search-placeholder="Cari nomor payment atau supplier..."
          title="Supplier Payment"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as SupplierPaymentRecord).id">
                  <td>{{ (item as SupplierPaymentRecord).payment_number }}</td>
                  <td>{{ formatDate((item as SupplierPaymentRecord).payment_date) }}</td>
                  <td>{{ (item as SupplierPaymentRecord).supplier_name }}</td>
                  <td>{{ formatCurrency((item as SupplierPaymentRecord).amount) }}</td>
                  <td><StatusBadge :status="(item as SupplierPaymentRecord).status" /></td>
                  <td><RouterLink class="secondary-button" :to="`/procurement/supplier-payments/${(item as SupplierPaymentRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>
    </section>
  </div>
</template>

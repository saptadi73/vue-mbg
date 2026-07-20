<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createSupplier,
  getGoodsReceipts,
  getPurchaseOrders,
  getPurchaseRequests,
  getSupplierInvoices,
  getSupplierPayments,
  getSuppliers,
} from '@/services/erp-ops'
import { formatCurrency, formatDate } from '@/utils/format'

const suppliersState = useAsyncState(getSuppliers)
const prState = useAsyncState(getPurchaseRequests)
const poState = useAsyncState(getPurchaseOrders)
const grState = useAsyncState(getGoodsReceipts)
const invoiceState = useAsyncState(getSupplierInvoices)
const paymentState = useAsyncState(getSupplierPayments)

const saving = ref(false)
const supplierForm = reactive({
  name: 'Supplier Bahan Segar Baru',
  supplier_type: 'VENDOR',
  contact_person: 'Dewi Lestari',
  phone: '081288899900',
  email: 'dewi.lestari@supplier.local',
  address: 'Jl. Ketahanan Pangan No. 12, Jakarta',
  status: 'ACTIVE',
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
        <p class="text-sm text-app-muted">Goods receipts</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ grState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Tahap yang memindahkan reserve menjadi committed dan posting inventory.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Supplier payments</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ paymentState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Tahap akhir yang menutup hutang supplier menjadi kas keluar.</p>
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

    <section class="grid gap-6">
      <article class="glass-panel overflow-hidden">
        <div class="overflow-x-auto p-6">
          <h2 class="font-display text-2xl text-app-heading">Supplier</h2>
          <table class="data-table mt-4">
            <thead><tr><th>Nama</th><th>Tipe</th><th>Kontak</th><th>Email</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in suppliersState.data.value?.items || []" :key="item.id">
                <td>{{ item.name }}</td><td>{{ item.supplier_type }}</td><td>{{ item.contact_person }}</td><td>{{ item.email }}</td><td><StatusBadge :status="item.status || 'ACTIVE'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="glass-panel overflow-hidden">
        <div class="overflow-x-auto p-6">
          <h2 class="font-display text-2xl text-app-heading">Purchase Request</h2>
          <table class="data-table mt-4">
            <thead><tr><th>Nomor</th><th>Tanggal</th><th>Meal Plan</th><th>Supplier</th><th>Estimasi</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in prState.data.value?.items || []" :key="item.id">
                <td>{{ item.request_number }}</td><td>{{ formatDate(item.request_date) }}</td><td>{{ item.meal_plan_id || '-' }}</td><td>{{ item.supplier_name || '-' }}</td><td>{{ formatCurrency(item.total_estimated_cost) }}</td><td><StatusBadge :status="item.status" /></td><td><RouterLink class="secondary-button" :to="`/procurement/purchase-requests/${item.id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="glass-panel overflow-hidden">
        <div class="grid gap-6 p-6 xl:grid-cols-2">
          <div class="overflow-x-auto">
            <h2 class="font-display text-2xl text-app-heading">Purchase Order</h2>
            <table class="data-table mt-4">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in poState.data.value?.items || []" :key="item.id">
                  <td>{{ item.po_number }}</td><td>{{ formatDate(item.po_date) }}</td><td>{{ item.supplier_name }}</td><td>{{ formatCurrency(item.total_amount) }}</td><td><StatusBadge :status="item.status" /></td><td><RouterLink class="secondary-button" :to="`/procurement/purchase-orders/${item.id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="overflow-x-auto">
            <h2 class="font-display text-2xl text-app-heading">Goods Receipt</h2>
            <table class="data-table mt-4">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Sumber</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in grState.data.value?.items || []" :key="item.id">
                  <td>{{ item.receipt_number }}</td><td>{{ formatDate(item.receipt_date) }}</td><td>{{ item.source_number }}</td><td>{{ formatCurrency(item.total_amount) }}</td><td><StatusBadge :status="item.status" /></td><td><RouterLink class="secondary-button" :to="`/procurement/goods-receipts/${item.id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>

      <article class="glass-panel overflow-hidden">
        <div class="grid gap-6 p-6 xl:grid-cols-2">
          <div class="overflow-x-auto">
            <h2 class="font-display text-2xl text-app-heading">Supplier Invoice</h2>
            <table class="data-table mt-4">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in invoiceState.data.value?.items || []" :key="item.id">
                  <td>{{ item.invoice_number }}</td><td>{{ formatDate(item.invoice_date) }}</td><td>{{ item.supplier_name }}</td><td>{{ formatCurrency(item.total_amount) }}</td><td><StatusBadge :status="item.status" /></td><td><RouterLink class="secondary-button" :to="`/procurement/supplier-invoices/${item.id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="overflow-x-auto">
            <h2 class="font-display text-2xl text-app-heading">Supplier Payment</h2>
            <table class="data-table mt-4">
              <thead><tr><th>Nomor</th><th>Tanggal</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                <tr v-for="item in paymentState.data.value?.items || []" :key="item.id">
                  <td>{{ item.payment_number }}</td><td>{{ formatDate(item.payment_date) }}</td><td>{{ item.supplier_name }}</td><td>{{ formatCurrency(item.amount) }}</td><td><StatusBadge :status="item.status" /></td><td><RouterLink class="secondary-button" :to="`/procurement/supplier-payments/${item.id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

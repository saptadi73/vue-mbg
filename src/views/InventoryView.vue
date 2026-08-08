<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Plus, Search, RefreshCw } from '@lucide/vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import ReusableCrudTable, { type CrudColumn } from '@/components/common/ReusableCrudTable.vue'
import ReusableUpdateModal from '@/components/common/ReusableUpdateModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createInventoryBatch,
  createInventoryLocation,
  createInventoryTransaction,
  createInventoryWarehouse,
  deleteInventoryBatch,
  deleteInventoryLocation,
  deleteInventoryTransaction,
  deleteInventoryWarehouse,
  getInventoryBatches,
  getInventoryExpiryAlerts,
  getInventoryLocations,
  getInventoryBalances,
  getInventoryTransactions,
  getInventoryWarehouses,
  previewFefo,
  updateInventoryBatch,
  updateInventoryLocation,
  updateInventoryTransaction,
  updateInventoryWarehouse,
} from '@/services/operations'
import type {
  FefoPreviewCandidate,
  FefoPreviewResult,
  InventoryBalance,
  InventoryBatchRecord,
  InventoryLocationRecord,
  InventoryTransactionRecord,
  InventoryWarehouseRecord,
} from '@/types/domain'
import { formatCurrency, formatNumber } from '@/utils/format'

type InventoryTab = 'overview' | 'warehouses' | 'locations' | 'batches' | 'transactions' | 'fefo'

const balancesState = useAsyncState(getInventoryBalances)
const expiryState = useAsyncState(getInventoryExpiryAlerts)
const warehousesState = useAsyncState(getInventoryWarehouses)
const locationsState = useAsyncState(getInventoryLocations)
const batchesState = useAsyncState(getInventoryBatches)
const transactionsState = useAsyncState(getInventoryTransactions)

const activeTab = ref<InventoryTab>('overview')

const fefoLoading = ref(false)
const fefoError = ref('')
const fefoResult = ref<FefoPreviewResult | null>(null)
const isRefreshing = ref(false)

const warehouseForm = reactive({
  code: 'WH-NEW-01',
  name: 'Warehouse Baru',
  warehouse_type: 'DRY_STORAGE',
  location: 'Area Dapur Baru',
  is_active: true,
})

const locationForm = reactive({
  warehouse_id: 'wh-main-1',
  code: 'LOC-NEW-01',
  name: 'Lokasi Baru',
  location_type: 'DRY_STORAGE',
  parent_id: '',
  is_active: true,
})

const batchForm = reactive({
  product_id: 'produk-ayam',
  product_name: 'Ayam Fillet',
  supplier_id: '',
  batch_number: 'BATCH-NEW-01',
  warehouse_id: 'wh-main-1',
  location_id: '',
  production_date: '2026-08-01',
  received_date: '2026-08-02',
  expiry_date: '2026-09-01',
  quality_status: 'PENDING',
  is_blocked: false,
  quantity_on_hand: 20,
})

const transactionForm = reactive({
  transaction_type: 'RECEIPT',
  reference_type: 'PO',
  reference_id: 'po-new',
  product_id: 'produk-ayam',
  batch_id: 'batch-1',
  source_warehouse_id: '',
  destination_warehouse_id: 'wh-main-1',
  source_location_id: '',
  destination_location_id: 'loc-1',
  quantity: 20,
  uom_id: 'kg',
  unit_cost: 12000,
  transaction_at: '2026-08-01T10:00',
  notes: 'Input transaksi',
})

const fefoForm = reactive({
  product_name: 'Ayam Fillet',
  warehouse_id: 'wh-main-1',
  required_quantity: 80,
})

const savingWarehouse = ref(false)
const savingLocation = ref(false)
const savingBatch = ref(false)
const savingTransaction = ref(false)

const deleteWarehouseLoadingId = ref('')
const deleteLocationLoadingId = ref('')
const deleteBatchLoadingId = ref('')
const deleteTransactionLoadingId = ref('')

const isWarehouseEditOpen = ref(false)
const isLocationEditOpen = ref(false)
const isBatchEditOpen = ref(false)
const isTransactionEditOpen = ref(false)

const editingWarehouse = ref<InventoryWarehouseRecord | null>(null)
const editingLocation = ref<InventoryLocationRecord | null>(null)
const editingBatch = ref<InventoryBatchRecord | null>(null)
const editingTransaction = ref<InventoryTransactionRecord | null>(null)

type FieldInputType = 'text' | 'number' | 'date' | 'checkbox'
const makeFields = <
  T extends {
    key: string
    label: string
    required?: boolean
    type?: FieldInputType
    options?: { value: string; label: string }[]
  },
>(
  items: T[],
) => items

const warehouseEditFields = makeFields([
  { key: 'code', label: 'Kode warehouse', type: 'text', required: true },
  { key: 'name', label: 'Nama warehouse', type: 'text', required: true },
  {
    key: 'warehouse_type',
    label: 'Tipe warehouse',
    type: 'text',
    required: true,
    options: [
      { value: 'DRY_STORAGE', label: 'DRY_STORAGE' },
      { value: 'COLD_STORAGE', label: 'COLD_STORAGE' },
      { value: 'MAIN', label: 'MAIN' },
    ],
  },
  { key: 'location', label: 'Lokasi', type: 'text' },
  { key: 'is_active', label: 'Aktif', type: 'checkbox' },
])

const locationEditFields = makeFields([
  { key: 'warehouse_id', label: 'Warehouse', type: 'text', required: true },
  { key: 'code', label: 'Kode lokasi', type: 'text', required: true },
  { key: 'name', label: 'Nama lokasi', type: 'text', required: true },
  {
    key: 'location_type',
    label: 'Tipe lokasi',
    type: 'text',
    options: [
      { value: 'DRY_STORAGE', label: 'DRY_STORAGE' },
      { value: 'COLD_STORAGE', label: 'COLD_STORAGE' },
      { value: 'RACK', label: 'RACK' },
    ],
  },
  { key: 'parent_id', label: 'Parent ID', type: 'text' },
  { key: 'is_active', label: 'Aktif', type: 'checkbox' },
])

const batchEditFields = makeFields([
  { key: 'product_id', label: 'Produk ID', type: 'text', required: true },
  { key: 'batch_number', label: 'Batch Number', type: 'text', required: true },
  { key: 'supplier_id', label: 'Supplier ID', type: 'text' },
  { key: 'production_date', label: 'Production Date', type: 'date' },
  { key: 'received_date', label: 'Received Date', type: 'date' },
  { key: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
  {
    key: 'quality_status',
    label: 'Quality Status',
    type: 'text',
    required: true,
    options: [
      { value: 'PENDING', label: 'PENDING' },
      { value: 'PASSED', label: 'PASSED' },
      { value: 'REJECTED', label: 'REJECTED' },
    ],
  },
  { key: 'is_blocked', label: 'Blocked', type: 'checkbox' },
  { key: 'quantity_on_hand', label: 'Quantity on hand', type: 'number', min: 0 },
])

const transactionEditFields = makeFields([
  {
    key: 'transaction_type',
    label: 'Transaction Type',
    required: true,
    options: [
      { value: 'RECEIPT', label: 'RECEIPT' },
      { value: 'ISSUE', label: 'ISSUE' },
      { value: 'TRANSFER', label: 'TRANSFER' },
      { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
    ],
  },
  { key: 'reference_type', label: 'Reference Type', type: 'text' },
  { key: 'reference_id', label: 'Reference ID', type: 'text' },
  { key: 'product_id', label: 'Product ID', type: 'text', required: true },
  { key: 'batch_id', label: 'Batch ID', type: 'text' },
  { key: 'source_warehouse_id', label: 'Source Warehouse', type: 'text' },
  { key: 'destination_warehouse_id', label: 'Destination Warehouse', type: 'text' },
  { key: 'source_location_id', label: 'Source Location', type: 'text' },
  { key: 'destination_location_id', label: 'Destination Location', type: 'text' },
  { key: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
  { key: 'uom_id', label: 'UOM', required: true },
  { key: 'unit_cost', label: 'Unit Cost', type: 'number', min: 0 },
  { key: 'transaction_at', label: 'Waktu', type: 'date', required: true },
  { key: 'notes', label: 'Catatan', rows: 2 },
])

const warehouseColumns: CrudColumn[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Nama' },
  { key: 'warehouse_type', label: 'Type' },
  { key: 'location', label: 'Lokasi' },
  { key: 'is_active', label: 'Status' },
]

const locationColumns: CrudColumn[] = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Nama' },
  { key: 'location_type', label: 'Type' },
  { key: 'warehouse_id', label: 'Warehouse ID' },
  { key: 'parent_id', label: 'Parent ID' },
  { key: 'is_active', label: 'Status' },
]

const batchColumns: CrudColumn[] = [
  { key: 'batch_number', label: 'Batch' },
  { key: 'product_name', label: 'Produk' },
  { key: 'warehouse_name', label: 'Warehouse' },
  { key: 'location_name', label: 'Location' },
  { key: 'expiry_date', label: 'Expiry' },
  { key: 'quality_status', label: 'Quality' },
  { key: 'quantity_available', label: 'Available' },
]

const transactionColumns: CrudColumn[] = [
  { key: 'transaction_type', label: 'Type' },
  { key: 'reference_type', label: 'Ref Type' },
  { key: 'product_id', label: 'Produk ID' },
  { key: 'quantity', label: 'Qty' },
  { key: 'uom_id', label: 'UOM' },
  { key: 'unit_cost', label: 'Unit Cost' },
  { key: 'total_cost', label: 'Total Cost' },
  { key: 'transaction_at', label: 'Waktu' },
]

const replaceInState = <T extends { id: string }>(state: { data: { value: { items: T[]; total: number } | null } }, id: string, updated: T) => {
  if (!state.data.value) return
  state.data.value = {
    ...state.data.value,
    items: state.data.value.items.map((item) => (item.id === id ? updated : item)),
  }
}

const removeFromState = <T extends { id: string }>(state: { data: { value: { items: T[]; total: number } | null } }, id: string) => {
  if (!state.data.value) return
  state.data.value = {
    ...state.data.value,
    items: state.data.value.items.filter((item) => item.id !== id),
    total: Math.max(state.data.value.total - 1, 0),
  }
}

const locationOptions = computed(() => locationsState.data.value?.items || [])
const warehouseOptions = computed(() => warehousesState.data.value?.items || [])

const batchWarehouseOptions = computed(() => (warehouseOptions.value || []).map((item) => ({ id: item.id, name: item.name })))

const productOptions = computed(() => {
  const names = new Set((batchesState.data.value?.items || []).map((item) => item.product_name))
  return Array.from(names)
})

const inventorySearchText = (item: unknown) => {
  const row = item as InventoryBalance
  return `${row.warehouse_name} ${row.location_name} ${row.product_name} ${row.quality_status || ''}`.trim()
}

const warehouseSearchText = (item: unknown) => {
  const row = item as InventoryWarehouseRecord
  return `${row.code} ${row.name} ${row.warehouse_type} ${row.location}`.trim()
}

const locationSearchText = (item: unknown) => {
  const row = item as InventoryLocationRecord
  return `${row.code} ${row.name} ${row.location_type} ${row.warehouse_id}`.trim()
}

const batchSearchText = (item: unknown) => {
  const row = item as InventoryBatchRecord
  return `${row.batch_number} ${row.product_name} ${row.warehouse_name} ${row.location_name} ${row.quality_status}`.trim()
}

const transactionSearchText = (item: unknown) => {
  const row = item as InventoryTransactionRecord
  return `${row.transaction_type} ${row.reference_type} ${row.reference_id} ${row.product_id} ${row.transaction_at}`.trim()
}

const fefoCandidateSearchText = (item: unknown) => {
  const row = item as FefoPreviewCandidate
  return `${row.batch_number} ${row.warehouse_name} ${row.expiry_date} ${row.quality_status || ''}`.trim()
}

const expiryAttentionCount = computed(
  () => (expiryState.data.value?.items || []).filter((item) => item.blocked || item.quality_status === 'PENDING').length,
)

const refreshAll = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      balancesState.execute(),
      expiryState.execute(),
      warehousesState.execute(),
      locationsState.execute(),
      batchesState.execute(),
      transactionsState.execute(),
    ])
  } finally {
    isRefreshing.value = false
  }
}

const runFefoPreview = async () => {
  fefoLoading.value = true
  fefoError.value = ''
  try {
    fefoResult.value = await previewFefo({
      product_name: fefoForm.product_name,
      warehouse_id: fefoForm.warehouse_id,
      required_quantity: Number(fefoForm.required_quantity),
    })
  } catch (error) {
    fefoError.value = error instanceof Error ? error.message : 'FEFO preview gagal.'
  } finally {
    fefoLoading.value = false
  }
}

const confirmDoubleDelete = (label: string) => {
  if (!window.confirm(`Yakin ingin menghapus ${label}?`)) return false
  return window.confirm(`Konfirmasi ulang untuk menghapus ${label} permanen.`)
}

const openWarehouseEdit = (item: InventoryWarehouseRecord) => {
  editingWarehouse.value = item
  isWarehouseEditOpen.value = true
}
const openLocationEdit = (item: InventoryLocationRecord) => {
  editingLocation.value = item
  isLocationEditOpen.value = true
}
const openBatchEdit = (item: InventoryBatchRecord) => {
  editingBatch.value = item
  isBatchEditOpen.value = true
}
const openTransactionEdit = (item: InventoryTransactionRecord) => {
  editingTransaction.value = item
  isTransactionEditOpen.value = true
}

const submitWarehouseUpdate = async (values: Record<string, unknown>) => {
  if (!editingWarehouse.value) return
  const updated = await updateInventoryWarehouse(editingWarehouse.value.id, values)
  replaceInState(warehousesState, editingWarehouse.value.id, updated)
  isWarehouseEditOpen.value = false
}

const submitLocationUpdate = async (values: Record<string, unknown>) => {
  if (!editingLocation.value) return
  const updated = await updateInventoryLocation(editingLocation.value.id, values)
  replaceInState(locationsState, editingLocation.value.id, updated)
  isLocationEditOpen.value = false
}

const submitBatchUpdate = async (values: Record<string, unknown>) => {
  if (!editingBatch.value) return
  const patched = {
    ...values,
    quantity_on_hand: values.quantity_on_hand === undefined ? editingBatch.value.quantity_on_hand : Number(values.quantity_on_hand),
    quantity_available: values.quantity_on_hand === undefined ? editingBatch.value.quantity_available : Number(values.quantity_on_hand),
  }
  const updated = await updateInventoryBatch(editingBatch.value.id, patched)
  replaceInState(batchesState, editingBatch.value.id, updated)
  isBatchEditOpen.value = false
}

const submitTransactionUpdate = async (values: Record<string, unknown>) => {
  if (!editingTransaction.value) return
  const patched = {
    ...values,
    quantity: values.quantity === undefined ? editingTransaction.value.quantity : Number(values.quantity),
    unit_cost: values.unit_cost === undefined ? editingTransaction.value.unit_cost : Number(values.unit_cost),
    transaction_at: String(values.transaction_at || editingTransaction.value.transaction_at),
  }
  const updated = await updateInventoryTransaction(editingTransaction.value.id, patched)
  replaceInState(transactionsState, editingTransaction.value.id, updated)
  isTransactionEditOpen.value = false
}

const submitWarehouseCreate = async () => {
  savingWarehouse.value = true
  try {
    const created = await createInventoryWarehouse({
      code: warehouseForm.code,
      name: warehouseForm.name,
      warehouse_type: warehouseForm.warehouse_type,
      location: warehouseForm.location,
      is_active: warehouseForm.is_active,
      tenant_id: 'tenant-demo-mbg',
      sppg_id: null,
    })
    if (warehousesState.data.value) {
      warehousesState.data.value = {
        ...warehousesState.data.value,
        items: [created, ...warehousesState.data.value.items],
        total: warehousesState.data.value.total + 1,
      }
    }
  } finally {
    savingWarehouse.value = false
  }
}

const submitLocationCreate = async () => {
  savingLocation.value = true
  try {
    const created = await createInventoryLocation({
      warehouse_id: locationForm.warehouse_id,
      code: locationForm.code,
      name: locationForm.name,
      location_type: locationForm.location_type,
      parent_id: locationForm.parent_id || null,
      is_active: locationForm.is_active,
      tenant_id: 'tenant-demo-mbg',
      sppg_id: null,
    })
    if (locationsState.data.value) {
      locationsState.data.value = {
        ...locationsState.data.value,
        items: [created, ...locationsState.data.value.items],
        total: locationsState.data.value.total + 1,
      }
    }
  } finally {
    savingLocation.value = false
  }
}

const submitBatchCreate = async () => {
  savingBatch.value = true
  try {
    const created = await createInventoryBatch({
      product_id: batchForm.product_id,
      product_name: batchForm.product_name,
      supplier_id: batchForm.supplier_id || undefined,
      warehouse_id: batchForm.warehouse_id,
      location_id: batchForm.location_id || undefined,
      batch_number: batchForm.batch_number,
      production_date: batchForm.production_date,
      received_date: batchForm.received_date,
      expiry_date: batchForm.expiry_date,
      quality_status: batchForm.quality_status,
      is_blocked: batchForm.is_blocked,
      tenant_id: 'tenant-demo-mbg',
      quantity_on_hand: batchForm.quantity_on_hand,
    })
    if (batchesState.data.value) {
      batchesState.data.value = {
        ...batchesState.data.value,
        items: [created, ...batchesState.data.value.items],
        total: batchesState.data.value.total + 1,
      }
    }
  } finally {
    savingBatch.value = false
  }
}

const submitTransactionCreate = async () => {
  savingTransaction.value = true
  try {
    const created = await createInventoryTransaction({
      transaction_type: transactionForm.transaction_type,
      reference_type: transactionForm.reference_type || undefined,
      reference_id: transactionForm.reference_id || undefined,
      product_id: transactionForm.product_id,
      batch_id: transactionForm.batch_id || undefined,
      source_warehouse_id: transactionForm.source_warehouse_id || undefined,
      destination_warehouse_id: transactionForm.destination_warehouse_id || undefined,
      source_location_id: transactionForm.source_location_id || undefined,
      destination_location_id: transactionForm.destination_location_id || undefined,
      quantity: Number(transactionForm.quantity),
      uom_id: transactionForm.uom_id,
      unit_cost: Number(transactionForm.unit_cost),
      total_cost: Number(transactionForm.quantity) * Number(transactionForm.unit_cost),
      transaction_at: new Date(transactionForm.transaction_at).toISOString(),
      notes: transactionForm.notes || undefined,
      tenant_id: 'tenant-demo-mbg',
      sppg_id: null,
    })
    if (transactionsState.data.value) {
      transactionsState.data.value = {
        ...transactionsState.data.value,
        items: [created, ...transactionsState.data.value.items],
        total: transactionsState.data.value.total + 1,
      }
    }
  } finally {
    savingTransaction.value = false
  }
}

const deleteWarehouseAction = async (item: InventoryWarehouseRecord) => {
  if (!confirmDoubleDelete(`warehouse ${item.name}`)) return
  deleteWarehouseLoadingId.value = item.id
  try {
    await deleteInventoryWarehouse(item.id)
    removeFromState(warehousesState, item.id)
  } finally {
    deleteWarehouseLoadingId.value = ''
  }
}

const deleteLocationAction = async (item: InventoryLocationRecord) => {
  if (!confirmDoubleDelete(`lokasi ${item.name}`)) return
  deleteLocationLoadingId.value = item.id
  try {
    await deleteInventoryLocation(item.id)
    removeFromState(locationsState, item.id)
  } finally {
    deleteLocationLoadingId.value = ''
  }
}

const deleteBatchAction = async (item: InventoryBatchRecord) => {
  if (!confirmDoubleDelete(`batch ${item.batch_number}`)) return
  deleteBatchLoadingId.value = item.id
  try {
    await deleteInventoryBatch(item.id)
    removeFromState(batchesState, item.id)
  } finally {
    deleteBatchLoadingId.value = ''
  }
}

const deleteTransactionAction = async (item: InventoryTransactionRecord) => {
  if (!confirmDoubleDelete(`transaksi ${item.transaction_type} ${item.id}`)) return
  deleteTransactionLoadingId.value = item.id
  try {
    await deleteInventoryTransaction(item.id)
    removeFromState(transactionsState, item.id)
  } finally {
    deleteTransactionLoadingId.value = ''
  }
}

const overviewCards = computed(() => {
  const balances = balancesState.data.value?.items || []
  const totalQty = balances.reduce((sum, item) => sum + item.quantity_on_hand, 0)
  const totalAvail = balances.reduce((sum, item) => sum + item.available_quantity, 0)
  const lowQuality = balances.filter((item) => item.quality_status === 'PENDING').length

  return [
    { title: 'Total Produk', value: formatNumber(totalQty), description: 'Jumlah stok tersedia (on hand)' },
    { title: 'Total Tersedia', value: formatNumber(totalAvail), description: 'Jumlah siap distribusi' },
    { title: 'Pending QC', value: formatNumber(lowQuality), description: 'Batch perlu verifikasi' },
    { title: 'Alert Expiry', value: formatNumber(expiryAttentionCount.value), description: 'Penuh perhatian expired/blocked' },
  ]
})
</script>

<template>
  <div class="container-space">
      <PageHeader
        title="Inventory Operations"
        subtitle="Manajemen gudang, lokasi, batch, transaksi, dan simulasi FEFO untuk kebutuhan distribusi makanan sekolah."
      />

    <section class="mb-6">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <button class="secondary-button" type="button" :disabled="isRefreshing" @click="refreshAll">
          <RefreshCw class="size-4" :class="{ 'animate-spin': isRefreshing }" />
          <span>Refresh</span>
        </button>

        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'overview' }" type="button" @click="activeTab = 'overview'">Overview</button>
        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'warehouses' }" type="button" @click="activeTab = 'warehouses'">Warehouses</button>
        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'locations' }" type="button" @click="activeTab = 'locations'">Locations</button>
        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'batches' }" type="button" @click="activeTab = 'batches'">Batches</button>
        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'transactions' }" type="button" @click="activeTab = 'transactions'">Transactions</button>
        <button class="secondary-button" :class="{ 'border-cyan-300': activeTab === 'fefo' }" type="button" @click="activeTab = 'fefo'">FEFO</button>
      </div>
    </section>

    <section v-if="activeTab === 'overview'" class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      <article v-for="item in overviewCards" :key="item.title" class="glass-panel p-6">
        <p class="eyebrow-text">{{ item.title }}</p>
        <h2 class="mt-2 font-display text-3xl text-app-heading">{{ item.value }}</h2>
        <p class="mt-2 text-sm text-app-body">{{ item.description }}</p>
      </article>

      <article class="glass-panel md:col-span-2 xl:col-span-4">
        <div class="p-6">
          <div class="mb-4">
            <p class="eyebrow-text">Stock Balance</p>
            <h3 class="mt-2 font-display text-2xl text-app-heading">Ringkasan Stok Saat Ini</h3>
          </div>
          <ReusableCrudTable
            title="Inventory Balance"
            :columns="[
              { key: 'warehouse_name', label: 'Gudang' },
              { key: 'location_name', label: 'Lokasi' },
              { key: 'product_name', label: 'Produk' },
              { key: 'quantity_on_hand', label: 'Qty On Hand' },
              { key: 'reserved_quantity', label: 'Reserved' },
              { key: 'available_quantity', label: 'Available' },
              { key: 'quality_status', label: 'Quality' },
            ]"
            :items="balancesState.data.value?.items || []"
            :search-text-resolver="inventorySearchText"
            search-placeholder="Cari stok"
            :show-actions="false"
          />
        </div>
      </article>

      <article class="glass-panel md:col-span-2 xl:col-span-4">
        <div class="p-6">
          <p class="eyebrow-text">Expiry Alerts</p>
          <h3 class="mt-2 font-display text-2xl text-app-heading">Peringatan Expiry</h3>
          <ReusableCrudTable
            title="Expiry Alerts"
            :columns="[
              { key: 'batch_number', label: 'Batch' },
              { key: 'product_name', label: 'Produk' },
              { key: 'expiry_date', label: 'Expiry' },
              { key: 'quality_status', label: 'Quality' },
              { key: 'quantity_available', label: 'Available' },
            ]"
            :items="expiryState.data.value?.items || []"
            :search-text-resolver="(item) => fefoCandidateSearchText(item)"
            search-placeholder="Cari alert"
            :show-actions="false"
          />
        </div>
      </article>
    </section>

    <section v-if="activeTab === 'warehouses'" class="grid gap-6">
      <article class="glass-panel p-6">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Warehouses</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah warehouse</h2>
          </div>
          <span class="status-pill">POST /api/v1/inventory/warehouses/</span>
        </div>
        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitWarehouseCreate">
          <label class="form-field"><span>Kode</span><input v-model="warehouseForm.code" class="toolbar-input" required /></label>
          <label class="form-field"><span>Nama</span><input v-model="warehouseForm.name" class="toolbar-input" required /></label>
          <label class="form-field">
            <span>Tipe</span>
            <select v-model="warehouseForm.warehouse_type" class="toolbar-input">
              <option value="DRY_STORAGE">DRY_STORAGE</option>
              <option value="COLD_STORAGE">COLD_STORAGE</option>
              <option value="MAIN">MAIN</option>
            </select>
          </label>
          <label class="form-field"><span>Lokasi</span><input v-model="warehouseForm.location" class="toolbar-input" /></label>
          <label class="form-field">
            <span>Active</span>
            <select v-model="warehouseForm.is_active" class="toolbar-input">
              <option :value="true">Ya</option>
              <option :value="false">Tidak</option>
            </select>
          </label>
          <div class="flex items-end">
            <button class="primary-button" type="submit">
              <Plus class="size-4" />
              <span>{{ savingWarehouse ? 'Menyimpan...' : 'Simpan Warehouse' }}</span>
            </button>
          </div>
        </form>
      </article>

      <ReusableCrudTable
        :columns="warehouseColumns"
        :items="warehousesState.data.value?.items || []"
        :search-text-resolver="warehouseSearchText"
        search-placeholder="Cari warehouse"
        title="Warehouse List"
      >
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="secondary-button" type="button" @click="openWarehouseEdit(item as InventoryWarehouseRecord)">Edit</button>
            <button
              class="secondary-button"
              type="button"
              :disabled="deleteWarehouseLoadingId === (item as InventoryWarehouseRecord).id"
              @click="deleteWarehouseAction(item as InventoryWarehouseRecord)"
            >
              {{ deleteWarehouseLoadingId === (item as InventoryWarehouseRecord).id ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </template>
        <template #cell-is_active="{ item }">
          <StatusBadge :status="(item as InventoryWarehouseRecord).is_active ? 'ACTIVE' : 'INACTIVE'" />
        </template>
      </ReusableCrudTable>
    </section>

    <section v-if="activeTab === 'locations'" class="grid gap-6">
      <article class="glass-panel p-6">
        <div class="mb-4">
          <p class="eyebrow-text">Locations</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah lokasi</h2>
        </div>
        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitLocationCreate">
          <label class="form-field">
            <span>Warehouse</span>
            <select v-model="locationForm.warehouse_id" class="toolbar-input">
              <option v-for="item in warehouseOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field"><span>Kode</span><input v-model="locationForm.code" class="toolbar-input" required /></label>
          <label class="form-field"><span>Nama</span><input v-model="locationForm.name" class="toolbar-input" required /></label>
          <label class="form-field">
            <span>Tipe</span>
            <select v-model="locationForm.location_type" class="toolbar-input">
              <option value="DRY_STORAGE">DRY_STORAGE</option>
              <option value="COLD_STORAGE">COLD_STORAGE</option>
              <option value="RACK">RACK</option>
            </select>
          </label>
          <label class="form-field"><span>Parent ID</span><input v-model="locationForm.parent_id" class="toolbar-input" /></label>
          <label class="form-field">
            <span>Active</span>
            <select v-model="locationForm.is_active" class="toolbar-input">
              <option :value="true">Ya</option>
              <option :value="false">Tidak</option>
            </select>
          </label>
          <div class="flex items-end">
            <button class="primary-button" type="submit">
              <Plus class="size-4" />
              <span>{{ savingLocation ? 'Menyimpan...' : 'Simpan Location' }}</span>
            </button>
          </div>
        </form>
      </article>

      <ReusableCrudTable
        :columns="locationColumns"
        :items="locationsState.data.value?.items || []"
        :search-text-resolver="locationSearchText"
        search-placeholder="Cari lokasi"
        title="Location List"
      >
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="secondary-button" type="button" @click="openLocationEdit(item as InventoryLocationRecord)">Edit</button>
            <button
              class="secondary-button"
              type="button"
              :disabled="deleteLocationLoadingId === (item as InventoryLocationRecord).id"
              @click="deleteLocationAction(item as InventoryLocationRecord)"
            >
              {{ deleteLocationLoadingId === (item as InventoryLocationRecord).id ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </template>
        <template #cell-is_active="{ item }">
          <StatusBadge :status="(item as InventoryLocationRecord).is_active ? 'ACTIVE' : 'INACTIVE'" />
        </template>
      </ReusableCrudTable>
    </section>

    <section v-if="activeTab === 'batches'" class="grid gap-6">
      <article class="glass-panel p-6">
        <div class="mb-4">
          <p class="eyebrow-text">Inventory Batches</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah batch</h2>
        </div>
        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitBatchCreate">
          <label class="form-field"><span>Product ID</span><input v-model="batchForm.product_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Product Name</span><input v-model="batchForm.product_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Supplier ID</span><input v-model="batchForm.supplier_id" class="toolbar-input" /></label>
          <label class="form-field"><span>Batch Number</span><input v-model="batchForm.batch_number" class="toolbar-input" required /></label>
          <label class="form-field">
            <span>Warehouse</span>
            <select v-model="batchForm.warehouse_id" class="toolbar-input">
              <option v-for="item in batchWarehouseOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Location</span>
            <select v-model="batchForm.location_id" class="toolbar-input">
              <option value="">-- lokasi default --</option>
              <option v-for="loc in locationOptions" :key="loc.id" :value="loc.id">{{ loc.code }} - {{ loc.name }}</option>
            </select>
          </label>
          <label class="form-field"><span>Production Date</span><input v-model="batchForm.production_date" class="toolbar-input" type="date" /></label>
          <label class="form-field"><span>Received Date</span><input v-model="batchForm.received_date" class="toolbar-input" type="date" /></label>
          <label class="form-field"><span>Expiry Date</span><input v-model="batchForm.expiry_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Quantity</span><input v-model.number="batchForm.quantity_on_hand" class="toolbar-input" type="number" min="0" /></label>
          <label class="form-field">
            <span>Quality Status</span>
            <select v-model="batchForm.quality_status" class="toolbar-input">
              <option value="PENDING">PENDING</option>
              <option value="PASSED">PASSED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </label>
          <label class="form-field">
            <span>Blocked</span>
            <select v-model="batchForm.is_blocked" class="toolbar-input">
              <option :value="false">Tidak</option>
              <option :value="true">Ya</option>
            </select>
          </label>
          <div class="flex items-end">
            <button class="primary-button" type="submit">
              <Plus class="size-4" />
              <span>{{ savingBatch ? 'Menyimpan...' : 'Simpan Batch' }}</span>
            </button>
          </div>
        </form>
      </article>

      <ReusableCrudTable
        :columns="batchColumns"
        :items="batchesState.data.value?.items || []"
        :search-text-resolver="batchSearchText"
        search-placeholder="Cari batch"
        title="Batch List"
      >
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="secondary-button" type="button" @click="openBatchEdit(item as InventoryBatchRecord)">Edit</button>
            <button
              class="secondary-button"
              type="button"
              :disabled="deleteBatchLoadingId === (item as InventoryBatchRecord).id"
              @click="deleteBatchAction(item as InventoryBatchRecord)"
            >
              {{ deleteBatchLoadingId === (item as InventoryBatchRecord).id ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </template>
      </ReusableCrudTable>
    </section>

    <section v-if="activeTab === 'transactions'" class="grid gap-6">
      <article class="glass-panel p-6">
        <div class="mb-4">
          <p class="eyebrow-text">Transactions</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah transaksi</h2>
        </div>
        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitTransactionCreate">
          <label class="form-field">
            <span>Type</span>
            <select v-model="transactionForm.transaction_type" class="toolbar-input">
              <option value="RECEIPT">RECEIPT</option>
              <option value="ISSUE">ISSUE</option>
              <option value="TRANSFER">TRANSFER</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </label>
          <label class="form-field"><span>Reference Type</span><input v-model="transactionForm.reference_type" class="toolbar-input" /></label>
          <label class="form-field"><span>Reference ID</span><input v-model="transactionForm.reference_id" class="toolbar-input" /></label>
          <label class="form-field"><span>Product ID</span><input v-model="transactionForm.product_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Batch ID</span><input v-model="transactionForm.batch_id" class="toolbar-input" /></label>
          <label class="form-field">
            <span>Source WH</span>
            <select v-model="transactionForm.source_warehouse_id" class="toolbar-input">
              <option value="">--</option>
              <option v-for="item in batchWarehouseOptions" :key="`s-${item.id}`" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Destination WH</span>
            <select v-model="transactionForm.destination_warehouse_id" class="toolbar-input">
              <option value="">--</option>
              <option v-for="item in batchWarehouseOptions" :key="`d-${item.id}`" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Source Location</span>
            <select v-model="transactionForm.source_location_id" class="toolbar-input">
              <option value="">--</option>
              <option v-for="loc in locationOptions" :key="`sl-${loc.id}`" :value="loc.id">{{ loc.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Destination Location</span>
            <select v-model="transactionForm.destination_location_id" class="toolbar-input">
              <option value="">--</option>
              <option v-for="loc in locationOptions" :key="`dl-${loc.id}`" :value="loc.id">{{ loc.name }}</option>
            </select>
          </label>
          <label class="form-field"><span>Quantity</span><input v-model.number="transactionForm.quantity" class="toolbar-input" type="number" min="0" required /></label>
          <label class="form-field"><span>UOM</span><input v-model="transactionForm.uom_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Unit Cost</span><input v-model.number="transactionForm.unit_cost" class="toolbar-input" type="number" min="0" /></label>
          <label class="form-field"><span>Transaction At</span><input v-model="transactionForm.transaction_at" class="toolbar-input" type="datetime-local" required /></label>
          <label class="form-field md:col-span-2"><span>Notes</span><textarea v-model="transactionForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="md:col-span-2 flex justify-end">
            <button class="primary-button" type="submit">
              <Plus class="size-4" />
              <span>{{ savingTransaction ? 'Menyimpan...' : 'Simpan Transaksi' }}</span>
            </button>
          </div>
        </form>
      </article>

      <ReusableCrudTable
        :columns="transactionColumns"
        :items="transactionsState.data.value?.items || []"
        :search-text-resolver="transactionSearchText"
        search-placeholder="Cari transaksi"
        title="Transaction List"
      >
        <template #actions="{ item }">
          <div class="flex gap-2">
            <button class="secondary-button" type="button" @click="openTransactionEdit(item as InventoryTransactionRecord)">Edit</button>
            <button
              class="secondary-button"
              type="button"
              :disabled="deleteTransactionLoadingId === (item as InventoryTransactionRecord).id"
              @click="deleteTransactionAction(item as InventoryTransactionRecord)"
            >
              {{ deleteTransactionLoadingId === (item as InventoryTransactionRecord).id ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </template>
        <template #cell-unit_cost="{ item }">{{ formatCurrency((item as InventoryTransactionRecord).unit_cost) }}</template>
        <template #cell-total_cost="{ item }">{{ formatCurrency((item as InventoryTransactionRecord).total_cost || 0) }}</template>
      </ReusableCrudTable>
    </section>

    <section v-if="activeTab === 'fefo'" class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-6">
        <div class="mb-4">
          <p class="eyebrow-text">FEFO Preview</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Simulasi pemilihan batch</h2>
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
              <option v-for="item in batchWarehouseOptions" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Required Quantity</span>
            <input v-model.number="fefoForm.required_quantity" class="toolbar-input" type="number" min="1" required />
          </label>
          <button class="primary-button w-fit" type="submit">
            <Search class="size-4" />
            <span>{{ fefoLoading ? 'Menganalisis...' : 'Jalankan FEFO Preview' }}</span>
          </button>
        </form>

        <div v-if="fefoError" class="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
          {{ fefoError }}
        </div>

        <div v-if="fefoResult" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">{{ fefoResult.product_name }} | {{ fefoResult.warehouse_name }}</p>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <p class="text-sm">Required: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.required_quantity) }}</span></p>
              <p class="text-sm">Fulfilled: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.fulfilled_quantity) }}</span></p>
              <p class="text-sm">Shortage: <span class="font-semibold text-app-heading">{{ formatNumber(fefoResult.shortage_quantity) }}</span></p>
            </div>
          </div>
          <DataTableCard
            title="Candidate Batches"
            :items="fefoResult.candidate_batches"
            :search-text-resolver="fefoCandidateSearchText"
            search-placeholder="Cari kandidat batch..."
            empty-message="Tidak ada kandidat batch."
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Batch</th>
                    <th>Expiry</th>
                    <th>Available</th>
                    <th>Allocated</th>
                    <th>Quality</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="batch in items" :key="(batch as FefoPreviewCandidate).batch_id">
                    <td>{{ (batch as FefoPreviewCandidate).batch_number }}</td>
                    <td>{{ (batch as FefoPreviewCandidate).expiry_date }}</td>
                    <td>{{ formatNumber((batch as FefoPreviewCandidate).quantity_available) }}</td>
                    <td>{{ formatNumber((batch as FefoPreviewCandidate).allocated_quantity) }}</td>
                    <td><StatusBadge :status="(batch as FefoPreviewCandidate).quality_status || 'PENDING'" /></td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>
        </div>
      </article>
    </section>
  </div>

  <ReusableUpdateModal
    :open="isWarehouseEditOpen"
    :title="'Update Warehouse'"
    :fields="warehouseEditFields"
    :initial-values="editingWarehouse || {}"
    submit-label="Update Warehouse"
    @close="isWarehouseEditOpen = false"
    @submit="submitWarehouseUpdate"
  />

  <ReusableUpdateModal
    :open="isLocationEditOpen"
    :title="'Update Location'"
    :fields="locationEditFields"
    :initial-values="editingLocation || {}"
    submit-label="Update Location"
    @close="isLocationEditOpen = false"
    @submit="submitLocationUpdate"
  />

  <ReusableUpdateModal
    :open="isBatchEditOpen"
    :title="'Update Batch'"
    :fields="batchEditFields"
    :initial-values="editingBatch || {}"
    submit-label="Update Batch"
    @close="isBatchEditOpen = false"
    @submit="submitBatchUpdate"
  />

  <ReusableUpdateModal
    :open="isTransactionEditOpen"
    :title="'Update Transaction'"
    :fields="transactionEditFields"
    :initial-values="editingTransaction || {}"
    submit-label="Update Transaction"
    @close="isTransactionEditOpen = false"
    @submit="submitTransactionUpdate"
  />
</template>

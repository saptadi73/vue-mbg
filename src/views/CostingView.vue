<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createActualExpense,
  createLaborCost,
  getActualExpenses,
  getCostPolicies,
  getLaborCosts,
  getProductionCostSheet,
  getProductionOrders,
} from '@/services/erp-ops'
import { useAppStore } from '@/stores/app'
import type { ActualExpenseRecord, CostPolicyRecord, LaborCostRecord, ProductionOrderRecord } from '@/types/domain'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const appStore = useAppStore()
const { sppgOptions, activeSppgId } = storeToRefs(appStore)

const policiesState = useAsyncState(getCostPolicies)
const laborState = useAsyncState(getLaborCosts)
const actualExpensesState = useAsyncState(getActualExpenses)
const productionOrdersState = useAsyncState(getProductionOrders)

const selectedProductionOrderId = ref('')
const costSheetState = useAsyncState(() => getProductionCostSheet(selectedProductionOrderId.value || 'prod-1'))

watch(
  () => productionOrdersState.data.value?.items,
  (items) => {
    if (!selectedProductionOrderId.value && items?.length) {
      selectedProductionOrderId.value = items[0]?.id || ''
    }
  },
  { immediate: true },
)

watch(selectedProductionOrderId, async (value) => {
  if (value) {
    await costSheetState.execute()
  }
})

const savingLabor = ref(false)
const savingExpense = ref(false)

const laborForm = reactive({
  work_date: '2026-07-20',
  sppg_id: activeSppgId.value || sppgOptions.value[0]?.id || '',
  employee_count: 12,
  hours_worked: 84,
  hourly_rate: 28000,
  notes: 'Input biaya tenaga kerja aktual shift pagi.',
})

const expenseForm = reactive({
  expense_date: '2026-07-20',
  sppg_id: activeSppgId.value || sppgOptions.value[0]?.id || '',
  cost_category: 'UTILITY' as 'UTILITY' | 'PACKAGING' | 'DISTRIBUTION' | 'OVERHEAD' | 'WASTE',
  reference_type: 'PRODUCTION_ORDER',
  reference_id: 'prod-1',
  amount: 650000,
  notes: 'Input biaya aktual non-labor untuk produksi aktif.',
  status: 'DRAFT',
})

const totalLaborToday = computed(() =>
  (laborState.data.value?.items || [])
    .filter((item) => item.work_date === laborForm.work_date)
    .reduce((sum, item) => sum + item.total_cost, 0),
)

const totalActualExpenseToday = computed(() =>
  (actualExpensesState.data.value?.items || [])
    .filter((item) => item.expense_date === expenseForm.expense_date)
    .reduce((sum, item) => sum + item.amount, 0),
)

const expenseSummary = computed(() => {
  const summary = {
    UTILITY: 0,
    PACKAGING: 0,
    DISTRIBUTION: 0,
    OVERHEAD: 0,
    WASTE: 0,
  }

  for (const item of actualExpensesState.data.value?.items || []) {
    summary[item.cost_category] += item.amount
  }

  return summary
})

const selectedProductionOrder = computed(() =>
  (productionOrdersState.data.value?.items || []).find((item) => item.id === selectedProductionOrderId.value),
)

const submitLaborCost = async () => {
  savingLabor.value = true
  try {
    const created = await createLaborCost({
      ...laborForm,
      status: 'DRAFT',
      sppg_name: sppgOptions.value.find((item) => item.id === laborForm.sppg_id)?.label,
    })

    if (laborState.data.value) {
      laborState.data.value = {
        ...laborState.data.value,
        items: [created, ...laborState.data.value.items],
        total: laborState.data.value.total + 1,
      }
    }
  } finally {
    savingLabor.value = false
  }
}

const submitActualExpense = async () => {
  savingExpense.value = true
  try {
    const created = await createActualExpense({
      ...expenseForm,
      sppg_name: sppgOptions.value.find((item) => item.id === expenseForm.sppg_id)?.label,
    })

    if (actualExpensesState.data.value) {
      actualExpensesState.data.value = {
        ...actualExpensesState.data.value,
        items: [created, ...actualExpensesState.data.value.items],
        total: actualExpensesState.data.value.total + 1,
      }
    }
  } finally {
    savingExpense.value = false
  }
}

const laborSearchText = (item: unknown) => {
  const row = item as LaborCostRecord
  return [row.work_date, row.sppg_name, row.sppg_id, row.status, row.notes].filter(Boolean).join(' ')
}

const expenseSearchText = (item: unknown) => {
  const row = item as ActualExpenseRecord
  return [row.expense_date, row.sppg_name, row.sppg_id, row.cost_category, row.reference_type, row.reference_id, row.status, row.notes].filter(Boolean).join(' ')
}

const productionOrderSearchText = (item: unknown) => {
  const row = item as ProductionOrderRecord
  return [row.order_number, row.production_date, row.meal_plan_name, row.status, row.sppg_name].filter(Boolean).join(' ')
}

const policySearchText = (item: unknown) => {
  const row = item as CostPolicyRecord
  return [
    row.code,
    row.name,
    row.effective_start_date,
    row.effective_end_date,
    row.utility_cost_per_portion,
    row.packaging_cost_per_portion,
    row.distribution_cost_per_portion,
    row.overhead_cost_per_portion,
    row.waste_cost_percentage,
    row.is_active ? 'ACTIVE' : 'DRAFT',
  ].join(' ')
}

const costSheetRows = computed(() => {
  const sheet = costSheetState.data.value
  if (!sheet) return []

  return [
    { id: 'material', component: 'Material Cost', amount: sheet.actual_material_cost, note: 'Berasal dari konsumsi material produksi dan pergerakan inventory/procurement.' },
    { id: 'labor', component: 'Labor Cost', amount: sheet.labor_cost_amount, note: `Sumber: ${sheet.labor_cost_source}` },
    { id: 'utility', component: 'Utility Cost', amount: sheet.utility_cost_amount, note: 'Aktual operasional atau fallback policy aktif.' },
    { id: 'packaging', component: 'Packaging Cost', amount: sheet.packaging_cost_amount, note: 'Tray, segel, label, dan kebutuhan kemasan.' },
    { id: 'distribution', component: 'Distribution Cost', amount: sheet.distribution_cost_amount, note: 'Biaya rute, fuel, handling, dan penyaluran.' },
    { id: 'overhead', component: 'Overhead Cost', amount: sheet.overhead_cost_amount, note: 'Sanitasi, admin dapur, dan overhead terkait produksi.' },
    { id: 'waste', component: 'Waste Cost', amount: sheet.waste_cost_amount, note: 'Biaya penyusutan atau waste sesuai aktual atau policy.' },
    { id: 'total', component: 'Total Actual Cost', amount: sheet.total_actual_cost, note: 'Akumulasi seluruh komponen biaya produksi.' },
    { id: 'portion', component: 'Actual Cost / Portion', amount: sheet.actual_cost_per_portion, note: 'Dibagi menggunakan accepted portions.' },
    { id: 'variance-total', component: 'Variance Total', amount: sheet.variance_total, note: 'Dibanding budget meal plan.' },
    { id: 'variance-portion', component: 'Variance / Portion', amount: sheet.variance_per_portion, note: 'Variance terhadap budget cost per portion.' },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Costing & Labor Cost"
      subtitle="Costing MBG sekarang dibagi jelas: labor aktual diinput harian, biaya non-labor aktual dicatat per kategori, material cost dibaca dari production/procurement, lalu semuanya dirangkum di cost sheet produksi."
      :badges="['Labor Cost', 'Actual Non-Labor', 'Production Cost Sheet']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Biaya tenaga kerja hari ini</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalLaborToday) }}</p>
        <p class="mt-2 text-sm text-app-body">Akumulasi input labor aktual untuk {{ formatDate(laborForm.work_date) }}.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Biaya non-labor hari ini</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalActualExpenseToday) }}</p>
        <p class="mt-2 text-sm text-app-body">Utility, packaging, distribution, overhead, dan waste aktual.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Material cost terpilih</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(costSheetState.data.value?.actual_material_cost || 0) }}</p>
        <p class="mt-2 text-sm text-app-body">Diambil dari cost sheet production order, sejalan dengan procurement dan inventory.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Labor source</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ costSheetState.data.value?.labor_cost_source || 'NONE' }}</p>
        <p class="mt-2 text-sm text-app-body">Menunjukkan apakah cost sheet memakai actual labor atau fallback policy.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input Aktual</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Catat labor cost</h2>
          </div>
          <span class="status-pill">POST /workforce/labor-costs</span>
        </div>

        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitLaborCost">
          <label class="form-field">
            <span>Tanggal kerja</span>
            <input v-model="laborForm.work_date" class="toolbar-input" type="date" required />
          </label>
          <label class="form-field">
            <span>SPPG</span>
            <select v-model="laborForm.sppg_id" class="toolbar-input" required>
              <option v-for="item in sppgOptions" :key="item.id" :value="item.id">{{ item.label }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Jumlah employee</span>
            <input v-model.number="laborForm.employee_count" class="toolbar-input" min="1" type="number" required />
          </label>
          <label class="form-field">
            <span>Total jam kerja</span>
            <input v-model.number="laborForm.hours_worked" class="toolbar-input" min="1" step="0.5" type="number" required />
          </label>
          <label class="form-field">
            <span>Tarif per jam</span>
            <input v-model.number="laborForm.hourly_rate" class="toolbar-input" min="0" step="500" type="number" required />
          </label>
          <label class="form-field">
            <span>Total estimasi</span>
            <input :value="formatCurrency(laborForm.hours_worked * laborForm.hourly_rate)" class="toolbar-input" disabled type="text" />
          </label>
          <label class="form-field md:col-span-2">
            <span>Catatan</span>
            <textarea v-model="laborForm.notes" class="toolbar-input min-h-24" />
          </label>
          <div class="md:col-span-2 flex justify-end">
            <button class="primary-button" :disabled="savingLabor" type="submit">{{ savingLabor ? 'Menyimpan...' : 'Simpan Labor Cost' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input Non-Labor</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Catat biaya aktual lain</h2>
          </div>
          <span class="status-pill">Operational actual entry</span>
        </div>

        <form class="mt-6 grid gap-4 md:grid-cols-2" @submit.prevent="submitActualExpense">
          <label class="form-field">
            <span>Tanggal biaya</span>
            <input v-model="expenseForm.expense_date" class="toolbar-input" type="date" required />
          </label>
          <label class="form-field">
            <span>SPPG</span>
            <select v-model="expenseForm.sppg_id" class="toolbar-input" required>
              <option v-for="item in sppgOptions" :key="item.id" :value="item.id">{{ item.label }}</option>
            </select>
          </label>
          <label class="form-field">
            <span>Kategori biaya</span>
            <select v-model="expenseForm.cost_category" class="toolbar-input">
              <option value="UTILITY">UTILITY</option>
              <option value="PACKAGING">PACKAGING</option>
              <option value="DISTRIBUTION">DISTRIBUTION</option>
              <option value="OVERHEAD">OVERHEAD</option>
              <option value="WASTE">WASTE</option>
            </select>
          </label>
          <label class="form-field">
            <span>Nominal aktual</span>
            <input v-model.number="expenseForm.amount" class="toolbar-input" min="0" step="1000" type="number" required />
          </label>
          <label class="form-field">
            <span>Reference type</span>
            <select v-model="expenseForm.reference_type" class="toolbar-input">
              <option value="PRODUCTION_ORDER">PRODUCTION_ORDER</option>
              <option value="DELIVERY_ROUTE">DELIVERY_ROUTE</option>
              <option value="PERIODIC">PERIODIC</option>
            </select>
          </label>
          <label class="form-field">
            <span>Reference id</span>
            <select v-model="expenseForm.reference_id" class="toolbar-input">
              <option v-for="item in productionOrdersState.data.value?.items || []" :key="item.id" :value="item.id">
                {{ item.order_number }}
              </option>
            </select>
          </label>
          <label class="form-field md:col-span-2">
            <span>Catatan</span>
            <textarea v-model="expenseForm.notes" class="toolbar-input min-h-24" />
          </label>
          <div class="md:col-span-2 flex justify-end">
            <button class="primary-button" :disabled="savingExpense" type="submit">{{ savingExpense ? 'Menyimpan...' : 'Simpan Biaya Non-Labor' }}</button>
          </div>
        </form>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
      <article class="glass-panel p-6">
        <p class="eyebrow-text">Policy & Actual Mix</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Komponen biaya non-labor</h2>

        <div class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">Summary aktual yang sudah masuk</p>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <p class="text-sm text-app-body">Utility: <span class="font-semibold text-app-heading">{{ formatCurrency(expenseSummary.UTILITY) }}</span></p>
              <p class="text-sm text-app-body">Packaging: <span class="font-semibold text-app-heading">{{ formatCurrency(expenseSummary.PACKAGING) }}</span></p>
              <p class="text-sm text-app-body">Distribution: <span class="font-semibold text-app-heading">{{ formatCurrency(expenseSummary.DISTRIBUTION) }}</span></p>
              <p class="text-sm text-app-body">Overhead: <span class="font-semibold text-app-heading">{{ formatCurrency(expenseSummary.OVERHEAD) }}</span></p>
              <p class="text-sm text-app-body">Waste: <span class="font-semibold text-app-heading">{{ formatCurrency(expenseSummary.WASTE) }}</span></p>
            </div>
          </div>

          <DataTableCard
            :items="policiesState.data.value?.items || []"
            :page-size="4"
            :search-text-resolver="policySearchText"
            search-placeholder="Cari policy code, nama, effective date..."
            title="Policy Non-Labor"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead><tr><th>Policy</th><th>Utility</th><th>Packaging</th><th>Distribution</th><th>Overhead</th><th>Waste</th><th>Status</th></tr></thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as CostPolicyRecord).id">
                    <td>
                      <p>{{ (item as CostPolicyRecord).name }}</p>
                      <p class="mt-1 text-xs text-app-muted">{{ (item as CostPolicyRecord).code }}</p>
                    </td>
                    <td>{{ formatCurrency((item as CostPolicyRecord).utility_cost_per_portion) }}</td>
                    <td>{{ formatCurrency((item as CostPolicyRecord).packaging_cost_per_portion) }}</td>
                    <td>{{ formatCurrency((item as CostPolicyRecord).distribution_cost_per_portion) }}</td>
                    <td>{{ formatCurrency((item as CostPolicyRecord).overhead_cost_per_portion) }}</td>
                    <td>{{ formatNumber((item as CostPolicyRecord).waste_cost_percentage) }}%</td>
                    <td><StatusBadge :status="(item as CostPolicyRecord).is_active ? 'APPROVED' : 'DRAFT'" /></td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>
        </div>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Production Cost Sheet</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Biaya lengkap per production order</h2>
          </div>
          <select v-model="selectedProductionOrderId" class="toolbar-input max-w-72">
            <option v-for="item in productionOrdersState.data.value?.items || []" :key="item.id" :value="item.id">
              {{ item.order_number }}
            </option>
          </select>
        </div>

        <div v-if="costSheetState.loading.value" class="loading-panel mt-5">Memuat cost sheet produksi...</div>
        <div v-else-if="costSheetState.data.value" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">{{ costSheetState.data.value.order_number }}</p>
                <p class="mt-1 text-sm text-app-body">{{ costSheetState.data.value.meal_plan_name }} · {{ formatDate(costSheetState.data.value.production_date) }}</p>
              </div>
              <StatusBadge :status="selectedProductionOrder?.status || 'COMPLETED'" />
            </div>

            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <p class="text-sm text-app-body">Accepted portions: <span class="font-semibold text-app-heading">{{ formatNumber(costSheetState.data.value.accepted_portions) }}</span></p>
              <p class="text-sm text-app-body">Budget/portion: <span class="font-semibold text-app-heading">{{ formatCurrency(costSheetState.data.value.budget_cost_per_portion) }}</span></p>
            </div>
            <div class="mt-4 flex flex-wrap gap-3">
              <RouterLink class="primary-button" :to="`/production-orders/${selectedProductionOrderId}`">Detail Production Order</RouterLink>
              <RouterLink class="secondary-button" :to="`/production-orders/${selectedProductionOrderId}/cost-sheet`">Detail Cost Sheet</RouterLink>
            </div>
          </div>

          <DataTableCard
            :items="costSheetRows"
            search-placeholder="Cari komponen costing..."
            title="Komponen Cost Sheet"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead><tr><th>Komponen</th><th>Nilai Aktual</th><th>Keterangan</th></tr></thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as { id: string }).id">
                    <td>{{ (item as { component: string }).component }}</td>
                    <td>{{ formatCurrency((item as { amount: number }).amount) }}</td>
                    <td>{{ (item as { note: string }).note }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <div v-if="laborState.loading.value" class="loading-panel">Memuat labor cost...</div>
      <DataTableCard
        v-else
        :items="laborState.data.value?.items || []"
        :search-text-resolver="laborSearchText"
        search-placeholder="Cari labor, SPPG, catatan..."
        title="Labor Cost Harian"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Tanggal</th><th>SPPG</th><th>Employee</th><th>Jam Kerja</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as LaborCostRecord).id">
                <td>{{ formatDate((item as LaborCostRecord).work_date) }}</td>
                <td>{{ (item as LaborCostRecord).sppg_name || (item as LaborCostRecord).sppg_id }}</td>
                <td>{{ formatNumber((item as LaborCostRecord).employee_count) }}</td>
                <td>{{ formatNumber((item as LaborCostRecord).hours_worked) }}</td>
                <td>{{ formatCurrency((item as LaborCostRecord).total_cost) }}</td>
                <td><StatusBadge :status="(item as LaborCostRecord).status || 'DRAFT'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <div v-if="actualExpensesState.loading.value" class="loading-panel">Memuat biaya non-labor...</div>
      <DataTableCard
        v-else
        :items="actualExpensesState.data.value?.items || []"
        :search-text-resolver="expenseSearchText"
        search-placeholder="Cari kategori, reference, SPPG..."
        title="Biaya Aktual Non-Labor"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Tanggal</th><th>SPPG</th><th>Kategori</th><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ActualExpenseRecord).id">
                <td>{{ formatDate((item as ActualExpenseRecord).expense_date) }}</td>
                <td>{{ (item as ActualExpenseRecord).sppg_name || (item as ActualExpenseRecord).sppg_id }}</td>
                <td>{{ (item as ActualExpenseRecord).cost_category }}</td>
                <td>{{ (item as ActualExpenseRecord).reference_type }} / {{ (item as ActualExpenseRecord).reference_id }}</td>
                <td>{{ formatCurrency((item as ActualExpenseRecord).amount) }}</td>
                <td><StatusBadge :status="(item as ActualExpenseRecord).status || 'DRAFT'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <DataTableCard
      :items="productionOrdersState.data.value?.items || []"
      :search-text-resolver="productionOrderSearchText"
      search-placeholder="Cari production order atau meal plan..."
      title="Dokumen Produksi Terkait Costing"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead><tr><th>Order</th><th>Tanggal</th><th>Meal Plan</th><th>Accepted</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="(item as ProductionOrderRecord).id">
              <td>{{ (item as ProductionOrderRecord).order_number }}</td>
              <td>{{ formatDate((item as ProductionOrderRecord).production_date) }}</td>
              <td>{{ (item as ProductionOrderRecord).meal_plan_name }}</td>
              <td>{{ formatNumber((item as ProductionOrderRecord).accepted_portions || 0) }}</td>
              <td><StatusBadge :status="(item as ProductionOrderRecord).status" /></td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <RouterLink class="secondary-button" :to="`/production-orders/${(item as ProductionOrderRecord).id}`">Detail</RouterLink>
                  <RouterLink class="secondary-button" :to="`/production-orders/${(item as ProductionOrderRecord).id}/cost-sheet`">Cost Sheet</RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

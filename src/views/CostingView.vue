<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
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

          <div v-for="item in policiesState.data.value?.items || []" :key="item.id" class="surface-subtle rounded-3xl p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">{{ item.name }}</p>
                <p class="mt-1 text-xs uppercase tracking-[0.2em] text-app-muted">{{ item.code }}</p>
              </div>
              <StatusBadge :status="item.is_active ? 'APPROVED' : 'DRAFT'" />
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <p class="text-sm text-app-body">Utility policy: <span class="font-semibold text-app-heading">{{ formatCurrency(item.utility_cost_per_portion) }}</span></p>
              <p class="text-sm text-app-body">Packaging policy: <span class="font-semibold text-app-heading">{{ formatCurrency(item.packaging_cost_per_portion) }}</span></p>
              <p class="text-sm text-app-body">Distribution policy: <span class="font-semibold text-app-heading">{{ formatCurrency(item.distribution_cost_per_portion) }}</span></p>
              <p class="text-sm text-app-body">Overhead policy: <span class="font-semibold text-app-heading">{{ formatCurrency(item.overhead_cost_per_portion) }}</span></p>
              <p class="text-sm text-app-body">Waste policy: <span class="font-semibold text-app-heading">{{ formatNumber(item.waste_cost_percentage) }}%</span></p>
            </div>
          </div>
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

          <div class="overflow-x-auto">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th>Nilai Aktual</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Material Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.actual_material_cost) }}</td>
                  <td>Berasal dari konsumsi material produksi dan pergerakan inventory/procurement.</td>
                </tr>
                <tr>
                  <td>Labor Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.labor_cost_amount) }}</td>
                  <td>Sumber: {{ costSheetState.data.value.labor_cost_source }}</td>
                </tr>
                <tr>
                  <td>Utility Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.utility_cost_amount) }}</td>
                  <td>Aktual operasional atau fallback policy aktif.</td>
                </tr>
                <tr>
                  <td>Packaging Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.packaging_cost_amount) }}</td>
                  <td>Tray, segel, label, dan kebutuhan kemasan.</td>
                </tr>
                <tr>
                  <td>Distribution Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.distribution_cost_amount) }}</td>
                  <td>Biaya rute, fuel, handling, dan penyaluran.</td>
                </tr>
                <tr>
                  <td>Overhead Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.overhead_cost_amount) }}</td>
                  <td>Sanitasi, admin dapur, dan overhead terkait produksi.</td>
                </tr>
                <tr>
                  <td>Waste Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.waste_cost_amount) }}</td>
                  <td>Biaya penyusutan/waste sesuai aktual atau policy.</td>
                </tr>
                <tr>
                  <td>Total Actual Cost</td>
                  <td>{{ formatCurrency(costSheetState.data.value.total_actual_cost) }}</td>
                  <td>Akumulasi seluruh komponen biaya produksi.</td>
                </tr>
                <tr>
                  <td>Actual Cost / Portion</td>
                  <td>{{ formatCurrency(costSheetState.data.value.actual_cost_per_portion) }}</td>
                  <td>Dibagi menggunakan accepted portions.</td>
                </tr>
                <tr>
                  <td>Variance Total</td>
                  <td>{{ formatCurrency(costSheetState.data.value.variance_total) }}</td>
                  <td>Dibanding budget meal plan.</td>
                </tr>
                <tr>
                  <td>Variance / Portion</td>
                  <td>{{ formatCurrency(costSheetState.data.value.variance_per_portion) }}</td>
                  <td>Variance terhadap budget cost per portion.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p class="eyebrow-text">Riwayat Labor</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Labor cost harian</h2>
          </div>
          <button class="secondary-button" @click="laborState.execute">Refresh</button>
        </div>
        <div v-if="laborState.loading.value" class="loading-panel m-6">Memuat labor cost...</div>
        <div v-else-if="laborState.data.value" class="overflow-x-auto p-6 pt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>SPPG</th>
                <th>Employee</th>
                <th>Jam Kerja</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in laborState.data.value.items" :key="item.id">
                <td>{{ formatDate(item.work_date) }}</td>
                <td>{{ item.sppg_name || item.sppg_id }}</td>
                <td>{{ formatNumber(item.employee_count) }}</td>
                <td>{{ formatNumber(item.hours_worked) }}</td>
                <td>{{ formatCurrency(item.total_cost) }}</td>
                <td><StatusBadge :status="item.status || 'DRAFT'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="glass-panel overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p class="eyebrow-text">Riwayat Non-Labor</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Biaya aktual non-labor</h2>
          </div>
          <button class="secondary-button" @click="actualExpensesState.execute">Refresh</button>
        </div>
        <div v-if="actualExpensesState.loading.value" class="loading-panel m-6">Memuat biaya non-labor...</div>
        <div v-else-if="actualExpensesState.data.value" class="overflow-x-auto p-6 pt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>SPPG</th>
                <th>Kategori</th>
                <th>Reference</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in actualExpensesState.data.value.items" :key="item.id">
                <td>{{ formatDate(item.expense_date) }}</td>
                <td>{{ item.sppg_name || item.sppg_id }}</td>
                <td>{{ item.cost_category }}</td>
                <td>{{ item.reference_type }} / {{ item.reference_id }}</td>
                <td>{{ formatCurrency(item.amount) }}</td>
                <td><StatusBadge :status="item.status || 'DRAFT'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="glass-panel overflow-hidden">
      <div class="flex items-center justify-between gap-3 px-6 pt-6">
        <div>
          <p class="eyebrow-text">Production Orders</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Dokumen produksi terkait costing</h2>
        </div>
      </div>
      <div class="overflow-x-auto p-6 pt-4">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Tanggal</th>
              <th>Meal Plan</th>
              <th>Accepted</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in productionOrdersState.data.value?.items || []" :key="item.id">
              <td>{{ item.order_number }}</td>
              <td>{{ formatDate(item.production_date) }}</td>
              <td>{{ item.meal_plan_name }}</td>
              <td>{{ formatNumber(item.accepted_portions || 0) }}</td>
              <td><StatusBadge :status="item.status" /></td>
              <td>
                <div class="flex flex-wrap gap-2">
                  <RouterLink class="secondary-button" :to="`/production-orders/${item.id}`">Detail</RouterLink>
                  <RouterLink class="secondary-button" :to="`/production-orders/${item.id}/cost-sheet`">Cost Sheet</RouterLink>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

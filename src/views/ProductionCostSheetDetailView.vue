<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getProductionCostSheet, getProductionOrderById } from '@/services/erp-ops'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const route = useRoute()
const productionOrderId = computed(() => String(route.params.productionOrderId || ''))

const detailState = useAsyncState(() => getProductionOrderById(productionOrderId.value))
const costSheetState = useAsyncState(() => getProductionCostSheet(productionOrderId.value))

const detail = computed(() => detailState.data.value ?? null)
const costSheet = computed(() => costSheetState.data.value ?? null)
const materialTotal = computed(() => (detail.value?.materials || []).reduce((sum, item) => sum + item.total_cost, 0))
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Production Cost Sheet"
      subtitle="Ringkasan biaya produksi aktual per dokumen. Material diambil dari consumption produksi, labor dari workforce/policy, dan komponen non-labor dari actual entry atau fallback policy aktif."
      :badges="[productionOrderId || 'cost-sheet', 'Actual Cost', 'Variance']"
    />

    <div v-if="costSheetState.loading.value || detailState.loading.value" class="loading-panel">Memuat cost sheet detail...</div>
    <div v-else-if="costSheetState.error.value || detailState.error.value" class="error-panel">
      <p>{{ costSheetState.error.value || detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="() => { costSheetState.execute(); detailState.execute() }">Muat ulang</button>
    </div>
    <template v-else-if="costSheet && detail">
      <section class="grid gap-4 xl:grid-cols-4">
        <article class="glass-panel p-5">
          <p class="text-sm text-app-muted">Production order</p>
          <p class="mt-3 font-display text-2xl text-app-heading">{{ costSheet.order_number }}</p>
          <p class="mt-2 text-sm text-app-body">{{ formatDate(costSheet.production_date) }}</p>
        </article>
        <article class="glass-panel p-5">
          <p class="text-sm text-app-muted">Accepted portions</p>
          <p class="mt-3 font-display text-2xl text-app-heading">{{ formatNumber(costSheet.accepted_portions) }}</p>
          <p class="mt-2 text-sm text-app-body">Pembagi cost per portion aktual.</p>
        </article>
        <article class="glass-panel p-5">
          <p class="text-sm text-app-muted">Total actual cost</p>
          <p class="mt-3 font-display text-2xl text-app-heading">{{ formatCurrency(costSheet.total_actual_cost) }}</p>
          <p class="mt-2 text-sm text-app-body">Akumulasi material, labor, dan non-labor.</p>
        </article>
        <article class="glass-panel p-5">
          <p class="text-sm text-app-muted">Variance / portion</p>
          <p class="mt-3 font-display text-2xl text-app-heading">{{ formatCurrency(costSheet.variance_per_portion) }}</p>
          <p class="mt-2 text-sm text-app-body">Dibanding budget per portion meal plan.</p>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <article class="glass-panel p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Document Context</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ detail.production_order.meal_plan_name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ detail.production_order.sppg_name || detail.production_order.sppg_id }}</p>
            </div>
            <StatusBadge :status="detail.production_order.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Labor Source</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ costSheet.labor_cost_source }}</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Budget / Portion</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(costSheet.budget_cost_per_portion) }}</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Actual / Portion</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(costSheet.actual_cost_per_portion) }}</p>
            </div>
            <div class="surface-subtle rounded-2xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Material Total</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(materialTotal) }}</p>
            </div>
          </div>

          <div class="mt-6 flex flex-wrap gap-3">
            <RouterLink class="primary-button" :to="`/production-orders/${detail.production_order.id}`">Buka Production Order</RouterLink>
            <RouterLink class="secondary-button" to="/costing">Kembali ke Costing</RouterLink>
          </div>
        </article>

        <article class="glass-panel overflow-hidden">
          <div class="overflow-x-auto p-6">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Komponen</th>
                  <th>Amount</th>
                  <th>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Actual Material Cost</td>
                  <td>{{ formatCurrency(costSheet.actual_material_cost) }}</td>
                  <td>Berasal dari total cost material aktual yang dikonsumsi produksi.</td>
                </tr>
                <tr>
                  <td>Labor Cost</td>
                  <td>{{ formatCurrency(costSheet.labor_cost_amount) }}</td>
                  <td>Sumber {{ costSheet.labor_cost_source }} dari workforce atau policy.</td>
                </tr>
                <tr>
                  <td>Utility Cost</td>
                  <td>{{ formatCurrency(costSheet.utility_cost_amount) }}</td>
                  <td>Listrik, gas, air, dan utilisasi operasional.</td>
                </tr>
                <tr>
                  <td>Packaging Cost</td>
                  <td>{{ formatCurrency(costSheet.packaging_cost_amount) }}</td>
                  <td>Tray, segel, label, dan kemasan distribusi.</td>
                </tr>
                <tr>
                  <td>Distribution Cost</td>
                  <td>{{ formatCurrency(costSheet.distribution_cost_amount) }}</td>
                  <td>Pengantaran, route handling, dan biaya penyaluran.</td>
                </tr>
                <tr>
                  <td>Overhead Cost</td>
                  <td>{{ formatCurrency(costSheet.overhead_cost_amount) }}</td>
                  <td>Sanitasi, admin dapur, dan overhead produksi.</td>
                </tr>
                <tr>
                  <td>Waste Cost</td>
                  <td>{{ formatCurrency(costSheet.waste_cost_amount) }}</td>
                  <td>Penyusutan / waste aktual atau hasil policy.</td>
                </tr>
                <tr>
                  <td>Total Actual Cost</td>
                  <td>{{ formatCurrency(costSheet.total_actual_cost) }}</td>
                  <td>Jumlah seluruh komponen biaya.</td>
                </tr>
                <tr>
                  <td>Variance Total</td>
                  <td>{{ formatCurrency(costSheet.variance_total) }}</td>
                  <td>Selisih total aktual terhadap baseline budget meal plan.</td>
                </tr>
                <tr>
                  <td>Variance / Portion</td>
                  <td>{{ formatCurrency(costSheet.variance_per_portion) }}</td>
                  <td>Selisih biaya aktual per accepted portion.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="glass-panel overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p class="eyebrow-text">Material Evidence</p>
            <h3 class="mt-2 font-display text-2xl text-app-heading">Breakdown material cost</h3>
          </div>
        </div>
        <div class="overflow-x-auto p-6 pt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Actual Qty</th>
                <th>UoM</th>
                <th>Unit Cost</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.materials" :key="item.id">
                <td>{{ item.product_code }} - {{ item.product_name }}</td>
                <td>{{ formatNumber(item.actual_quantity) }}</td>
                <td>{{ item.uom_id }}</td>
                <td>{{ formatCurrency(item.unit_cost) }}</td>
                <td>{{ formatCurrency(item.total_cost) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

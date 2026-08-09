<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getProductionOrderById } from '@/services/erp-ops'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const productionOrderId = computed(() => String(route.params.productionOrderId || ''))
const { data, loading, error, execute } = useAsyncState(() => getProductionOrderById(productionOrderId.value))
const detail = computed(() => data.value ?? null)
const productionOrder = computed(() => detail.value?.production_order ?? null)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Production Order Detail"
      subtitle="Detail ini menunjukkan konteks dokumen produksi, meal plan sumber, dan konsumsi material aktual yang kemudian menjadi material cost pada cost sheet."
      :badges="[productionOrderId || 'production-order', 'Production', 'Materials']"
    />

    <LoadingSkeleton v-if="loading" variant="detail" label="Memuat detail production order" />
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && productionOrder">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Production Profile</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ productionOrder.order_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ productionOrder.meal_plan_name }} · {{ productionOrder.sppg_name || productionOrder.sppg_id }}</p>
            </div>
            <StatusBadge :status="productionOrder.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Tanggal Produksi</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(productionOrder.production_date) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Planned</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(productionOrder.planned_portions) }} porsi</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Actual</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(productionOrder.actual_portions || 0) }} porsi</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Accepted</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(productionOrder.accepted_portions || 0) }} porsi</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Quick Actions</p>
          <div class="mt-4 grid gap-3">
            <RouterLink class="primary-button" :to="`/production-orders/${productionOrder.id}/cost-sheet`">Lihat Cost Sheet</RouterLink>
            <RouterLink class="secondary-button" to="/costing">Kembali ke Costing</RouterLink>
          </div>
          <p class="mt-4 text-sm text-app-body">
            Material di bawah ini adalah dasar `actual material cost` yang muncul pada dokumen cost sheet.
          </p>
        </article>
      </section>

      <section v-if="detail.meal_plan" class="glass-panel p-5">
        <h3 class="font-display text-xl text-app-heading">Meal Plan Source</h3>
        <div class="mt-4 grid gap-4 md:grid-cols-5">
          <div class="surface-subtle rounded-2xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Recipe</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">{{ detail.meal_plan.recipe_name }}</p>
          </div>
          <div class="surface-subtle rounded-2xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Meal Type</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">{{ detail.meal_plan.meal_type }}</p>
          </div>
          <div class="surface-subtle rounded-2xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Plan Date</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(detail.meal_plan.plan_date) }}</p>
          </div>
          <div class="surface-subtle rounded-2xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Planned Portions</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatNumber(detail.meal_plan.planned_portions) }}</p>
          </div>
          <div class="surface-subtle rounded-2xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Budget / Portion</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(detail.meal_plan.budget_cost_per_portion) }}</p>
          </div>
        </div>
      </section>

      <section class="glass-panel overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p class="eyebrow-text">Batch Materials Used</p>
            <h3 class="mt-2 font-display text-2xl text-app-heading">Lineage bahan ke output produksi</h3>
            <p class="mt-2 max-w-3xl text-sm text-app-muted">
              Porsi output menunjukkan lineage batch ke hasil produksi yang sama dan tidak dijumlahkan antarbaris.
            </p>
          </div>
        </div>
        <div class="overflow-x-auto p-6 pt-4">
          <table class="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Batch / Trace</th>
                <th>Received / Expiry</th>
                <th>Actual Qty</th>
                <th>Issued At</th>
                <th>Output Portions</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detail.materials" :key="item.id">
                <td>{{ item.product_code }} - {{ item.product_name }}</td>
                <td>
                  <p class="font-medium text-app-heading">{{ item.batch_number || '-' }}</p>
                  <p class="mt-1 font-mono text-xs text-app-muted">{{ item.batch_trace_code || item.trace_code || '-' }}</p>
                </td>
                <td>
                  <p>{{ item.batch_received_date ? formatDate(item.batch_received_date) : '-' }}</p>
                  <p class="mt-1 text-xs text-app-muted">Exp. {{ item.batch_expiry_date ? formatDate(item.batch_expiry_date) : '-' }}</p>
                </td>
                <td>{{ formatNumber(item.actual_quantity) }} {{ item.uom_id }}</td>
                <td>{{ item.issued_at ? formatDateTime(item.issued_at) : '-' }}</td>
                <td>
                  <p>{{ formatNumber(item.produced_portions || 0) }} produced</p>
                  <p class="mt-1 text-xs text-app-muted">{{ formatNumber(item.accepted_portions || 0) }} accepted</p>
                </td>
                <td>
                  <RouterLink
                    v-if="item.batch_trace_code"
                    class="secondary-button whitespace-nowrap"
                    :to="{ path: '/quality/food-safety', query: { trace: item.batch_trace_code, direction: 'forward' } }"
                  >
                    Forward Trace
                  </RouterLink>
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

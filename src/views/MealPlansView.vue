<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getMealPlans } from '@/services/operations'
import type { MealPlan } from '@/types/domain'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getMealPlans)
const selectedStatus = ref('ALL')

const filteredMealPlans = computed(() => {
  const items = data.value?.items || []
  if (selectedStatus.value === 'ALL') {
    return items
  }

  return items.filter((item) => item.status === selectedStatus.value)
})

const mealPlanSearchText = (item: unknown) => {
  const row = item as MealPlan
  return [
    row.plan_date,
    row.meal_type,
    row.recipe_name,
    row.status,
    row.workflow_status,
    row.notes,
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Meal Plans"
      subtitle="Triage rencana menu, workflow approval, dan kesiapan material untuk produksi berikutnya."
      :badges="['Workflow Visible', 'Action by Role', 'Cost Preview Ready']"
    />

    <section class="glass-panel p-5">
      <div class="grid gap-3 md:grid-cols-[1fr_auto]">
        <select v-model="selectedStatus" class="toolbar-input">
          <option value="ALL">Semua Status</option>
          <option value="DRAFT">DRAFT</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="APPROVED">APPROVED</option>
          <option value="MATERIAL_RESERVED">MATERIAL_RESERVED</option>
        </select>
        <button class="primary-button">Create Meal Plan</button>
      </div>
    </section>

    <div v-if="loading" class="loading-panel">Memuat meal plans...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="filteredMealPlans"
      :search-text-resolver="mealPlanSearchText"
      search-placeholder="Cari recipe, meal type, tanggal, atau catatan..."
      title="Daftar Meal Plans"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Meal Type</th>
              <th>Recipe</th>
              <th>Porsi</th>
              <th>Budget/Porsi</th>
              <th>Status</th>
              <th>Workflow</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as MealPlan).id">
              <td>{{ formatDate((item as MealPlan).plan_date) }}</td>
              <td>{{ (item as MealPlan).meal_type }}</td>
              <td>{{ (item as MealPlan).recipe_name }}</td>
              <td>{{ formatNumber((item as MealPlan).planned_portions) }}</td>
              <td>{{ formatCurrency((item as MealPlan).cost_per_portion_budget) }}</td>
              <td><StatusBadge :status="(item as MealPlan).status" /></td>
              <td><StatusBadge :status="(item as MealPlan).workflow_status || 'DRAFT'" /></td>
              <td class="max-w-xs text-app-body">{{ (item as MealPlan).notes }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

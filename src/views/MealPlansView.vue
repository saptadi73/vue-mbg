<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getMealPlans } from '@/services/operations'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getMealPlans)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Meal Plans"
      subtitle="Triage rencana menu, workflow approval, dan kesiapan material untuk produksi berikutnya."
      :badges="['Workflow Visible', 'Action by Role', 'Cost Preview Ready']"
    />

    <section class="glass-panel p-5">
      <div class="toolbar-grid">
        <input class="toolbar-input" placeholder="Cari recipe, meal type, atau tanggal" />
        <select class="toolbar-input">
          <option>Semua Status</option>
          <option>DRAFT</option>
          <option>SUBMITTED</option>
          <option>APPROVED</option>
          <option>MATERIAL_RESERVED</option>
        </select>
        <button class="primary-button">Create Meal Plan</button>
      </div>
    </section>

    <div v-if="loading" class="loading-panel">Memuat meal plans...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <section v-else-if="data" class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
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
            <tr v-for="item in data.items" :key="item.id">
              <td>{{ formatDate(item.plan_date) }}</td>
              <td>{{ item.meal_type }}</td>
              <td>{{ item.recipe_name }}</td>
              <td>{{ formatNumber(item.planned_portions) }}</td>
              <td>{{ formatCurrency(item.cost_per_portion_budget) }}</td>
              <td><StatusBadge :status="item.status" /></td>
              <td><StatusBadge :status="item.workflow_status || 'DRAFT'" /></td>
              <td class="max-w-xs text-app-body">{{ item.notes }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

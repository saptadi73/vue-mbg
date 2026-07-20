<script setup lang="ts">
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getBudgets } from '@/services/operations'
import type { BudgetSummary } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getBudgets)

const budgetSearchText = (item: unknown) => {
  const row = item as BudgetSummary
  return [row.name, row.status, row.date_start, row.date_end].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Finance Control"
      subtitle="Area budget, receivable, dan funding dirancang untuk approval, monitoring availability, dan next financial action."
      :badges="['Budget', 'Receivable', 'Funding']"
    />

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Receivable aging</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Rp2,1 M</p>
        <p class="mt-2 text-sm text-app-body">Piutang klaim pemerintah masih dominan di bucket 1-30 hari.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Funding position</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Rp6,9 M</p>
        <p class="mt-2 text-sm text-app-body">3 agreement aktif dengan performa ROI stabil.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Cash flow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">+Rp1,2 M</p>
        <p class="mt-2 text-sm text-app-body">Posisi likuiditas masih aman untuk 2 siklus produksi ke depan.</p>
      </article>
    </section>

    <section class="grid gap-4 xl:grid-cols-4">
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/costing">
        <p class="eyebrow-text">Costing</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Biaya aktual</h2>
        <p class="mt-2 text-sm text-app-body">Input labor cost, baca cost policy, dan kontrol variance operasional.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/budgets">
        <p class="eyebrow-text">Budget</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Rencana anggaran</h2>
        <p class="mt-2 text-sm text-app-body">Susun budget line, pantau availability, dan siapkan approval.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/workflow-approvals">
        <p class="eyebrow-text">Workflow</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Approval queue</h2>
        <p class="mt-2 text-sm text-app-body">Lihat definisi workflow, approval request, dan history keputusan.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/procurement">
        <p class="eyebrow-text">Procurement</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Pembelian & invoice</h2>
        <p class="mt-2 text-sm text-app-body">Kelola supplier, PR, PO, GR, invoice supplier, dan payment.</p>
      </RouterLink>
    </section>

    <div v-if="loading" class="loading-panel">Memuat budget summary...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="data.items"
      :search-text-resolver="budgetSearchText"
      search-placeholder="Cari budget, periode, atau status..."
      title="Budget Summary"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Effective</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as BudgetSummary).id">
              <td>{{ (item as BudgetSummary).name }}</td>
              <td>{{ formatDate((item as BudgetSummary).date_start) }} - {{ formatDate((item as BudgetSummary).date_end) }}</td>
              <td><StatusBadge :status="(item as BudgetSummary).status" /></td>
              <td>{{ formatCurrency((item as BudgetSummary).effective_budget) }}</td>
              <td>{{ formatCurrency((item as BudgetSummary).available_budget) }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

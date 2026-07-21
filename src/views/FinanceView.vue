<script setup lang="ts">
import { computed } from 'vue'
import type { ApexOptions } from 'apexcharts'
import ChartPanel from '@/components/charts/ChartPanel.vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getFundingAgreements } from '@/services/erp-ops'
import { getBudgets } from '@/services/operations'
import type { BudgetSummary, FundingAgreementRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const budgetState = useAsyncState(getBudgets)
const fundingAgreementState = useAsyncState(getFundingAgreements)

const totalBudgetEffective = computed(() =>
  (budgetState.data.value?.items || []).reduce((sum, item) => sum + item.effective_budget, 0),
)
const totalBudgetAvailable = computed(() =>
  (budgetState.data.value?.items || []).reduce((sum, item) => sum + item.available_budget, 0),
)
const totalBudgetUtilized = computed(() => Math.max(totalBudgetEffective.value - totalBudgetAvailable.value, 0))

const budgetStatusChartSeries = computed(() => {
  const items = budgetState.data.value?.items || []
  const statusCount = new Map<string, number>()

  for (const item of items) {
    statusCount.set(item.status, (statusCount.get(item.status) || 0) + 1)
  }

  return Array.from(statusCount.values())
})

const budgetStatusChartOptions = computed<ApexOptions>(() => ({
  chart: { type: 'donut', toolbar: { show: false }, background: 'transparent' },
  labels: Array.from(new Set((budgetState.data.value?.items || []).map((item) => item.status))),
  colors: ['#14b8a6', '#f59e0b', '#f97316', '#fb7185'],
  legend: { position: 'bottom' },
  dataLabels: { enabled: true },
  stroke: { width: 0 },
  plotOptions: {
    pie: {
      donut: {
        size: '62%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Budgets',
            formatter: () => String(budgetState.data.value?.items.length || 0),
          },
        },
      },
    },
  },
}))

const fundingCompositionRows = computed(() => {
  const map = new Map<string, number>()

  for (const item of fundingAgreementState.data.value?.items || []) {
    const key = item.funding_source_name || 'Unmapped Source'
    map.set(key, (map.get(key) || 0) + item.principal_amount)
  }

  return Array.from(map.entries()).map(([label, amount]) => ({ label, amount }))
})

const fundingCompositionChartSeries = computed(() => fundingCompositionRows.value.map((item) => item.amount))
const fundingCompositionChartOptions = computed<ApexOptions>(() => ({
  chart: { type: 'donut', toolbar: { show: false }, background: 'transparent' },
  labels: fundingCompositionRows.value.map((item) => item.label),
  colors: ['#38bdf8', '#34d399', '#f59e0b', '#a78bfa', '#fb7185'],
  legend: { position: 'bottom' },
  dataLabels: {
    enabled: true,
    formatter: (value: number) => `${value.toFixed(1)}%`,
  },
  stroke: { width: 0 },
  tooltip: {
    y: {
      formatter: (value: number) => formatCurrency(value),
    },
  },
  plotOptions: {
    pie: {
      donut: {
        size: '62%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Principal',
            formatter: () => formatCurrency(fundingCompositionChartSeries.value.reduce((sum, item) => sum + item, 0)),
          },
        },
      },
    },
  },
}))

const budgetSearchText = (item: unknown) => {
  const row = item as BudgetSummary
  return [row.name, row.status, row.date_start, row.date_end].filter(Boolean).join(' ')
}

const fundingSearchText = (item: unknown) => {
  const row = item as FundingAgreementRecord
  return [row.agreement_number, row.funding_source_name, row.agreement_type, row.status].filter(Boolean).join(' ')
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

    <section class="grid gap-6 xl:grid-cols-2">
      <ChartPanel
        title="Komposisi Status Budget"
        subtitle="Membaca proporsi draft, submitted, dan approved untuk melihat antrian kontrol anggaran."
        type="donut"
        :options="budgetStatusChartOptions"
        :series="budgetStatusChartSeries"
        :height="320"
      />
      <ChartPanel
        title="Komposisi Funding"
        subtitle="Melihat sebaran principal pendanaan berdasarkan sumber dana yang aktif di yayasan."
        type="donut"
        :options="fundingCompositionChartOptions"
        :series="fundingCompositionChartSeries"
        :height="320"
      />
    </section>

    <section class="grid gap-4 xl:grid-cols-8">
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/finance/reports">
        <p class="eyebrow-text">Reports</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Finance analytics</h2>
        <p class="mt-2 text-sm text-app-body">Pantau receivable aging, funding position, ROI per SPPG, dan cash flow.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/accounting/accounts">
        <p class="eyebrow-text">Accounts</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Chart of accounts</h2>
        <p class="mt-2 text-sm text-app-body">Kelola master account untuk jurnal, costing, claim, procurement, dan funding.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/accounting/journal-entries">
        <p class="eyebrow-text">Accounting</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Journal entries</h2>
        <p class="mt-2 text-sm text-app-body">Lihat jurnal draft dan posted, buat jurnal manual, lalu lakukan posting resmi.</p>
      </RouterLink>
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
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/government-claims">
        <p class="eyebrow-text">Claims</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Government claim</h2>
        <p class="mt-2 text-sm text-app-body">Susun dokumen klaim, verifikasi evidence, adjustment, dan monitoring payment.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/funding">
        <p class="eyebrow-text">Funding</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Investor funding</h2>
        <p class="mt-2 text-sm text-app-body">Kelola funding source, agreement, disbursement, dan repayment dalam satu alur.</p>
      </RouterLink>
      <RouterLink class="glass-panel p-5 transition hover:-translate-y-0.5" to="/procurement">
        <p class="eyebrow-text">Procurement</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Pembelian & invoice</h2>
        <p class="mt-2 text-sm text-app-body">Kelola supplier, PR, PO, GR, invoice supplier, dan payment.</p>
      </RouterLink>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Budget utilization</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalBudgetUtilized) }}</p>
        <p class="mt-2 text-sm text-app-body">Selisih antara effective budget dan available budget pada seluruh budget aktif.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Available budget</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalBudgetAvailable) }}</p>
        <p class="mt-2 text-sm text-app-body">Saldo ketersediaan anggaran yang masih bisa dipakai untuk operasi berikutnya.</p>
      </article>
    </section>

    <div v-if="budgetState.loading.value" class="loading-panel">Memuat budget summary...</div>
    <div v-else-if="budgetState.error.value" class="error-panel">
      <p>{{ budgetState.error.value }}</p>
      <button class="primary-button mt-3" @click="budgetState.execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="budgetState.data.value"
      :items="budgetState.data.value.items"
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

    <DataTableCard
      v-if="fundingAgreementState.data.value?.items?.length"
      :items="fundingAgreementState.data.value.items"
      :search-text-resolver="fundingSearchText"
      search-placeholder="Cari agreement, source, type, atau status..."
      title="Funding Agreement Snapshot"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Agreement</th>
              <th>Source</th>
              <th>Type</th>
              <th>Principal</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as FundingAgreementRecord).id">
              <td>{{ (item as FundingAgreementRecord).agreement_number }}</td>
              <td>{{ (item as FundingAgreementRecord).funding_source_name }}</td>
              <td>{{ (item as FundingAgreementRecord).agreement_type }}</td>
              <td>{{ formatCurrency((item as FundingAgreementRecord).principal_amount) }}</td>
              <td><StatusBadge :status="(item as FundingAgreementRecord).status" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

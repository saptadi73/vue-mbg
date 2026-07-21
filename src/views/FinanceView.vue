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
const totalBudgetUtilized = computed(() =>
  Math.max(totalBudgetEffective.value - totalBudgetAvailable.value, 0),
)

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

const fundingCompositionChartSeries = computed(() =>
  fundingCompositionRows.value.map((item) => item.amount),
)
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
            formatter: () =>
              formatCurrency(
                fundingCompositionChartSeries.value.reduce((sum, item) => sum + item, 0),
              ),
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
  return [row.agreement_number, row.funding_source_name, row.agreement_type, row.status]
    .filter(Boolean)
    .join(' ')
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
        <p class="mt-2 text-sm text-app-body">
          Piutang klaim pemerintah masih dominan di bucket 1-30 hari.
        </p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Funding position</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Rp6,9 M</p>
        <p class="mt-2 text-sm text-app-body">3 agreement aktif dengan performa ROI stabil.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Cash flow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">+Rp1,2 M</p>
        <p class="mt-2 text-sm text-app-body">
          Posisi likuiditas masih aman untuk 2 siklus produksi ke depan.
        </p>
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

    <section class="finance-hub-grid">
      <RouterLink class="finance-hub-card finance-hub-card-featured" to="/finance/reports">
        <p class="eyebrow-text">Reports</p>
        <h2 class="finance-hub-title">Finance analytics</h2>
        <p class="finance-hub-description">
          Pantau receivable aging, funding position, ROI per SPPG, dan cash flow.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/accounting/accounts">
        <p class="eyebrow-text">Accounts</p>
        <h2 class="finance-hub-title">Chart of accounts</h2>
        <p class="finance-hub-description">
          Kelola master account untuk jurnal, costing, claim, procurement, dan funding.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/accounting/journal-entries">
        <p class="eyebrow-text">Accounting</p>
        <h2 class="finance-hub-title">Journal entries</h2>
        <p class="finance-hub-description">
          Lihat jurnal draft dan posted, buat jurnal manual, lalu lakukan posting resmi.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/costing">
        <p class="eyebrow-text">Costing</p>
        <h2 class="finance-hub-title">Biaya aktual</h2>
        <p class="finance-hub-description">
          Input labor cost, baca cost policy, dan kontrol variance operasional.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/budgets">
        <p class="eyebrow-text">Budget</p>
        <h2 class="finance-hub-title">Rencana anggaran</h2>
        <p class="finance-hub-description">
          Susun budget line, pantau availability, dan siapkan approval.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/workflow-approvals">
        <p class="eyebrow-text">Workflow</p>
        <h2 class="finance-hub-title">Approval queue</h2>
        <p class="finance-hub-description">
          Lihat definisi workflow, approval request, dan history keputusan.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/government-claims">
        <p class="eyebrow-text">Claims</p>
        <h2 class="finance-hub-title">Government claim</h2>
        <p class="finance-hub-description">
          Susun dokumen klaim, verifikasi evidence, adjustment, dan monitoring payment.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/funding">
        <p class="eyebrow-text">Funding</p>
        <h2 class="finance-hub-title">Investor funding</h2>
        <p class="finance-hub-description">
          Kelola funding source, agreement, disbursement, dan repayment dalam satu alur.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
      <RouterLink class="finance-hub-card" to="/procurement">
        <p class="eyebrow-text">Procurement</p>
        <h2 class="finance-hub-title">Pembelian & invoice</h2>
        <p class="finance-hub-description">
          Kelola supplier, PR, PO, GR, invoice supplier, dan payment.
        </p>
        <p class="finance-hub-cta">Buka modul</p>
      </RouterLink>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Budget utilization</p>
        <p class="mt-3 font-display text-3xl text-app-heading">
          {{ formatCurrency(totalBudgetUtilized) }}
        </p>
        <p class="mt-2 text-sm text-app-body">
          Selisih antara effective budget dan available budget pada seluruh budget aktif.
        </p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Available budget</p>
        <p class="mt-3 font-display text-3xl text-app-heading">
          {{ formatCurrency(totalBudgetAvailable) }}
        </p>
        <p class="mt-2 text-sm text-app-body">
          Saldo ketersediaan anggaran yang masih bisa dipakai untuk operasi berikutnya.
        </p>
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
              <td>
                {{ formatDate((item as BudgetSummary).date_start) }} -
                {{ formatDate((item as BudgetSummary).date_end) }}
              </td>
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

<style scoped>
.finance-hub-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}

.finance-hub-card {
  position: relative;
  overflow: hidden;
  min-height: 220px;
  border: 1px solid color-mix(in srgb, var(--app-panel-border) 80%, #67e8f9 20%);
  border-radius: 1.75rem;
  background:
    radial-gradient(
      circle at 12% 10%,
      color-mix(in srgb, #67e8f9 16%, transparent) 0%,
      transparent 45%
    ),
    radial-gradient(
      circle at 88% 84%,
      color-mix(in srgb, #22d3ee 10%, transparent) 0%,
      transparent 38%
    ),
    var(--app-panel-bg);
  box-shadow: var(--app-shadow);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  text-decoration: none;
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease,
    background-color 0.25s ease;
}

.finance-hub-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    160deg,
    transparent 12%,
    color-mix(in srgb, #67e8f9 10%, transparent) 100%
  );
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.finance-hub-card:hover {
  transform: translateY(-5px);
  border-color: color-mix(in srgb, #67e8f9 40%, var(--app-panel-border) 60%);
  box-shadow: 0 22px 40px color-mix(in srgb, #0f172a 80%, #22d3ee 20%);
}

.finance-hub-card:hover::before {
  opacity: 1;
}

.finance-hub-card-featured {
  border-color: color-mix(in srgb, #2dd4bf 48%, var(--app-panel-border) 52%);
  background:
    radial-gradient(
      circle at 9% 16%,
      color-mix(in srgb, #2dd4bf 24%, transparent) 0%,
      transparent 46%
    ),
    radial-gradient(
      circle at 90% 82%,
      color-mix(in srgb, #22d3ee 20%, transparent) 0%,
      transparent 43%
    ),
    var(--app-panel-bg);
}

.finance-hub-title {
  margin-top: 0.1rem;
  color: var(--app-heading);
  font-family: var(--font-display);
  font-size: clamp(1.45rem, 2vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.finance-hub-description {
  color: var(--app-text);
  font-size: 0.89rem;
  line-height: 1.45;
  margin-top: 0.15rem;
  max-width: 30ch;
}

.finance-hub-cta {
  margin-top: auto;
  color: color-mix(in srgb, #5eead4 86%, var(--app-muted) 14%);
  font-family: var(--font-display);
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
}

[data-theme='light'] .finance-hub-card {
  box-shadow: 0 18px 36px color-mix(in srgb, #94a3b8 65%, transparent);
}

[data-theme='light'] .finance-hub-card:hover {
  box-shadow: 0 22px 42px color-mix(in srgb, #22d3ee 24%, #94a3b8 76%);
}

@media (min-width: 1280px) {
  .finance-hub-card-featured {
    grid-column: span 2;
  }
}
</style>

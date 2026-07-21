<script setup lang="ts">
import { computed, reactive } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  getBalanceSheetReport,
  getCashFlowReport,
  getGovernmentReceivableAgingReport,
  getInvestorFundingPositionReport,
  getProfitLossReport,
  getRoiBySppgReport,
} from '@/services/operations'
import type {
  BalanceSheetLineRecord,
  CashFlowReport,
  CashFlowRecord,
  GovernmentReceivableAgingRecord,
  InvestorFundingPositionRecord,
  ProfitLossExpenseCategoryRecord,
  ProfitLossReport,
  RoiBySppgRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const filters = reactive({
  as_of_date: '2026-07-20',
  period_start: '2026-07-01',
  period_end: '2026-07-31',
})

const loadCashFlow = () =>
  getCashFlowReport({
    period_start: filters.period_start,
    period_end: filters.period_end,
  })

const loadProfitLoss = () =>
  getProfitLossReport({
    period_start: filters.period_start,
    period_end: filters.period_end,
  })

const loadBalanceSheet = () =>
  getBalanceSheetReport({
    as_of_date: filters.as_of_date,
  })

const loadAging = () =>
  getGovernmentReceivableAgingReport({
    as_of_date: filters.as_of_date,
  })

const loadFunding = () =>
  getInvestorFundingPositionReport({
    as_of_date: filters.as_of_date,
  })

const loadRoi = () =>
  getRoiBySppgReport({
    period_start: filters.period_start,
    period_end: filters.period_end,
  })

const profitLossState = useAsyncState<ProfitLossReport>(loadProfitLoss)
const balanceSheetState = useAsyncState(loadBalanceSheet)
const agingState = useAsyncState(loadAging)
const fundingState = useAsyncState(loadFunding)
const roiState = useAsyncState(loadRoi)
const cashFlowState = useAsyncState<CashFlowReport>(loadCashFlow)

const totalReceivable = computed(() =>
  (agingState.data.value?.items || []).reduce((sum, item) => sum + item.outstanding_amount, 0),
)
const totalOutstandingFunding = computed(() =>
  (fundingState.data.value?.items || []).reduce((sum, item) => sum + item.outstanding_principal, 0),
)
const bestRoi = computed(() =>
  [...(roiState.data.value?.items || [])].sort((left, right) => right.roi_percent - left.roi_percent)[0] || null,
)
const netCashFlow = computed(() => cashFlowState.data.value?.totals.net_cash_flow || 0)
const grossSurplus = computed(() => profitLossState.data.value?.totals.gross_surplus || 0)
const netSurplus = computed(() => profitLossState.data.value?.totals.net_surplus || 0)
const totalAssets = computed(() => balanceSheetState.data.value?.totals.total_assets || 0)

const reloadReports = async () => {
  await Promise.all([
    cashFlowState.execute(),
    profitLossState.execute(),
    balanceSheetState.execute(),
    agingState.execute(),
    fundingState.execute(),
    roiState.execute(),
  ])
}

const agingSearchText = (item: unknown) => {
  const row = item as GovernmentReceivableAgingRecord
  return [row.claim_number, row.tenant_name, row.sppg_name, row.aging_bucket, row.status].filter(Boolean).join(' ')
}

const fundingSearchText = (item: unknown) => {
  const row = item as InvestorFundingPositionRecord
  return [row.agreement_number, row.funding_source_name, row.status].filter(Boolean).join(' ')
}

const roiSearchText = (item: unknown) => {
  const row = item as RoiBySppgRecord
  return [row.sppg_name, row.sppg_code, row.accepted_portions, row.delivery_orders].filter(Boolean).join(' ')
}

const cashFlowSearchText = (item: unknown) => {
  const row = item as CashFlowRecord
  return [row.source_module, row.source_document_type].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Finance Reports"
      subtitle="Layar analitik ini merangkum aging piutang claim, posisi pendanaan investor, ROI per SPPG, dan cash flow agar tim finance bisa membaca kesehatan bisnis dari satu tempat."
      :badges="['Receivable Aging', 'Funding Position', 'ROI & Cash Flow']"
    />

    <section class="glass-panel p-6">
      <div class="flex flex-wrap items-end gap-4">
        <label class="form-field">
          <span>As of date</span>
          <input v-model="filters.as_of_date" class="toolbar-input" type="date" />
        </label>
        <label class="form-field">
          <span>Period start</span>
          <input v-model="filters.period_start" class="toolbar-input" type="date" />
        </label>
        <label class="form-field">
          <span>Period end</span>
          <input v-model="filters.period_end" class="toolbar-input" type="date" />
        </label>
        <button class="primary-button" type="button" @click="reloadReports">Muat laporan</button>
      </div>
      <p class="mt-4 text-sm text-app-muted">
        `Laba Rugi` dan `Cash Flow` memakai `period_start` / `period_end`, sedangkan `Neraca` dan aging memakai `as_of_date`.
      </p>
    </section>

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Net surplus</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(netSurplus) }}</p>
        <p class="mt-2 text-sm text-app-body">Ringkasan laba rugi bersih untuk periode laporan aktif.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Gross surplus</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(grossSurplus) }}</p>
        <p class="mt-2 text-sm text-app-body">Pendapatan pemerintah dikurangi biaya langsung layanan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Outstanding receivable</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalReceivable) }}</p>
        <p class="mt-2 text-sm text-app-body">Total piutang claim pemerintah per {{ formatDate(filters.as_of_date) }}.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Outstanding funding</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalOutstandingFunding) }}</p>
        <p class="mt-2 text-sm text-app-body">Total principal funding yang masih outstanding.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Best ROI</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ bestRoi ? `${bestRoi.roi_percent.toFixed(1)}%` : '-' }}</p>
        <p class="mt-2 text-sm text-app-body">{{ bestRoi?.sppg_name || 'Belum ada data ROI.' }}</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Net cash flow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(netCashFlow) }}</p>
        <p class="mt-2 text-sm text-app-body">Arus kas bersih untuk periode aktif laporan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total assets</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalAssets) }}</p>
        <p class="mt-2 text-sm text-app-body">Posisi total aset tenant pada tanggal neraca aktif.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="profitLossState.data.value?.expenses.categories || []"
        :search-text-resolver="(item) => [((item as ProfitLossExpenseCategoryRecord).category_code), ((item as ProfitLossExpenseCategoryRecord).category_name)].join(' ')"
        empty-message="Belum ada data laba rugi."
        search-placeholder="Cari kategori expense..."
        title="Profit Loss"
      >
        <template #table="{ items }">
          <div class="mb-4 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Government revenue</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(profitLossState.data.value?.revenue.government_revenue || 0) }}</p>
              <p class="mt-1 text-sm text-app-body">Revenue yang diakui dari government claim.</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Cash received</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(profitLossState.data.value?.revenue.government_cash_received || 0) }}</p>
              <p class="mt-1 text-sm text-app-body">Kas yang benar-benar sudah diterima pada periode ini.</p>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>Kategori</th><th>Amount</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ProfitLossExpenseCategoryRecord).category_code">
                <td>{{ (item as ProfitLossExpenseCategoryRecord).category_name }}</td>
                <td>{{ formatCurrency((item as ProfitLossExpenseCategoryRecord).amount) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="[
          ...(balanceSheetState.data.value?.assets.items || []),
          ...(balanceSheetState.data.value?.liabilities.items || []),
          ...(balanceSheetState.data.value?.equity.items || []),
        ]"
        :search-text-resolver="(item) => [((item as BalanceSheetLineRecord).account_code), ((item as BalanceSheetLineRecord).account_name), ((item as BalanceSheetLineRecord).category)].join(' ')"
        empty-message="Belum ada data neraca."
        search-placeholder="Cari akun atau kategori..."
        title="Balance Sheet"
      >
        <template #table="{ items }">
          <div class="mb-4 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Assets</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(balanceSheetState.data.value?.totals.total_assets || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Liabilities</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(balanceSheetState.data.value?.totals.total_liabilities || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Equity</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(balanceSheetState.data.value?.totals.total_equity || 0) }}</p>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>Account</th><th>Category</th><th>Amount</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="`${(item as BalanceSheetLineRecord).category}-${(item as BalanceSheetLineRecord).account_code}`">
                <td>{{ (item as BalanceSheetLineRecord).account_code }} - {{ (item as BalanceSheetLineRecord).account_name }}</td>
                <td>{{ (item as BalanceSheetLineRecord).category }}</td>
                <td>{{ formatCurrency((item as BalanceSheetLineRecord).amount) }}</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-4 text-sm" :class="(balanceSheetState.data.value?.totals.is_balanced ?? false) ? 'text-emerald-600' : 'text-rose-600'">
            {{ balanceSheetState.data.value?.totals.is_balanced ? 'Neraca seimbang.' : 'Neraca belum seimbang.' }}
          </p>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="agingState.data.value?.items || []"
        :search-text-resolver="agingSearchText"
        empty-message="Belum ada data aging piutang."
        search-placeholder="Cari claim, yayasan, SPPG, atau bucket..."
        title="Government Receivable Aging"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Claim</th><th>SPPG</th><th>Claim Date</th><th>Days</th><th>Bucket</th><th>Outstanding</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as GovernmentReceivableAgingRecord).id">
                <td>{{ (item as GovernmentReceivableAgingRecord).claim_number }}</td>
                <td>{{ (item as GovernmentReceivableAgingRecord).sppg_name || '-' }}</td>
                <td>{{ formatDate((item as GovernmentReceivableAgingRecord).claim_date) }}</td>
                <td>{{ (item as GovernmentReceivableAgingRecord).days_outstanding }}</td>
                <td>{{ (item as GovernmentReceivableAgingRecord).aging_bucket }}</td>
                <td>{{ formatCurrency((item as GovernmentReceivableAgingRecord).outstanding_amount) }}</td>
                <td><StatusBadge :status="(item as GovernmentReceivableAgingRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="fundingState.data.value?.items || []"
        :search-text-resolver="fundingSearchText"
        empty-message="Belum ada data posisi funding."
        search-placeholder="Cari agreement, source, atau status..."
        title="Investor Funding Position"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Agreement</th><th>Source</th><th>Committed</th><th>Disbursed</th><th>Repaid</th><th>Outstanding</th><th>Margin</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as InvestorFundingPositionRecord).id">
                <td>
                  {{ (item as InvestorFundingPositionRecord).agreement_number }}
                  <p class="mt-1 text-xs text-app-muted">{{ (item as InvestorFundingPositionRecord).status }}</p>
                </td>
                <td>{{ (item as InvestorFundingPositionRecord).funding_source_name }}</td>
                <td>{{ formatCurrency((item as InvestorFundingPositionRecord).principal_committed) }}</td>
                <td>{{ formatCurrency((item as InvestorFundingPositionRecord).principal_disbursed) }}</td>
                <td>{{ formatCurrency((item as InvestorFundingPositionRecord).principal_repaid) }}</td>
                <td>{{ formatCurrency((item as InvestorFundingPositionRecord).outstanding_principal) }}</td>
                <td>{{ formatCurrency((item as InvestorFundingPositionRecord).realized_margin) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="roiState.data.value?.items || []"
        :search-text-resolver="roiSearchText"
        empty-message="Belum ada data ROI per SPPG."
        search-placeholder="Cari SPPG atau periode..."
        title="ROI by SPPG"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>SPPG</th><th>Revenue</th><th>Total Cost</th><th>Financing Cost</th><th>ROI</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as RoiBySppgRecord).sppg_id">
                <td>{{ (item as RoiBySppgRecord).sppg_name }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).recognized_revenue) }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).total_cost) }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).financing_cost) }}</td>
                <td>{{ (item as RoiBySppgRecord).roi_percent.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="cashFlowState.data.value?.breakdown || []"
        :search-text-resolver="cashFlowSearchText"
        empty-message="Belum ada data cash flow."
        search-placeholder="Cari module atau source document..."
        title="Cash Flow"
      >
        <template #table="{ items }">
          <div class="mb-4 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Cash in</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(cashFlowState.data.value?.totals.cash_in || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Cash out</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(cashFlowState.data.value?.totals.cash_out || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Net cash flow</p>
              <p class="mt-2 text-xl font-semibold text-app-heading">{{ formatCurrency(cashFlowState.data.value?.totals.net_cash_flow || 0) }}</p>
            </div>
          </div>
          <table class="data-table">
            <thead><tr><th>Source Module</th><th>Source Document</th><th>Cash In</th><th>Cash Out</th><th>Net</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="`${(item as CashFlowRecord).source_module}-${(item as CashFlowRecord).source_document_type}`">
                <td>{{ (item as CashFlowRecord).source_module }}</td>
                <td>{{ (item as CashFlowRecord).source_document_type }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).cash_in) }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).cash_out) }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).net_cash_flow) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

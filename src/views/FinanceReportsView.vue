<script setup lang="ts">
import { computed, reactive } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  getCashFlowReport,
  getGovernmentReceivableAgingReport,
  getInvestorFundingPositionReport,
  getRoiBySppgReport,
} from '@/services/operations'
import type {
  CashFlowRecord,
  GovernmentReceivableAgingRecord,
  InvestorFundingPositionRecord,
  RoiBySppgRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const filters = reactive({
  as_of_date: '2026-07-20',
  period_start: '2026-07-01',
  period_end: '2026-07-31',
})

const agingState = useAsyncState(getGovernmentReceivableAgingReport)
const fundingState = useAsyncState(getInvestorFundingPositionReport)
const roiState = useAsyncState(getRoiBySppgReport)
const cashFlowState = useAsyncState(getCashFlowReport)

const totalReceivable = computed(() =>
  (agingState.data.value?.items || []).reduce((sum, item) => sum + item.outstanding_amount, 0),
)
const totalOutstandingFunding = computed(() =>
  (fundingState.data.value?.items || []).reduce((sum, item) => sum + item.outstanding_principal, 0),
)
const bestRoi = computed(() =>
  [...(roiState.data.value?.items || [])].sort((left, right) => right.roi_percentage - left.roi_percentage)[0] || null,
)
const netCashFlow = computed(() =>
  (cashFlowState.data.value?.items || []).reduce((sum, item) => sum + item.net_amount, 0),
)

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
  return [row.sppg_name, row.period_start, row.period_end].filter(Boolean).join(' ')
}

const cashFlowSearchText = (item: unknown) => {
  const row = item as CashFlowRecord
  return [row.flow_date, row.category, row.description].filter(Boolean).join(' ')
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
      </div>
      <p class="mt-4 text-sm text-app-muted">
        Filter tanggal saat ini dipakai sebagai konteks laporan dan siap disambungkan penuh ke backend reporting endpoint.
      </p>
    </section>

    <section class="grid gap-4 xl:grid-cols-4">
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
        <p class="mt-3 font-display text-3xl text-app-heading">{{ bestRoi ? `${bestRoi.roi_percentage.toFixed(1)}%` : '-' }}</p>
        <p class="mt-2 text-sm text-app-body">{{ bestRoi?.sppg_name || 'Belum ada data ROI.' }}</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Net cash flow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(netCashFlow) }}</p>
        <p class="mt-2 text-sm text-app-body">Arus kas bersih untuk periode aktif laporan.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="agingState.data.value?.items || []"
        :search-text-resolver="agingSearchText"
        empty-message="Belum ada data aging piutang."
        search-placeholder="Cari claim, tenant, SPPG, atau bucket..."
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
              <tr v-for="item in items" :key="(item as RoiBySppgRecord).id">
                <td>{{ (item as RoiBySppgRecord).sppg_name }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).recognized_revenue) }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).total_cost) }}</td>
                <td>{{ formatCurrency((item as RoiBySppgRecord).financing_cost) }}</td>
                <td>{{ (item as RoiBySppgRecord).roi_percentage.toFixed(1) }}%</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="cashFlowState.data.value?.items || []"
        :search-text-resolver="cashFlowSearchText"
        empty-message="Belum ada data cash flow."
        search-placeholder="Cari tanggal, kategori, atau deskripsi..."
        title="Cash Flow"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Inflow</th><th>Outflow</th><th>Net</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as CashFlowRecord).id">
                <td>{{ formatDate((item as CashFlowRecord).flow_date) }}</td>
                <td>{{ (item as CashFlowRecord).category }}</td>
                <td>{{ (item as CashFlowRecord).description }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).inflow_amount) }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).outflow_amount) }}</td>
                <td>{{ formatCurrency((item as CashFlowRecord).net_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createFundingDisbursement,
  createFundingRepayment,
  getFundingAgreementById,
} from '@/services/erp-ops'
import type { FundingDisbursementRecord, FundingRepaymentRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

type FundingTab = 'agreement' | 'disbursements' | 'repayments'

const route = useRoute()
const agreementId = computed(() => String(route.params.agreementId || ''))
const detailState = useAsyncState(() => getFundingAgreementById(agreementId.value))
const activeTab = ref<FundingTab>('agreement')
const saving = ref(false)

const disbursementForm = reactive({
  sppg_name: 'SPPG Jakarta Pusat 01',
  disbursement_date: '2026-07-20',
  amount: 1000000,
  reference_number: 'FDB-2026-NEW',
  status: 'POSTED',
  notes: 'Pencairan tambahan operasional.',
})

const repaymentForm = reactive({
  repayment_date: '2026-08-20',
  principal_amount: 500000,
  margin_amount: 50000,
  penalty_amount: 0,
  payment_reference: 'FRP-2026-NEW',
  status: 'POSTED',
  notes: 'Repayment tambahan bulan berjalan.',
})

const detail = computed(() => detailState.data.value ?? null)
const header = computed(() => detail.value?.agreement ?? null)

const disbursementSearchText = (item: unknown) => {
  const row = item as FundingDisbursementRecord
  return [row.agreement_number, row.sppg_name, row.reference_number, row.status].filter(Boolean).join(' ')
}

const repaymentSearchText = (item: unknown) => {
  const row = item as FundingRepaymentRecord
  return [row.agreement_number, row.payment_reference, row.status].filter(Boolean).join(' ')
}

const handleCreateDisbursement = async () => {
  saving.value = true
  try {
    await createFundingDisbursement(agreementId.value, {
      sppg_name: disbursementForm.sppg_name,
      disbursement_date: disbursementForm.disbursement_date,
      amount: Number(disbursementForm.amount),
      reference_number: disbursementForm.reference_number,
      status: disbursementForm.status,
      notes: disbursementForm.notes,
    })
    await detailState.execute()
  } finally {
    saving.value = false
  }
}

const handleCreateRepayment = async () => {
  saving.value = true
  try {
    await createFundingRepayment(agreementId.value, {
      repayment_date: repaymentForm.repayment_date,
      principal_amount: Number(repaymentForm.principal_amount),
      margin_amount: Number(repaymentForm.margin_amount),
      penalty_amount: Number(repaymentForm.penalty_amount),
      payment_reference: repaymentForm.payment_reference,
      status: repaymentForm.status,
      notes: repaymentForm.notes,
    })
    await detailState.execute()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Funding Agreement Detail"
      subtitle="Detail agreement menampilkan hubungan antara source, principal disbursed, repayment principal, realized margin, dan outstanding principal agar posisi funding mudah dibaca."
      :badges="[agreementId || 'funding-agreement', 'Funding Detail', 'Cash Movement']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat detail funding agreement...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article class="glass-panel p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Agreement Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.agreement_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.funding_source_name }} | {{ header.agreement_type }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Principal</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.principal_amount) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Disbursed</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(detail.principal_disbursed) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Repaid</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(detail.principal_repaid) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Outstanding</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(detail.outstanding_principal) }}</p></div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Source Summary</p>
          <div class="mt-4 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Source</p><p class="mt-2 font-semibold text-app-heading">{{ detail.source.name }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Provider</p><p class="mt-2 font-semibold text-app-heading">{{ detail.source.provider_name || '-' }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Realized margin</p><p class="mt-2 font-semibold text-app-heading">{{ formatCurrency(detail.realized_margin) }}</p></div>
          </div>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'agreement' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'agreement'"
          >
            Agreement
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'disbursements' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'disbursements'"
          >
            Disbursements
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'repayments' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'repayments'"
          >
            Repayments
          </button>
        </div>
      </section>

      <article v-if="activeTab === 'agreement'" class="glass-panel p-6">
        <p class="eyebrow-text">Agreement Terms</p>
        <div class="mt-5 grid gap-4 md:grid-cols-2">
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Agreement type</p><p class="mt-2 font-semibold text-app-heading">{{ header.agreement_type }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Margin method</p><p class="mt-2 font-semibold text-app-heading">{{ header.margin_method }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Margin rate</p><p class="mt-2 font-semibold text-app-heading">{{ header.margin_rate || 0 }}%</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Fixed margin</p><p class="mt-2 font-semibold text-app-heading">{{ formatCurrency(header.fixed_margin_amount || 0) }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Start date</p><p class="mt-2 font-semibold text-app-heading">{{ header.start_date ? formatDate(header.start_date) : '-' }}</p></div>
          <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">End date</p><p class="mt-2 font-semibold text-app-heading">{{ header.end_date ? formatDate(header.end_date) : '-' }}</p></div>
          <div class="surface-subtle rounded-3xl p-4 md:col-span-2"><p class="text-sm text-app-muted">Notes</p><p class="mt-2 text-sm text-app-body">{{ header.notes || '-' }}</p></div>
        </div>
      </article>

      <section v-else-if="activeTab === 'disbursements'" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.disbursements"
          :search-text-resolver="disbursementSearchText"
          empty-message="Belum ada disbursement."
          search-placeholder="Cari SPPG, reference, atau status..."
          title="Disbursements"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>SPPG</th><th>Tanggal</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as FundingDisbursementRecord).id">
                  <td>{{ (item as FundingDisbursementRecord).sppg_name || '-' }}</td>
                  <td>{{ formatDate((item as FundingDisbursementRecord).disbursement_date) }}</td>
                  <td>{{ formatCurrency((item as FundingDisbursementRecord).amount) }}</td>
                  <td>{{ (item as FundingDisbursementRecord).reference_number || '-' }}</td>
                  <td><StatusBadge :status="(item as FundingDisbursementRecord).status" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Record Disbursement</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateDisbursement">
            <input v-model="disbursementForm.sppg_name" class="toolbar-input" placeholder="SPPG name" />
            <input v-model="disbursementForm.disbursement_date" class="toolbar-input" type="date" />
            <input v-model.number="disbursementForm.amount" class="toolbar-input" min="0" step="1000" type="number" />
            <input v-model="disbursementForm.reference_number" class="toolbar-input" placeholder="Reference number" />
            <textarea v-model="disbursementForm.notes" class="toolbar-input min-h-24" />
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Catat Disbursement' }}</button>
          </form>
        </article>
      </section>

      <section v-else class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.repayments"
          :search-text-resolver="repaymentSearchText"
          empty-message="Belum ada repayment."
          search-placeholder="Cari reference repayment atau status..."
          title="Repayments"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Tanggal</th><th>Principal</th><th>Margin</th><th>Penalty</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as FundingRepaymentRecord).id">
                  <td>{{ formatDate((item as FundingRepaymentRecord).repayment_date) }}</td>
                  <td>{{ formatCurrency((item as FundingRepaymentRecord).principal_amount) }}</td>
                  <td>{{ formatCurrency((item as FundingRepaymentRecord).margin_amount) }}</td>
                  <td>{{ formatCurrency((item as FundingRepaymentRecord).penalty_amount || 0) }}</td>
                  <td><StatusBadge :status="(item as FundingRepaymentRecord).status" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Record Repayment</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateRepayment">
            <input v-model="repaymentForm.repayment_date" class="toolbar-input" type="date" />
            <input v-model.number="repaymentForm.principal_amount" class="toolbar-input" min="0" step="1000" type="number" />
            <input v-model.number="repaymentForm.margin_amount" class="toolbar-input" min="0" step="1000" type="number" />
            <input v-model.number="repaymentForm.penalty_amount" class="toolbar-input" min="0" step="1000" type="number" />
            <input v-model="repaymentForm.payment_reference" class="toolbar-input" placeholder="Payment reference" />
            <textarea v-model="repaymentForm.notes" class="toolbar-input min-h-24" />
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Catat Repayment' }}</button>
          </form>
        </article>
      </section>
    </template>
  </div>
</template>

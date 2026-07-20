<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createFundingAgreement,
  getFundingAgreements,
  getFundingDisbursements,
  getFundingRepayments,
  getFundingSources,
} from '@/services/erp-ops'
import type {
  FundingAgreementRecord,
  FundingDisbursementRecord,
  FundingRepaymentRecord,
  FundingSourceRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const sourcesState = useAsyncState(getFundingSources)
const agreementsState = useAsyncState(getFundingAgreements)
const disbursementsState = useAsyncState(getFundingDisbursements)
const repaymentsState = useAsyncState(getFundingRepayments)
const saving = ref(false)

const form = reactive({
  funding_source_id: 'fund-src-2',
  agreement_type: 'MUDHARABAH',
  principal_amount: 10000000,
  margin_method: 'PERCENTAGE',
  margin_rate: 12,
  fixed_margin_amount: 0,
  status: 'DRAFT',
  start_date: '2026-07-20',
  end_date: '2026-12-31',
  notes: 'Perjanjian pendanaan baru untuk ekspansi semester berjalan.',
})

const activeAgreements = computed(
  () => (agreementsState.data.value?.items || []).filter((item) => item.status === 'ACTIVE').length,
)
const totalPrincipal = computed(
  () => (agreementsState.data.value?.items || []).reduce((sum, item) => sum + item.principal_amount, 0),
)

const handleCreateAgreement = async () => {
  saving.value = true
  try {
    const created = await createFundingAgreement({
      funding_source_id: form.funding_source_id,
      agreement_type: form.agreement_type,
      principal_amount: Number(form.principal_amount),
      margin_method: form.margin_method,
      margin_rate: form.margin_method === 'PERCENTAGE' ? Number(form.margin_rate) : null,
      fixed_margin_amount: form.margin_method === 'FIXED' ? Number(form.fixed_margin_amount) : null,
      status: form.status,
      start_date: form.start_date,
      end_date: form.end_date,
      notes: form.notes,
    })
    if (agreementsState.data.value) {
      agreementsState.data.value = {
        ...agreementsState.data.value,
        items: [created, ...agreementsState.data.value.items],
        total: agreementsState.data.value.total + 1,
      }
    }
  } finally {
    saving.value = false
  }
}

const sourceSearchText = (item: unknown) => {
  const row = item as FundingSourceRecord
  return [row.name, row.source_type, row.provider_name, row.status].filter(Boolean).join(' ')
}

const agreementSearchText = (item: unknown) => {
  const row = item as FundingAgreementRecord
  return [row.agreement_number, row.funding_source_name, row.agreement_type, row.status].filter(Boolean).join(' ')
}

const disbursementSearchText = (item: unknown) => {
  const row = item as FundingDisbursementRecord
  return [row.agreement_number, row.sppg_name, row.reference_number, row.status].filter(Boolean).join(' ')
}

const repaymentSearchText = (item: unknown) => {
  const row = item as FundingRepaymentRecord
  return [row.agreement_number, row.payment_reference, row.status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Funding Agreements"
      subtitle="Modul funding mengelola sumber dana, agreement pendanaan, pencairan principal, dan repayment principal atau margin agar posisi investor serta likuiditas yayasan tetap terpantau."
      :badges="['Funding Source', 'Agreement', 'Disbursement & Repayment']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Funding sources</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ sourcesState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Sumber dana pemerintah dan investor yang siap dipakai yayasan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Active agreements</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ activeAgreements }}</p>
        <p class="mt-2 text-sm text-app-body">Agreement aktif yang masih bisa dicairkan atau direpay.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Principal value</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalPrincipal) }}</p>
        <p class="mt-2 text-sm text-app-body">Total nilai principal pada seluruh agreement pendanaan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Repayment posted</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ repaymentsState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Pengembalian principal dan margin yang sudah tercatat.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Agreement</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Buat funding agreement baru</h2>
          </div>
          <span class="status-pill">POST /funding/agreements</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="handleCreateAgreement">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Funding source</span>
              <select v-model="form.funding_source_id" class="toolbar-input">
                <option v-for="source in sourcesState.data.value?.items || []" :key="source.id" :value="source.id">{{ source.name }}</option>
              </select>
            </label>
            <label class="form-field">
              <span>Agreement type</span>
              <select v-model="form.agreement_type" class="toolbar-input">
                <option value="MUDHARABAH">MUDHARABAH</option>
                <option value="QARDH">QARDH</option>
              </select>
            </label>
            <label class="form-field">
              <span>Principal amount</span>
              <input v-model.number="form.principal_amount" class="toolbar-input" min="0" step="1000" type="number" />
            </label>
            <label class="form-field">
              <span>Margin method</span>
              <select v-model="form.margin_method" class="toolbar-input">
                <option value="PERCENTAGE">PERCENTAGE</option>
                <option value="FIXED">FIXED</option>
              </select>
            </label>
            <label class="form-field" v-if="form.margin_method === 'PERCENTAGE'">
              <span>Margin rate</span>
              <input v-model.number="form.margin_rate" class="toolbar-input" min="0" step="0.1" type="number" />
            </label>
            <label class="form-field" v-else>
              <span>Fixed margin amount</span>
              <input v-model.number="form.fixed_margin_amount" class="toolbar-input" min="0" step="1000" type="number" />
            </label>
            <label class="form-field">
              <span>Status</span>
              <select v-model="form.status" class="toolbar-input">
                <option value="DRAFT">DRAFT</option>
                <option value="ACTIVE">ACTIVE</option>
              </select>
            </label>
            <label class="form-field">
              <span>Start date</span>
              <input v-model="form.start_date" class="toolbar-input" type="date" />
            </label>
            <label class="form-field">
              <span>End date</span>
              <input v-model="form.end_date" class="toolbar-input" type="date" />
            </label>
          </div>
          <label class="form-field">
            <span>Notes</span>
            <textarea v-model="form.notes" class="toolbar-input min-h-24" />
          </label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Agreement' }}</button>
          </div>
        </form>
      </article>

      <DataTableCard
        :items="sourcesState.data.value?.items || []"
        :search-text-resolver="sourceSearchText"
        empty-message="Belum ada funding source."
        search-placeholder="Cari source, provider, atau status..."
        title="Funding Sources"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Source</th><th>Type</th><th>Provider</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FundingSourceRecord).id">
                <td>{{ (item as FundingSourceRecord).name }}</td>
                <td>{{ (item as FundingSourceRecord).source_type }}</td>
                <td>{{ (item as FundingSourceRecord).provider_name || '-' }}</td>
                <td><StatusBadge :status="(item as FundingSourceRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <DataTableCard
      :items="agreementsState.data.value?.items || []"
      :search-text-resolver="agreementSearchText"
      empty-message="Belum ada funding agreement."
      search-placeholder="Cari agreement number, source, atau status..."
      title="Funding Agreements"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead><tr><th>Agreement</th><th>Source</th><th>Principal</th><th>Margin</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="(item as FundingAgreementRecord).id">
              <td>
                {{ (item as FundingAgreementRecord).agreement_number }}
                <p class="mt-1 text-xs text-app-muted">{{ (item as FundingAgreementRecord).agreement_type }}</p>
              </td>
              <td>{{ (item as FundingAgreementRecord).funding_source_name }}</td>
              <td>{{ formatCurrency((item as FundingAgreementRecord).principal_amount) }}</td>
              <td>
                <span v-if="(item as FundingAgreementRecord).margin_method === 'PERCENTAGE'">{{ (item as FundingAgreementRecord).margin_rate || 0 }}%</span>
                <span v-else>{{ formatCurrency((item as FundingAgreementRecord).fixed_margin_amount || 0) }}</span>
              </td>
              <td><StatusBadge :status="(item as FundingAgreementRecord).status" /></td>
              <td><RouterLink class="secondary-button" :to="`/funding/agreements/${(item as FundingAgreementRecord).id}`">Detail</RouterLink></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="disbursementsState.data.value?.items || []"
        :search-text-resolver="disbursementSearchText"
        empty-message="Belum ada funding disbursement."
        search-placeholder="Cari agreement, SPPG, atau reference..."
        title="Funding Disbursements"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Agreement</th><th>SPPG</th><th>Tanggal</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FundingDisbursementRecord).id">
                <td>{{ (item as FundingDisbursementRecord).agreement_number }}</td>
                <td>{{ (item as FundingDisbursementRecord).sppg_name || '-' }}</td>
                <td>{{ formatDate((item as FundingDisbursementRecord).disbursement_date) }}</td>
                <td>{{ formatCurrency((item as FundingDisbursementRecord).amount) }}</td>
                <td><StatusBadge :status="(item as FundingDisbursementRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="repaymentsState.data.value?.items || []"
        :search-text-resolver="repaymentSearchText"
        empty-message="Belum ada funding repayment."
        search-placeholder="Cari agreement, reference payment, atau status..."
        title="Funding Repayments"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Agreement</th><th>Tanggal</th><th>Principal</th><th>Margin</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FundingRepaymentRecord).id">
                <td>{{ (item as FundingRepaymentRecord).agreement_number }}</td>
                <td>{{ formatDate((item as FundingRepaymentRecord).repayment_date) }}</td>
                <td>{{ formatCurrency((item as FundingRepaymentRecord).principal_amount) }}</td>
                <td>{{ formatCurrency((item as FundingRepaymentRecord).margin_amount) }}</td>
                <td><StatusBadge :status="(item as FundingRepaymentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  addGovernmentClaimAdjustment,
  addGovernmentClaimPayment,
  getGovernmentClaimById,
  submitGovernmentClaim,
  verifyGovernmentClaim,
} from '@/services/operations'
import type {
  GovernmentClaimAdjustmentRecord,
  GovernmentClaimEvidenceRecord,
  GovernmentClaimLineRecord,
  GovernmentClaimPaymentRecord,
} from '@/types/domain'
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '@/utils/format'

const route = useRoute()
const claimId = computed(() => String(route.params.claimId || ''))
const detailState = useAsyncState(() => getGovernmentClaimById(claimId.value))

const actionLoading = ref(false)
const actionMessage = ref('')

const adjustmentForm = reactive({
  adjustment_date: '2026-07-20',
  adjustment_type: 'DEDUCTION',
  amount: -250000,
  notes: 'Koreksi minor karena rounding dan portion reject.',
})

const paymentForm = reactive({
  payment_date: '2026-07-20',
  payment_number: 'CLM-PAY-20260720-NEW',
  amount: 5000000,
  notes: 'Pembayaran termin berikutnya.',
})

const detail = computed(() => detailState.data.value ?? null)
const header = computed(() => detail.value?.claim ?? null)

const lineSearchText = (item: unknown) => {
  const row = item as GovernmentClaimLineRecord
  return [row.delivery_order_number, row.production_order_number, row.school_name].filter(Boolean).join(' ')
}

const evidenceSearchText = (item: unknown) => {
  const row = item as GovernmentClaimEvidenceRecord
  return [row.label, row.reference_type, row.reference_number, row.status].filter(Boolean).join(' ')
}

const adjustmentSearchText = (item: unknown) => {
  const row = item as GovernmentClaimAdjustmentRecord
  return [row.adjustment_date, row.adjustment_type, row.notes].filter(Boolean).join(' ')
}

const paymentSearchText = (item: unknown) => {
  const row = item as GovernmentClaimPaymentRecord
  return [row.payment_date, row.payment_number, row.notes].filter(Boolean).join(' ')
}

const handleSubmitClaim = async () => {
  actionLoading.value = true
  actionMessage.value = ''
  try {
    detailState.data.value = await submitGovernmentClaim(claimId.value)
    actionMessage.value = 'Claim berhasil disubmit ke tahap verifikasi.'
  } finally {
    actionLoading.value = false
  }
}

const handleVerifyClaim = async () => {
  actionLoading.value = true
  actionMessage.value = ''
  try {
    detailState.data.value = await verifyGovernmentClaim(claimId.value)
    actionMessage.value = 'Claim berhasil diverifikasi.'
  } finally {
    actionLoading.value = false
  }
}

const handleAddAdjustment = async () => {
  actionLoading.value = true
  actionMessage.value = ''
  try {
    detailState.data.value = await addGovernmentClaimAdjustment(claimId.value, {
      adjustment_date: adjustmentForm.adjustment_date,
      adjustment_type: adjustmentForm.adjustment_type,
      amount: Number(adjustmentForm.amount),
      notes: adjustmentForm.notes,
    })
    actionMessage.value = 'Adjustment claim berhasil ditambahkan.'
  } finally {
    actionLoading.value = false
  }
}

const handleAddPayment = async () => {
  actionLoading.value = true
  actionMessage.value = ''
  try {
    detailState.data.value = await addGovernmentClaimPayment(claimId.value, {
      payment_date: paymentForm.payment_date,
      payment_number: paymentForm.payment_number,
      amount: Number(paymentForm.amount),
      notes: paymentForm.notes,
    })
    actionMessage.value = 'Payment claim berhasil dicatat.'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Government Claim Detail"
      subtitle="Detail claim menampilkan evidence, delivery basis, adjustment, payment, dan workflow verifikasi agar receivable tetap audit-ready."
      :badges="[claimId || 'government-claim', 'Receivable', 'Verification']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat detail government claim...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <article class="glass-panel p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Claim Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.claim_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.claim_type }} | {{ formatDate(header.claim_date) }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Claimed</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.claimed_amount) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Approved</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.approved_amount || 0) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Paid</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.paid_amount || 0) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Outstanding</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.outstanding_amount || 0) }}</p></div>
          </div>

          <p class="mt-5 text-sm text-app-body">{{ header.notes }}</p>
          <p v-if="header.verified_by" class="mt-3 text-sm text-app-muted">
            Verified by {{ header.verified_by }} pada {{ header.verified_at ? formatDateTime(header.verified_at) : '-' }}
          </p>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Claim Actions</p>
          <div class="mt-4 grid gap-3">
            <button
              class="primary-button"
              :disabled="actionLoading || header.status !== 'DRAFT'"
              type="button"
              @click="handleSubmitClaim"
            >
              {{ actionLoading && header.status === 'DRAFT' ? 'Memproses...' : 'Submit Claim' }}
            </button>
            <button
              class="secondary-button"
              :disabled="actionLoading || header.status !== 'SUBMITTED'"
              type="button"
              @click="handleVerifyClaim"
            >
              {{ actionLoading && header.status === 'SUBMITTED' ? 'Memproses...' : 'Verify Claim' }}
            </button>
          </div>

          <p v-if="actionMessage" class="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ actionMessage }}
          </p>

          <RouterLink class="secondary-button mt-5 w-full" to="/government-claims">Kembali ke Claim List</RouterLink>
        </article>
      </section>

      <DataTableCard
        :items="detail.lines"
        :search-text-resolver="lineSearchText"
        search-placeholder="Cari delivery order, production order, atau sekolah..."
        title="Claim Lines"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Delivery</th><th>Production</th><th>School</th><th>Received</th><th>Cost / Portion</th><th>Amount</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as GovernmentClaimLineRecord).id">
                <td>{{ (item as GovernmentClaimLineRecord).delivery_order_number }}</td>
                <td>{{ (item as GovernmentClaimLineRecord).production_order_number }}</td>
                <td>{{ (item as GovernmentClaimLineRecord).school_name }}</td>
                <td>{{ formatNumber((item as GovernmentClaimLineRecord).received_portions) }}</td>
                <td>{{ formatCurrency((item as GovernmentClaimLineRecord).actual_cost_per_portion) }}</td>
                <td>{{ formatCurrency((item as GovernmentClaimLineRecord).line_amount) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <section class="grid gap-6 xl:grid-cols-2">
        <DataTableCard
          :items="detail.evidence"
          :search-text-resolver="evidenceSearchText"
          search-placeholder="Cari label evidence atau reference..."
          title="Evidence"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Label</th><th>Reference Type</th><th>Reference Number</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="item in items" :key="(item as GovernmentClaimEvidenceRecord).id">
                  <td>{{ (item as GovernmentClaimEvidenceRecord).label }}</td>
                  <td>{{ (item as GovernmentClaimEvidenceRecord).reference_type }}</td>
                  <td>{{ (item as GovernmentClaimEvidenceRecord).reference_number }}</td>
                  <td><StatusBadge :status="(item as GovernmentClaimEvidenceRecord).status" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Workflow Snapshot</p>
          <div v-if="detail.workflow" class="mt-4 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-body">Current state</p>
              <p class="mt-2 font-semibold text-app-heading">{{ detail.workflow.current_state }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-body">Approval requests</p>
              <p class="mt-2 font-semibold text-app-heading">{{ detail.workflow.approval_requests.length }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-body">History events</p>
              <p class="mt-2 font-semibold text-app-heading">{{ detail.workflow.history.length }}</p>
            </div>
          </div>
        </article>
      </section>

      <section class="grid gap-6 xl:grid-cols-2">
        <div class="space-y-6">
          <DataTableCard
            :items="detail.adjustments"
            :search-text-resolver="adjustmentSearchText"
            empty-message="Belum ada adjustment claim."
            search-placeholder="Cari adjustment type, notes, atau tanggal..."
            title="Adjustments"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead><tr><th>Tanggal</th><th>Type</th><th>Amount</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as GovernmentClaimAdjustmentRecord).id">
                    <td>{{ formatDate((item as GovernmentClaimAdjustmentRecord).adjustment_date) }}</td>
                    <td>{{ (item as GovernmentClaimAdjustmentRecord).adjustment_type }}</td>
                    <td>{{ formatCurrency((item as GovernmentClaimAdjustmentRecord).amount) }}</td>
                    <td>{{ (item as GovernmentClaimAdjustmentRecord).notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>

          <article class="glass-panel p-6">
            <p class="eyebrow-text">Add Adjustment</p>
            <form class="mt-4 grid gap-4" @submit.prevent="handleAddAdjustment">
              <input v-model="adjustmentForm.adjustment_date" class="toolbar-input" type="date" required />
              <select v-model="adjustmentForm.adjustment_type" class="toolbar-input">
                <option value="DEDUCTION">DEDUCTION</option>
                <option value="ADDITION">ADDITION</option>
              </select>
              <input v-model.number="adjustmentForm.amount" class="toolbar-input" step="1000" type="number" required />
              <textarea v-model="adjustmentForm.notes" class="toolbar-input min-h-24" />
              <button class="primary-button" :disabled="actionLoading" type="submit">Tambah Adjustment</button>
            </form>
          </article>
        </div>

        <div class="space-y-6">
          <DataTableCard
            :items="detail.payments"
            :search-text-resolver="paymentSearchText"
            empty-message="Belum ada payment claim."
            search-placeholder="Cari payment number, notes, atau tanggal..."
            title="Payments"
          >
            <template #table="{ items }">
              <table class="data-table">
                <thead><tr><th>Tanggal</th><th>Payment Number</th><th>Amount</th><th>Notes</th></tr></thead>
                <tbody>
                  <tr v-for="item in items" :key="(item as GovernmentClaimPaymentRecord).id">
                    <td>{{ formatDate((item as GovernmentClaimPaymentRecord).payment_date) }}</td>
                    <td>{{ (item as GovernmentClaimPaymentRecord).payment_number }}</td>
                    <td>{{ formatCurrency((item as GovernmentClaimPaymentRecord).amount) }}</td>
                    <td>{{ (item as GovernmentClaimPaymentRecord).notes || '-' }}</td>
                  </tr>
                </tbody>
              </table>
            </template>
          </DataTableCard>

          <article class="glass-panel p-6">
            <p class="eyebrow-text">Add Payment</p>
            <form class="mt-4 grid gap-4" @submit.prevent="handleAddPayment">
              <input v-model="paymentForm.payment_date" class="toolbar-input" type="date" required />
              <input v-model="paymentForm.payment_number" class="toolbar-input" placeholder="Payment number" required />
              <input v-model.number="paymentForm.amount" class="toolbar-input" step="1000" type="number" required />
              <textarea v-model="paymentForm.notes" class="toolbar-input min-h-24" />
              <button class="primary-button" :disabled="actionLoading" type="submit">Catat Payment</button>
            </form>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

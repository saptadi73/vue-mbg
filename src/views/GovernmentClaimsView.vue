<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createGovernmentClaim, getGovernmentClaims } from '@/services/operations'
import type { GovernmentClaimRecord } from '@/types/domain'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const claimState = useAsyncState(getGovernmentClaims)
const saving = ref(false)
const formMessage = ref('')

const claimForm = reactive({
  claim_date: '2026-07-20',
  claim_type: 'ACTUAL_COST',
  notes: 'Draft claim dari delivery order yang sudah memiliki proof penerimaan.',
  delivery_order_ids: 'DO-20260720-0001',
})

const totalOutstanding = computed(() =>
  (claimState.data.value?.items || []).reduce((sum, item) => sum + (item.outstanding_amount || 0), 0),
)

const totalPaid = computed(() =>
  (claimState.data.value?.items || []).reduce((sum, item) => sum + (item.paid_amount || 0), 0),
)

const claimSearchText = (item: unknown) => {
  const row = item as GovernmentClaimRecord
  return [row.claim_number, row.claim_type, row.status, row.claim_date].filter(Boolean).join(' ')
}

const submitClaimDraft = async () => {
  saving.value = true
  formMessage.value = ''

  try {
    const created = await createGovernmentClaim({
      claim_date: claimForm.claim_date,
      claim_type: claimForm.claim_type,
      notes: claimForm.notes,
      delivery_order_ids: claimForm.delivery_order_ids
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    })

    if (claimState.data.value) {
      claimState.data.value = {
        ...claimState.data.value,
        items: [created.claim, ...claimState.data.value.items],
        total: claimState.data.value.total + 1,
      }
    }

    formMessage.value = `Government claim ${created.claim.claim_number} berhasil dibuat sebagai draft.`
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Government Claims"
      subtitle="Kelola claim biaya aktual berbasis delivery yang sudah memiliki proof penerimaan, lalu lanjutkan ke submit, verifikasi, adjustment, dan payment."
      :badges="['Claim List', 'Receivable', 'Verification Flow']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total claims</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ claimState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Jumlah claim yang sedang dikelola tenant.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Outstanding receivable</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalOutstanding) }}</p>
        <p class="mt-2 text-sm text-app-body">Piutang claim yang belum dibayar penuh.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Paid amount</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalPaid) }}</p>
        <p class="mt-2 text-sm text-app-body">Total pembayaran claim yang sudah tercatat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Claim basis</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Actual Cost</p>
        <p class="mt-2 text-sm text-app-body">Nilai claim dihitung dari delivery received x actual cost per portion.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <DataTableCard
        :items="claimState.data.value?.items || []"
        :search-text-resolver="claimSearchText"
        search-placeholder="Cari nomor claim, tanggal, type, atau status..."
        title="Claim Portfolio"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Claim Number</th>
                <th>Tanggal</th>
                <th>Type</th>
                <th>Claimed</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as GovernmentClaimRecord).id">
                <td>{{ (item as GovernmentClaimRecord).claim_number }}</td>
                <td>{{ formatDate((item as GovernmentClaimRecord).claim_date) }}</td>
                <td>{{ (item as GovernmentClaimRecord).claim_type }}</td>
                <td>{{ formatCurrency((item as GovernmentClaimRecord).claimed_amount) }}</td>
                <td>{{ formatCurrency((item as GovernmentClaimRecord).outstanding_amount || 0) }}</td>
                <td><StatusBadge :status="(item as GovernmentClaimRecord).status" /></td>
                <td>
                  <RouterLink class="secondary-button" :to="`/government-claims/${(item as GovernmentClaimRecord).id}`">
                    Detail
                  </RouterLink>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Draft</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Buat government claim</h2>
          </div>
          <span class="status-pill">POST /government-claims</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="submitClaimDraft">
          <label class="form-field">
            <span>Claim date</span>
            <input v-model="claimForm.claim_date" class="toolbar-input" type="date" required />
          </label>
          <label class="form-field">
            <span>Claim type</span>
            <select v-model="claimForm.claim_type" class="toolbar-input">
              <option value="ACTUAL_COST">ACTUAL_COST</option>
            </select>
          </label>
          <label class="form-field">
            <span>Delivery order IDs</span>
            <input
              v-model="claimForm.delivery_order_ids"
              class="toolbar-input"
              placeholder="DO-20260720-0001, DO-20260720-0002"
              required
            />
          </label>
          <label class="form-field">
            <span>Catatan</span>
            <textarea v-model="claimForm.notes" class="toolbar-input min-h-28" />
          </label>

          <button class="primary-button" :disabled="saving" type="submit">
            {{ saving ? 'Menyimpan...' : 'Buat Draft Claim' }}
          </button>

          <p v-if="formMessage" class="rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ formMessage }}
          </p>
        </form>

        <div class="surface-subtle mt-5 rounded-3xl p-4">
          <p class="text-sm font-semibold text-app-heading">Catatan alur</p>
          <p class="mt-2 text-sm text-app-body">
            Setelah draft dibuat, buka detail claim untuk melakukan submit ke tahap verifikasi, lalu finance manager dapat menambahkan adjustment dan payment sesuai progres claim.
          </p>
        </div>
      </article>
    </section>
  </div>
</template>

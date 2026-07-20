<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import DocumentActionCard from '@/components/common/DocumentActionCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  approveBudgetRecord,
  createBudgetRecord,
  getBudgetRecords,
  rejectBudgetRecord,
  submitBudgetRecord as submitBudgetForApproval,
} from '@/services/erp-ops'
import type { BudgetRecord, BudgetLineRecord, CreateBudgetPayload } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const budgetState = useAsyncState(getBudgetRecords)
const saving = ref(false)
const actionLoadingId = ref('')
const actionMessage = ref('')
const actionError = ref('')
const selectedBudgetId = ref('')

const form = reactive<CreateBudgetPayload>({
  name: 'Budget Operasional Agustus 2026',
  date_start: '2026-08-01',
  date_end: '2026-08-31',
  notes: 'Draft budget baru untuk siklus produksi bulan depan.',
  lines: [
    { account_code: '510000', account_name: 'Bahan Baku', planned_amount: 2400000000 },
    { account_code: '520000', account_name: 'Distribusi', planned_amount: 640000000 },
  ],
})

const totalDraft = computed(() => form.lines.reduce((sum, line) => sum + line.planned_amount, 0))
const approvedBudget = computed(() =>
  (budgetState.data.value?.items || [])
    .filter((item) => item.status === 'APPROVED')
    .reduce((sum, item) => sum + item.effective_budget, 0),
)
const budgets = computed(() => budgetState.data.value?.items || [])
const selectedBudget = computed(() => budgets.value.find((item) => item.id === selectedBudgetId.value) || budgets.value[0] || null)

const addLine = () => {
  form.lines.push({
    account_code: '',
    account_name: '',
    planned_amount: 0,
  })
}

const removeLine = (index: number) => {
  form.lines.splice(index, 1)
}

const submitBudget = async () => {
  saving.value = true
  try {
    const created = await createBudgetRecord(form)
    if (budgetState.data.value) {
      budgetState.data.value = {
        ...budgetState.data.value,
        items: [created, ...budgetState.data.value.items],
        total: budgetState.data.value.total + 1,
      }
    }
  } finally {
    saving.value = false
  }
}

const replaceBudget = (updated: BudgetRecord) => {
  if (!budgetState.data.value) return

  budgetState.data.value = {
    ...budgetState.data.value,
    items: budgetState.data.value.items.map((item) => (item.id === updated.id ? updated : item)),
  }

  if (selectedBudgetId.value === updated.id || !selectedBudgetId.value) {
    selectedBudgetId.value = updated.id
  }
}

const handleSubmitBudget = async (budgetId: string) => {
  actionLoadingId.value = budgetId
  actionMessage.value = ''
  actionError.value = ''
  try {
    const updated = await submitBudgetForApproval(budgetId)
    replaceBudget(updated)
    actionMessage.value = 'Budget berhasil disubmit ke workflow approval.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal submit budget.'
  } finally {
    actionLoadingId.value = ''
  }
}

const handleApproveBudget = async (budgetId: string) => {
  actionLoadingId.value = budgetId
  actionMessage.value = ''
  actionError.value = ''
  try {
    const updated = await approveBudgetRecord(budgetId, 'Approved dari panel budget planning.')
    replaceBudget(updated)
    actionMessage.value = 'Budget berhasil diapprove.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal approve budget.'
  } finally {
    actionLoadingId.value = ''
  }
}

const handleRejectBudget = async (budgetId: string) => {
  actionLoadingId.value = budgetId
  actionMessage.value = ''
  actionError.value = ''
  try {
    const updated = await rejectBudgetRecord(budgetId, 'Budget perlu revisi line atau nominal.')
    replaceBudget(updated)
    actionMessage.value = 'Budget berhasil direject untuk revisi.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal reject budget.'
  } finally {
    actionLoadingId.value = ''
  }
}

const budgetSearchText = (item: unknown) => {
  const row = item as BudgetRecord
  return [row.name, row.status, row.notes, row.date_start, row.date_end].filter(Boolean).join(' ')
}

const budgetLineSearchText = (item: unknown) => {
  const row = item as BudgetLineRecord
  return [row.account_code, row.account_name].filter(Boolean).join(' ')
}

const selectBudget = (budgetId: string) => {
  selectedBudgetId.value = budgetId
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Budget Planning"
      subtitle="Di sini tim finance menyusun rencana anggaran per periode, memecah line account, lalu meneruskan draft ke workflow approval. Summary availability akan menjadi dasar reserve, commit, dan actual saat procurement berjalan."
      :badges="['Budget Draft', 'Approval Ready', 'Availability']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Approved budget</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(approvedBudget) }}</p>
        <p class="mt-2 text-sm text-app-body">Akumulasi budget yang sudah approved.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Draft baru</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalDraft) }}</p>
        <p class="mt-2 text-sm text-app-body">Nilai budget yang sedang kamu susun di form.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Reserved pressure</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Procurement-aware</p>
        <p class="mt-2 text-sm text-app-body">Purchase request akan menambah reserved amount bila line 510000 aktif.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Workflow readiness</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Draft -> Submitted</p>
        <p class="mt-2 text-sm text-app-body">Status bisnis budget tetap dipertahankan sambil history approval bertambah.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1fr_1.04fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input Budget</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Susun draft anggaran</h2>
          </div>
          <span class="status-pill">POST /budgets</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="submitBudget">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Nama budget</span>
              <input v-model="form.name" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Total draft</span>
              <input :value="formatCurrency(totalDraft)" class="toolbar-input" disabled type="text" />
            </label>
            <label class="form-field">
              <span>Tanggal mulai</span>
              <input v-model="form.date_start" class="toolbar-input" type="date" required />
            </label>
            <label class="form-field">
              <span>Tanggal akhir</span>
              <input v-model="form.date_end" class="toolbar-input" type="date" required />
            </label>
          </div>

          <label class="form-field">
            <span>Catatan</span>
            <textarea v-model="form.notes" class="toolbar-input min-h-24" />
          </label>

          <div class="surface-subtle rounded-3xl p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">Budget lines</p>
                <p class="mt-1 text-sm text-app-body">Pisahkan account utama agar availability mudah dipantau.</p>
              </div>
              <button class="secondary-button" type="button" @click="addLine">Tambah Line</button>
            </div>

            <div class="mt-4 grid gap-4">
              <div v-for="(line, index) in form.lines" :key="index" class="grid gap-3 rounded-2xl border border-[var(--app-panel-border)] p-4 md:grid-cols-[1fr_1.4fr_1fr_auto]">
                <input v-model="line.account_code" class="toolbar-input" placeholder="Account code" required />
                <input v-model="line.account_name" class="toolbar-input" placeholder="Account name" required />
                <input v-model.number="line.planned_amount" class="toolbar-input" min="0" step="1000" type="number" required />
                <button class="secondary-button" type="button" @click="removeLine(index)">Hapus</button>
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving || !form.lines.length" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Draft Budget' }}</button>
          </div>
        </form>
      </article>

      <div v-if="budgetState.loading.value" class="loading-panel">Memuat daftar budget...</div>
      <DataTableCard
        v-else
        :items="budgetState.data.value?.items || []"
        :search-text-resolver="budgetSearchText"
        search-placeholder="Cari budget, status, periode..."
        title="Ringkasan Budget & Availability"
      >
        <template #table="{ items }">
          <div v-if="actionMessage" class="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ actionMessage }}
          </div>
          <div v-if="actionError" class="mb-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {{ actionError }}
          </div>

          <table class="data-table">
            <thead><tr><th>Budget</th><th>Periode</th><th>Effective</th><th>Available</th><th>Lines</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as BudgetRecord).id">
                <td>
                  <p>{{ (item as BudgetRecord).name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as BudgetRecord).notes || 'Tanpa catatan tambahan.' }}</p>
                </td>
                <td>{{ formatDate((item as BudgetRecord).date_start) }} - {{ formatDate((item as BudgetRecord).date_end) }}</td>
                <td>{{ formatCurrency((item as BudgetRecord).effective_budget) }}</td>
                <td>{{ formatCurrency((item as BudgetRecord).available_budget) }}</td>
                <td>{{ (item as BudgetRecord).lines?.length || 0 }}</td>
                <td><StatusBadge :status="(item as BudgetRecord).status" /></td>
                <td>
                  <div class="flex flex-wrap gap-2">
                    <router-link
                      :to="{ name: 'budget-detail', params: { budgetId: (item as BudgetRecord).id } }"
                      class="secondary-button"
                    >
                      Detail
                    </router-link>
                    <button
                      class="secondary-button"
                      type="button"
                      @click="selectBudget((item as BudgetRecord).id)"
                    >
                      Focus
                    </button>
                    <button
                      v-if="(item as BudgetRecord).status === 'DRAFT'"
                      class="secondary-button"
                      :disabled="actionLoadingId === (item as BudgetRecord).id"
                      type="button"
                      @click="handleSubmitBudget((item as BudgetRecord).id)"
                    >
                      Submit
                    </button>
                    <button
                      v-if="(item as BudgetRecord).status === 'SUBMITTED'"
                      class="secondary-button"
                      :disabled="actionLoadingId === (item as BudgetRecord).id"
                      type="button"
                      @click="handleApproveBudget((item as BudgetRecord).id)"
                    >
                      Approve
                    </button>
                    <button
                      v-if="(item as BudgetRecord).status === 'SUBMITTED'"
                      class="secondary-button"
                      :disabled="actionLoadingId === (item as BudgetRecord).id"
                      type="button"
                      @click="handleRejectBudget((item as BudgetRecord).id)"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="selectedBudget" class="mt-6 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-app-heading">{{ selectedBudget.name }}</p>
                  <p class="mt-1 text-sm text-app-body">Line budget dan utilisasi account</p>
                </div>
                <StatusBadge :status="selectedBudget.status" />
              </div>

              <div class="mt-4 grid gap-4 xl:grid-cols-3">
                <DocumentActionCard
                  v-if="selectedBudget.status === 'DRAFT'"
                  action-label="Submit Budget"
                  :description="`Kirim ${selectedBudget.name} ke approval queue agar governance dan tenant admin bisa menilai readiness budget.`"
                  :loading="actionLoadingId === selectedBudget.id"
                  helper-text="Status draft akan berubah menjadi submitted dan approval request dibuat otomatis."
                  title="Submit ke Workflow"
                  @action="handleSubmitBudget(selectedBudget.id)"
                />
                <DocumentActionCard
                  v-if="selectedBudget.status === 'SUBMITTED'"
                  action-label="Approve Budget"
                  :description="`Setujui ${selectedBudget.name} agar line budget bisa dipakai untuk reserved, committed, dan actual flow berikutnya.`"
                  :loading="actionLoadingId === selectedBudget.id"
                  helper-text="Approval akan membuka budget untuk transaksi operasional."
                  title="Approve Governance"
                  @action="handleApproveBudget(selectedBudget.id)"
                />
                <DocumentActionCard
                  v-if="selectedBudget.status === 'SUBMITTED'"
                  action-label="Reject Budget"
                  :description="`Kembalikan ${selectedBudget.name} ke tim penyusun bila nominal atau struktur account masih perlu revisi.`"
                  :loading="actionLoadingId === selectedBudget.id"
                  helper-text="Reject disimpan sebagai jejak keputusan governance."
                  title="Reject untuk Revisi"
                  @action="handleRejectBudget(selectedBudget.id)"
                />
              </div>

              <DataTableCard
                v-if="selectedBudget.lines?.length"
                :items="selectedBudget.lines"
                :page-size="4"
                :search-text-resolver="budgetLineSearchText"
                empty-message="Belum ada budget line."
                search-placeholder="Cari account code atau nama..."
                title="Budget Lines"
              >
                <template #table="{ items: lineItems }">
                  <table class="data-table">
                    <thead><tr><th>Account</th><th>Planned</th><th>Reserved</th><th>Committed</th><th>Actual</th><th>Available</th></tr></thead>
                    <tbody>
                      <tr v-for="line in lineItems" :key="(line as BudgetLineRecord).id">
                        <td>{{ (line as BudgetLineRecord).account_code }} - {{ (line as BudgetLineRecord).account_name }}</td>
                        <td>{{ formatCurrency((line as BudgetLineRecord).planned_amount) }}</td>
                        <td>{{ formatCurrency((line as BudgetLineRecord).reserved_amount || 0) }}</td>
                        <td>{{ formatCurrency((line as BudgetLineRecord).committed_amount || 0) }}</td>
                        <td>{{ formatCurrency((line as BudgetLineRecord).actual_amount || 0) }}</td>
                        <td>{{ formatCurrency((line as BudgetLineRecord).available_budget || 0) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </template>
              </DataTableCard>
            </div>
          </div>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

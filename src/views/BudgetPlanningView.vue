<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createBudgetRecord, getBudgetRecords } from '@/services/erp-ops'
import type { CreateBudgetPayload } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const budgetState = useAsyncState(getBudgetRecords)
const saving = ref(false)

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

      <article class="glass-panel overflow-hidden">
        <div class="flex items-center justify-between gap-3 px-6 pt-6">
          <div>
            <p class="eyebrow-text">Portfolio Budget</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Ringkasan budget & availability</h2>
          </div>
          <button class="secondary-button" @click="budgetState.execute">Refresh</button>
        </div>
        <div v-if="budgetState.loading.value" class="loading-panel m-6">Memuat daftar budget...</div>
        <div v-else-if="budgetState.data.value" class="grid gap-4 p-6 pt-4">
          <div v-for="budget in budgetState.data.value.items" :key="budget.id" class="surface-subtle rounded-3xl p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">{{ budget.name }}</p>
                <p class="mt-1 text-sm text-app-body">{{ formatDate(budget.date_start) }} - {{ formatDate(budget.date_end) }}</p>
              </div>
              <StatusBadge :status="budget.status" />
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-2">
              <p class="text-sm text-app-body">Effective: <span class="font-semibold text-app-heading">{{ formatCurrency(budget.effective_budget) }}</span></p>
              <p class="text-sm text-app-body">Available: <span class="font-semibold text-app-heading">{{ formatCurrency(budget.available_budget) }}</span></p>
            </div>
            <div v-if="budget.lines?.length" class="mt-4 overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Planned</th>
                    <th>Reserved</th>
                    <th>Committed</th>
                    <th>Actual</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="line in budget.lines" :key="line.id">
                    <td>{{ line.account_code }} - {{ line.account_name }}</td>
                    <td>{{ formatCurrency(line.planned_amount) }}</td>
                    <td>{{ formatCurrency(line.reserved_amount || 0) }}</td>
                    <td>{{ formatCurrency(line.committed_amount || 0) }}</td>
                    <td>{{ formatCurrency(line.actual_amount || 0) }}</td>
                    <td>{{ formatCurrency(line.available_budget || 0) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

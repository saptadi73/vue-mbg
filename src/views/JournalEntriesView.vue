<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createJournalEntry, getAccounts, getJournalEntries } from '@/services/erp-ops'
import type { AccountRecord, JournalEntryRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

const journalState = useAsyncState(getJournalEntries)
const accountsState = useAsyncState(getAccounts)
const saving = ref(false)

const form = reactive({
  entry_date: '2026-07-20',
  reference: 'MANUAL-JE-001',
  description: 'Jurnal koreksi manual',
  source_module: 'accounting',
  source_document_type: 'manual_adjustment',
  source_document_id: '',
  lines: [
    { account_code: '610000', account_name: 'Beban Koreksi', line_type: 'DEBIT' as const, amount: 500000, description: 'Debit line' },
    { account_code: '110000', account_name: 'Kas / Bank', line_type: 'CREDIT' as const, amount: 500000, description: 'Credit line' },
  ],
})

const totalDebit = computed(() =>
  form.lines.filter((line) => line.line_type === 'DEBIT').reduce((sum, line) => sum + line.amount, 0),
)
const totalCredit = computed(() =>
  form.lines.filter((line) => line.line_type === 'CREDIT').reduce((sum, line) => sum + line.amount, 0),
)

const addLine = () => {
  form.lines.push({
    account_code: '',
    account_name: '',
    line_type: 'DEBIT',
    amount: 0,
    description: '',
  })
}

const removeLine = (index: number) => {
  form.lines.splice(index, 1)
}

const handleCreateJournal = async () => {
  saving.value = true
  try {
    const created = await createJournalEntry({
      entry_date: form.entry_date,
      reference: form.reference,
      description: form.description,
      source_module: form.source_module,
      source_document_type: form.source_document_type,
      source_document_id: form.source_document_id || null,
      lines: form.lines.map((line) => ({
        account_code: line.account_code,
        account_name: line.account_name,
        line_type: line.line_type,
        amount: Number(line.amount),
        description: line.description,
      })),
    })
    if (journalState.data.value) {
      journalState.data.value = {
        ...journalState.data.value,
        items: [created.journal_entry, ...journalState.data.value.items],
        total: journalState.data.value.total + 1,
      }
    }
  } finally {
    saving.value = false
  }
}

const journalSearchText = (item: unknown) => {
  const row = item as JournalEntryRecord
  return [row.entry_number, row.reference, row.description, row.source_module, row.status].filter(Boolean).join(' ')
}

const selectableAccounts = computed(() =>
  (accountsState.data.value?.items || []).filter((item) => item.allow_posting && item.is_active),
)

const syncLineAccount = (index: number, nextCode: string) => {
  const account = selectableAccounts.value.find((item) => item.code === nextCode)
  const line = form.lines[index]
  if (!account || !line) return
  line.account_code = account.code
  line.account_name = account.name
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Journal Entries"
      subtitle="Modul accounting menampilkan jurnal hasil posting operasional maupun jurnal manual, agar finance bisa melihat header, saldo debit-credit, dan status posting secara konsisten."
      :badges="['Accounting', 'Draft & Posted', 'Audit Trail']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Journal entries</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ journalState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Total header jurnal yang tersimpan di tenant aktif.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Draft debit</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalDebit) }}</p>
        <p class="mt-2 text-sm text-app-body">Nilai debit dari form jurnal manual yang sedang disusun.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Draft credit</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalCredit) }}</p>
        <p class="mt-2 text-sm text-app-body">Nilai credit harus seimbang sebelum jurnal disimpan.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Balance check</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ totalDebit === totalCredit ? 'Balanced' : 'Mismatch' }}</p>
        <p class="mt-2 text-sm text-app-body">Frontend akan menolak simpan bila debit dan credit belum sama.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Manual Journal</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Buat jurnal draft</h2>
          </div>
          <span class="status-pill">POST /journal-entries</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="handleCreateJournal">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Entry date</span>
              <input v-model="form.entry_date" class="toolbar-input" type="date" />
            </label>
            <label class="form-field">
              <span>Reference</span>
              <input v-model="form.reference" class="toolbar-input" />
            </label>
            <label class="form-field">
              <span>Source module</span>
              <input v-model="form.source_module" class="toolbar-input" />
            </label>
            <label class="form-field">
              <span>Document type</span>
              <input v-model="form.source_document_type" class="toolbar-input" />
            </label>
          </div>
          <label class="form-field">
            <span>Description</span>
            <textarea v-model="form.description" class="toolbar-input min-h-24" />
          </label>
          <div class="surface-subtle rounded-3xl p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">Journal lines</p>
                <p class="mt-1 text-sm text-app-body">Minimal harus ada satu debit dan satu credit.</p>
              </div>
              <button class="secondary-button" type="button" @click="addLine">Tambah Line</button>
            </div>
            <div class="mt-4 grid gap-4">
              <div
                v-for="(line, index) in form.lines"
                :key="index"
                class="grid gap-3 rounded-2xl border border-[var(--app-panel-border)] p-4 md:grid-cols-[1fr_1.2fr_0.85fr_0.9fr_auto]"
              >
                <select v-model="line.account_code" class="toolbar-input" @change="syncLineAccount(index, line.account_code)">
                  <option value="">Pilih account</option>
                  <option v-for="account in selectableAccounts" :key="account.id" :value="account.code">
                    {{ account.code }} - {{ account.name }}
                  </option>
                </select>
                <input v-model="line.account_name" class="toolbar-input" placeholder="Account name" readonly />
                <select v-model="line.line_type" class="toolbar-input">
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
                <input v-model.number="line.amount" class="toolbar-input" min="0" step="1000" type="number" />
                <button class="secondary-button" type="button" @click="removeLine(index)">Hapus</button>
              </div>
            </div>
          </div>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving || totalDebit !== totalCredit || !form.lines.length" type="submit">
              {{ saving ? 'Menyimpan...' : 'Simpan Draft Journal' }}
            </button>
          </div>
        </form>
      </article>

      <DataTableCard
        :items="journalState.data.value?.items || []"
        :search-text-resolver="journalSearchText"
        empty-message="Belum ada journal entry."
        search-placeholder="Cari entry number, reference, module, atau status..."
        title="Journal Entry List"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Entry</th><th>Date</th><th>Reference</th><th>Source</th><th>Debit</th><th>Credit</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as JournalEntryRecord).id">
                <td>{{ (item as JournalEntryRecord).entry_number }}</td>
                <td>{{ formatDate((item as JournalEntryRecord).entry_date) }}</td>
                <td>{{ (item as JournalEntryRecord).reference }}</td>
                <td>{{ (item as JournalEntryRecord).source_module }}</td>
                <td>{{ formatCurrency((item as JournalEntryRecord).total_debit) }}</td>
                <td>{{ formatCurrency((item as JournalEntryRecord).total_credit) }}</td>
                <td><StatusBadge :status="(item as JournalEntryRecord).status" /></td>
                <td><RouterLink class="secondary-button" :to="`/accounting/journal-entries/${(item as JournalEntryRecord).id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

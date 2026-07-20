<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import DocumentActionCard from '@/components/common/DocumentActionCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getJournalEntryById, postJournalEntry } from '@/services/erp-ops'
import type { JournalEntryLineRecord } from '@/types/domain'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

const route = useRoute()
const journalEntryId = computed(() => String(route.params.journalEntryId || ''))
const detailState = useAsyncState(() => getJournalEntryById(journalEntryId.value))
const actionLoading = ref(false)
const actionMessage = ref('')

const detail = computed(() => detailState.data.value ?? null)
const header = computed(() => detail.value?.journal_entry ?? null)

const lineSearchText = (item: unknown) => {
  const row = item as JournalEntryLineRecord
  return [row.account_code, row.account_name, row.line_type, row.description].filter(Boolean).join(' ')
}

const handlePostJournal = async () => {
  actionLoading.value = true
  actionMessage.value = ''
  try {
    detailState.data.value = await postJournalEntry(journalEntryId.value)
    actionMessage.value = 'Journal entry berhasil diposting.'
  } finally {
    actionLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Journal Entry Detail"
      subtitle="Detail jurnal wajib menampilkan header dan lines agar finance bisa memverifikasi keseimbangan debit-credit, sumber dokumen, dan status posting sebelum audit."
      :badges="[journalEntryId || 'journal-entry', 'Header & Lines', 'Posting Control']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat detail journal entry...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="detail && header">
      <section class="grid gap-4 xl:grid-cols-3">
        <article class="glass-panel p-5 xl:col-span-2">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Journal Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.entry_number }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ header.reference }} | {{ header.source_module }}</p>
            </div>
            <StatusBadge :status="header.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Entry Date</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatDate(header.entry_date) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Debit</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.total_debit) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Credit</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(header.total_credit) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-xs uppercase tracking-[0.2em] text-app-muted">Posted At</p><p class="mt-2 text-sm font-semibold text-app-heading">{{ header.posted_at ? formatDateTime(header.posted_at) : '-' }}</p></div>
          </div>
          <div class="mt-5 rounded-3xl border border-[var(--app-panel-border)] p-4">
            <p class="text-sm text-app-muted">Description</p>
            <p class="mt-2 text-sm text-app-body">{{ header.description }}</p>
          </div>
        </article>

        <div class="space-y-4">
          <DocumentActionCard
            v-if="header.status === 'DRAFT'"
            action-label="Post Journal"
            :loading="actionLoading"
            :description="`Post ${header.entry_number} untuk mengunci jurnal dan membuatnya resmi masuk ke reporting serta audit trail.`"
            :helper-text="actionMessage || 'Setelah diposting, jurnal berpindah dari DRAFT ke POSTED.'"
            title="Posting Journal"
            @action="handlePostJournal"
          />

          <article class="glass-panel p-5">
            <p class="eyebrow-text">Source Context</p>
            <div class="mt-4 grid gap-3 text-sm">
              <p class="text-app-body">Module: <span class="font-semibold text-app-heading">{{ header.source_module }}</span></p>
              <p class="text-app-body">Document Type: <span class="font-semibold text-app-heading">{{ header.source_document_type || '-' }}</span></p>
              <p class="text-app-body">Document ID: <span class="font-semibold text-app-heading">{{ header.source_document_id || '-' }}</span></p>
              <p class="text-app-body">Posted By: <span class="font-semibold text-app-heading">{{ header.posted_by || '-' }}</span></p>
            </div>
            <RouterLink class="secondary-button mt-5 w-full" to="/accounting/journal-entries">Kembali ke Journal List</RouterLink>
          </article>
        </div>
      </section>

      <DataTableCard
        :items="detail.lines"
        :search-text-resolver="lineSearchText"
        empty-message="Belum ada journal lines."
        search-placeholder="Cari account code, account name, atau type..."
        title="Journal Lines"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Account</th><th>Type</th><th>Amount</th><th>Description</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as JournalEntryLineRecord).id">
                <td>{{ (item as JournalEntryLineRecord).account_code }} - {{ (item as JournalEntryLineRecord).account_name }}</td>
                <td>{{ (item as JournalEntryLineRecord).line_type }}</td>
                <td>{{ formatCurrency((item as JournalEntryLineRecord).amount) }}</td>
                <td>{{ (item as JournalEntryLineRecord).description || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </template>
  </div>
</template>

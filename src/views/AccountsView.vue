<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createAccount, getAccounts } from '@/services/erp-ops'
import type { AccountRecord } from '@/types/domain'

const accountsState = useAsyncState(getAccounts)
const saving = ref(false)

const form = reactive<Omit<AccountRecord, 'id'>>({
  code: '140000',
  name: 'Piutang Lain-lain',
  category: 'ASSET',
  normal_balance: 'DEBIT',
  allow_posting: true,
  is_active: true,
})

const postingAccounts = computed(
  () => (accountsState.data.value?.items || []).filter((item) => item.allow_posting).length,
)

const handleCreateAccount = async () => {
  saving.value = true
  try {
    const created = await createAccount(form)
    if (accountsState.data.value) {
      accountsState.data.value = {
        ...accountsState.data.value,
        items: [created, ...accountsState.data.value.items],
        total: accountsState.data.value.total + 1,
      }
    }
  } finally {
    saving.value = false
  }
}

const accountSearchText = (item: unknown) => {
  const row = item as AccountRecord
  return [row.code, row.name, row.category, row.normal_balance].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Chart of Accounts"
      subtitle="Master account menjadi fondasi untuk jurnal, costing, procurement, claim, dan funding agar semua posting masuk ke struktur akun yang baku."
      :badges="['Accounting Master', 'Posting Accounts', 'Reusable Ledger']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Accounts</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ accountsState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Total account aktif di chart of accounts tenant.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Posting allowed</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ postingAccounts }}</p>
        <p class="mt-2 text-sm text-app-body">Account yang dapat dipakai langsung di journal lines.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Normal balance</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Debit / Credit</p>
        <p class="mt-2 text-sm text-app-body">Normal balance membantu user memilih arah pencatatan dengan benar.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Account categories</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Asset to Expense</p>
        <p class="mt-2 text-sm text-app-body">Struktur akun siap dipakai lintas modul operasional dan finance.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Account Form</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah account baru</h2>
          </div>
          <span class="status-pill">POST /accounts</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="handleCreateAccount">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>Code</span>
              <input v-model="form.code" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Name</span>
              <input v-model="form.name" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Category</span>
              <select v-model="form.category" class="toolbar-input">
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </label>
            <label class="form-field">
              <span>Normal balance</span>
              <select v-model="form.normal_balance" class="toolbar-input">
                <option value="DEBIT">DEBIT</option>
                <option value="CREDIT">CREDIT</option>
              </select>
            </label>
            <label class="form-field">
              <span>Allow posting</span>
              <select v-model="form.allow_posting" class="toolbar-input">
                <option :value="true">Ya</option>
                <option :value="false">Tidak</option>
              </select>
            </label>
            <label class="form-field">
              <span>Active</span>
              <select v-model="form.is_active" class="toolbar-input">
                <option :value="true">Aktif</option>
                <option :value="false">Nonaktif</option>
              </select>
            </label>
          </div>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Account' }}</button>
          </div>
        </form>
      </article>

      <DataTableCard
        :items="accountsState.data.value?.items || []"
        :search-text-resolver="accountSearchText"
        empty-message="Belum ada account."
        search-placeholder="Cari code, name, category..."
        title="Account List"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Normal Balance</th><th>Posting</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as AccountRecord).id">
                <td>{{ (item as AccountRecord).code }}</td>
                <td>{{ (item as AccountRecord).name }}</td>
                <td>{{ (item as AccountRecord).category }}</td>
                <td>{{ (item as AccountRecord).normal_balance }}</td>
                <td>{{ (item as AccountRecord).allow_posting ? 'Allowed' : 'Blocked' }}</td>
                <td><StatusBadge :status="(item as AccountRecord).is_active ? 'ACTIVE' : 'INACTIVE'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

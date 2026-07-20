<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { env } from '@/config/env'
import { useAsyncState } from '@/composables/useAsyncState'
import { createAssetCategory, getAssetCategories } from '@/services/assets'
import { getAccounts } from '@/services/erp-ops'
import type { AccountRecord, AssetCategoryRecord } from '@/types/domain'
import { formatNumber } from '@/utils/format'

const categoriesState = useAsyncState(getAssetCategories)
const accountsState = useAsyncState(getAccounts)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const postingAccounts = computed(() => (accountsState.data.value?.items || []).filter((item) => item.allow_posting))

const form = reactive({
  code: 'EQP',
  name: 'Peralatan Dapur',
  asset_account_id: 'acc-150100',
  depreciation_expense_account_id: 'acc-520100',
  accumulated_depreciation_account_id: 'acc-170100',
  useful_life_months: 60,
  depreciation_method: 'STRAIGHT_LINE',
  is_active: true,
})

const accountLabel = (accountId: string) =>
  postingAccounts.value.find((item) => item.id === accountId || item.code === accountId)?.name || accountId

const handleCreateCategory = async () => {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createAssetCategory({
      tenant_id: env.devTenantId,
      code: form.code,
      name: form.name,
      asset_account_id: form.asset_account_id,
      depreciation_expense_account_id: form.depreciation_expense_account_id,
      accumulated_depreciation_account_id: form.accumulated_depreciation_account_id,
      useful_life_months: Number(form.useful_life_months),
      depreciation_method: form.depreciation_method,
      is_active: form.is_active,
    })

    if (categoriesState.data.value) {
      categoriesState.data.value = {
        ...categoriesState.data.value,
        items: [response.item, ...categoriesState.data.value.items],
        total: categoriesState.data.value.total + 1,
      }
    }

    successMessage.value = response.fallback
      ? `Kategori ${response.item.name} tersimpan sebagai fallback mock karena backend category asset belum merespons.`
      : `Kategori ${response.item.name} berhasil dibuat di backend.`
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pembuatan kategori asset gagal. Periksa payload atau koneksi backend.'
  } finally {
    saving.value = false
  }
}

const categorySearchText = (item: unknown) => {
  const row = item as AssetCategoryRecord
  return [
    row.code,
    row.name,
    row.asset_account_id,
    row.depreciation_expense_account_id,
    row.accumulated_depreciation_account_id,
    row.depreciation_method,
  ]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Asset Categories"
      subtitle="Master kategori asset menjadi fondasi register asset, akun depresiasi default, dan umur manfaat yang konsisten lintas yayasan."
      :badges="['Asset Module', 'Category Master', 'Depreciation Setup']"
    />

    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Category</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah kategori asset</h2>
          </div>
          <span class="status-pill">POST /assets/categories</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="handleCreateCategory">
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
              <span>Asset Account</span>
              <select v-model="form.asset_account_id" class="toolbar-input" required>
                <option v-for="account in postingAccounts" :key="account.id" :value="account.id">
                  {{ account.code }} - {{ account.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Depreciation Expense Account</span>
              <select v-model="form.depreciation_expense_account_id" class="toolbar-input" required>
                <option v-for="account in postingAccounts" :key="account.id" :value="account.id">
                  {{ account.code }} - {{ account.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Accumulated Depreciation Account</span>
              <select v-model="form.accumulated_depreciation_account_id" class="toolbar-input" required>
                <option v-for="account in postingAccounts" :key="account.id" :value="account.id">
                  {{ account.code }} - {{ account.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Useful Life (Months)</span>
              <input v-model.number="form.useful_life_months" class="toolbar-input" min="1" type="number" required />
            </label>
            <label class="form-field">
              <span>Depreciation Method</span>
              <select v-model="form.depreciation_method" class="toolbar-input" required>
                <option value="STRAIGHT_LINE">STRAIGHT_LINE</option>
              </select>
            </label>
            <label class="form-field">
              <span>Status</span>
              <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
                <input v-model="form.is_active" type="checkbox" />
                <span class="text-sm text-app-heading">Aktifkan kategori asset</span>
              </label>
            </label>
          </div>

          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Simpan Kategori' }}
            </button>
          </div>

          <p v-if="successMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {{ errorMessage }}
          </p>
        </form>
      </article>

      <DataTableCard
        :items="categoriesState.data.value?.items || []"
        :search-text-resolver="categorySearchText"
        search-placeholder="Cari code, kategori, account, atau metode..."
        title="Daftar Kategori Asset"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Asset Account</th>
                <th>Expense Account</th>
                <th>Accumulated Dep</th>
                <th>Useful Life</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="category in items" :key="(category as AssetCategoryRecord).id">
                <td>
                  {{ (category as AssetCategoryRecord).name }}
                  <div class="text-xs text-app-muted">{{ (category as AssetCategoryRecord).code }}</div>
                </td>
                <td>{{ accountLabel((category as AssetCategoryRecord).asset_account_id) }}</td>
                <td>{{ accountLabel((category as AssetCategoryRecord).depreciation_expense_account_id) }}</td>
                <td>{{ accountLabel((category as AssetCategoryRecord).accumulated_depreciation_account_id) }}</td>
                <td>{{ formatNumber((category as AssetCategoryRecord).useful_life_months) }} bulan</td>
                <td><StatusBadge :status="(category as AssetCategoryRecord).is_active ? 'ACTIVE' : 'INACTIVE'" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

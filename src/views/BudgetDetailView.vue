<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  getBudgetAvailability,
  getBudgetById,
  getMonthlyBudgetRealizations,
  refreshMonthlyBudgetRealizations,
} from '@/services/erp-ops'
import type {
  BudgetAvailabilityLineRecord,
  MonthlyBudgetRealizationRecord,
} from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

type BudgetDetailPayload = Awaited<ReturnType<typeof loadBudgetDetail>>
type BudgetTab = 'overview' | 'realisasi'

const route = useRoute()
const budgetId = computed(() => String(route.params.budgetId || ''))
const activeTab = ref<BudgetTab>('overview')
const refreshMessage = ref('')
const refreshing = ref(false)

async function loadBudgetDetail() {
  const [budget, availability, realizations] = await Promise.all([
    getBudgetById(budgetId.value),
    getBudgetAvailability(budgetId.value),
    getMonthlyBudgetRealizations(budgetId.value),
  ])

  return {
    budget,
    availability,
    realizations: realizations.items,
  }
}

const detailState = useAsyncState<BudgetDetailPayload>(loadBudgetDetail)

const header = computed(() => detailState.data.value?.budget ?? null)
const availability = computed(() => detailState.data.value?.availability ?? null)
const realizations = computed(() => detailState.data.value?.realizations ?? [])

const reservedTotal = computed(() =>
  availability.value?.lines.reduce((sum, item) => sum + item.reserved_amount, 0) ?? 0,
)
const committedTotal = computed(() =>
  availability.value?.lines.reduce((sum, item) => sum + item.committed_amount, 0) ?? 0,
)
const actualTotal = computed(() =>
  availability.value?.lines.reduce((sum, item) => sum + item.actual_amount, 0) ?? 0,
)

const availabilitySearchText = (item: unknown) => {
  const row = item as BudgetAvailabilityLineRecord
  return [row.budget_line_id, row.category_name].filter(Boolean).join(' ')
}

const realizationSearchText = (item: unknown) => {
  const row = item as MonthlyBudgetRealizationRecord
  return [row.budget_name, row.month_label, row.account_code, row.account_name].filter(Boolean).join(' ')
}

const handleRefreshReadModel = async () => {
  refreshing.value = true
  refreshMessage.value = ''
  try {
    const result = await refreshMonthlyBudgetRealizations()
    await detailState.execute()
    refreshMessage.value = result.refreshed
      ? 'Monthly budget realization berhasil direfresh dari backend.'
      : 'Read model direload memakai fallback mock frontend.'
  } finally {
    refreshing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Budget Detail"
      subtitle="Halaman ini memecah budget menjadi availability line, utilisasi reserved-committed-actual, dan breakdown realisasi bulanan agar finance serta governance bisa membaca posisi budget lebih cepat."
      :badges="[budgetId || 'budget-detail', 'Availability', 'Realization Breakdown']"
    />

    <div v-if="detailState.loading.value" class="loading-panel">Memuat detail budget...</div>
    <div v-else-if="detailState.error.value" class="error-panel">
      <p>{{ detailState.error.value }}</p>
      <button class="primary-button mt-3" type="button" @click="detailState.execute">Muat ulang</button>
    </div>
    <template v-else-if="header && availability">
      <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article class="glass-panel p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">Budget Header</p>
              <h2 class="mt-2 font-display text-3xl text-app-heading">{{ header.name }}</h2>
              <p class="mt-2 text-sm text-app-body">
                {{ formatDate(header.date_start) }} - {{ formatDate(header.date_end) }}
              </p>
              <p class="mt-3 max-w-3xl text-sm text-app-body">
                {{ header.notes || 'Tidak ada catatan tambahan pada budget ini.' }}
              </p>
            </div>
            <StatusBadge :status="header.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Effective</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(availability.totals.effective_budget) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Reserved</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(reservedTotal) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Committed</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(committedTotal) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Actual</p>
              <p class="mt-2 text-sm font-semibold text-app-heading">{{ formatCurrency(actualTotal) }}</p>
            </div>
          </div>
        </article>

        <article class="glass-panel p-5">
          <p class="eyebrow-text">Budget Position</p>
          <div class="mt-4 grid gap-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Available budget</p>
              <p class="mt-2 font-display text-3xl text-app-heading">{{ formatCurrency(availability.totals.available_budget) }}</p>
              <p class="mt-2 text-sm text-app-body">Saldo ini menjadi ruang transaksi berikutnya untuk PR, PO, GR, invoice, dan payment.</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Budget lines</p>
              <p class="mt-2 font-semibold text-app-heading">{{ availability.lines.length }} line availability aktif</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Monthly rows</p>
              <p class="mt-2 font-semibold text-app-heading">{{ realizations.length }} baris realisasi bulanan</p>
            </div>
          </div>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="activeTab === 'overview' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
              type="button"
              @click="activeTab = 'overview'"
            >
              Availability Overview
            </button>
            <button
              class="rounded-full border px-4 py-2 text-sm transition"
              :class="activeTab === 'realisasi' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
              type="button"
              @click="activeTab = 'realisasi'"
            >
              Realisasi Bulanan
            </button>
          </div>
          <button class="secondary-button" :disabled="refreshing" type="button" @click="handleRefreshReadModel">
            {{ refreshing ? 'Refreshing...' : 'Refresh Read Model' }}
          </button>
        </div>
        <p v-if="refreshMessage" class="mt-3 text-sm text-app-muted">{{ refreshMessage }}</p>
      </section>

      <section v-if="activeTab === 'overview'" class="grid gap-6">
        <DataTableCard
          :items="availability.lines"
          :page-size="5"
          :search-text-resolver="availabilitySearchText"
          empty-message="Belum ada availability line."
          search-placeholder="Cari budget line atau kategori..."
          title="Budget Availability Breakdown"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Effective</th>
                  <th>Reserved</th>
                  <th>Committed</th>
                  <th>Actual</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as BudgetAvailabilityLineRecord).budget_line_id">
                  <td>
                    <p>{{ (item as BudgetAvailabilityLineRecord).category_name }}</p>
                    <p class="mt-1 text-xs text-app-muted">{{ (item as BudgetAvailabilityLineRecord).budget_line_id }}</p>
                  </td>
                  <td>{{ formatCurrency((item as BudgetAvailabilityLineRecord).effective_budget) }}</td>
                  <td>{{ formatCurrency((item as BudgetAvailabilityLineRecord).reserved_amount) }}</td>
                  <td>{{ formatCurrency((item as BudgetAvailabilityLineRecord).committed_amount) }}</td>
                  <td>{{ formatCurrency((item as BudgetAvailabilityLineRecord).actual_amount) }}</td>
                  <td>{{ formatCurrency((item as BudgetAvailabilityLineRecord).available_budget) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>

      <section v-else class="grid gap-6">
        <DataTableCard
          :items="realizations"
          :page-size="6"
          :search-text-resolver="realizationSearchText"
          empty-message="Belum ada monthly realization."
          search-placeholder="Cari bulan, account, atau nama budget..."
          title="Monthly Budget Realization Breakdown"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Account</th>
                  <th>Planned</th>
                  <th>Reserved</th>
                  <th>Committed</th>
                  <th>Actual</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="(item as MonthlyBudgetRealizationRecord).id">
                  <td>{{ (item as MonthlyBudgetRealizationRecord).month_label }}</td>
                  <td>
                    <p>{{ (item as MonthlyBudgetRealizationRecord).account_code }} - {{ (item as MonthlyBudgetRealizationRecord).account_name }}</p>
                    <p class="mt-1 text-xs text-app-muted">{{ (item as MonthlyBudgetRealizationRecord).budget_name }}</p>
                  </td>
                  <td>{{ formatCurrency((item as MonthlyBudgetRealizationRecord).planned_amount) }}</td>
                  <td>{{ formatCurrency((item as MonthlyBudgetRealizationRecord).reserved_amount) }}</td>
                  <td>{{ formatCurrency((item as MonthlyBudgetRealizationRecord).committed_amount) }}</td>
                  <td>{{ formatCurrency((item as MonthlyBudgetRealizationRecord).actual_amount) }}</td>
                  <td>{{ formatCurrency((item as MonthlyBudgetRealizationRecord).available_budget) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </section>
    </template>
  </div>
</template>

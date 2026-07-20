<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getBudgets } from '@/services/operations'
import { formatCurrency, formatDate } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getBudgets)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Finance Control"
      subtitle="Area budget, receivable, dan funding dirancang untuk approval, monitoring availability, dan next financial action."
      :badges="['Budget', 'Receivable', 'Funding']"
    />

    <section class="grid gap-4 xl:grid-cols-3">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Receivable aging</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Rp2,1 M</p>
        <p class="mt-2 text-sm text-app-body">Piutang klaim pemerintah masih dominan di bucket 1-30 hari.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Funding position</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Rp6,9 M</p>
        <p class="mt-2 text-sm text-app-body">3 agreement aktif dengan performa ROI stabil.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Cash flow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">+Rp1,2 M</p>
        <p class="mt-2 text-sm text-app-body">Posisi likuiditas masih aman untuk 2 siklus produksi ke depan.</p>
      </article>
    </section>

    <div v-if="loading" class="loading-panel">Memuat budget summary...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <section v-else-if="data" class="glass-panel overflow-hidden">
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Budget</th>
              <th>Periode</th>
              <th>Status</th>
              <th>Effective</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.items" :key="item.id">
              <td>{{ item.name }}</td>
              <td>{{ formatDate(item.date_start) }} - {{ formatDate(item.date_end) }}</td>
              <td><StatusBadge :status="item.status" /></td>
              <td>{{ formatCurrency(item.effective_budget) }}</td>
              <td>{{ formatCurrency(item.available_budget) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

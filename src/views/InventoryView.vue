<script setup lang="ts">
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getInventoryBalances } from '@/services/operations'
import type { InventoryBalance } from '@/types/domain'
import { formatCurrency, formatNumber } from '@/utils/format'

const { data, loading, error, execute } = useAsyncState(getInventoryBalances)

const inventorySearchText = (item: unknown) => {
  const row = item as InventoryBalance
  return [row.warehouse_name, row.location_name, row.product_name, row.quality_status].filter(Boolean).join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Inventory Pulse"
      subtitle="Konsolidasi balance, risiko stok, dan kesiapan FEFO agar operasi dapur tetap aman dan cepat."
      :badges="['Warehouse', 'Balances', 'FEFO Ready']"
    />

    <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div class="glass-panel p-5">
        <h3 class="font-display text-xl text-app-heading">Inventory strategy</h3>
        <p class="mt-3 text-sm leading-6 text-app-body">
          Fokus panel ini adalah menampilkan item yang berisiko untuk reserve meal plan, terutama bahan protein, cold chain, dan batch near expiry.
        </p>
      </div>
      <div class="glass-panel p-5">
        <button class="primary-button w-full">Open FEFO Preview</button>
      </div>
    </section>

    <div v-if="loading" class="loading-panel">Memuat saldo inventory...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <DataTableCard
      v-else-if="data"
      :items="data.items"
      :search-text-resolver="inventorySearchText"
      search-placeholder="Cari warehouse, lokasi, produk, atau quality..."
      title="Inventory Balances"
    >
      <template #table="{ items }">
        <table class="data-table">
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Location</th>
              <th>Product</th>
              <th>On Hand</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Avg Cost</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="(item as InventoryBalance).id">
              <td>{{ (item as InventoryBalance).warehouse_name }}</td>
              <td>{{ (item as InventoryBalance).location_name }}</td>
              <td>{{ (item as InventoryBalance).product_name }}</td>
              <td>{{ formatNumber((item as InventoryBalance).quantity_on_hand) }}</td>
              <td>{{ formatNumber((item as InventoryBalance).reserved_quantity) }}</td>
              <td>{{ formatNumber((item as InventoryBalance).available_quantity) }}</td>
              <td>{{ formatCurrency((item as InventoryBalance).average_cost) }}</td>
              <td><StatusBadge :status="(item as InventoryBalance).quality_status || 'OPEN'" /></td>
            </tr>
          </tbody>
        </table>
      </template>
    </DataTableCard>
  </div>
</template>

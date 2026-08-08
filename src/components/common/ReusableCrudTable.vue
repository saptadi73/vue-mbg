<script setup lang="ts">
import { computed } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'

export type CrudColumn = {
  key: string
  label: string
  class?: string
  resolve?: (item: Record<string, unknown>) => string | number | boolean | null | undefined | Record<string, unknown>
}

const props = withDefaults(
  defineProps<{
    title: string
    items: unknown[]
    columns: CrudColumn[]
    pageSize?: number
    searchTextResolver?: (item: unknown) => string
    searchPlaceholder?: string
    emptyMessage?: string
    rowKey?: string
    showActions?: boolean
  }>(),
  {
    pageSize: 5,
    searchTextResolver: (item: unknown) => JSON.stringify(item),
    searchPlaceholder: 'Cari data...',
    emptyMessage: 'Belum ada data.',
    rowKey: 'id',
    showActions: true,
  },
)

const resolveCell = (item: Record<string, any>, column: CrudColumn) => {
  const value = column.resolve ? column.resolve(item) : item[column.key]
  if (value === undefined || value === null) return '-'
  return value
}

const rowId = computed(() => (item: Record<string, any>) => item[props.rowKey] || item.id)
</script>

<template>
  <DataTableCard
    :title="title"
    :items="items"
    :page-size="pageSize"
    :search-text-resolver="searchTextResolver"
    :search-placeholder="searchPlaceholder"
    :empty-message="emptyMessage"
  >
    <template #table="{ items }">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
            <th v-if="$slots.actions && showActions">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="rowId(item as Record<string, any>)">
            <td
              v-for="column in columns"
              :key="`${rowId(item as Record<string, any>)}-${column.key}`"
              :class="column.class"
            >
              <slot v-if="$slots[`cell-${column.key}`]" :name="`cell-${column.key}`" :item="item" />
              <template v-else>
                {{ resolveCell(item as Record<string, any>, column) }}
              </template>
            </td>
            <td v-if="$slots.actions && showActions">
              <slot name="actions" :item="item" />
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </DataTableCard>
</template>

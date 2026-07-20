<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { formatNumber } from '@/utils/format'

const props = withDefaults(
  defineProps<{
    title: string
    items: unknown[]
    pageSize?: number
    searchPlaceholder?: string
    emptyMessage?: string
    searchTextResolver?: (item: unknown) => string
  }>(),
  {
    pageSize: 5,
    searchPlaceholder: 'Cari data...',
    emptyMessage: 'Belum ada data.',
    searchTextResolver: undefined,
  },
)

const query = ref('')
const page = ref(1)

const filteredItems = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword) return props.items

  return props.items.filter((item) => {
    const source = props.searchTextResolver ? props.searchTextResolver(item) : JSON.stringify(item)
    return source.toLowerCase().includes(keyword)
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / props.pageSize)))
const paginatedItems = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return filteredItems.value.slice(start, start + props.pageSize)
})

watch(
  () => [props.items.length, query.value],
  () => {
    page.value = 1
  },
)

watch(pageCount, (value) => {
  if (page.value > value) {
    page.value = value
  }
})

const goPrev = () => {
  page.value = Math.max(1, page.value - 1)
}

const goNext = () => {
  page.value = Math.min(pageCount.value, page.value + 1)
}
</script>

<template>
  <article class="glass-panel overflow-hidden">
    <div class="flex flex-col gap-4 px-6 pt-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 class="font-display text-2xl text-app-heading">{{ title }}</h2>
        <p class="mt-2 text-sm text-app-body">
          Menampilkan {{ formatNumber(paginatedItems.length) }} dari {{ formatNumber(filteredItems.length) }} data.
        </p>
      </div>

      <div class="w-full lg:max-w-sm">
        <input v-model="query" :placeholder="searchPlaceholder" class="toolbar-input w-full" type="search" />
      </div>
    </div>

    <div class="overflow-x-auto p-6 pt-4">
      <slot :items="paginatedItems" name="table" />
      <p v-if="!filteredItems.length" class="rounded-2xl border border-[var(--app-panel-border)] px-4 py-6 text-sm text-app-muted">
        {{ emptyMessage }}
      </p>
    </div>

    <div v-if="filteredItems.length" class="flex flex-col gap-3 px-6 pb-6 md:flex-row md:items-center md:justify-between">
      <p class="text-sm text-app-body">
        Halaman {{ formatNumber(page) }} dari {{ formatNumber(pageCount) }}
      </p>
      <div class="flex gap-2">
        <button class="secondary-button disabled:cursor-not-allowed disabled:opacity-50" :disabled="page <= 1" type="button" @click="goPrev">
          Sebelumnya
        </button>
        <button class="secondary-button disabled:cursor-not-allowed disabled:opacity-50" :disabled="page >= pageCount" type="button" @click="goNext">
          Berikutnya
        </button>
      </div>
    </div>
  </article>
</template>

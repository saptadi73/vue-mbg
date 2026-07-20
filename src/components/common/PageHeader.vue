<script setup lang="ts">
defineProps<{
  title: string
  subtitle: string
  badges?: string[]
}>()
</script>

<template>
  <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <p class="eyebrow-text">MBG Module</p>
      <h1 class="font-display text-3xl text-app-heading">{{ title }}</h1>
      <p class="mt-2 max-w-3xl text-sm leading-6 text-app-body">{{ subtitle }}</p>
    </div>

    <div class="flex flex-wrap gap-2">
      <span v-for="badge in badges" :key="badge" class="status-pill">{{ badge }}</span>
    </div>
  </div>
</template>

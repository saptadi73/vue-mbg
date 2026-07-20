<script setup lang="ts">
defineProps<{
  title: string
  description: string
  actionLabel?: string
  helperText?: string
  disabled?: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  action: []
}>()
</script>

<template>
  <article class="glass-panel p-5">
    <p class="eyebrow-text">Next Action</p>
    <h3 class="mt-2 font-display text-2xl text-app-heading">{{ title }}</h3>
    <p class="mt-3 text-sm text-app-body">{{ description }}</p>

    <slot />

    <p v-if="helperText" class="mt-4 text-sm text-app-muted">
      {{ helperText }}
    </p>

    <button
      v-if="actionLabel"
      class="primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="disabled || loading"
      type="button"
      @click="emit('action')"
    >
      {{ loading ? 'Memproses...' : actionLabel }}
    </button>
  </article>
</template>

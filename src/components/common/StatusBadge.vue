<script setup lang="ts">
import { computed } from 'vue'
import { getStatusTone } from '@/utils/status'

const props = defineProps<{
  status: string
}>()

const tone = computed(() => getStatusTone(props.status))
</script>

<template>
  <span class="status-pill" :class="`status-pill-${tone}`">{{ status }}</span>
</template>

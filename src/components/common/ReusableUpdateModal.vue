<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

type FieldType = 'text' | 'number' | 'date' | 'checkbox'

type FieldDefinition = {
  key: string
  label: string
  type?: FieldType
  required?: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }>
  min?: number
  max?: number
  step?: number | string
  rows?: number
}

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    fields: FieldDefinition[]
    initialValues: Record<string, unknown>
    submitLabel?: string
    cancelLabel?: string
    loading?: boolean
    disabled?: boolean
  }>(),
  {
    submitLabel: 'Simpan',
    cancelLabel: 'Batal',
    loading: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  close: []
  submit: [value: Record<string, unknown>]
}>()

const localValues = reactive<Record<string, unknown>>({})
const formError = ref('')

const initialized = computed(() => props.initialValues && typeof props.initialValues === 'object')

watch(
  () => [props.open, initialized.value],
  () => {
    if (!props.open) {
      Object.keys(localValues).forEach((key) => delete localValues[key])
      formError.value = ''
      return
    }

    Object.keys(props.initialValues || {}).forEach((key) => {
      const value = props.initialValues[key]
      if (value !== undefined) {
        localValues[key] = value
      } else {
        delete localValues[key]
      }
    })
  },
  { immediate: true },
)

const handleSubmit = () => {
  if (props.loading || props.disabled) return
  formError.value = ''

  for (const field of props.fields) {
    if (!field.required) continue
    const value = localValues[field.key]
    if (value === undefined || value === null || String(value).trim() === '') {
      formError.value = `${field.label} wajib diisi.`
      return
    }
  }

  emit('submit', { ...localValues })
}

const handleCancel = () => {
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
    <section class="glass-panel max-h-[85vh] w-full max-w-3xl overflow-y-auto p-6">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="font-display text-2xl text-app-heading">{{ title }}</h2>
          <p class="mt-1 text-sm text-app-muted">Update data terkait baris ini secara langsung.</p>
        </div>
        <button class="secondary-button" type="button" @click="handleCancel">Tutup</button>
      </div>

      <div v-if="formError" class="mb-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
        {{ formError }}
      </div>

      <div class="grid gap-4">
        <label
          v-for="field in fields"
          :key="field.key"
          class="space-y-2"
          :class="{ 'opacity-70': field.type === 'checkbox' }"
        >
          <span class="text-sm text-app-muted">{{ field.label }}</span>

          <template v-if="field.type === 'checkbox'">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="(localValues[field.key] as boolean)"
                type="checkbox"
                class="h-4 w-4 rounded border-[var(--app-subtle-border)]"
              />
              <span>{{ field.label }}</span>
            </label>
          </template>

          <template v-else-if="field.type === 'date'">
            <input
              v-model="(localValues[field.key] as string)"
              type="date"
              class="toolbar-input w-full"
              :required="field.required"
            />
          </template>

          <template v-else-if="field.type === 'number'">
            <input
              v-model.number="(localValues[field.key] as number)"
              class="toolbar-input w-full"
              type="number"
              :min="field.min"
              :max="field.max"
              :step="field.step || 1"
              :required="field.required"
              :placeholder="field.placeholder"
            />
          </template>

          <template v-else-if="field.options">
            <select v-model="localValues[field.key]" class="toolbar-input w-full">
              <option v-for="option in field.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </template>

          <textarea
            v-else-if="field.rows && field.rows > 1"
            v-model="(localValues[field.key] as string)"
            :rows="field.rows"
            class="toolbar-input min-h-24 w-full"
            :placeholder="field.placeholder"
          />

          <input
            v-else
            v-model="(localValues[field.key] as string)"
            type="text"
            class="toolbar-input w-full"
            :placeholder="field.placeholder"
            :required="field.required"
          />
        </label>
      </div>

      <div class="mt-6 flex flex-wrap gap-3">
        <button class="secondary-button" type="button" @click="handleCancel">
          {{ cancelLabel }}
        </button>
        <button class="primary-button" :disabled="loading || disabled" type="button" @click="handleSubmit">
          {{ loading ? 'Memproses...' : submitLabel }}
        </button>
      </div>
    </section>
  </div>
</template>


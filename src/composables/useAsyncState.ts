import { onMounted, ref } from 'vue'

export const useAsyncState = <T>(loader: () => Promise<T>) => {
  const data = ref<T | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const execute = async () => {
    loading.value = true
    error.value = null

    try {
      data.value = await loader()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Terjadi kendala saat memuat data.'
    } finally {
      loading.value = false
    }
  }

  onMounted(execute)

  return { data, loading, error, execute }
}

import { readonly, ref } from 'vue'
import { env } from '@/config/env'

type GoogleMapsWindow = Window & { google?: { maps?: unknown } }

const loading = ref(false)
const ready = ref(false)
const error = ref<string | null>(null)
let loader: Promise<void> | null = null

export const loadGoogleMaps = () => {
  if ((window as GoogleMapsWindow).google?.maps) {
    ready.value = true
    return Promise.resolve()
  }
  if (!env.googleMapsApiKey)
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_API_KEY belum dikonfigurasi.'))
  if (loader) return loader

  loading.value = true
  error.value = null
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(env.googleMapsApiKey)}&v=weekly&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => {
      loading.value = false
      ready.value = true
      resolve()
    }
    script.onerror = () => {
      loading.value = false
      error.value = 'Google Maps gagal dimuat. Periksa API key, restriction, quota, dan koneksi.'
      loader = null
      reject(new Error(error.value))
    }
    document.head.appendChild(script)
  })
  return loader
}

export const useGoogleMaps = () => ({
  configured: Boolean(env.googleMapsApiKey),
  loading: readonly(loading),
  ready: readonly(ready),
  error: readonly(error),
  load: loadGoogleMaps,
})

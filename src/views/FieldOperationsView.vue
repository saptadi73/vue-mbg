<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { LocateFixed, MapPin, QrCode, ScanLine, Thermometer } from '@lucide/vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { getDeliveryRoutes } from '@/services/delivery'
import { getDeliveryPackages } from '@/services/delivery'
import type { ApiRequestContext } from '@/services/http'
import { createFleetVehicleLocationPing, getFleetVehicles } from '@/services/fleet'
import {
  addTraceEvent,
  getFoodSafetyProfiles,
  loadDeliveryPackage,
  receiveDeliveryPackage,
  getTraceLabel,
  recordTemperatureReading,
  resolveTrace,
} from '@/services/food-safety'
import { useAppStore } from '@/stores/app'
import { isQzReady, printQrLabel } from '@/services/thermal-printer'
import type { DeliveryRoutePlanRecord, FleetVehicleRecord } from '@/types/domain'
import type { FoodSafetyProfile, TraceEntity } from '@/types/food-safety'
import type { DeliveryPackageLifecycleRecord } from '@/types/domain'

const props = withDefaults(defineProps<{ workspace?: 'all' | 'raw-material' }>(), {
  workspace: 'all',
})

type BarcodeResult = { rawValue: string }
type JsQrDecodeResult = { data?: string }
type JsQrDecoder = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options?: unknown,
) => JsQrDecodeResult | null
type WindowWithJsQr = Window & { jsQR?: JsQrDecoder }
type BarcodeDetectorInstance = { detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

const appStore = useAppStore()
const workflowContext: Readonly<ApiRequestContext> = Object.freeze({
  tenantId: appStore.activeTenantId,
  sppgId: appStore.activeSppgId || '',
})
const activePanel = ref<'temperature' | 'gps' | 'qr'>(
  props.workspace === 'raw-material' ? 'qr' : 'temperature',
)
const isRawMaterialWorkspace = computed(() => props.workspace === 'raw-material')
const busy = ref(false)
const message = ref('')
const error = ref('')
const printMessage = ref('')
const printError = ref('')
const vehicles = ref<FleetVehicleRecord[]>([])
const deliveryRoutes = ref<DeliveryRoutePlanRecord[]>([])
const profiles = ref<FoodSafetyProfile[]>([])
const traceResult = ref<TraceEntity | null>(null)
const deliveryPackages = ref<DeliveryPackageLifecycleRecord[]>([])

const temperatureForm = reactive({
  entity_type: 'MEAL_BATCH',
  entity_id: '',
  profile_id: '',
  temperature_c: 60,
  measured_at: '',
  notes: '',
})

const gpsForm = reactive({
  vehicle_id: '',
  latitude: null as number | null,
  longitude: null as number | null,
  accuracy_meter: null as number | null,
  movement_status: 'IN_TRANSIT',
  event_type: 'GPS_PING',
  notes: '',
})

const qrCode = ref('')
const qrAction = ref<'RAW_RECEIVED' | 'RAW_ISSUED' | 'PACKAGE_DISPATCH' | 'PACKAGE_RECEIVE'>(
  'RAW_RECEIVED',
)
const cameraSupportMessage = ref('')
const materialForm = reactive({
  quantity: null as number | null,
  uom: 'kg',
  location_code: '',
  notes: '',
})
const dispatchForm = reactive({
  route_id: '',
  delivery_stop_id: '',
  destination_name: '',
  vehicle_id: '',
  temp_at_loading: null as number | null,
  notes: '',
})
const receiveForm = reactive({
  route_id: '',
  temperature_c: null as number | null,
  latitude: null as number | null,
  longitude: null as number | null,
})
const cameraActive = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
let cameraStream: MediaStream | null = null
let scanFrame = 0
let jsQrDecoder: JsQrDecoder | null = null
let jsQrLoading: Promise<JsQrDecoder | null> | null = null

const loadJsQr = async () => {
  if (jsQrDecoder) return jsQrDecoder
  if (!jsQrLoading) {
    jsQrLoading = (async () => {
      const win = window as WindowWithJsQr
      if (typeof win.jsQR === 'function') {
        jsQrDecoder = win.jsQR
        return jsQrDecoder
      }

      const scriptId = 'jsqr-cdn-fallback'
      if (!document.getElementById(scriptId)) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.id = scriptId
          script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'
          script.async = true
          script.onload = () => resolve()
          script.onerror = () => reject(new Error('Gagal memuat jsQR dari CDN.'))
          document.body.appendChild(script)
        })
      }

      if (typeof win.jsQR === 'function') {
        jsQrDecoder = win.jsQR
        return jsQrDecoder
      }
      throw new Error('jsQR tidak tersedia.')
    })()
  }
  return jsQrLoading
}

const readQrFromVideo = async (): Promise<string | null> => {
  const video = videoElement.value
  if (!video || !cameraActive.value || video.videoWidth === 0 || video.videoHeight === 0)
    return null

  const decoder = await loadJsQr()
  if (!decoder) return null

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const result = decoder(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  })
  return result?.data || null
}

const selectedVehicle = computed(() =>
  vehicles.value.find((vehicle) => vehicle.id === gpsForm.vehicle_id),
)
const selectedDispatchVehicle = computed(() =>
  vehicles.value.find((vehicle) => vehicle.id === dispatchForm.vehicle_id),
)
const selectedRoute = computed(() =>
  deliveryRoutes.value.find((route) => route.id === dispatchForm.route_id),
)
const isRawMaterial = computed(() => traceResult.value?.entity_type === 'RAW_MATERIAL_LOT')
const isPackage = computed(() =>
  ['PACKAGE', 'CONTAINER', 'MEAL_BATCH'].includes(traceResult.value?.entity_type || ''),
)
const resolvedPackage = computed(() => {
  if (!traceResult.value?.trace_code) return null
  const matched = deliveryPackages.value.find(
    (item) => item.trace_code === traceResult.value!.trace_code,
  )
  return matched || null
})
const resolvedPackageId = computed(() => {
  if (resolvedPackage.value?.package_id) return resolvedPackage.value.package_id
  return traceResult.value?.id || traceResult.value?.entity_id || ''
})

const run = async (action: () => Promise<void>, success: string) => {
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    await action()
    message.value = success
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Operasi gagal diproses.'
  } finally {
    busy.value = false
  }
}

const printQrFromValue = async (value: string, caption: string) => {
  printMessage.value = ''
  printError.value = ''
  const qrDataUrl = `https://chart.googleapis.com/chart?chs=260x260&cht=qr&chl=${encodeURIComponent(value)}&choe=UTF-8`
  try {
    if (await isQzReady()) {
      const result = await printQrLabel({
        value: `${caption}: ${value}`,
        pageWidthMm: 101.6,
        pageHeightMm: 76.2,
      })
      printMessage.value = result
      return
    }

    const w = window.open('', '_blank')
    if (!w) {
      throw new Error('Popup print diblokir. Aktifkan popup untuk fallback print.')
    }
    w.document.write(`
      <html>
        <body style="font-family:Arial,sans-serif;padding:16px;text-align:center;">
          <h3>${caption}</h3>
          <img src="${qrDataUrl}" alt="QR code" />
          <p style="word-break:break-all; margin-top:8px;">${value}</p>
        </body>
      </html>
    `)
    w.document.close()
    w.print()
    printMessage.value = 'Label dicetak via browser.'
  } catch (cause) {
    printError.value = cause instanceof Error ? cause.message : 'Gagal mencetak QR label.'
  }
}

const printTraceWithOptionalLabel = async (code: string, caption: string) => {
  try {
    let value = code
    try {
      const label = await getTraceLabel(code)
      if (label?.label?.content) {
        value = `${code} - ${label.label.content}`
      }
    } catch {
      // Biarkan fallback ke kode murni jika endpoint label belum tersedia.
    }
    await printQrFromValue(value, caption)
  } catch (cause) {
    printError.value = cause instanceof Error ? cause.message : `Gagal mencetak ${caption}.`
  }
}

const loadOptions = async () => {
  const [fleetResult, safetyProfiles, routesResult, packagesResult] = await Promise.all([
    getFleetVehicles(),
    getFoodSafetyProfiles().catch(() => []),
    getDeliveryRoutes(workflowContext),
    getDeliveryPackages(workflowContext).catch(() => ({ items: [], total: 0 })),
  ])
  vehicles.value = fleetResult.items
  profiles.value = safetyProfiles
  deliveryRoutes.value = routesResult.items
  deliveryPackages.value = packagesResult.items
  gpsForm.vehicle_id ||= vehicles.value[0]?.id || ''
  dispatchForm.vehicle_id ||= vehicles.value[0]?.id || ''
  dispatchForm.route_id ||= deliveryRoutes.value[0]?.id || ''
  receiveForm.route_id ||= deliveryRoutes.value[0]?.id || ''
  temperatureForm.profile_id ||= profiles.value[0]?.id || ''
}

const submitTemperature = () =>
  run(async () => {
    const result = await recordTemperatureReading({
      tenant_id: appStore.activeTenantId,
      sppg_id: appStore.activeSppgId || undefined,
      entity_type: temperatureForm.entity_type,
      entity_id: temperatureForm.entity_id.trim(),
      profile_id: temperatureForm.profile_id,
      temperature_c: temperatureForm.temperature_c,
      measured_at: temperatureForm.measured_at
        ? new Date(temperatureForm.measured_at).toISOString()
        : new Date().toISOString(),
      measurement_method: 'MANUAL',
      metadata_json: temperatureForm.notes ? { notes: temperatureForm.notes } : undefined,
    })
    if (result.alert) message.value = 'Suhu tercatat dan backend membuat alert keamanan pangan.'
    temperatureForm.measured_at = ''
    temperatureForm.notes = ''
  }, 'Suhu manual berhasil dicatat.')

const captureGps = () => {
  message.value = ''
  error.value = ''
  if (!navigator.geolocation) {
    error.value = 'Browser ini tidak mendukung pengambilan lokasi.'
    return
  }
  busy.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      gpsForm.latitude = Number(position.coords.latitude.toFixed(7))
      gpsForm.longitude = Number(position.coords.longitude.toFixed(7))
      gpsForm.accuracy_meter = Number(position.coords.accuracy.toFixed(1))
      message.value = 'Koordinat perangkat berhasil diambil. Periksa lalu kirim laporan.'
      busy.value = false
    },
    (cause) => {
      error.value = cause.code === 1 ? 'Izin lokasi ditolak.' : 'Lokasi belum dapat diperoleh.'
      busy.value = false
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
  )
}

const submitGps = () =>
  run(
    async () => {
      if (gpsForm.latitude === null || gpsForm.longitude === null)
        throw new Error('Koordinat GPS belum diisi.')
      await createFleetVehicleLocationPing(
        gpsForm.vehicle_id,
        {
          sppg_id: appStore.activeSppgId || null,
          assignment_id: null,
          recorded_at: new Date().toISOString(),
          latitude: gpsForm.latitude,
          longitude: gpsForm.longitude,
          speed_kph: null,
          heading_degree: null,
          accuracy_meter: gpsForm.accuracy_meter,
          engine_on: true,
          movement_status: gpsForm.movement_status,
          event_type: gpsForm.event_type,
          source: 'manual_web_report',
          address_label: null,
          notes: gpsForm.notes || 'Laporan lokasi manual dari web operasional lapangan.',
        },
        { tenantId: appStore.activeTenantId, sppgId: appStore.activeSppgId || null },
      )
      gpsForm.notes = ''
    },
    `Lokasi ${selectedVehicle.value?.vehicle_code || 'kendaraan'} berhasil dilaporkan.`,
  )

const resolveQr = () =>
  run(async () => {
    const value = qrCode.value.trim()
    if (!value) throw new Error('Kode QR belum tersedia.')
    traceResult.value = await resolveTrace(value)
    const fallback = deliveryPackages.value.find((item) => item.trace_code === value)
    if (!fallback && !traceResult.value?.id) {
      throw new Error('Data paket tidak lengkap. Pilih trace yang valid untuk aksi ini.')
    }
    stopCamera()
  }, 'QR berhasil dipindai dan data trace ditemukan.')

const resetQrResult = () => {
  traceResult.value = null
  qrCode.value = ''
  message.value = ''
  error.value = ''
  printMessage.value = ''
  printError.value = ''
}

const submitMaterialMovement = () =>
  run(
    async () => {
      if (!traceResult.value || !isRawMaterial.value) {
        throw new Error('QR harus bertipe RAW_MATERIAL_LOT untuk transaksi bahan baku.')
      }
      const eventType = qrAction.value === 'RAW_RECEIVED' ? 'RECEIVED' : 'ISSUED'
      await addTraceEvent(traceResult.value.trace_code, {
        event_type: eventType,
        notes:
          materialForm.notes ||
          (eventType === 'RECEIVED'
            ? 'Bahan baku diterima melalui scan web.'
            : 'Bahan baku dikeluarkan melalui scan web.'),
        metadata_json: {
          quantity: materialForm.quantity,
          uom: materialForm.uom,
          location_code: materialForm.location_code || null,
          source: 'field_operations_qr',
        },
      })
      materialForm.quantity = null
      materialForm.notes = ''
      if (qrAction.value === 'RAW_RECEIVED') {
        await printTraceWithOptionalLabel(traceResult.value.trace_code, 'Terima bahan baku')
      }
    },
    qrAction.value === 'RAW_RECEIVED'
      ? 'Barang masuk berhasil dicatat.'
      : 'Barang keluar berhasil dicatat.',
  )

const submitPackageDispatch = () =>
  run(
    async () => {
      if (!traceResult.value || !isPackage.value) {
        throw new Error('QR harus bertipe PACKAGE, CONTAINER, atau MEAL_BATCH untuk pengiriman.')
      }
      if (!appStore.activeSppgId) {
        throw new Error('Pilih konteks SPPG sebelum memuat paket ke pengiriman.')
      }
      if (dispatchForm.temp_at_loading === null) {
        throw new Error('Suhu saat loading wajib diisi.')
      }
      await loadDeliveryPackage(dispatchForm.route_id, {
        tenant_id: appStore.activeTenantId,
        sppg_id: appStore.activeSppgId,
        package_trace_code: traceResult.value.trace_code,
        delivery_stop_id: dispatchForm.delivery_stop_id.trim(),
        vehicle_id: dispatchForm.vehicle_id,
        loaded_at: new Date().toISOString(),
        temp_at_loading: dispatchForm.temp_at_loading,
      }, workflowContext)
      await addTraceEvent(traceResult.value.trace_code, {
        event_type: 'DISPATCHED',
        notes: dispatchForm.notes || `Mulai dikirim ke ${dispatchForm.destination_name}.`,
        metadata_json: {
          route_id: dispatchForm.route_id,
          route_code: selectedRoute.value?.route_code || null,
          delivery_stop_id: dispatchForm.delivery_stop_id,
          destination_name: dispatchForm.destination_name,
          vehicle_id: dispatchForm.vehicle_id,
          vehicle_code: selectedDispatchVehicle.value?.vehicle_code || null,
          source: 'field_operations_qr',
        },
      })
      dispatchForm.notes = ''
      await printTraceWithOptionalLabel(traceResult.value.trace_code, 'Kemasan dikirim')
    },
    `Kemasan mulai dikirim dengan ${selectedDispatchVehicle.value?.vehicle_code || 'kendaraan terpilih'}.`,
  )

const captureReceivingGps = () => {
  message.value = ''
  error.value = ''
  if (!navigator.geolocation) {
    error.value = 'Browser ini tidak mendukung pengambilan lokasi.'
    return
  }
  busy.value = true
  navigator.geolocation.getCurrentPosition(
    (position) => {
      receiveForm.latitude = Number(position.coords.latitude.toFixed(7))
      receiveForm.longitude = Number(position.coords.longitude.toFixed(7))
      message.value = 'GPS penerimaan berhasil diambil.'
      busy.value = false
    },
    (cause) => {
      error.value =
        cause.code === 1 ? 'Izin lokasi ditolak.' : 'Lokasi penerimaan belum dapat diperoleh.'
      busy.value = false
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 },
  )
}

const submitPackageReceive = () =>
  run(async () => {
    if (!traceResult.value || !isPackage.value) {
      throw new Error('QR harus bertipe PACKAGE, CONTAINER, atau MEAL_BATCH untuk penerimaan.')
    }
    if (!resolvedPackageId.value) {
      throw new Error('Data paket tidak lengkap. Selesaikan resolve QR lalu coba lagi.')
    }
    if (!resolvedPackage.value?.package_id) {
      printError.value =
        'Data paket belum sinkron ke modul delivery lifecycle. Tetap kirim dengan jejak trace_id.'
    }
    if (receiveForm.latitude === null || receiveForm.longitude === null) {
      throw new Error('GPS penerimaan wajib diambil atau diisi.')
    }
    if (receiveForm.temperature_c === null) {
      throw new Error('Suhu saat paket diterima wajib diisi.')
    }
    await receiveDeliveryPackage(receiveForm.route_id, resolvedPackageId.value, {
      received_at: new Date().toISOString(),
      temperature_c: receiveForm.temperature_c,
      latitude: receiveForm.latitude,
      longitude: receiveForm.longitude,
    }, workflowContext)
    await printTraceWithOptionalLabel(traceResult.value.trace_code, 'Paket diterima')
  }, 'Paket MBG berhasil ditandai diterima.')

const scanCameraFrame = async (detector?: BarcodeDetectorInstance) => {
  if (!cameraActive.value || !videoElement.value) return
  try {
    if (detector) {
      const results = await detector.detect(videoElement.value)
      if (results[0]?.rawValue) {
        qrCode.value = results[0].rawValue
        await resolveQr()
        return
      }
    } else {
      const value = await readQrFromVideo()
      if (value) {
        qrCode.value = value
        await resolveQr()
        return
      }
    }
  } catch {
    // Kamera dapat belum siap pada beberapa frame pertama.
  }
  scanFrame = window.requestAnimationFrame(() => void scanCameraFrame(detector))
}

const startCamera = async () => {
  message.value = ''
  error.value = ''
  cameraSupportMessage.value = ''
  const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
    cameraActive.value = true
    await nextTick()
    if (!videoElement.value) return
    videoElement.value.srcObject = cameraStream
    await videoElement.value.play()
    if (Detector) {
      const detector = new Detector({ formats: ['qr_code'] })
      scanFrame = window.requestAnimationFrame(() => void scanCameraFrame(detector))
    } else {
      try {
        await loadJsQr()
        scanFrame = window.requestAnimationFrame(() => void scanCameraFrame())
      } catch (cause) {
        cameraSupportMessage.value =
          cause instanceof Error
            ? `Gagal memuat library QR: ${cause.message}`
            : 'Gagal memuat library QR untuk fallback scan.'
        stopCamera()
      }
    }
  } catch (cause) {
    cameraActive.value = false
    error.value = cause instanceof Error ? cause.message : 'Kamera tidak dapat dibuka.'
  }
}

function stopCamera() {
  cameraActive.value = false
  window.cancelAnimationFrame(scanFrame)
  cameraStream?.getTracks().forEach((track) => track.stop())
  cameraStream = null
  if (videoElement.value) videoElement.value.srcObject = null
}

onMounted(() => void loadOptions())
onBeforeUnmount(stopCamera)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="isRawMaterialWorkspace ? 'Traceability Bahan Baku' : 'Operasional Lapangan'"
      :subtitle="
        isRawMaterialWorkspace
          ? 'Catat bahan baku masuk dan keluar, pindai identitas lot, serta cetak label QR dari satu halaman.'
          : 'Pencatatan manual saat perangkat IoT belum tersedia, pelaporan GPS armada, dan pemindaian QR melalui web.'
      "
      :badges="
        isRawMaterialWorkspace
          ? ['Raw Material', 'QR Print & Scan', 'Audit Trail']
          : ['Mobile Ready', 'Manual Fallback', 'Audit Trail']
      "
    />
    <p
      v-if="cameraSupportMessage"
      class="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
    >
      {{ cameraSupportMessage }}
    </p>

    <div v-if="!isRawMaterialWorkspace" class="grid gap-3 md:grid-cols-3">
      <button
        class="glass-panel flex items-center gap-4 p-5 text-left"
        :class="{ 'ring-2 ring-emerald-500': activePanel === 'temperature' }"
        @click="activePanel = 'temperature'"
      >
        <Thermometer :size="28" /><span
          ><b class="text-app-heading">Suhu Manual</b
          ><small class="mt-1 block text-app-muted">Pengganti sensor IoT</small></span
        >
      </button>
      <button
        class="glass-panel flex items-center gap-4 p-5 text-left"
        :class="{ 'ring-2 ring-emerald-500': activePanel === 'gps' }"
        @click="activePanel = 'gps'"
      >
        <MapPin :size="28" /><span
          ><b class="text-app-heading">Laporan GPS</b
          ><small class="mt-1 block text-app-muted">Posisi mobil pengantar</small></span
        >
      </button>
      <button
        class="glass-panel flex items-center gap-4 p-5 text-left"
        :class="{ 'ring-2 ring-emerald-500': activePanel === 'qr' }"
        @click="activePanel = 'qr'"
      >
        <QrCode :size="28" /><span
          ><b class="text-app-heading">Scan QR</b
          ><small class="mt-1 block text-app-muted">Kamera atau kode manual</small></span
        >
      </button>
    </div>

    <p
      v-if="message"
      class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
    >
      {{ message }}
    </p>
    <p
      v-if="printMessage"
      class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
    >
      {{ printMessage }}
    </p>
    <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {{ error }}
    </p>
    <p v-if="printError" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {{ printError }}
    </p>

    <section v-if="activePanel === 'temperature'" class="glass-panel p-6">
      <div class="mb-6 flex items-center gap-3">
        <Thermometer />
        <div>
          <p class="eyebrow-text">Manual fallback</p>
          <h2 class="font-display text-2xl text-app-heading">Catat suhu makanan</h2>
        </div>
      </div>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitTemperature">
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Jenis objek</span
          ><select v-model="temperatureForm.entity_type" class="toolbar-input w-full">
            <option>MEAL_BATCH</option>
            <option>COOKING_BATCH</option>
            <option>PACKAGE</option>
            <option>DELIVERY</option>
          </select></label
        >
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">ID objek / batch</span
          ><input
            v-model="temperatureForm.entity_id"
            required
            class="toolbar-input w-full"
            placeholder="UUID batch atau paket"
        /></label>
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Profil keamanan</span
          ><select v-model="temperatureForm.profile_id" required class="toolbar-input w-full">
            <option disabled value="">Pilih profil</option>
            <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
              {{ profile.profile_name }}
            </option>
          </select></label
        >
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Suhu (°C)</span
          ><input
            v-model.number="temperatureForm.temperature_c"
            required
            type="number"
            step="0.1"
            class="toolbar-input w-full"
        /></label>
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Waktu pengukuran</span
          ><input
            v-model="temperatureForm.measured_at"
            type="datetime-local"
            class="toolbar-input w-full"
        /></label>
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Catatan</span
          ><input
            v-model="temperatureForm.notes"
            class="toolbar-input w-full"
            placeholder="Alat ukur/petugas (opsional)"
        /></label>
        <button
          class="primary-button md:col-span-2"
          :disabled="busy || !temperatureForm.entity_id || !temperatureForm.profile_id"
        >
          {{ busy ? 'Menyimpan...' : 'Simpan suhu manual' }}
        </button>
      </form>
      <p v-if="!profiles.length" class="mt-4 text-sm text-amber-600">
        Profil keamanan belum tersedia. Pastikan backend aktif dan profil food safety sudah dibuat.
      </p>
    </section>

    <section v-else-if="activePanel === 'gps'" class="glass-panel p-6">
      <div class="mb-6 flex items-center gap-3">
        <LocateFixed />
        <div>
          <p class="eyebrow-text">Delivery fleet</p>
          <h2 class="font-display text-2xl text-app-heading">Laporkan lokasi kendaraan</h2>
        </div>
      </div>
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="submitGps">
        <label class="space-y-2 md:col-span-2"
          ><span class="text-sm text-app-muted">Mobil pengantar</span
          ><select v-model="gpsForm.vehicle_id" required class="toolbar-input w-full">
            <option disabled value="">Pilih kendaraan</option>
            <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
              {{ vehicle.vehicle_code }} — {{ vehicle.plate_number }}
            </option>
          </select></label
        >
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Latitude</span
          ><input
            v-model.number="gpsForm.latitude"
            required
            type="number"
            step="any"
            class="toolbar-input w-full"
            placeholder="-6.200000"
        /></label>
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Longitude</span
          ><input
            v-model.number="gpsForm.longitude"
            required
            type="number"
            step="any"
            class="toolbar-input w-full"
            placeholder="106.816666"
        /></label>
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Status pergerakan</span
          ><select v-model="gpsForm.movement_status" class="toolbar-input w-full">
            <option>LOADING</option>
            <option>IN_TRANSIT</option>
            <option>STOPPED</option>
            <option>ARRIVED</option>
          </select></label
        >
        <label class="space-y-2"
          ><span class="text-sm text-app-muted">Jenis laporan</span
          ><select v-model="gpsForm.event_type" class="toolbar-input w-full">
            <option>GPS_PING</option>
            <option>DEPARTURE</option>
            <option>CHECKPOINT</option>
            <option>ARRIVAL</option>
          </select></label
        >
        <label class="space-y-2 md:col-span-2"
          ><span class="text-sm text-app-muted">Catatan</span
          ><input
            v-model="gpsForm.notes"
            class="toolbar-input w-full"
            placeholder="Kondisi perjalanan atau lokasi"
        /></label>
        <div class="flex flex-wrap gap-3 md:col-span-2">
          <button type="button" class="secondary-button" :disabled="busy" @click="captureGps">
            <LocateFixed :size="17" /> Ambil GPS perangkat</button
          ><button class="primary-button" :disabled="busy || !gpsForm.vehicle_id">
            {{ busy ? 'Mengirim...' : 'Kirim laporan lokasi' }}
          </button>
        </div>
      </form>
    </section>

    <section v-else class="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
      <article class="glass-panel p-6">
        <div class="mb-6 flex items-center gap-3">
          <ScanLine />
          <div>
            <p class="eyebrow-text">Traceability</p>
            <h2 class="font-display text-2xl text-app-heading">Scan QR objek</h2>
          </div>
        </div>
        <div class="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <button
            v-if="!isRawMaterialWorkspace"
            type="button"
            class="secondary-button justify-center"
            :class="{ 'ring-2 ring-emerald-500': qrAction === 'RAW_RECEIVED' }"
            @click="((qrAction = 'RAW_RECEIVED'), resetQrResult())"
          >
            Barang masuk
          </button>
          <button
            v-if="!isRawMaterialWorkspace"
            type="button"
            class="secondary-button justify-center"
            :class="{ 'ring-2 ring-emerald-500': qrAction === 'RAW_ISSUED' }"
            @click="((qrAction = 'RAW_ISSUED'), resetQrResult())"
          >
            Barang keluar
          </button>
          <button
            type="button"
            class="secondary-button justify-center"
            :class="{ 'ring-2 ring-emerald-500': qrAction === 'PACKAGE_DISPATCH' }"
            @click="((qrAction = 'PACKAGE_DISPATCH'), resetQrResult())"
          >
            Start delivery
          </button>
          <button
            type="button"
            class="secondary-button justify-center"
            :class="{ 'ring-2 ring-emerald-500': qrAction === 'PACKAGE_RECEIVE' }"
            @click="((qrAction = 'PACKAGE_RECEIVE'), resetQrResult())"
          >
            Paket diterima
          </button>
        </div>
        <p class="mb-4 text-sm text-app-muted">
          {{
            qrAction === 'RAW_RECEIVED'
              ? 'Scan QR lot bahan baku yang diterima.'
              : qrAction === 'RAW_ISSUED'
                ? 'Scan QR lot bahan baku yang dikeluarkan dari penyimpanan.'
                : qrAction === 'PACKAGE_DISPATCH'
                  ? 'Scan QR kemasan yang akan dimuat ke kendaraan dan mulai dikirim.'
                  : 'Scan QR kemasan MBG yang sudah sampai di lokasi penerima.'
          }}
        </p>
        <div v-if="cameraActive" class="overflow-hidden rounded-3xl bg-black">
          <video
            ref="videoElement"
            muted
            playsinline
            class="aspect-video w-full object-cover"
          ></video>
        </div>
        <div
          v-else
          class="surface-subtle flex aspect-video items-center justify-center rounded-3xl"
        >
          <QrCode :size="72" class="text-app-muted" />
        </div>
        <div class="mt-4 flex flex-wrap gap-3">
          <button v-if="!cameraActive" class="secondary-button" type="button" @click="startCamera">
            Buka kamera</button
          ><button v-else class="secondary-button" type="button" @click="stopCamera">
            Tutup kamera
          </button>
        </div>
        <form class="mt-5 flex flex-col gap-3 sm:flex-row" @submit.prevent="resolveQr">
          <input
            v-model="qrCode"
            required
            class="toolbar-input flex-1"
            placeholder="Hasil scan atau masukkan trace code"
          /><button class="primary-button" :disabled="busy">Cari trace</button>
        </form>
      </article>
      <article class="glass-panel p-6">
        <p class="eyebrow-text">Hasil Scan</p>
        <div v-if="traceResult" class="mt-5 space-y-4">
          <div>
            <p class="text-sm text-app-muted">Trace code</p>
            <p class="mt-1 break-all font-semibold text-app-heading">
              {{ traceResult.trace_code }}
            </p>
          </div>
          <div>
            <p class="text-sm text-app-muted">Jenis / ID</p>
            <p class="mt-1 text-app-heading">
              {{ traceResult.entity_type }} / {{ traceResult.entity_id }}
            </p>
          </div>
          <div>
            <p class="text-sm text-app-muted">Status</p>
            <StatusBadge class="mt-2" :status="traceResult.status" />
          </div>

          <form
            v-if="qrAction === 'RAW_RECEIVED' || qrAction === 'RAW_ISSUED'"
            class="space-y-4 border-t border-[var(--app-panel-border)] pt-5"
            @submit.prevent="submitMaterialMovement"
          >
            <p
              v-if="!isRawMaterial"
              class="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              QR ini bukan lot raw material. Scan QR dengan tipe RAW_MATERIAL_LOT.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm text-app-muted">Jumlah</span>
                <input
                  v-model.number="materialForm.quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  class="toolbar-input w-full"
                  placeholder="25"
                />
              </label>
              <label class="space-y-2">
                <span class="text-sm text-app-muted">Satuan</span>
                <select v-model="materialForm.uom" class="toolbar-input w-full">
                  <option value="kg">kg</option>
                  <option value="gram">gram</option>
                  <option value="liter">liter</option>
                  <option value="pcs">pcs</option>
                </select>
              </label>
            </div>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Lokasi gudang</span>
              <input
                v-model="materialForm.location_code"
                class="toolbar-input w-full"
                placeholder="Contoh: COLD-A atau RACK-02"
              />
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Catatan</span>
              <textarea
                v-model="materialForm.notes"
                class="toolbar-input min-h-24 w-full"
                placeholder="Kondisi barang atau keperluan pengeluaran"
              ></textarea>
            </label>
            <button class="primary-button w-full justify-center" :disabled="busy || !isRawMaterial">
              {{
                qrAction === 'RAW_RECEIVED' ? 'Konfirmasi barang masuk' : 'Konfirmasi barang keluar'
              }}
            </button>
          </form>

          <form
            v-else-if="qrAction === 'PACKAGE_DISPATCH'"
            class="space-y-4 border-t border-[var(--app-panel-border)] pt-5"
            @submit.prevent="submitPackageDispatch"
          >
            <p
              v-if="!isPackage"
              class="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              QR ini bukan kemasan. Scan QR bertipe PACKAGE, CONTAINER, atau MEAL_BATCH.
            </p>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Rute pengiriman</span>
              <select v-model="dispatchForm.route_id" required class="toolbar-input w-full">
                <option disabled value="">Pilih rute</option>
                <option v-for="route in deliveryRoutes" :key="route.id" :value="route.id">
                  {{ route.route_code }} — {{ route.route_name }}
                </option>
              </select>
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">ID tujuan / delivery stop</span>
              <input
                v-model="dispatchForm.delivery_stop_id"
                required
                class="toolbar-input w-full"
                placeholder="UUID delivery stop"
              />
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Nama tujuan</span>
              <input
                v-model="dispatchForm.destination_name"
                required
                class="toolbar-input w-full"
                placeholder="Sekolah atau lokasi penerima"
              />
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Kendaraan pengantar</span>
              <select v-model="dispatchForm.vehicle_id" required class="toolbar-input w-full">
                <option disabled value="">Pilih kendaraan</option>
                <option v-for="vehicle in vehicles" :key="vehicle.id" :value="vehicle.id">
                  {{ vehicle.vehicle_code }} — {{ vehicle.plate_number }}
                </option>
              </select>
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Suhu saat loading (°C)</span>
              <input
                v-model.number="dispatchForm.temp_at_loading"
                type="number"
                step="0.1"
                class="toolbar-input w-full"
                placeholder="65.0"
              />
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Catatan dispatch</span>
              <textarea
                v-model="dispatchForm.notes"
                class="toolbar-input min-h-24 w-full"
                placeholder="Catatan kondisi kemasan atau perjalanan"
              ></textarea>
            </label>
            <button
              class="primary-button w-full justify-center"
              :disabled="
                busy ||
                !isPackage ||
                !dispatchForm.route_id ||
                !dispatchForm.delivery_stop_id ||
                !dispatchForm.vehicle_id ||
                dispatchForm.temp_at_loading === null
              "
            >
              Tandai loading & mulai delivery
            </button>
          </form>

          <form
            v-else
            class="space-y-4 border-t border-[var(--app-panel-border)] pt-5"
            @submit.prevent="submitPackageReceive"
          >
            <p
              v-if="!isPackage"
              class="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
            >
              QR ini bukan kemasan. Scan QR bertipe PACKAGE, CONTAINER, atau MEAL_BATCH.
            </p>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Rute pengiriman</span>
              <select v-model="receiveForm.route_id" required class="toolbar-input w-full">
                <option disabled value="">Pilih rute</option>
                <option v-for="route in deliveryRoutes" :key="route.id" :value="route.id">
                  {{ route.route_code }} — {{ route.route_name }}
                </option>
              </select>
            </label>
            <label class="block space-y-2">
              <span class="text-sm text-app-muted">Suhu saat diterima (°C)</span>
              <input
                v-model.number="receiveForm.temperature_c"
                type="number"
                step="0.1"
                class="toolbar-input w-full"
                placeholder="61.8"
              />
            </label>
            <div class="grid gap-3 sm:grid-cols-2">
              <label class="space-y-2">
                <span class="text-sm text-app-muted">Latitude penerima</span>
                <input
                  v-model.number="receiveForm.latitude"
                  required
                  type="number"
                  step="any"
                  class="toolbar-input w-full"
                />
              </label>
              <label class="space-y-2">
                <span class="text-sm text-app-muted">Longitude penerima</span>
                <input
                  v-model.number="receiveForm.longitude"
                  required
                  type="number"
                  step="any"
                  class="toolbar-input w-full"
                />
              </label>
            </div>
            <button
              type="button"
              class="secondary-button w-full justify-center"
              :disabled="busy"
              @click="captureReceivingGps"
            >
              <LocateFixed :size="17" /> Ambil GPS penerima
            </button>
            <button
              class="primary-button w-full justify-center"
              :disabled="
                busy ||
                !isPackage ||
                !receiveForm.route_id ||
                receiveForm.temperature_c === null ||
                receiveForm.latitude === null ||
                receiveForm.longitude === null
              "
            >
              Konfirmasi paket MBG diterima
            </button>
          </form>
        </div>
        <p v-else class="mt-5 text-sm text-app-muted">
          Arahkan kamera ke QR atau masukkan trace code untuk menampilkan identitas objek.
        </p>
      </article>
    </section>
  </div>
</template>

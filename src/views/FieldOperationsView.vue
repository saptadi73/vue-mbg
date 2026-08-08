<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { LocateFixed, MapPin, QrCode, ScanLine, Thermometer } from '@lucide/vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { createFleetVehicleLocationPing, getFleetVehicles } from '@/services/fleet'
import {
  getFoodSafetyProfiles,
  recordTemperatureReading,
  resolveTrace,
} from '@/services/food-safety'
import { useAppStore } from '@/stores/app'
import type { FleetVehicleRecord } from '@/types/domain'
import type { FoodSafetyProfile, TraceEntity } from '@/types/food-safety'

type BarcodeResult = { rawValue: string }
type BarcodeDetectorInstance = { detect: (source: HTMLVideoElement) => Promise<BarcodeResult[]> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance

const appStore = useAppStore()
const activePanel = ref<'temperature' | 'gps' | 'qr'>('temperature')
const busy = ref(false)
const message = ref('')
const error = ref('')
const vehicles = ref<FleetVehicleRecord[]>([])
const profiles = ref<FoodSafetyProfile[]>([])
const traceResult = ref<TraceEntity | null>(null)

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
const cameraActive = ref(false)
const videoElement = ref<HTMLVideoElement | null>(null)
let cameraStream: MediaStream | null = null
let scanFrame = 0

const selectedVehicle = computed(() =>
  vehicles.value.find((vehicle) => vehicle.id === gpsForm.vehicle_id),
)

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

const loadOptions = async () => {
  const [fleetResult, safetyProfiles] = await Promise.all([
    getFleetVehicles(),
    getFoodSafetyProfiles().catch(() => []),
  ])
  vehicles.value = fleetResult.items
  profiles.value = safetyProfiles
  gpsForm.vehicle_id ||= vehicles.value[0]?.id || ''
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
    stopCamera()
  }, 'QR berhasil dipindai dan data trace ditemukan.')

const scanCameraFrame = async (detector: BarcodeDetectorInstance) => {
  if (!cameraActive.value || !videoElement.value) return
  try {
    const results = await detector.detect(videoElement.value)
    if (results[0]?.rawValue) {
      qrCode.value = results[0].rawValue
      await resolveQr()
      return
    }
  } catch {
    // Kamera dapat belum siap pada beberapa frame pertama.
  }
  scanFrame = window.requestAnimationFrame(() => void scanCameraFrame(detector))
}

const startCamera = async () => {
  message.value = ''
  error.value = ''
  const Detector = (window as typeof window & { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector
  if (!Detector) {
    error.value = 'Pemindaian kamera belum didukung browser ini. Masukkan kode QR secara manual.'
    return
  }
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
    const detector = new Detector({ formats: ['qr_code'] })
    scanFrame = window.requestAnimationFrame(() => void scanCameraFrame(detector))
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
      title="Operasional Lapangan"
      subtitle="Pencatatan manual saat perangkat IoT belum tersedia, pelaporan GPS armada, dan pemindaian QR melalui web."
      :badges="['Mobile Ready', 'Manual Fallback', 'Audit Trail']"
    />

    <div class="grid gap-3 md:grid-cols-3">
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
    <p v-if="error" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
      {{ error }}
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
        </div>
        <p v-else class="mt-5 text-sm text-app-muted">
          Arahkan kamera ke QR atau masukkan trace code untuk menampilkan identitas objek.
        </p>
      </article>
    </section>
  </div>
</template>

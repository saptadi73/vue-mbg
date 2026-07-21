<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createFleetVehicleLocationPing } from '@/services/fleet'

type TrackerQuery = {
  vehicleId: string
  vehicleCode: string
  tenantId: string
  sppgId: string
  assignmentId: string
  driverId: string
  driverName: string
}

const route = useRoute()
const trackingIntervalMs = 60000
const sending = ref(false)
const lastSentAt = ref('')
const lastError = ref('')
const lastPositionText = ref('')
const permissionState = ref('Meminta izin lokasi...')
const movementStatus = ref('STOPPED')
const pingCount = ref(0)
const tracker = computed<TrackerQuery>(() => ({
  vehicleId: String(route.query.vehicle_id || ''),
  vehicleCode: String(route.query.vehicle_code || route.query.vehicle_id || ''),
  tenantId: String(route.query.tenant_id || ''),
  sppgId: String(route.query.sppg_id || ''),
  assignmentId: String(route.query.assignment_id || ''),
  driverId: String(route.query.driver_id || ''),
  driverName: String(route.query.driver_name || ''),
}))

const missingRequiredQuery = computed(() => !tracker.value.vehicleId || !tracker.value.tenantId)
const intervalLabel = computed(() => `${Math.round(trackingIntervalMs / 1000)} detik`)

let intervalId: number | null = null

const inferMovementStatus = (speedMps: number | null) => {
  if (!speedMps || speedMps <= 0.5) return 'STOPPED'
  if (speedMps < 3) return 'LOADING'
  return 'IN_TRANSIT'
}

const sendCurrentPosition = async () => {
  if (sending.value || missingRequiredQuery.value) return
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    lastError.value = 'Browser HP ini belum mendukung geolocation.'
    permissionState.value = 'Geolocation tidak tersedia.'
    return
  }

  sending.value = true
  lastError.value = ''

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        permissionState.value = 'Izin lokasi aktif.'
        const speedMps = position.coords.speed
        movementStatus.value = inferMovementStatus(speedMps)
        lastPositionText.value = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`

        await createFleetVehicleLocationPing(
          tracker.value.vehicleId,
          {
            sppg_id: tracker.value.sppgId || null,
            assignment_id: tracker.value.assignmentId || null,
            recorded_at: new Date(position.timestamp).toISOString(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed_kph: speedMps !== null && speedMps !== undefined ? Number((speedMps * 3.6).toFixed(2)) : null,
            heading_degree:
              position.coords.heading !== null && position.coords.heading !== undefined
                ? Number(position.coords.heading.toFixed(2))
                : null,
            accuracy_meter: Number(position.coords.accuracy.toFixed(2)),
            engine_on: true,
            movement_status: movementStatus.value,
            event_type: 'GPS_PING',
            source: 'driver_qr_page',
            address_label: null,
            notes: `Ping otomatis dari halaman driver setiap ${intervalLabel.value}. driver_id=${tracker.value.driverId || '-'}`,
          },
          {
            tenantId: tracker.value.tenantId,
            sppgId: tracker.value.sppgId || null,
          },
        )

        lastSentAt.value = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'medium',
        })
        pingCount.value += 1
      } catch (error) {
        lastError.value = error instanceof Error ? error.message : 'Gagal mengirim lokasi ke backend.'
      } finally {
        sending.value = false
      }
    },
    (error) => {
      const errorMap: Record<number, string> = {
        1: 'Izin lokasi ditolak di perangkat driver.',
        2: 'Posisi GPS belum bisa didapatkan. Coba aktifkan lokasi presisi tinggi.',
        3: 'Permintaan lokasi melebihi batas waktu.',
      }
      permissionState.value = 'Izin lokasi belum aktif.'
      lastError.value = errorMap[error.code] || 'Terjadi kendala saat membaca lokasi perangkat.'
      sending.value = false
    },
    {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 20000,
    },
  )
}

const startTracking = () => {
  if (intervalId !== null) return
  void sendCurrentPosition()
  intervalId = window.setInterval(() => {
    void sendCurrentPosition()
  }, trackingIntervalMs)
}

const stopTracking = () => {
  if (intervalId !== null) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

onMounted(() => {
  if (!missingRequiredQuery.value) {
    startTracking()
  }
})

onBeforeUnmount(() => {
  stopTracking()
})
</script>

<template>
  <div class="mx-auto min-h-screen max-w-3xl px-4 py-6 sm:px-6">
    <div class="space-y-6">
      <article class="glass-panel overflow-hidden">
        <div class="bg-[linear-gradient(135deg,rgba(30,64,52,0.95),rgba(14,116,144,0.88))] px-6 py-8 text-white">
          <p class="text-xs uppercase tracking-[0.3em] text-white/75">Driver Tracker</p>
          <h1 class="mt-3 font-display text-3xl">Halaman ping lokasi armada</h1>
          <p class="mt-3 max-w-2xl text-sm text-white/80">
            Buka halaman ini di HP driver, izinkan akses lokasi, lalu posisi kendaraan akan dikirim ke backend setiap {{ intervalLabel }}.
          </p>
        </div>

        <div class="grid gap-4 p-6 md:grid-cols-2">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Kendaraan</p>
            <p class="mt-2 font-semibold text-app-heading">{{ tracker.vehicleCode || '-' }}</p>
            <p class="mt-1 text-sm text-app-body">Vehicle ID: {{ tracker.vehicleId || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Driver</p>
            <p class="mt-2 font-semibold text-app-heading">{{ tracker.driverName || 'Driver belum terisi di QR' }}</p>
            <p class="mt-1 text-sm text-app-body">Driver ID: {{ tracker.driverId || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">SPPG</p>
            <p class="mt-2 font-semibold text-app-heading">{{ tracker.sppgId || '-' }}</p>
            <p class="mt-1 text-sm text-app-body">Tenant: {{ tracker.tenantId || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Status tracking</p>
            <p class="mt-2 font-semibold text-app-heading">{{ movementStatus }}</p>
            <p class="mt-1 text-sm text-app-body">{{ permissionState }}</p>
          </div>
        </div>
      </article>

      <article v-if="missingRequiredQuery" class="error-panel">
        Link driver belum lengkap. Parameter minimal yang dibutuhkan adalah `vehicle_id` dan `tenant_id`.
      </article>

      <template v-else>
        <section class="grid gap-4 md:grid-cols-3">
          <article class="glass-panel p-5">
            <p class="text-sm text-app-muted">Ping terkirim</p>
            <p class="mt-3 font-display text-3xl text-app-heading">{{ pingCount }}</p>
          </article>
          <article class="glass-panel p-5">
            <p class="text-sm text-app-muted">Posisi terakhir</p>
            <p class="mt-3 text-sm font-semibold text-app-heading">{{ lastPositionText || 'Menunggu GPS...' }}</p>
          </article>
          <article class="glass-panel p-5">
            <p class="text-sm text-app-muted">Update terakhir</p>
            <p class="mt-3 text-sm font-semibold text-app-heading">{{ lastSentAt || 'Belum ada ping sukses' }}</p>
          </article>
        </section>

        <article class="glass-panel p-6">
          <div class="flex flex-wrap gap-3">
            <button class="primary-button" :disabled="sending" type="button" @click="sendCurrentPosition">
              {{ sending ? 'Mengirim...' : 'Kirim lokasi sekarang' }}
            </button>
            <button class="secondary-button" type="button" @click="startTracking">Mulai auto ping</button>
            <button class="secondary-button" type="button" @click="stopTracking">Hentikan auto ping</button>
          </div>

          <p class="mt-4 text-sm text-app-muted">
            Payload akan dikirim ke endpoint `POST /api/v1/fleet/vehicles/{vehicle_id}/locations` dengan sumber `driver_qr_page`.
          </p>
          <p v-if="lastError" class="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {{ lastError }}
          </p>
        </article>
      </template>
    </div>
  </div>
</template>

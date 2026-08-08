<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import type { FleetAssignmentRecord, FleetVehicleDetailRecord } from '@/types/domain'
import { getAvailablePrinters, isQzReady, printQrLabel } from '@/services/thermal-printer'

const LABEL_PRESET_STORAGE_KEY = 'mbg_driver_qr_label_size_mm_v1'

type LabelSize = {
  width: number
  height: number
  vehicleId?: string | null
}

const props = defineProps<{
  detail: FleetVehicleDetailRecord | null
}>()

const qrCodeDataUrl = ref('')
const copyFeedback = ref('')
const printFeedback = ref('')
const isPrinting = ref(false)
const printers = ref<string[]>([])
const selectedPrinter = ref('')
const qzAvailable = ref<boolean | null>(null)
const labelWidth = ref(101.6)
const labelHeight = ref(76.2)
const selectedAssignmentId = ref('')
const lastPrintable = ref('')

const driverAssignments = computed<FleetAssignmentRecord[]>(() =>
  [...(props.detail?.assignments || [])]
    .filter((item) => item.driver_id || item.driver_name)
    .sort((left, right) => {
      if (left.is_active !== right.is_active) return left.is_active ? -1 : 1
      return right.assignment_date.localeCompare(left.assignment_date)
    }),
)

const selectedAssignment = computed<FleetAssignmentRecord | null>(() => {
  if (!driverAssignments.value.length) return null
  return (
    driverAssignments.value.find((item) => item.id === selectedAssignmentId.value) ||
    driverAssignments.value[0] ||
    null
  )
})

const driverOptionLabel = (assignment: FleetAssignmentRecord) => {
  const driverLabel = assignment.driver_name || 'Driver belum bernama'
  const sppgLabel = assignment.sppg_name || assignment.sppg_id || 'SPPG belum terhubung'
  return `${driverLabel} | ${sppgLabel}`
}

const requiresDriverSelection = computed(() => driverAssignments.value.length > 0)

const trackerReady = computed(() => {
  if (!props.detail) return false
  if (requiresDriverSelection.value) return Boolean(selectedAssignment.value)
  return true
})

const trackerUrl = computed(() => {
  if (!props.detail || typeof window === 'undefined' || !trackerReady.value) return ''

  const target = new URL('/fleet/driver-tracker', window.location.origin)
  const vehicle = props.detail.vehicle
  const assignment = selectedAssignment.value

  target.searchParams.set('vehicle_id', vehicle.id)
  target.searchParams.set('vehicle_code', vehicle.vehicle_code)
  target.searchParams.set('tenant_id', vehicle.tenant_id || 'tenant-demo-mbg')

  if (assignment?.sppg_id || vehicle.home_sppg_id) {
    target.searchParams.set('sppg_id', assignment?.sppg_id || vehicle.home_sppg_id || '')
  }
  if (assignment?.id) target.searchParams.set('assignment_id', assignment.id)
  if (assignment?.driver_id) target.searchParams.set('driver_id', assignment.driver_id)
  if (assignment?.driver_name) target.searchParams.set('driver_name', assignment.driver_name)

  return target.toString()
})

const renderQrCode = async () => {
  if (!trackerUrl.value) {
    qrCodeDataUrl.value = ''
    return
  }

  qrCodeDataUrl.value = await QRCode.toDataURL(trackerUrl.value, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: {
      dark: '#11342d',
      light: '#f8fcfb',
    },
  })
}

const copyTrackerUrl = async () => {
  if (!trackerUrl.value || typeof navigator === 'undefined' || !navigator.clipboard) return

  await navigator.clipboard.writeText(trackerUrl.value)
  copyFeedback.value = 'Link driver berhasil disalin.'
  window.setTimeout(() => {
    copyFeedback.value = ''
  }, 2000)
}

const printQrFromValue = async (value: string) => {
  if (!value) return

  try {
    isPrinting.value = true
    printFeedback.value = qzAvailable.value
      ? 'Menghubungkan ke printer...'
      : 'QZ Tray tidak siap, menyiapkan fallback browser print.'

    if (qzAvailable.value) {
      const result = await printQrLabel({
        value,
        printerName: selectedPrinter.value || undefined,
        pageWidthMm: labelWidth.value,
        pageHeightMm: labelHeight.value,
      })
      lastPrintable.value = value
      printFeedback.value = result
      return
    }

    const w = window.open('', '_blank')
    if (!w) throw new Error('Popup diblokir browser. Aktifkan popup untuk fallback print.')
    w.document.write(`<div style="width:${labelWidth.value}mm;height:${labelHeight.value}mm;padding:4mm;box-sizing:border-box;">`)
    w.document.write(`<img src="${await QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
      color: {
        dark: '#11342d',
        light: '#f8fcfb',
      },
    })}" style="width:100%;max-width:100%;height:auto;" />`)
    w.document.write(
      `<div style="margin-top:4mm; font-family:Arial, sans-serif; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${value}</div>`,
    )
    w.document.write(`</div>`)
    w.document.close()
    w.print()
    lastPrintable.value = value
    printFeedback.value = 'Fallback print via browser sudah dipanggil.'
  } catch (error) {
    printFeedback.value = error instanceof Error ? error.message : 'Gagal print QR code.'
  } finally {
    isPrinting.value = false
  }
}

const printTrackerQr = async () => {
  if (!trackerUrl.value) return
  await printQrFromValue(trackerUrl.value)
}

const printLast = async () => {
  if (!lastPrintable.value) return
  await printQrFromValue(lastPrintable.value)
}

const loadPrinters = async () => {
  try {
    const list = await getAvailablePrinters()
    printers.value = list
    selectedPrinter.value = list[0] ?? ''
  } catch {
    printers.value = []
  }
}

const saveLabelPreset = () => {
  if (typeof window === 'undefined') return
  const payload: LabelSize = {
    width: labelWidth.value,
    height: labelHeight.value,
    vehicleId: props.detail?.vehicle.id || null,
  }
  window.localStorage.setItem(LABEL_PRESET_STORAGE_KEY, JSON.stringify(payload))
}

const loadLabelPreset = () => {
  if (typeof window === 'undefined') return
  const raw = window.localStorage.getItem(LABEL_PRESET_STORAGE_KEY)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as LabelSize
    const currentVehicleId = props.detail?.vehicle.id || null
    if (
      typeof parsed?.width === 'number' &&
      typeof parsed?.height === 'number' &&
      (!parsed.vehicleId || parsed.vehicleId === currentVehicleId)
    ) {
      labelWidth.value = parsed.width
      labelHeight.value = parsed.height
    }
  } catch {
    window.localStorage.removeItem(LABEL_PRESET_STORAGE_KEY)
  }
}

const presetLabel = (width: number, height: number) => {
  labelWidth.value = width
  labelHeight.value = height
}

const onPresetChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  if (value === '4x3') presetLabel(101.6, 76.2)
  else if (value === '4x2') presetLabel(101.6, 50.8)
}

const resetLabelPreset = () => {
  presetLabel(101.6, 76.2)
}

watch(
  () => [props.detail?.vehicle.id, driverAssignments.value.map((item) => item.id).join('|')],
  () => {
    selectedAssignmentId.value = driverAssignments.value[0]?.id || ''
    copyFeedback.value = ''
    printFeedback.value = ''
    loadLabelPreset()
  },
)

watch(trackerUrl, () => {
  void renderQrCode()
})

watch([labelWidth, labelHeight], () => {
  saveLabelPreset()
})

onMounted(async () => {
  loadLabelPreset()
  qzAvailable.value = await isQzReady()
  if (qzAvailable.value) {
    await loadPrinters()
  }
})
</script>

<template>
  <article id="driver-qr-card" class="glass-panel p-6">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="eyebrow-text">Driver Tracker QR</p>
        <h2 class="mt-2 font-display text-2xl text-app-heading">Generate QR halaman driver</h2>
      </div>
      <span class="status-pill">Ping GPS tiap 60 detik</span>
    </div>

    <div v-if="detail" class="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
      <div class="surface-subtle flex aspect-square w-full max-w-[220px] items-center justify-center rounded-[28px] p-4">
        <img
          v-if="qrCodeDataUrl"
          :src="qrCodeDataUrl"
          alt="QR code halaman driver"
          class="aspect-square h-full w-full rounded-2xl bg-white p-3 object-contain"
        />
        <p v-else class="max-w-[180px] text-center text-sm text-app-muted">
          Pilih armada dan driver dulu agar QR code bisa dibuat.
        </p>
      </div>

      <div class="grid gap-4">
        <div class="surface-subtle rounded-3xl p-4">
          <p class="text-sm text-app-muted">Kendaraan</p>
          <p class="mt-2 font-semibold text-app-heading">{{ detail.vehicle.vehicle_code }} / {{ detail.vehicle.plate_number }}</p>
          <p class="mt-2 text-sm text-app-body">
            Driver:
            {{ selectedAssignment?.driver_name || (requiresDriverSelection ? 'Belum dipilih' : 'Tidak ada assignment driver') }}
          </p>
          <p class="mt-1 text-sm text-app-body">
            SPPG:
            {{ selectedAssignment?.sppg_name || detail.vehicle.home_sppg_name || '-' }}
          </p>
        </div>

        <div v-if="requiresDriverSelection" class="surface-subtle rounded-3xl p-4">
          <label class="form-field">
            <span>Pilih driver / assignment</span>
            <select v-model="selectedAssignmentId" class="toolbar-input">
              <option value="">Pilih driver terlebih dulu</option>
              <option v-for="assignment in driverAssignments" :key="assignment.id" :value="assignment.id">
                {{ driverOptionLabel(assignment) }}
              </option>
            </select>
          </label>
          <p class="mt-3 text-sm text-app-muted">
            QR baru dibuat setelah driver dipilih, supaya query string sesuai armada dan assignment yang diinginkan.
          </p>
        </div>

        <div v-else class="surface-subtle rounded-3xl p-4">
          <p class="text-sm text-app-muted">
            Armada ini belum punya assignment driver aktif, jadi QR akan dibuat berbasis armada saja.
          </p>
        </div>

        <div class="surface-subtle rounded-3xl p-4">
          <p class="text-sm text-app-muted">Link Driver</p>
          <p class="mt-2 break-all text-sm text-app-body">
            {{ trackerUrl || 'Link belum tersedia. Pilih driver atau gunakan armada tanpa assignment driver.' }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <button class="primary-button" :disabled="!trackerUrl" type="button" @click="copyTrackerUrl">Salin Link</button>
          <button class="secondary-button" type="button" :disabled="!qzAvailable" @click="loadPrinters">Muat Ulang Printer</button>
          <label v-if="qzAvailable && printers.length > 1" class="form-field">
            <span>Pilih Printer</span>
            <select v-model="selectedPrinter" class="toolbar-input">
              <option v-for="item in printers" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </label>
          <label class="form-field">
            <span>Label Preset</span>
            <select class="toolbar-input" @change="onPresetChange">
              <option value="4x3">4 inch x 3 inch</option>
              <option value="4x2">4 inch x 2 inch</option>
              <option value="custom">Custom Manual</option>
            </select>
          </label>
          <label class="form-field">
            <span>Lebar (mm)</span>
            <input v-model.number="labelWidth" type="number" class="toolbar-input" min="20" max="250" step="0.1" />
          </label>
          <label class="form-field">
            <span>Tinggi (mm)</span>
            <input v-model.number="labelHeight" type="number" class="toolbar-input" min="20" max="250" step="0.1" />
          </label>
          <button class="secondary-button" type="button" @click="resetLabelPreset">Reset Ukuran Default 4x3</button>
          <button class="secondary-button" :disabled="!lastPrintable || isPrinting" type="button" @click="printLast">
            Print Ulang Terakhir
          </button>
          <button
            class="secondary-button"
            :disabled="!trackerUrl || isPrinting"
            type="button"
            @click="printTrackerQr"
          >
            {{ isPrinting ? 'Mengirim...' : 'Print QR Label' }}
          </button>
          <a v-if="trackerUrl" class="secondary-button" :href="trackerUrl" target="_blank" rel="noopener noreferrer">Buka Halaman Driver</a>
        </div>

        <p class="text-sm text-app-muted">
          Query string membawa `vehicle_id`, `tenant_id`, `sppg_id`, `assignment_id`, dan `driver_id` agar halaman driver bisa langsung mengirim lokasi ke backend.
        </p>
        <p v-if="copyFeedback" class="text-sm font-medium text-emerald-600">{{ copyFeedback }}</p>
        <p v-if="printFeedback" class="text-sm font-medium text-emerald-700">{{ printFeedback }}</p>
      </div>
    </div>

    <div v-else class="mt-6 rounded-3xl border border-dashed border-[var(--app-panel-border)] p-6 text-sm text-app-muted">
      Klik tombol pilih armada dari tabel terlebih dulu. Setelah itu, kalau armada punya assignment driver, pilih juga driver yang akan dipakai untuk QR.
    </div>
  </article>
</template>

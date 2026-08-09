<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import QRCode from 'qrcode'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { env } from '@/config/env'
import { isQzReady, printQrLabel } from '@/services/thermal-printer'
import {
  acknowledgeFoodSafetyAlert,
  addTraceEvent,
  createFoodSafetyHold,
  createFoodSafetyRecall,
  createTraceEntity,
  createTraceRelation,
  getTraceLabel,
  getFoodSafetyAlerts,
  getFoodSafetyProfiles,
  getTraceGraph,
  getTraceTimeline,
  recordTemperatureReading,
  resolveTrace,
  runFoodSafetyCheck,
} from '@/services/food-safety'
import { getDeliveryPackages } from '@/services/delivery'
import type {
  FoodSafetyAlert,
  FoodSafetyCheckResult,
  FoodSafetyProfile,
  TraceEntity,
  TraceEvent,
  TraceGraph,
  TraceLabel,
} from '@/types/food-safety'
import type { DeliveryPackageLifecycleRecord } from '@/types/domain'
import { readStoredSession } from '@/utils/auth-storage'
import { formatDateTime } from '@/utils/format'

type Tab = 'trace' | 'safety' | 'alerts' | 'packages'
const props = withDefaults(defineProps<{ workspace?: 'all' | 'food-security' }>(), {
  workspace: 'all',
})
const session = readStoredSession()
const tenantId = session?.tenantId || env.devTenantId
const sppgId = session?.activeSppgId || env.devSppgId
const isFoodSecurityWorkspace = computed(() => props.workspace === 'food-security')
const activeTab = ref<Tab>(props.workspace === 'food-security' ? 'packages' : 'trace')
const visibleTabs = computed<Tab[]>(() =>
  isFoodSecurityWorkspace.value
    ? ['packages', 'trace', 'safety', 'alerts']
    : ['trace', 'safety', 'alerts', 'packages'],
)
const busy = ref(false)
const message = ref('')
const error = ref('')
const trace = ref<TraceEntity | null>(null)
const timeline = ref<TraceEvent[]>([])
const graph = ref<TraceGraph | null>(null)
const graphDirection = ref<'backward' | 'forward'>('backward')
const qrUrl = ref('')
const traceLabel = ref<TraceLabel | null>(null)
const profiles = ref<FoodSafetyProfile[]>([])
const alerts = ref<FoodSafetyAlert[]>([])
const checkResult = ref<FoodSafetyCheckResult | null>(null)
const printLoading = ref(false)
const printMessage = ref('')
const printError = ref('')
const packageLoading = ref(false)
const cameraSupportMessage = ref('')
const packages = ref<DeliveryPackageLifecycleRecord[]>([])
const videoElement = ref<HTMLVideoElement | null>(null)
const cameraActive = ref(false)
let cameraStream: MediaStream | null = null
let scanFrame = 0
let jsQrDecoder: JsQrDecoder | null = null
let jsQrLoading: Promise<JsQrDecoder | null> | null = null

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

const traceForm = reactive({
  trace_code: '',
  entity_type: 'MEAL_BATCH',
  entity_id: '',
  event_type: 'COOKED',
  notes: '',
})
const relationForm = reactive({
  parent_trace_code: '',
  child_trace_code: '',
  relation_type: 'CONSUMED_IN',
  quantity: 1,
  uom_id: '',
})
const safetyForm = reactive({
  profile_id: '',
  entity_type: 'MEAL_BATCH',
  entity_id: '',
  temperature_c: 60,
  cooking_completed_at: '',
  predicted_recipient_at: '',
})
const temperatureForm = reactive({
  entity_type: 'MEAL_BATCH',
  entity_id: '',
  profile_id: '',
  temperature_c: 60,
  measured_at: '',
  measurement_method: 'MANUAL',
})
const holdForm = reactive({
  entity_type: 'MEAL_BATCH',
  entity_id: '',
  reason: 'Memerlukan pemeriksaan QA',
})
const recallForm = reactive({
  trace_code: '',
  reason: 'Objek terindikasi tidak aman',
  severity: 'CRITICAL',
})

const canContinue = computed(
  () => !checkResult.value || ['PASS', 'WARNING'].includes(checkResult.value.gate),
)
const execute = async (action: () => Promise<void>, success: string) => {
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    await action()
    message.value = success
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Operasi gagal.'
  } finally {
    busy.value = false
  }
}
const syncTrace = async (entity: TraceEntity) => {
  trace.value = entity
  traceLabel.value = null
  traceForm.trace_code = entity.trace_code
  recallForm.trace_code = entity.trace_code
  relationForm.child_trace_code ||= entity.trace_code
  qrUrl.value = await QRCode.toDataURL(entity.trace_code, {
    width: 240,
    margin: 2,
    errorCorrectionLevel: 'M',
  })
  timeline.value = await getTraceTimeline(entity.trace_code)
  graph.value = await getTraceGraph(entity.trace_code, graphDirection.value)
  try {
    traceLabel.value = await getTraceLabel(entity.trace_code)
  } catch {
    traceLabel.value = null
  }
}
const browserPrintQr = (qrValue: string, text: string) => {
  const w = window.open('', '_blank')
  if (!w) {
    throw new Error('Popup print diblokir. Aktifkan popup browser untuk fallback print.')
  }
  const encoded = encodeURIComponent(qrValue)
  w.document.write(`
    <html>
      <body style="font-family:Arial,sans-serif;padding:20px;text-align:center;">
        <h3>${text}</h3>
        <img src="https://chart.googleapis.com/chart?chs=220x220&cht=qr&chl=${encoded}&choe=UTF-8" alt="QR Label" />
        <p style="margin-top:12px;">${text}</p>
      </body>
    </html>
  `)
  w.document.close()
  w.print()
}
const printTraceLabel = async () => {
  if (!trace.value) return
  printLoading.value = true
  printMessage.value = ''
  printError.value = ''
  try {
    let value = trace.value.trace_code
    try {
      const label = await getTraceLabel(value)
      if (label?.label?.content) {
        value = `${value} - ${label.label.content}`
      }
    } catch {
      // Endpoint label opsional saat demo masih belum siap.
    }

    if (await isQzReady()) {
      await printQrLabel({ value })
      printMessage.value = 'Label dikirim ke printer thermal.'
    } else {
      browserPrintQr(value, trace.value.trace_code)
      printMessage.value = 'Label berhasil dicetak via browser.'
    }
  } catch (err) {
    printError.value = err instanceof Error ? err.message : 'Gagal mencetak QR label.'
  } finally {
    printLoading.value = false
  }
}
const printPackageLabel = async (code: string) => {
  if (!code) return
  printLoading.value = true
  printMessage.value = ''
  printError.value = ''
  try {
    let value = code
    try {
      const label = await getTraceLabel(code)
      if (label?.label?.content) {
        value = `${code} - ${label.label.content}`
      }
    } catch {
      // label fallback tetap memakai trace code mentah
    }

    if (await isQzReady()) {
      await printQrLabel({ value })
      printMessage.value = 'Label paket dikirim ke printer thermal.'
    } else {
      browserPrintQr(value, code)
      printMessage.value = 'Label paket berhasil dicetak via browser.'
    }
  } catch (err) {
    printError.value = err instanceof Error ? err.message : 'Gagal mencetak label paket.'
  } finally {
    printLoading.value = false
  }
}
const findTrace = () =>
  execute(
    async () => syncTrace(await resolveTrace(traceForm.trace_code.trim())),
    'Trace identity ditemukan.',
  )
const makeTrace = () =>
  execute(
    async () =>
      syncTrace(
        await createTraceEntity({
          tenant_id: tenantId,
          sppg_id: sppgId,
          entity_type: traceForm.entity_type,
          entity_id: traceForm.entity_id,
          status: 'ACTIVE',
        }),
      ),
    'Trace identity dan QR berhasil dibuat.',
  )
const submitEvent = () =>
  execute(async () => {
    await addTraceEvent(traceForm.trace_code, {
      event_type: traceForm.event_type,
      notes: traceForm.notes,
    })
    timeline.value = await getTraceTimeline(traceForm.trace_code)
  }, 'Event trace berhasil dicatat.')
const submitRelation = () =>
  execute(async () => {
    await createTraceRelation({ ...relationForm, uom_id: relationForm.uom_id || undefined })
    graph.value = await getTraceGraph(
      traceForm.trace_code || relationForm.child_trace_code,
      graphDirection.value,
    )
  }, 'Lineage berhasil dihubungkan.')
const refreshGraph = () =>
  execute(async () => {
    graph.value = await getTraceGraph(traceForm.trace_code, graphDirection.value)
  }, 'Lineage diperbarui.')
const loadSafety = () =>
  execute(async () => {
    profiles.value = await getFoodSafetyProfiles()
    alerts.value = await getFoodSafetyAlerts()
    if (!safetyForm.profile_id) safetyForm.profile_id = profiles.value[0]?.id || ''
    temperatureForm.profile_id ||= safetyForm.profile_id
  }, 'Data Food Safety diperbarui.')
const loadPackages = async () => {
  packageLoading.value = true
  error.value = ''
  try {
    const payload = await getDeliveryPackages()
    packages.value = payload.items
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat package lifecycle.'
  } finally {
    packageLoading.value = false
  }
}
const pickPackage = async (traceCode: string) => {
  if (!traceCode) return
  activeTab.value = 'trace'
  traceForm.trace_code = traceCode
  await findTrace()
}
const checkSafety = () =>
  execute(async () => {
    checkResult.value = await runFoodSafetyCheck({
      profile_id: safetyForm.profile_id,
      entity_type: safetyForm.entity_type,
      entity_id: safetyForm.entity_id,
      temperature_c: safetyForm.temperature_c,
      cooking_completed_at: safetyForm.cooking_completed_at
        ? new Date(safetyForm.cooking_completed_at).toISOString()
        : undefined,
      predicted_recipient_at: safetyForm.predicted_recipient_at
        ? new Date(safetyForm.predicted_recipient_at).toISOString()
        : undefined,
    })
  }, 'Safety gate selesai dievaluasi.')
const recordTemperature = () =>
  execute(async () => {
    const result = await recordTemperatureReading({
      tenant_id: tenantId,
      sppg_id: sppgId,
      ...temperatureForm,
      measured_at: temperatureForm.measured_at
        ? new Date(temperatureForm.measured_at).toISOString()
        : new Date().toISOString(),
    })
    if (result.alert) alerts.value.unshift(result.alert)
  }, 'Pembacaan suhu berhasil dicatat.')
const placeHold = () =>
  execute(async () => {
    await createFoodSafetyHold({ tenant_id: tenantId, sppg_id: sppgId, ...holdForm })
    alerts.value = await getFoodSafetyAlerts()
  }, 'HOLD berhasil dipasang dan tercatat dalam audit trail.')
const recall = () =>
  execute(async () => {
    await createFoodSafetyRecall(recallForm)
    graphDirection.value = 'forward'
    graph.value = await getTraceGraph(recallForm.trace_code, 'forward')
  }, 'Recall dibuat dan forward trace dimuat.')
const acknowledge = (id: string) =>
  execute(async () => {
    await acknowledgeFoodSafetyAlert(id)
    alerts.value = await getFoodSafetyAlerts()
  }, 'Alert berhasil di-acknowledge.')

const scanCameraFrame = async (detector?: BarcodeDetectorInstance) => {
  if (!cameraActive.value || !videoElement.value) return
  try {
    if (detector) {
      const results = await detector.detect(videoElement.value)
      if (results[0]?.rawValue) {
        traceForm.trace_code = results[0].rawValue
        await findTrace()
        stopCamera()
        return
      }
    } else {
      const value = await readQrFromVideo()
      if (value) {
        traceForm.trace_code = value
        await findTrace()
        stopCamera()
        return
      }
    }
  } catch {
    // kamera kadang belum stabil untuk frame awal
  }
  scanFrame = window.requestAnimationFrame(() => void scanCameraFrame(detector))
}

const startCamera = async () => {
  printMessage.value = ''
  printError.value = ''
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
  } catch (err) {
    cameraActive.value = false
    printError.value = err instanceof Error ? err.message : 'Tidak dapat membuka kamera.'
  }
}

const stopCamera = () => {
  cameraActive.value = false
  window.cancelAnimationFrame(scanFrame)
  cameraStream?.getTracks().forEach((track) => track.stop())
  cameraStream = null
  if (videoElement.value) videoElement.value.srcObject = null
}

onBeforeUnmount(stopCamera)

watch(
  activeTab,
  (tab) => {
    if ((tab === 'safety' || tab === 'alerts') && !profiles.value.length) loadSafety()
    if (tab === 'packages' && !packages.value.length) loadPackages()
  },
  { immediate: true },
)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      :title="isFoodSecurityWorkspace ? 'Food Security' : 'Food Safety & Traceability'"
      :subtitle="
        isFoodSecurityWorkspace
          ? 'Pantau kemasan siap kirim, cetak dan scan QR, status pengiriman, riwayat proses memasak, hingga penerimaan paket.'
          : 'QR lineage end-to-end, safety gate, temperature, alert, HOLD, dan recall berdasarkan API v2.1.'
      "
      :badges="['QR End-to-End', 'Safety Gate', 'Audit Ready']"
    />
    <div class="glass-panel flex flex-wrap gap-2 p-3">
      <button
        v-for="tab in visibleTabs"
        :key="tab"
        class="secondary-button"
        :class="{ 'primary-button': activeTab === tab }"
        @click="activeTab = tab"
      >
        {{
          tab === 'trace'
            ? isFoodSecurityWorkspace
              ? 'Scan & Riwayat Proses'
              : 'QR & Lineage'
            : tab === 'safety'
              ? 'Safety Check'
              : tab === 'alerts'
                ? 'Alerts & Actions'
                : 'Kemasan & Pengiriman'
        }}
      </button>
    </div>
    <p v-if="message" class="success-panel">{{ message }}</p>
    <p v-if="error" class="error-panel">{{ error }}</p>
    <p
      v-if="cameraSupportMessage"
      class="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700"
    >
      {{ cameraSupportMessage }}
    </p>
    <p v-if="printMessage" class="success-panel">{{ printMessage }}</p>
    <p v-if="printError" class="error-panel">{{ printError }}</p>

    <section v-if="activeTab === 'trace'" class="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <article class="glass-panel p-6 space-y-4">
        <p class="eyebrow-text">Scan / Create Identity</p>
        <div class="flex gap-2">
          <input
            v-model="traceForm.trace_code"
            class="toolbar-input flex-1"
            placeholder="TRC-PAC-..."
          /><button
            class="secondary-button"
            :disabled="busy || !traceForm.trace_code"
            @click="findTrace"
          >
            Resolve QR
          </button>
          <button
            class="secondary-button"
            type="button"
            :disabled="cameraActive"
            @click="startCamera"
          >
            Buka kamera
          </button>
          <button v-if="cameraActive" class="secondary-button" type="button" @click="stopCamera">
            Tutup kamera
          </button>
        </div>
        <video
          v-if="cameraActive"
          ref="videoElement"
          class="mb-2 mt-3 aspect-video w-full rounded-2xl object-cover"
          muted
          playsinline
        ></video>
        <div class="grid gap-3 md:grid-cols-2">
          <label class="form-field"
            ><span>Entity type</span
            ><select v-model="traceForm.entity_type" class="toolbar-input">
              <option
                v-for="x in [
                  'RAW_MATERIAL_LOT',
                  'COOKING_BATCH',
                  'MEAL_BATCH',
                  'PACKAGE',
                  'CONTAINER',
                ]"
                :key="x"
              >
                {{ x }}
              </option>
            </select></label
          ><label class="form-field"
            ><span>Entity ID</span
            ><input v-model="traceForm.entity_id" class="toolbar-input" placeholder="UUID backend"
          /></label>
        </div>
        <button class="primary-button" :disabled="busy || !traceForm.entity_id" @click="makeTrace">
          Buat Identity & QR
        </button>
        <div v-if="trace" class="surface-subtle rounded-3xl p-5 text-center">
          <img :src="qrUrl" class="mx-auto w-48 rounded-xl bg-white p-2" alt="Trace QR" />
          <p class="mt-3 font-mono font-semibold text-app-heading">{{ trace.trace_code }}</p>
          <p class="mt-1 text-xs text-app-muted">QR hanya berisi trace_code opaque</p>
          <button
            class="secondary-button mt-3"
            :disabled="printLoading"
            type="button"
            @click="printTraceLabel"
          >
            {{ printLoading ? 'Mencetak...' : 'Cetak label QR' }}
          </button>
        </div>
        <div v-if="traceLabel" class="surface-subtle rounded-3xl p-5">
          <p class="eyebrow-text">Label payload</p>
          <p class="mt-2 text-sm text-app-body">
            {{
              traceLabel.label?.content || 'Label siap dikirim ke printer / service print barcode.'
            }}
          </p>
          <pre class="mt-2 overflow-x-auto text-xs text-app-muted">{{
            JSON.stringify(traceLabel.label?.print_payload || traceLabel.payload, null, 2)
          }}</pre>
        </div>
        <div class="border-t border-white/10 pt-4">
          <p class="font-semibold text-app-heading">Catat Event</p>
          <div class="mt-3 grid gap-3">
            <select v-model="traceForm.event_type" class="toolbar-input">
              <option
                v-for="x in [
                  'RECEIVED',
                  'STORED',
                  'ISSUED',
                  'COOKED',
                  'PACKAGED',
                  'LOADED',
                  'DISPATCHED',
                  'ARRIVED',
                  'RECEIVED_BY_RECIPIENT',
                  'REJECTED',
                ]"
                :key="x"
              >
                {{ x }}
              </option></select
            ><input
              v-model="traceForm.notes"
              class="toolbar-input"
              placeholder="Catatan event"
            /><button
              class="secondary-button"
              :disabled="busy || !traceForm.trace_code"
              @click="submitEvent"
            >
              Simpan Event
            </button>
          </div>
        </div>
      </article>
      <div class="space-y-6">
        <article class="glass-panel p-6">
          <div class="flex justify-between gap-3">
            <p class="eyebrow-text">Timeline</p>
            <StatusBadge v-if="trace" :status="trace.status" />
          </div>
          <div class="mt-4 space-y-3">
            <div v-for="event in timeline" :key="event.id" class="surface-subtle rounded-2xl p-4">
              <b class="text-app-heading">{{ event.event_type }}</b>
              <p class="text-sm text-app-body">{{ event.notes || '-' }}</p>
              <small class="text-app-muted">{{
                event.event_at || event.created_at
                  ? formatDateTime(event.event_at || event.created_at || '')
                  : '-'
              }}</small>
            </div>
            <p v-if="!timeline.length" class="text-app-muted">Belum ada timeline.</p>
          </div>
        </article>
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="eyebrow-text">Lineage Graph</p>
            <div class="flex gap-2">
              <select v-model="graphDirection" class="toolbar-input">
                <option value="backward">Backward</option>
                <option value="forward">Forward</option></select
              ><button
                class="secondary-button"
                :disabled="!traceForm.trace_code"
                @click="refreshGraph"
              >
                Refresh
              </button>
            </div>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div
              v-for="entity in graph?.entities || []"
              :key="entity.id"
              class="surface-subtle rounded-2xl p-3"
            >
              <b class="text-sm text-app-heading">{{ entity.entity_type }}</b>
              <p class="mt-1 break-all font-mono text-xs text-app-muted">{{ entity.trace_code }}</p>
            </div>
          </div>
          <div class="mt-5 grid gap-3 md:grid-cols-2">
            <input
              v-model="relationForm.parent_trace_code"
              class="toolbar-input"
              placeholder="Parent trace code"
            /><input
              v-model="relationForm.child_trace_code"
              class="toolbar-input"
              placeholder="Child trace code"
            /><select v-model="relationForm.relation_type" class="toolbar-input">
              <option>CONSUMED_IN</option>
              <option>PACKAGED_AS</option>
              <option>LOADED_ON</option></select
            ><button class="secondary-button" @click="submitRelation">Hubungkan Lineage</button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'safety'" class="grid gap-6 xl:grid-cols-2">
      <article class="glass-panel p-6 space-y-4">
        <p class="eyebrow-text">Backend Safety Gate</p>
        <label class="form-field"
          ><span>Safety profile</span
          ><select v-model="safetyForm.profile_id" class="toolbar-input">
            <option v-for="p in profiles" :key="p.id" :value="p.id">
              {{ p.profile_name }} · {{ p.critical_action }}
            </option>
          </select></label
        >
        <div class="grid gap-3 md:grid-cols-2">
          <input
            v-model="safetyForm.entity_id"
            class="toolbar-input"
            placeholder="Meal batch/entity UUID"
          /><input
            v-model.number="safetyForm.temperature_c"
            class="toolbar-input"
            type="number"
            step="0.1"
            placeholder="Temperature °C"
          /><label class="form-field"
            ><span>Cooking completed</span
            ><input
              v-model="safetyForm.cooking_completed_at"
              class="toolbar-input"
              type="datetime-local" /></label
          ><label class="form-field"
            ><span>Predicted recipient / ETA</span
            ><input
              v-model="safetyForm.predicted_recipient_at"
              class="toolbar-input"
              type="datetime-local"
          /></label>
        </div>
        <button
          class="primary-button"
          :disabled="busy || !safetyForm.profile_id || !safetyForm.entity_id"
          @click="checkSafety"
        >
          Jalankan Safety Check
        </button>
        <div v-if="checkResult" class="surface-subtle rounded-3xl p-5">
          <div class="flex items-center justify-between">
            <b class="text-xl text-app-heading">{{ checkResult.gate }}</b
            ><StatusBadge :status="checkResult.status" />
          </div>
          <p class="mt-3 text-app-body">
            Safety buffer: {{ checkResult.safety_buffer_minutes ?? '-' }} menit
          </p>
          <ul class="mt-3 list-disc pl-5 text-sm text-app-body">
            <li v-for="v in checkResult.violations" :key="v">{{ v }}</li>
          </ul>
          <p class="mt-4 font-semibold" :class="canContinue ? 'text-emerald-400' : 'text-rose-400'">
            {{
              canContinue
                ? 'CTA operasional dapat dilanjutkan.'
                : 'CTA posting diblokir; arahkan ke QA.'
            }}
          </p>
        </div>
      </article>
      <article class="glass-panel p-6 space-y-4">
        <p class="eyebrow-text">Temperature Reading</p>
        <input
          v-model="temperatureForm.entity_id"
          class="toolbar-input"
          placeholder="Entity UUID"
        /><select v-model="temperatureForm.profile_id" class="toolbar-input">
          <option v-for="p in profiles" :key="p.id" :value="p.id">{{ p.profile_name }}</option>
        </select>
        <div class="grid gap-3 md:grid-cols-2">
          <input
            v-model.number="temperatureForm.temperature_c"
            type="number"
            step="0.1"
            class="toolbar-input"
          /><input
            v-model="temperatureForm.measured_at"
            type="datetime-local"
            class="toolbar-input"
          />
        </div>
        <button
          class="primary-button"
          :disabled="busy || !temperatureForm.entity_id"
          @click="recordTemperature"
        >
          Catat Suhu Manual
        </button>
        <p class="text-sm text-app-muted">
          Backend otomatis membuat alert bila reading melanggar profile.
        </p>
      </article>
    </section>

    <section v-else-if="activeTab === 'alerts'" class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <article class="glass-panel p-6">
        <div class="flex justify-between">
          <p class="eyebrow-text">Open Alerts</p>
          <button class="secondary-button" @click="loadSafety">Refresh</button>
        </div>
        <div class="mt-4 space-y-3">
          <div v-for="alert in alerts" :key="alert.id" class="surface-subtle rounded-2xl p-4">
            <div class="flex flex-wrap justify-between gap-3">
              <div>
                <b class="text-app-heading">{{ alert.alert_type || alert.entity_type }}</b>
                <p class="mt-1 text-sm text-app-body">{{ alert.message || alert.entity_id }}</p>
              </div>
              <div class="flex items-center gap-2">
                <StatusBadge :status="alert.alert_status" /><button
                  class="secondary-button"
                  @click="acknowledge(alert.id)"
                >
                  Acknowledge
                </button>
              </div>
            </div>
          </div>
          <p v-if="!alerts.length" class="text-app-muted">Tidak ada alert terbuka.</p>
        </div>
      </article>
      <div class="space-y-6">
        <article class="glass-panel p-6 space-y-3">
          <p class="eyebrow-text">QA HOLD</p>
          <input
            v-model="holdForm.entity_id"
            class="toolbar-input"
            placeholder="Entity UUID"
          /><textarea v-model="holdForm.reason" class="toolbar-input" rows="3" /><button
            class="primary-button"
            :disabled="!holdForm.entity_id"
            @click="placeHold"
          >
            Pasang HOLD
          </button>
        </article>
        <article class="glass-panel p-6 space-y-3">
          <p class="eyebrow-text">Recall & Forward Trace</p>
          <input
            v-model="recallForm.trace_code"
            class="toolbar-input"
            placeholder="Trace code sumber"
          /><textarea v-model="recallForm.reason" class="toolbar-input" rows="3" /><select
            v-model="recallForm.severity"
            class="toolbar-input"
          >
            <option>WARNING</option>
            <option>HIGH</option>
            <option>CRITICAL</option></select
          ><button class="primary-button" :disabled="!recallForm.trace_code" @click="recall">
            Buat Recall
          </button>
        </article>
      </div>
    </section>

    <section v-else class="glass-panel">
      <div class="border-b border-white/10 p-6">
        <p class="eyebrow-text">Package Lifecycle</p>
        <p class="mt-2 text-sm text-app-muted">
          Menampilkan paket aktif dari endpoint delivery packages untuk aksi loading/receive.
        </p>
      </div>
      <div class="space-y-4 p-6">
        <p v-if="packageLoading" class="text-sm text-app-muted">Memuat data paket...</p>
        <div v-else>
          <div
            v-for="item in packages"
            :key="item.package_id"
            class="surface-subtle mb-3 rounded-3xl p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-app-heading">{{ item.trace_code }}</p>
                <p class="mt-1 text-sm text-app-body">
                  {{ item.product_name }} | {{ item.status_label || item.status }} | Porsi
                  {{ item.quantity_portions }}
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  class="secondary-button"
                  :disabled="printLoading"
                  @click="printPackageLabel(item.trace_code)"
                >
                  Cetak label
                </button>
                <button class="secondary-button" @click="pickPackage(item.trace_code)">
                  Buka Trace
                </button>
              </div>
            </div>
            <div class="mt-2 text-xs text-app-muted">
              <p v-if="item.route_code">Route: {{ item.route_code }}</p>
              <p v-if="item.destination_name">Tujuan: {{ item.destination_name }}</p>
            </div>
          </div>
          <p v-if="!packages.length" class="text-sm text-app-muted">
            Tidak ada paket dalam lifecycle.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import QRCode from 'qrcode'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { env } from '@/config/env'
import {
  acknowledgeFoodSafetyAlert,
  addTraceEvent,
  createFoodSafetyHold,
  createFoodSafetyRecall,
  createTraceEntity,
  createTraceRelation,
  getFoodSafetyAlerts,
  getFoodSafetyProfiles,
  getTraceGraph,
  getTraceTimeline,
  recordTemperatureReading,
  resolveTrace,
  runFoodSafetyCheck,
} from '@/services/food-safety'
import type {
  FoodSafetyAlert,
  FoodSafetyCheckResult,
  FoodSafetyProfile,
  TraceEntity,
  TraceEvent,
  TraceGraph,
} from '@/types/food-safety'
import { readStoredSession } from '@/utils/auth-storage'
import { formatDateTime } from '@/utils/format'

type Tab = 'trace' | 'safety' | 'alerts'
const session = readStoredSession()
const tenantId = session?.tenantId || env.devTenantId
const sppgId = session?.activeSppgId || env.devSppgId
const activeTab = ref<Tab>('trace')
const busy = ref(false)
const message = ref('')
const error = ref('')
const trace = ref<TraceEntity | null>(null)
const timeline = ref<TraceEvent[]>([])
const graph = ref<TraceGraph | null>(null)
const graphDirection = ref<'backward' | 'forward'>('backward')
const qrUrl = ref('')
const profiles = ref<FoodSafetyProfile[]>([])
const alerts = ref<FoodSafetyAlert[]>([])
const checkResult = ref<FoodSafetyCheckResult | null>(null)

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

watch(activeTab, (tab) => {
  if ((tab === 'safety' || tab === 'alerts') && !profiles.value.length) loadSafety()
})
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Food Safety & Traceability"
      subtitle="QR lineage end-to-end, safety gate, temperature, alert, HOLD, dan recall berdasarkan API v2.1."
      :badges="['Traceability v2.1', 'Backend Safety Gate', 'Audit Ready']"
    />
    <div class="glass-panel flex flex-wrap gap-2 p-3">
      <button
        v-for="tab in ['trace', 'safety', 'alerts'] as Tab[]"
        :key="tab"
        class="secondary-button"
        :class="{ 'primary-button': activeTab === tab }"
        @click="activeTab = tab"
      >
        {{
          tab === 'trace' ? 'QR & Lineage' : tab === 'safety' ? 'Safety Check' : 'Alerts & Actions'
        }}
      </button>
    </div>
    <p v-if="message" class="success-panel">{{ message }}</p>
    <p v-if="error" class="error-panel">{{ error }}</p>

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
        </div>
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

    <section v-else class="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
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
  </div>
</template>

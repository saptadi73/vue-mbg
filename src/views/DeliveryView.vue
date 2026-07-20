<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createRoutePlan,
  getDeliveryOrderById,
  getDeliveryOrders,
  getDeliveryRoutes,
  recordDeliveryIncident,
  recordDeliveryProof,
} from '@/services/delivery'
import type {
  DeliveryIncidentRecord,
  DeliveryOrderDetailRecord,
  DeliveryOrderRecord,
  DeliveryProofRecord,
  DeliveryRoutePlanRecord,
  DeliveryRouteStopRecord,
} from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

const ordersState = useAsyncState(getDeliveryOrders)
const routesState = useAsyncState(getDeliveryRoutes)
const selectedDeliveryId = ref('do-1')
const detailState = useAsyncState<DeliveryOrderDetailRecord>(() => getDeliveryOrderById(selectedDeliveryId.value))
const saving = ref(false)

const routeForm = reactive({
  route_name: 'Route Sekolah Pagi Baru',
  planned_departure: '2026-07-21T06:45',
  planned_arrival: '2026-07-21T07:40',
  notes: 'Route planning tambahan untuk cluster sekolah besok pagi.',
  delivery_order_id: 'do-3',
  recipient_name: 'Petugas Pagi Sekolah',
  stop_gps: '-6.1883,106.8393',
})

const proofForm = reactive({
  received_at: '2026-07-20T08:05',
  receiver_name: 'Petugas Sekolah',
  receiver_gps: '-6.1702,106.8283',
  route_stop_id: 'route-stop-2',
  received_portions: 1180,
  rejected_portions: 0,
  temperature_celsius: 61.8,
  condition_status: 'GOOD',
  condition_notes: 'Diterima lengkap.',
  photo_urls: 'https://example.com/proofs/arrival-extra.jpg',
  signature_name: 'Petugas Sekolah',
  signature_url: 'https://example.com/signatures/receiver.png',
  signature_signed_at: '2026-07-20T08:05:30Z',
  incident_notes: '',
  linked_incident_ids: '',
})

const incidentForm = reactive({
  incident_time: '2026-07-20T08:32',
  category: 'TEMPERATURE',
  severity: 'MEDIUM',
  title: 'Suhu turun saat transit',
  description: 'Perlu inspeksi box termal dan jalur distribusi.',
  route_stop_id: 'route-stop-2',
  incident_gps: '-6.1805,106.8162',
  temperature_celsius: 58.4,
  media_urls: 'https://example.com/incidents/temp-drop-new.jpg',
  status: 'OPEN',
})

const orders = computed(() => ordersState.data.value?.items || [])
const routes = computed(() => routesState.data.value?.items || [])
const detail = computed(() => detailState.data.value || null)

const orderSearchText = (item: unknown) => {
  const row = item as DeliveryOrderRecord
  return [row.delivery_number, row.status, row.school_name, row.receiver_name].filter(Boolean).join(' ')
}

const routeSearchText = (item: unknown) => {
  const row = item as DeliveryRoutePlanRecord
  return [row.route_code, row.route_name, row.route_status, row.notes].filter(Boolean).join(' ')
}

const stopSearchText = (item: unknown) => {
  const row = item as DeliveryRouteStopRecord
  return [row.recipient_name, row.stop_gps, row.status, row.notes].filter(Boolean).join(' ')
}

const proofSearchText = (item: unknown) => {
  const row = item as DeliveryProofRecord
  return [row.receiver_name, row.condition_status, row.condition_notes].filter(Boolean).join(' ')
}

const incidentSearchText = (item: unknown) => {
  const row = item as DeliveryIncidentRecord
  return [row.category, row.severity, row.title, row.status].filter(Boolean).join(' ')
}

const selectDelivery = async (deliveryId: string) => {
  selectedDeliveryId.value = deliveryId
  await detailState.execute()
}

const submitRoutePlan = async () => {
  saving.value = true
  try {
    await createRoutePlan({
      route_name: routeForm.route_name,
      planned_departure: `${routeForm.planned_departure}:00Z`,
      planned_arrival: `${routeForm.planned_arrival}:00Z`,
      notes: routeForm.notes,
      stops: [
        {
          delivery_order_id: routeForm.delivery_order_id,
          planned_arrival: `${routeForm.planned_arrival}:00Z`,
          recipient_name: routeForm.recipient_name,
          stop_gps: routeForm.stop_gps,
          notes: 'Stop baru hasil planning frontend.',
        },
      ],
    })
    await routesState.execute()
  } finally {
    saving.value = false
  }
}

const submitProof = async () => {
  saving.value = true
  try {
    await recordDeliveryProof(selectedDeliveryId.value, {
      received_at: `${proofForm.received_at}:00Z`,
      receiver_name: proofForm.receiver_name,
      receiver_gps: proofForm.receiver_gps,
      route_stop_id: proofForm.route_stop_id,
      received_portions: Number(proofForm.received_portions),
      rejected_portions: Number(proofForm.rejected_portions),
      temperature_celsius: Number(proofForm.temperature_celsius),
      condition_status: proofForm.condition_status,
      condition_notes: proofForm.condition_notes,
      photo_urls: proofForm.photo_urls ? [proofForm.photo_urls] : [],
      signature_name: proofForm.signature_name,
      signature_url: proofForm.signature_url,
      signature_signed_at: proofForm.signature_signed_at,
      incident_notes: proofForm.incident_notes,
      linked_incident_ids: proofForm.linked_incident_ids
        ? proofForm.linked_incident_ids.split(',').map((item) => item.trim()).filter(Boolean)
        : [],
    })
    await ordersState.execute()
    await detailState.execute()
  } finally {
    saving.value = false
  }
}

const submitIncident = async () => {
  saving.value = true
  try {
    await recordDeliveryIncident(selectedDeliveryId.value, {
      incident_time: `${incidentForm.incident_time}:00Z`,
      category: incidentForm.category,
      severity: incidentForm.severity,
      title: incidentForm.title,
      description: incidentForm.description,
      route_stop_id: incidentForm.route_stop_id,
      incident_gps: incidentForm.incident_gps,
      temperature_celsius: Number(incidentForm.temperature_celsius),
      media_urls: incidentForm.media_urls ? [incidentForm.media_urls] : [],
      status: incidentForm.status,
    })
    await detailState.execute()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Delivery Workspace"
      subtitle="Kelola delivery order, route planning, proof of delivery, dan incidents dalam satu layar operasional yang siap dipakai tim distribusi dan quality."
      :badges="['Delivery Orders', 'Proof of Delivery', 'Incidents']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Delivery orders</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ orders.length }}</p>
        <p class="mt-2 text-sm text-app-body">Order distribusi aktif di tenant ini.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Planned routes</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ routes.length }}</p>
        <p class="mt-2 text-sm text-app-body">Route planning yang sudah tercatat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Proof records</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ detail?.proofs.length || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Proof pada delivery yang sedang dipilih.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Open incidents</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ (detail?.incidents || []).filter((item) => item.status === 'OPEN').length }}</p>
        <p class="mt-2 text-sm text-app-body">Insiden terbuka pada delivery terpilih.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <DataTableCard
        :items="orders"
        :search-text-resolver="orderSearchText"
        search-placeholder="Cari nomor delivery, sekolah, status..."
        title="Delivery Orders"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Delivery</th>
                <th>Sekolah</th>
                <th>Planned</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryOrderRecord).id">
                <td>{{ (item as DeliveryOrderRecord).delivery_number }}</td>
                <td>{{ (item as DeliveryOrderRecord).school_name || '-' }}</td>
                <td>{{ formatDateTime((item as DeliveryOrderRecord).planned_departure) }}</td>
                <td><StatusBadge :status="(item as DeliveryOrderRecord).status" /></td>
                <td>
                  <button class="secondary-button" type="button" @click="selectDelivery((item as DeliveryOrderRecord).id)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Selected Delivery</p>
        <div v-if="detail" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Delivery Number</p>
            <p class="mt-2 font-display text-2xl text-app-heading">{{ detail.delivery_order.delivery_number }}</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.delivery_order.school_name || '-' }} | {{ detail.delivery_order.receiver_name || 'Belum ada receiver' }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Planned Arrival</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatDateTime(detail.delivery_order.planned_arrival) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Actual Arrival</p>
              <p class="mt-2 font-semibold text-app-heading">{{ detail.delivery_order.actual_arrival ? formatDateTime(detail.delivery_order.actual_arrival) : '-' }}</p>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="routes"
        :search-text-resolver="routeSearchText"
        search-placeholder="Cari route code, route name, atau status..."
        title="Route Planning"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Route</th>
                <th>Status</th>
                <th>Distance</th>
                <th>Departure</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryRoutePlanRecord).id">
                <td>
                  <p>{{ (item as DeliveryRoutePlanRecord).route_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as DeliveryRoutePlanRecord).route_code }}</p>
                </td>
                <td><StatusBadge :status="(item as DeliveryRoutePlanRecord).route_status" /></td>
                <td>{{ ((item as DeliveryRoutePlanRecord).total_distance_km || 0).toFixed(2) }} km</td>
                <td>{{ formatDateTime((item as DeliveryRoutePlanRecord).planned_departure) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Create Route</p>
        <form class="mt-5 grid gap-4" @submit.prevent="submitRoutePlan">
          <input v-model="routeForm.route_name" class="toolbar-input" placeholder="Route name" />
          <div class="grid gap-4 md:grid-cols-2">
            <input v-model="routeForm.planned_departure" class="toolbar-input" type="datetime-local" />
            <input v-model="routeForm.planned_arrival" class="toolbar-input" type="datetime-local" />
          </div>
          <select v-model="routeForm.delivery_order_id" class="toolbar-input">
            <option v-for="order in orders" :key="order.id" :value="order.id">{{ order.delivery_number }}</option>
          </select>
          <input v-model="routeForm.recipient_name" class="toolbar-input" placeholder="Recipient name" />
          <input v-model="routeForm.stop_gps" class="toolbar-input" placeholder="Stop GPS" />
          <textarea v-model="routeForm.notes" class="toolbar-input min-h-24" />
          <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Create Route Plan' }}</button>
        </form>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <article class="glass-panel p-6">
        <p class="eyebrow-text">Record Proof of Delivery</p>
        <form class="mt-5 grid gap-4" @submit.prevent="submitProof">
          <div class="grid gap-4 md:grid-cols-2">
            <input v-model="proofForm.received_at" class="toolbar-input" type="datetime-local" />
            <input v-model="proofForm.receiver_name" class="toolbar-input" placeholder="Receiver name" />
            <input v-model="proofForm.receiver_gps" class="toolbar-input" placeholder="Receiver GPS" />
            <input v-model="proofForm.route_stop_id" class="toolbar-input" placeholder="Route stop ID" />
            <input v-model.number="proofForm.received_portions" class="toolbar-input" min="0" type="number" />
            <input v-model.number="proofForm.rejected_portions" class="toolbar-input" min="0" type="number" />
            <input v-model.number="proofForm.temperature_celsius" class="toolbar-input" step="0.1" type="number" />
            <input v-model="proofForm.condition_status" class="toolbar-input" placeholder="Condition status" />
          </div>
          <textarea v-model="proofForm.condition_notes" class="toolbar-input min-h-20" placeholder="Condition notes" />
          <input v-model="proofForm.photo_urls" class="toolbar-input" placeholder="Photo URL" />
          <input v-model="proofForm.signature_name" class="toolbar-input" placeholder="Signature name" />
          <input v-model="proofForm.signature_url" class="toolbar-input" placeholder="Signature URL" />
          <input v-model="proofForm.signature_signed_at" class="toolbar-input" placeholder="Signature signed at (ISO)" />
          <textarea v-model="proofForm.incident_notes" class="toolbar-input min-h-20" placeholder="Incident notes" />
          <input v-model="proofForm.linked_incident_ids" class="toolbar-input" placeholder="Linked incident IDs, pisahkan koma" />
          <button class="primary-button" :disabled="saving || !selectedDeliveryId" type="submit">{{ saving ? 'Menyimpan...' : 'Record Proof' }}</button>
        </form>
      </article>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Record Delivery Incident</p>
        <form class="mt-5 grid gap-4" @submit.prevent="submitIncident">
          <div class="grid gap-4 md:grid-cols-2">
            <input v-model="incidentForm.incident_time" class="toolbar-input" type="datetime-local" />
            <input v-model="incidentForm.category" class="toolbar-input" placeholder="Category" />
            <input v-model="incidentForm.severity" class="toolbar-input" placeholder="Severity" />
            <input v-model="incidentForm.route_stop_id" class="toolbar-input" placeholder="Route stop ID" />
            <input v-model="incidentForm.incident_gps" class="toolbar-input" placeholder="Incident GPS" />
            <input v-model.number="incidentForm.temperature_celsius" class="toolbar-input" step="0.1" type="number" />
          </div>
          <input v-model="incidentForm.title" class="toolbar-input" placeholder="Incident title" />
          <textarea v-model="incidentForm.description" class="toolbar-input min-h-24" placeholder="Description" />
          <input v-model="incidentForm.media_urls" class="toolbar-input" placeholder="Media URL" />
          <input v-model="incidentForm.status" class="toolbar-input" placeholder="Status" />
          <button class="primary-button" :disabled="saving || !selectedDeliveryId" type="submit">{{ saving ? 'Menyimpan...' : 'Record Incident' }}</button>
        </form>
      </article>
    </section>

    <section v-if="detail" class="grid gap-6 xl:grid-cols-3">
      <DataTableCard
        :items="detail.route_stops"
        :page-size="4"
        :search-text-resolver="stopSearchText"
        empty-message="Belum ada route stop."
        search-placeholder="Cari recipient, stop GPS, atau status..."
        title="Route Stops"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Stop</th><th>Status</th><th>Arrival</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryRouteStopRecord).id">
                <td>{{ (item as DeliveryRouteStopRecord).recipient_name || '-' }}</td>
                <td><StatusBadge :status="(item as DeliveryRouteStopRecord).status" /></td>
                <td>{{ (item as DeliveryRouteStopRecord).planned_arrival ? formatDateTime((item as DeliveryRouteStopRecord).planned_arrival as string) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="detail.proofs"
        :page-size="4"
        :search-text-resolver="proofSearchText"
        empty-message="Belum ada proof."
        search-placeholder="Cari receiver, condition, atau notes..."
        title="Proof Records"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Receiver</th><th>Portions</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryProofRecord).id">
                <td>{{ (item as DeliveryProofRecord).receiver_name }}</td>
                <td>{{ formatNumber((item as DeliveryProofRecord).received_portions) }}</td>
                <td>{{ (item as DeliveryProofRecord).condition_status }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="detail.incidents"
        :page-size="4"
        :search-text-resolver="incidentSearchText"
        empty-message="Belum ada incident."
        search-placeholder="Cari category, severity, atau title..."
        title="Incidents"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Incident</th><th>Severity</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as DeliveryIncidentRecord).id">
                <td>{{ (item as DeliveryIncidentRecord).title }}</td>
                <td>{{ (item as DeliveryIncidentRecord).severity }}</td>
                <td><StatusBadge :status="(item as DeliveryIncidentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

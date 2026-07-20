<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  addQualityInspectionLine,
  createQualityInspection,
  finalizeQualityInspection,
  getQualityInspectionById,
  getQualityInspections,
} from '@/services/quality'
import type {
  QualityInspectionDetailRecord,
  QualityInspectionLineRecord,
  QualityInspectionRecord,
} from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

const inspectionsState = useAsyncState(getQualityInspections)
const selectedInspectionId = ref('qc-1')
const detailState = useAsyncState<QualityInspectionDetailRecord>(() => getQualityInspectionById(selectedInspectionId.value))
const saving = ref(false)
const actionMessage = ref('')
const actionError = ref('')

const inspectionForm = reactive({
  tenant_id: 'tenant-1',
  sppg_id: 'sppg-jakarta-pusat-01',
  inspection_type: 'PRODUCTION',
  stage: 'PRODUCTION_OUTPUT',
  reference_type: 'PRODUCTION_ORDER',
  reference_id: 'prod-1',
  inspection_at: '2026-07-20T09:15',
  inspector_name: 'Petugas QC Baru',
  is_mandatory_for_release: true,
  notes: 'QC batch tambahan untuk menu siang.',
})

const lineForm = reactive({
  parameter_name: 'Suhu makanan',
  expected_value: '>=60C',
  actual_value: '63C',
  result_status: 'PASS',
  notes: 'Masih dalam batas aman.',
})

const inspections = computed(() => inspectionsState.data.value?.items || [])
const detail = computed(() => detailState.data.value || null)

const inspectionSearchText = (item: unknown) => {
  const row = item as QualityInspectionRecord
  return [
    row.inspection_number,
    row.inspection_type,
    row.stage,
    row.reference_type,
    row.reference_id,
    row.inspector_name,
    row.status,
    row.overall_result,
  ].filter(Boolean).join(' ')
}

const lineSearchText = (item: unknown) => {
  const row = item as QualityInspectionLineRecord
  return [row.parameter_name, row.expected_value, row.actual_value, row.result_status, row.notes].filter(Boolean).join(' ')
}

const reloadAll = async () => {
  await Promise.all([inspectionsState.execute(), detailState.execute()])
}

const selectInspection = async (inspectionId: string) => {
  selectedInspectionId.value = inspectionId
  actionMessage.value = ''
  actionError.value = ''
  await detailState.execute()
}

const submitInspection = async () => {
  saving.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    const result = await createQualityInspection({
      tenant_id: inspectionForm.tenant_id,
      sppg_id: inspectionForm.sppg_id,
      inspection_type: inspectionForm.inspection_type,
      stage: inspectionForm.stage,
      reference_type: inspectionForm.reference_type,
      reference_id: inspectionForm.reference_id,
      inspection_at: `${inspectionForm.inspection_at}:00Z`,
      inspector_name: inspectionForm.inspector_name,
      is_mandatory_for_release: inspectionForm.is_mandatory_for_release,
      notes: inspectionForm.notes,
    })
    await inspectionsState.execute()
    await selectInspection(result.id)
    actionMessage.value = `Inspection ${result.inspection_number} berhasil dibuat.`
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal membuat inspection.'
  } finally {
    saving.value = false
  }
}

const submitLine = async () => {
  saving.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    const result = await addQualityInspectionLine(selectedInspectionId.value, {
      parameter_name: lineForm.parameter_name,
      expected_value: lineForm.expected_value,
      actual_value: lineForm.actual_value,
      result_status: lineForm.result_status,
      notes: lineForm.notes,
    })
    await inspectionsState.execute()
    detailState.data.value = result
    actionMessage.value = 'Line QC berhasil ditambahkan.'
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal menambah line QC.'
  } finally {
    saving.value = false
  }
}

const handleFinalize = async () => {
  saving.value = true
  actionMessage.value = ''
  actionError.value = ''
  try {
    const result = await finalizeQualityInspection(selectedInspectionId.value)
    await inspectionsState.execute()
    detailState.data.value = result
    actionMessage.value = `Inspection selesai dengan hasil ${result.inspection.overall_result}.`
  } catch (error) {
    actionError.value = error instanceof Error ? error.message : 'Gagal finalisasi inspection.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Quality Inspection Workspace"
      subtitle="Kelola inspeksi QC untuk produksi, receiving, dan delivery pre-dispatch. Tambah parameter hasil inspeksi lalu finalize agar keputusan release operasional lebih terkontrol."
      :badges="['QC Inspection', 'Inspection Lines', 'Release Gate']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Total inspections</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ inspections.length }}</p>
        <p class="mt-2 text-sm text-app-body">Seluruh inspeksi QC yang tercatat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Draft inspections</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ inspections.filter((item) => item.status === 'DRAFT').length }}</p>
        <p class="mt-2 text-sm text-app-body">Masih menunggu line atau finalisasi.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Mandatory gate</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ inspections.filter((item) => item.is_mandatory_for_release).length }}</p>
        <p class="mt-2 text-sm text-app-body">Inspection yang memblokir release bila belum lolos.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Selected result</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ detail?.inspection.overall_result || 'PENDING' }}</p>
        <p class="mt-2 text-sm text-app-body">Hasil inspeksi yang sedang dipilih.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <DataTableCard
        :items="inspections"
        :search-text-resolver="inspectionSearchText"
        search-placeholder="Cari nomor QC, tipe, referensi, inspector..."
        title="Quality Inspections"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Inspection</th>
                <th>Type</th>
                <th>Reference</th>
                <th>Status</th>
                <th>Result</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as QualityInspectionRecord).id">
                <td>
                  <p>{{ (item as QualityInspectionRecord).inspection_number }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ formatDateTime((item as QualityInspectionRecord).inspection_at) }}</p>
                </td>
                <td>{{ (item as QualityInspectionRecord).inspection_type }} / {{ (item as QualityInspectionRecord).stage }}</td>
                <td>{{ (item as QualityInspectionRecord).reference_type }} / {{ (item as QualityInspectionRecord).reference_id }}</td>
                <td><StatusBadge :status="(item as QualityInspectionRecord).status" /></td>
                <td><StatusBadge :status="(item as QualityInspectionRecord).overall_result || 'PENDING'" /></td>
                <td><button class="secondary-button" type="button" @click="selectInspection((item as QualityInspectionRecord).id)">Detail</button></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Selected Inspection</p>
        <div v-if="detail" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Inspection Number</p>
            <p class="mt-2 font-display text-2xl text-app-heading">{{ detail.inspection.inspection_number }}</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.inspection.inspector_name }} | {{ detail.inspection.reference_type }} / {{ detail.inspection.reference_id }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Status</p>
              <div class="mt-2"><StatusBadge :status="detail.inspection.status" /></div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Overall Result</p>
              <div class="mt-2"><StatusBadge :status="detail.inspection.overall_result || 'PENDING'" /></div>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Mandatory Release Gate</p>
              <p class="mt-2 font-semibold text-app-heading">{{ detail.inspection.is_mandatory_for_release ? 'Ya' : 'Tidak' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Line Count</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.lines.length) }}</p>
            </div>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Notes</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.inspection.notes || 'Belum ada catatan.' }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <DataTableCard
        :items="detail?.lines || []"
        :search-text-resolver="lineSearchText"
        search-placeholder="Cari parameter, hasil aktual, result..."
        title="Inspection Lines"
      >
        <template #table="{ items }">
          <div v-if="actionMessage" class="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ actionMessage }}
          </div>
          <div v-if="actionError" class="mb-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {{ actionError }}
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Expected</th>
                <th>Actual</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as QualityInspectionLineRecord).id">
                <td>{{ (item as QualityInspectionLineRecord).parameter_name }}</td>
                <td>{{ (item as QualityInspectionLineRecord).expected_value || '-' }}</td>
                <td>{{ (item as QualityInspectionLineRecord).actual_value || '-' }}</td>
                <td><StatusBadge :status="(item as QualityInspectionLineRecord).result_status" /></td>
                <td>{{ (item as QualityInspectionLineRecord).notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Finalize Gate</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Aksi inspection</h2>
          </div>
          <span class="status-pill">POST /quality/inspections</span>
        </div>
        <div class="mt-6 grid gap-4">
          <button
            class="primary-button"
            :disabled="saving || !detail || detail.inspection.status === 'FINAL'"
            type="button"
            @click="handleFinalize"
          >
            {{ saving ? 'Memproses...' : 'Finalize Inspection' }}
          </button>
          <p class="text-sm text-app-body">
            Inspection yang final akan otomatis menjadi `PASSED` bila semua line `PASS`, atau `FAILED` bila ada satu saja `FAIL`.
          </p>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Inspection</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Buat QC inspection</h2>
          </div>
          <span class="status-pill">POST /quality/inspections/</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitInspection">
          <label class="form-field"><span>Inspection type</span><select v-model="inspectionForm.inspection_type" class="toolbar-input"><option value="PRODUCTION">PRODUCTION</option><option value="DELIVERY">DELIVERY</option><option value="INGREDIENT">INGREDIENT</option></select></label>
          <label class="form-field"><span>Stage</span><select v-model="inspectionForm.stage" class="toolbar-input"><option value="PRODUCTION_OUTPUT">PRODUCTION_OUTPUT</option><option value="PRE_DISPATCH">PRE_DISPATCH</option><option value="RECEIVING">RECEIVING</option></select></label>
          <label class="form-field"><span>Reference type</span><select v-model="inspectionForm.reference_type" class="toolbar-input"><option value="PRODUCTION_ORDER">PRODUCTION_ORDER</option><option value="DELIVERY_ORDER">DELIVERY_ORDER</option><option value="GOODS_RECEIPT">GOODS_RECEIPT</option></select></label>
          <label class="form-field"><span>Reference ID</span><input v-model="inspectionForm.reference_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Inspection at</span><input v-model="inspectionForm.inspection_at" class="toolbar-input" type="datetime-local" required /></label>
          <label class="form-field"><span>Inspector name</span><input v-model="inspectionForm.inspector_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="inspectionForm.notes" class="toolbar-input min-h-24" /></label>
          <label class="form-field">
            <span>Mandatory for release</span>
            <select v-model="inspectionForm.is_mandatory_for_release" class="toolbar-input">
              <option :value="true">Ya</option>
              <option :value="false">Tidak</option>
            </select>
          </label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Inspection' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Add Line</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah parameter QC</h2>
          </div>
          <span class="status-pill">POST /quality/inspections/{id}/lines</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitLine">
          <label class="form-field"><span>Parameter name</span><input v-model="lineForm.parameter_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Expected value</span><input v-model="lineForm.expected_value" class="toolbar-input" required /></label>
          <label class="form-field"><span>Actual value</span><input v-model="lineForm.actual_value" class="toolbar-input" required /></label>
          <label class="form-field">
            <span>Result status</span>
            <select v-model="lineForm.result_status" class="toolbar-input">
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
          </label>
          <label class="form-field"><span>Notes</span><textarea v-model="lineForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving || !detail || detail.inspection.status === 'FINAL'" type="submit">
              {{ saving ? 'Menyimpan...' : 'Tambah Line' }}
            </button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Inspection Rules</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Aturan release gate</h2>
          </div>
          <span class="status-pill">QC Governance</span>
        </div>
        <div class="mt-6 space-y-4 text-sm text-app-body">
          <p>Inspection wajib punya minimal satu line sebelum finalisasi.</p>
          <p>Bila ada satu line `FAIL`, hasil akhir inspeksi menjadi `FAILED`.</p>
          <p>Bila semua line `PASS`, hasil akhir inspeksi menjadi `PASSED`.</p>
          <p>Inspection dengan `mandatory release gate` akan menjadi checkpoint sebelum distribusi atau pelepasan dokumen operasional.</p>
        </div>
      </article>
    </section>
  </div>
</template>

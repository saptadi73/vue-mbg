<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import {
  createComplaint,
  createFeedbackSubmission,
  createServiceQualityScore,
  getComplaints,
  getFeedbackSubmissionById,
  getFeedbackSubmissions,
  getFeedbackSummary,
  getServiceQualityScores,
} from '@/services/feedback'
import type {
  ComplaintRecord,
  FeedbackDetailRecord,
  FeedbackItemRecord,
  FeedbackSubmissionRecord,
  ServiceQualityScoreRecord,
} from '@/types/domain'
import { formatDate, formatDateTime, formatNumber } from '@/utils/format'

const summaryState = useAsyncState(getFeedbackSummary)
const submissionsState = useAsyncState(getFeedbackSubmissions)
const complaintsState = useAsyncState(getComplaints)
const scoresState = useAsyncState(getServiceQualityScores)
const selectedSubmissionId = ref('feedback-1')
const detailState = useAsyncState<FeedbackDetailRecord>(() => getFeedbackSubmissionById(selectedSubmissionId.value))
const saving = ref(false)

const submissionForm = reactive({
  tenant_id: 'tenant-1',
  sppg_id: 'sppg-jakarta-pusat-01',
  school_id: 'school-1',
  meal_plan_id: 'mp-3',
  delivery_order_id: 'do-1',
  feedback_date: '2026-07-20',
  source_type: 'SCHOOL',
  respondent_name: 'Petugas Sekolah Baru',
  respondent_role: 'GURU_PIKET',
  overall_rating: 90,
  acceptance_rate: 93,
  food_waste_portions: 3,
  delivery_timeliness_rating: 92,
  temperature_rating: 88,
  comment_text: 'Distribusi lancar dan respons siswa baik.',
  status: 'SUBMITTED',
  item_type: 'TASTE',
  metric_name: 'taste_rating',
  item_score: 91,
  item_sentiment: 'POSITIVE',
  item_comment_text: 'Rasa dinilai enak oleh mayoritas siswa.',
})

const complaintForm = reactive({
  feedback_submission_id: 'feedback-2',
  tenant_id: 'tenant-1',
  sppg_id: 'sppg-tanah-abang-02',
  school_id: 'school-2',
  complaint_date: '2026-07-20T09:45',
  category: 'TEMPERATURE',
  severity: 'MEDIUM',
  complaint_text: 'Suhu makanan turun sebelum diterima siswa.',
  resolution_status: 'OPEN',
  resolved_at: '',
  notes: 'Tindak lanjut cek box termal dan jadwal loading.',
})

const qualityScoreForm = reactive({
  tenant_id: 'tenant-1',
  sppg_id: 'sppg-jakarta-pusat-01',
  score_date: '2026-07-20',
  acceptance_score: 93,
  waste_score: 89,
  delivery_score: 91,
  temperature_score: 87,
  taste_score: 90,
  nutrition_score: 92,
  complaint_score: 86,
  total_score: 89.71,
  score_status: 'CALCULATED',
  notes: 'SQI hasil rekap feedback harian.',
})

const summary = computed(() => summaryState.data.value)
const submissions = computed(() => submissionsState.data.value?.items || [])
const complaints = computed(() => complaintsState.data.value?.items || [])
const scores = computed(() => scoresState.data.value?.items || [])
const detail = computed(() => detailState.data.value || null)

const submissionSearchText = (item: unknown) => {
  const row = item as FeedbackSubmissionRecord
  return [row.school_name, row.respondent_name, row.respondent_role, row.status, row.comment_text].filter(Boolean).join(' ')
}

const complaintSearchText = (item: unknown) => {
  const row = item as ComplaintRecord
  return [row.school_name, row.category, row.severity, row.complaint_text, row.resolution_status].filter(Boolean).join(' ')
}

const scoreSearchText = (item: unknown) => {
  const row = item as ServiceQualityScoreRecord
  return [row.sppg_name, row.score_date, row.score_status, row.notes].filter(Boolean).join(' ')
}

const detailItemSearchText = (item: unknown) => {
  const row = item as FeedbackItemRecord
  return [row.item_type, row.metric_name, row.sentiment, row.comment_text].filter(Boolean).join(' ')
}

const selectSubmission = async (submissionId: string) => {
  selectedSubmissionId.value = submissionId
  await detailState.execute()
}

const reloadAll = async () => {
  await Promise.all([
    summaryState.execute(),
    submissionsState.execute(),
    complaintsState.execute(),
    scoresState.execute(),
  ])
}

const submitFeedback = async () => {
  saving.value = true
  try {
    const result = await createFeedbackSubmission({
      tenant_id: submissionForm.tenant_id,
      sppg_id: submissionForm.sppg_id,
      school_id: submissionForm.school_id,
      meal_plan_id: submissionForm.meal_plan_id,
      delivery_order_id: submissionForm.delivery_order_id,
      feedback_date: submissionForm.feedback_date,
      source_type: submissionForm.source_type,
      respondent_name: submissionForm.respondent_name,
      respondent_role: submissionForm.respondent_role,
      overall_rating: Number(submissionForm.overall_rating),
      acceptance_rate: Number(submissionForm.acceptance_rate),
      food_waste_portions: Number(submissionForm.food_waste_portions),
      delivery_timeliness_rating: Number(submissionForm.delivery_timeliness_rating),
      temperature_rating: Number(submissionForm.temperature_rating),
      comment_text: submissionForm.comment_text,
      status: submissionForm.status,
      items: [
        {
          item_type: submissionForm.item_type,
          metric_name: submissionForm.metric_name,
          score: Number(submissionForm.item_score),
          sentiment: submissionForm.item_sentiment,
          comment_text: submissionForm.item_comment_text,
        },
      ],
    })
    await reloadAll()
    await selectSubmission(result.submission.id)
  } finally {
    saving.value = false
  }
}

const submitComplaint = async () => {
  saving.value = true
  try {
    await createComplaint({
      feedback_submission_id: complaintForm.feedback_submission_id,
      tenant_id: complaintForm.tenant_id,
      sppg_id: complaintForm.sppg_id,
      school_id: complaintForm.school_id,
      complaint_date: `${complaintForm.complaint_date}:00Z`,
      category: complaintForm.category,
      severity: complaintForm.severity,
      complaint_text: complaintForm.complaint_text,
      resolution_status: complaintForm.resolution_status,
      resolved_at: complaintForm.resolved_at ? `${complaintForm.resolved_at}:00Z` : null,
      notes: complaintForm.notes,
    })
    await reloadAll()
    if (complaintForm.feedback_submission_id) {
      await selectSubmission(complaintForm.feedback_submission_id)
    }
  } finally {
    saving.value = false
  }
}

const submitQualityScore = async () => {
  saving.value = true
  try {
    await createServiceQualityScore({
      tenant_id: qualityScoreForm.tenant_id,
      sppg_id: qualityScoreForm.sppg_id,
      score_date: qualityScoreForm.score_date,
      acceptance_score: Number(qualityScoreForm.acceptance_score),
      waste_score: Number(qualityScoreForm.waste_score),
      delivery_score: Number(qualityScoreForm.delivery_score),
      temperature_score: Number(qualityScoreForm.temperature_score),
      taste_score: Number(qualityScoreForm.taste_score),
      nutrition_score: Number(qualityScoreForm.nutrition_score),
      complaint_score: Number(qualityScoreForm.complaint_score),
      total_score: Number(qualityScoreForm.total_score),
      score_status: qualityScoreForm.score_status,
      notes: qualityScoreForm.notes,
    })
    await reloadAll()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Feedback Workspace"
      subtitle="Pantau feedback sekolah, complaint operasional, dan service quality score dalam satu workspace mutu layanan yang terhubung langsung ke alur delivery."
      :badges="['Feedback', 'Complaints', 'Service Quality']"
    />

    <section class="grid gap-4 xl:grid-cols-5">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Feedback submissions</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ summary?.submission_count || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Jumlah feedback yang sudah masuk.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Open complaints</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ summary?.open_complaint_count || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Butuh tindakan korektif cepat.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">High severity</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ summary?.high_severity_complaint_count || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Keluhan prioritas untuk governance mutu.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Avg feedback</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(summary?.average_overall_rating || 0) }}</p>
        <p class="mt-2 text-sm text-app-body">Rata-rata overall rating penerima.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Avg SQI</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(summary?.average_service_quality_score || 0) }}</p>
        <p class="mt-2 text-sm text-app-body">Indeks mutu layanan agregat.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <DataTableCard
        :items="submissions"
        :search-text-resolver="submissionSearchText"
        search-placeholder="Cari sekolah, responden, status, komentar..."
        title="Feedback Submissions"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Tanggal</th>
                <th>Respondent</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FeedbackSubmissionRecord).id">
                <td>
                  <p>{{ (item as FeedbackSubmissionRecord).school_name || '-' }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as FeedbackSubmissionRecord).source_type }}</p>
                </td>
                <td>{{ formatDate((item as FeedbackSubmissionRecord).feedback_date) }}</td>
                <td>{{ (item as FeedbackSubmissionRecord).respondent_name }}</td>
                <td>{{ formatNumber((item as FeedbackSubmissionRecord).overall_rating) }}</td>
                <td><StatusBadge :status="(item as FeedbackSubmissionRecord).status" /></td>
                <td>
                  <button class="secondary-button" type="button" @click="selectSubmission((item as FeedbackSubmissionRecord).id)">
                    Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <article class="glass-panel p-6">
        <p class="eyebrow-text">Selected Feedback</p>
        <div v-if="detail" class="mt-5 grid gap-4">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Sekolah</p>
            <p class="mt-2 font-display text-2xl text-app-heading">{{ detail.submission.school_name || '-' }}</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.submission.respondent_name }} | {{ detail.submission.respondent_role || '-' }}</p>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Overall Rating</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.submission.overall_rating) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Acceptance Rate</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.submission.acceptance_rate || 0) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Food Waste</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.submission.food_waste_portions || 0) }} porsi</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Temperature</p>
              <p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.submission.temperature_rating || 0) }}</p>
            </div>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm text-app-muted">Komentar</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.submission.comment_text || 'Belum ada komentar.' }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="detail?.items || []"
        :search-text-resolver="detailItemSearchText"
        search-placeholder="Cari metric, sentiment, komentar..."
        title="Feedback Detail Items"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Metric</th>
                <th>Score</th>
                <th>Sentiment</th>
                <th>Komentar</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as FeedbackItemRecord).id">
                <td>{{ (item as FeedbackItemRecord).item_type }}</td>
                <td>{{ (item as FeedbackItemRecord).metric_name }}</td>
                <td>{{ formatNumber((item as FeedbackItemRecord).score) }}</td>
                <td><StatusBadge :status="(item as FeedbackItemRecord).sentiment || 'OPEN'" /></td>
                <td>{{ (item as FeedbackItemRecord).comment_text || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="detail?.complaints || []"
        :search-text-resolver="complaintSearchText"
        search-placeholder="Cari complaint, severity, status..."
        title="Complaints Terkait Feedback"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Severity</th>
                <th>Keluhan</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ComplaintRecord).id">
                <td>{{ (item as ComplaintRecord).category }}</td>
                <td><StatusBadge :status="(item as ComplaintRecord).severity" /></td>
                <td>{{ (item as ComplaintRecord).complaint_text }}</td>
                <td><StatusBadge :status="(item as ComplaintRecord).resolution_status" /></td>
                <td>{{ formatDateTime((item as ComplaintRecord).complaint_date) }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="complaints"
        :search-text-resolver="complaintSearchText"
        search-placeholder="Cari sekolah, kategori, severity..."
        title="Complaint Queue"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Kategori</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ComplaintRecord).id">
                <td>{{ (item as ComplaintRecord).school_name || '-' }}</td>
                <td>{{ (item as ComplaintRecord).category }}</td>
                <td><StatusBadge :status="(item as ComplaintRecord).severity" /></td>
                <td><StatusBadge :status="(item as ComplaintRecord).resolution_status" /></td>
                <td>{{ (item as ComplaintRecord).notes || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="scores"
        :search-text-resolver="scoreSearchText"
        search-placeholder="Cari SPPG, tanggal, status..."
        title="Service Quality Scores"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead>
              <tr>
                <th>SPPG</th>
                <th>Tanggal</th>
                <th>Total Score</th>
                <th>Complaint Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ServiceQualityScoreRecord).id">
                <td>{{ (item as ServiceQualityScoreRecord).sppg_name || (item as ServiceQualityScoreRecord).sppg_id || '-' }}</td>
                <td>{{ formatDate((item as ServiceQualityScoreRecord).score_date) }}</td>
                <td>{{ formatNumber((item as ServiceQualityScoreRecord).total_score) }}</td>
                <td>{{ formatNumber((item as ServiceQualityScoreRecord).complaint_score) }}</td>
                <td><StatusBadge :status="(item as ServiceQualityScoreRecord).score_status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-3">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input Feedback</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Buat feedback submission</h2>
          </div>
          <span class="status-pill">POST /feedback/submissions</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitFeedback">
          <label class="form-field"><span>Feedback date</span><input v-model="submissionForm.feedback_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>School ID</span><input v-model="submissionForm.school_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Respondent</span><input v-model="submissionForm.respondent_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Role</span><input v-model="submissionForm.respondent_role" class="toolbar-input" required /></label>
          <label class="form-field"><span>Overall rating</span><input v-model.number="submissionForm.overall_rating" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Acceptance rate</span><input v-model.number="submissionForm.acceptance_rate" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Food waste portions</span><input v-model.number="submissionForm.food_waste_portions" class="toolbar-input" min="0" type="number" required /></label>
          <label class="form-field"><span>Item metric</span><input v-model="submissionForm.metric_name" class="toolbar-input" required /></label>
          <label class="form-field"><span>Item score</span><input v-model.number="submissionForm.item_score" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Komentar</span><textarea v-model="submissionForm.comment_text" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Feedback' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input Complaint</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Catat complaint</h2>
          </div>
          <span class="status-pill">POST /feedback/complaints</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitComplaint">
          <label class="form-field"><span>Feedback submission ID</span><input v-model="complaintForm.feedback_submission_id" class="toolbar-input" required /></label>
          <label class="form-field"><span>Complaint date</span><input v-model="complaintForm.complaint_date" class="toolbar-input" type="datetime-local" required /></label>
          <label class="form-field">
            <span>Kategori</span>
            <select v-model="complaintForm.category" class="toolbar-input">
              <option value="TEMPERATURE">TEMPERATURE</option>
              <option value="DELIVERY_DELAY">DELIVERY_DELAY</option>
              <option value="PACKAGING">PACKAGING</option>
            </select>
          </label>
          <label class="form-field">
            <span>Severity</span>
            <select v-model="complaintForm.severity" class="toolbar-input">
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </label>
          <label class="form-field"><span>Keluhan</span><textarea v-model="complaintForm.complaint_text" class="toolbar-input min-h-24" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="complaintForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan Complaint' }}</button>
          </div>
        </form>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Input SQI</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Catat service quality score</h2>
          </div>
          <span class="status-pill">POST /feedback/service-quality-scores</span>
        </div>
        <form class="mt-6 grid gap-4" @submit.prevent="submitQualityScore">
          <label class="form-field"><span>Score date</span><input v-model="qualityScoreForm.score_date" class="toolbar-input" type="date" required /></label>
          <label class="form-field"><span>Acceptance</span><input v-model.number="qualityScoreForm.acceptance_score" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Waste</span><input v-model.number="qualityScoreForm.waste_score" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Delivery</span><input v-model.number="qualityScoreForm.delivery_score" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Temperature</span><input v-model.number="qualityScoreForm.temperature_score" class="toolbar-input" max="100" min="0" type="number" required /></label>
          <label class="form-field"><span>Total score</span><input v-model.number="qualityScoreForm.total_score" class="toolbar-input" max="100" min="0" step="0.01" type="number" required /></label>
          <label class="form-field"><span>Notes</span><textarea v-model="qualityScoreForm.notes" class="toolbar-input min-h-24" /></label>
          <div class="flex justify-end">
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Simpan SQI' }}</button>
          </div>
        </form>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { getSppgs } from '@/services/sppg'
import { getTenants } from '@/services/tenants'
import {
  assignSppgToProgram,
  assignTenantToProgram,
  createProgramPeriod,
  getProgramById,
} from '@/services/programs'
import type {
  ProgramPeriodRecord,
  ProgramSppgAssignmentRecord,
  ProgramTenantAssignmentRecord,
} from '@/types/domain'
import { formatDate, formatDateTime } from '@/utils/format'

type ProgramTab = 'overview' | 'periods' | 'tenants' | 'sppg'

const route = useRoute()
const programId = computed(() => String(route.params.programId || ''))
const loading = ref(true)
const error = ref('')
const fallback = ref(false)
const saving = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const activeTab = ref<ProgramTab>('overview')
const detail = ref<Awaited<ReturnType<typeof getProgramById>>['item'] | null>(null)

const tenantsState = ref<Awaited<ReturnType<typeof getTenants>> | null>(null)
const sppgState = ref<Awaited<ReturnType<typeof getSppgs>> | null>(null)

const periodForm = reactive({
  code: '',
  name: '',
  date_start: '2026-07-20',
  date_end: '2026-12-31',
  status: 'OPEN',
  notes: '',
})

const tenantForm = reactive({
  tenant_id: '',
  start_date: '2026-07-20',
  end_date: '2026-12-31',
  is_active: true,
  notes: '',
})

const sppgForm = reactive({
  tenant_id: '',
  sppg_id: '',
  start_date: '2026-07-20',
  end_date: '2026-12-31',
  is_active: true,
  notes: '',
})

const loadDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const [detailResponse, tenantsResponse, sppgResponse] = await Promise.all([
      getProgramById(programId.value),
      getTenants(),
      getSppgs(),
    ])

    detail.value = detailResponse.item
    fallback.value = detailResponse.fallback
    tenantsState.value = tenantsResponse
    sppgState.value = sppgResponse

    if (!tenantForm.tenant_id && tenantsResponse.items[0]) {
      tenantForm.tenant_id = tenantsResponse.items[0].id
    }
    if (!sppgForm.tenant_id && tenantsResponse.items[0]) {
      sppgForm.tenant_id = tenantsResponse.items[0].id
    }
    if (!sppgForm.sppg_id && sppgResponse.items[0]) {
      sppgForm.sppg_id = sppgResponse.items[0].id
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat detail program.'
  } finally {
    loading.value = false
  }
}

void loadDetail()

const filteredSppgOptions = computed(() =>
  (sppgState.value?.items || []).filter((item) => !sppgForm.tenant_id || item.tenant_id === sppgForm.tenant_id),
)

const showMessage = (text: string, tone: 'success' | 'error') => {
  message.value = text
  messageTone.value = tone
}

const periodSearchText = (item: unknown) => {
  const row = item as ProgramPeriodRecord
  return [row.code, row.name, row.status, row.notes].filter(Boolean).join(' ')
}

const tenantSearchText = (item: unknown) => {
  const row = item as ProgramTenantAssignmentRecord
  return [row.tenant_name, row.notes, row.start_date, row.end_date].filter(Boolean).join(' ')
}

const sppgSearchText = (item: unknown) => {
  const row = item as ProgramSppgAssignmentRecord
  return [row.tenant_name, row.sppg_name, row.notes, row.start_date, row.end_date].filter(Boolean).join(' ')
}

const handleCreatePeriod = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await createProgramPeriod(detail.value.program.id, { ...periodForm })
    detail.value = {
      ...detail.value,
      periods: [response.item, ...detail.value.periods],
    }
    showMessage(
      response.fallback
        ? 'Periode program ditambahkan sebagai fallback mock karena backend belum merespons endpoint period.'
        : 'Periode program berhasil ditambahkan.',
      'success',
    )
    periodForm.code = ''
    periodForm.name = ''
    periodForm.notes = ''
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Gagal menambah periode program.', 'error')
  } finally {
    saving.value = false
  }
}

const handleAssignTenant = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await assignTenantToProgram(detail.value.program.id, { ...tenantForm })
    detail.value = {
      ...detail.value,
      tenant_assignments: [response.item, ...detail.value.tenant_assignments],
    }
    showMessage(
      response.fallback
        ? 'Tenant assignment disimpan sebagai fallback mock karena backend assignment tenant belum merespons.'
        : 'Tenant berhasil diassign ke program.',
      'success',
    )
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Gagal assign tenant ke program.', 'error')
  } finally {
    saving.value = false
  }
}

const handleAssignSppg = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await assignSppgToProgram(detail.value.program.id, { ...sppgForm })
    detail.value = {
      ...detail.value,
      sppg_assignments: [response.item, ...detail.value.sppg_assignments],
    }
    showMessage(
      response.fallback
        ? 'SPPG assignment disimpan sebagai fallback mock karena backend assignment SPPG belum merespons.'
        : 'SPPG berhasil diassign ke program.',
      'success',
    )
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Gagal assign SPPG ke program.', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="loading-panel">Memuat detail program...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="loadDetail">Muat ulang</button>
    </div>
    <template v-else-if="detail">
      <PageHeader
        :title="detail.program.name"
        subtitle="Detail program memusatkan period, assignment tenant, dan assignment SPPG agar pengelolaan program tetap rapi dalam satu flow."
        :badges="['Program Detail', detail.program.code, detail.program.program_type]"
      />

      <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">{{ detail.program.code }}</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ detail.program.name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ detail.program.description || '-' }}</p>
            </div>
            <StatusBadge :status="detail.program.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Program Type</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.program.program_type }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Funding</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.program.funding_source_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Tenant Assigned</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.tenant_assignments.length }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">SPPG Assigned</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.sppg_assignments.length }}</p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-2">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Periode Program</p>
              <p class="mt-2 text-sm font-medium text-app-heading">
                {{ formatDate(detail.program.start_date) }} - {{ formatDate(detail.program.end_date) }}
              </p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Updated At</p>
              <p class="mt-2 text-sm font-medium text-app-heading">
                {{ detail.program.updated_at ? formatDateTime(detail.program.updated_at) : '-' }}
              </p>
            </div>
          </div>

          <p v-if="fallback" class="mt-4 text-sm text-app-muted">
            Detail program ini sedang memakai fallback mock agar flow program tetap bisa ditinjau saat backend belum lengkap.
          </p>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Quick Actions</p>
          <div class="mt-4 grid gap-3">
            <button class="secondary-button" type="button" @click="activeTab = 'periods'">Tambah Period</button>
            <button class="secondary-button" type="button" @click="activeTab = 'tenants'">Assign Tenant</button>
            <button class="secondary-button" type="button" @click="activeTab = 'sppg'">Assign SPPG</button>
            <RouterLink class="secondary-button" to="/programs">Kembali ke Programs</RouterLink>
          </div>
          <p class="mt-4 text-sm text-app-body">
            Urutan kerja paling aman adalah buat program, tambah period, assign tenant, lalu assign SPPG sesuai dokumentasi backend.
          </p>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'overview' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'overview'"
          >
            Overview
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'periods' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'periods'"
          >
            Periods
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'tenants' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'tenants'"
          >
            Tenant Assignments
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'sppg' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'sppg'"
          >
            SPPG Assignments
          </button>
        </div>
      </section>

      <article v-if="activeTab === 'overview'" class="glass-panel p-6">
        <p class="eyebrow-text">Operational Guidance</p>
        <div class="mt-5 grid gap-4 md:grid-cols-3">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">1. Validasi tanggal program</p>
            <p class="mt-2 text-sm text-app-body">Pastikan semua periode yang dibuat berada di dalam rentang tanggal program.</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">2. Assign tenant dulu</p>
            <p class="mt-2 text-sm text-app-body">Backend mensyaratkan tenant sudah terhubung sebelum SPPG diassign ke program.</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">3. Review cakupan SPPG</p>
            <p class="mt-2 text-sm text-app-body">Gunakan assignment SPPG untuk memastikan program benar-benar berjalan di dapur yang tepat.</p>
          </div>
        </div>
      </article>

      <section v-else-if="activeTab === 'periods'" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.periods"
          :search-text-resolver="periodSearchText"
          search-placeholder="Cari kode, nama period, status, atau catatan..."
          title="Program Periods"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Tanggal Mulai</th>
                  <th>Tanggal Selesai</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="period in items" :key="(period as ProgramPeriodRecord).id">
                  <td>
                    {{ (period as ProgramPeriodRecord).name }}
                    <div class="text-xs text-app-muted">{{ (period as ProgramPeriodRecord).code }}</div>
                  </td>
                  <td>{{ formatDate((period as ProgramPeriodRecord).date_start) }}</td>
                  <td>{{ formatDate((period as ProgramPeriodRecord).date_end) }}</td>
                  <td><StatusBadge :status="(period as ProgramPeriodRecord).status" /></td>
                  <td>{{ (period as ProgramPeriodRecord).notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Add Period</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreatePeriod">
            <input v-model="periodForm.code" class="toolbar-input" placeholder="2026-H2" required />
            <input v-model="periodForm.name" class="toolbar-input" placeholder="Semester 2 2026" required />
            <div class="grid gap-4 md:grid-cols-2">
              <input v-model="periodForm.date_start" class="toolbar-input" type="date" required />
              <input v-model="periodForm.date_end" class="toolbar-input" type="date" required />
            </div>
            <select v-model="periodForm.status" class="toolbar-input" required>
              <option value="OPEN">OPEN</option>
              <option value="PLANNED">PLANNED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <textarea v-model="periodForm.notes" class="toolbar-input min-h-24" placeholder="Catatan period operasional." />
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Tambah Period' }}
            </button>
          </form>
        </article>
      </section>

      <section v-else-if="activeTab === 'tenants'" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.tenant_assignments"
          :search-text-resolver="tenantSearchText"
          search-placeholder="Cari tenant, tanggal, atau catatan assignment..."
          title="Tenant Assignments"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Status</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in items" :key="(assignment as ProgramTenantAssignmentRecord).id">
                  <td>{{ (assignment as ProgramTenantAssignmentRecord).tenant_name || '-' }}</td>
                  <td>{{ formatDate((assignment as ProgramTenantAssignmentRecord).start_date) }}</td>
                  <td>
                    {{
                      (assignment as ProgramTenantAssignmentRecord).end_date
                        ? formatDate((assignment as ProgramTenantAssignmentRecord).end_date!)
                        : '-'
                    }}
                  </td>
                  <td>
                    <StatusBadge :status="(assignment as ProgramTenantAssignmentRecord).is_active ? 'APPROVED' : 'REJECTED'" />
                  </td>
                  <td>{{ (assignment as ProgramTenantAssignmentRecord).notes || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Assign Tenant</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleAssignTenant">
            <select v-model="tenantForm.tenant_id" class="toolbar-input" required>
              <option value="" disabled>Pilih tenant</option>
              <option v-for="tenant in tenantsState?.items || []" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
            <div class="grid gap-4 md:grid-cols-2">
              <input v-model="tenantForm.start_date" class="toolbar-input" type="date" required />
              <input v-model="tenantForm.end_date" class="toolbar-input" type="date" required />
            </div>
            <label class="surface-subtle inline-flex items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="tenantForm.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan assignment tenant</span>
            </label>
            <textarea v-model="tenantForm.notes" class="toolbar-input min-h-24" placeholder="Catatan assignment tenant." />
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Assign Tenant' }}
            </button>
          </form>
        </article>
      </section>

      <section v-else class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.sppg_assignments"
          :search-text-resolver="sppgSearchText"
          search-placeholder="Cari tenant, SPPG, tanggal, atau catatan assignment..."
          title="SPPG Assignments"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>SPPG</th>
                  <th>Mulai</th>
                  <th>Selesai</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in items" :key="(assignment as ProgramSppgAssignmentRecord).id">
                  <td>{{ (assignment as ProgramSppgAssignmentRecord).tenant_name || '-' }}</td>
                  <td>{{ (assignment as ProgramSppgAssignmentRecord).sppg_name || '-' }}</td>
                  <td>{{ formatDate((assignment as ProgramSppgAssignmentRecord).start_date) }}</td>
                  <td>
                    {{
                      (assignment as ProgramSppgAssignmentRecord).end_date
                        ? formatDate((assignment as ProgramSppgAssignmentRecord).end_date!)
                        : '-'
                    }}
                  </td>
                  <td>
                    <StatusBadge :status="(assignment as ProgramSppgAssignmentRecord).is_active ? 'APPROVED' : 'REJECTED'" />
                  </td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Assign SPPG</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleAssignSppg">
            <select v-model="sppgForm.tenant_id" class="toolbar-input" required>
              <option value="" disabled>Pilih tenant pemilik SPPG</option>
              <option v-for="tenant in tenantsState?.items || []" :key="tenant.id" :value="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
            <select v-model="sppgForm.sppg_id" class="toolbar-input" required>
              <option value="" disabled>Pilih SPPG</option>
              <option v-for="sppg in filteredSppgOptions" :key="sppg.id" :value="sppg.id">
                {{ sppg.name }}
              </option>
            </select>
            <div class="grid gap-4 md:grid-cols-2">
              <input v-model="sppgForm.start_date" class="toolbar-input" type="date" required />
              <input v-model="sppgForm.end_date" class="toolbar-input" type="date" required />
            </div>
            <label class="surface-subtle inline-flex items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="sppgForm.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan assignment SPPG</span>
            </label>
            <textarea v-model="sppgForm.notes" class="toolbar-input min-h-24" placeholder="Catatan assignment SPPG." />
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Assign SPPG' }}
            </button>
          </form>
        </article>
      </section>

      <p
        v-if="message"
        class="rounded-2xl px-4 py-3 text-sm"
        :class="messageTone === 'success' ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700' : 'border border-rose-500/20 bg-rose-500/10 text-rose-700'"
      >
        {{ message }}
      </p>
    </template>
  </div>
</template>

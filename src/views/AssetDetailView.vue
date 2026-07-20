<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { createAssetAssignment, createAssetDepreciation, getAssetById } from '@/services/assets'
import { getAccounts } from '@/services/erp-ops'
import { getSppgs } from '@/services/sppg'
import type { AssetAssignmentRecord, AssetDepreciationRecord } from '@/types/domain'
import { formatCurrency, formatDate } from '@/utils/format'

type AssetTab = 'overview' | 'assignments' | 'depreciations'

const route = useRoute()
const assetId = computed(() => String(route.params.assetId || ''))
const loading = ref(true)
const error = ref('')
const fallback = ref(false)
const saving = ref(false)
const message = ref('')
const messageTone = ref<'success' | 'error'>('success')
const activeTab = ref<AssetTab>('overview')
const detail = ref<Awaited<ReturnType<typeof getAssetById>>['item'] | null>(null)
const sppgState = ref<Awaited<ReturnType<typeof getSppgs>> | null>(null)
const accountsState = ref<Awaited<ReturnType<typeof getAccounts>> | null>(null)

const assignmentForm = reactive({
  sppg_id: 'sppg-jakarta-pusat-01',
  assigned_to_name: 'Koordinator Produksi',
  assignment_date: '2026-07-20',
  end_date: '',
  assignment_role: 'OPERATIONAL',
  status: 'ASSIGNED',
  is_active: true,
  notes: 'Rotasi untuk kebutuhan operasional baru.',
})

const depreciationForm = reactive({
  depreciation_date: '2026-07-31',
  depreciation_amount: '',
  debit_account_code: '520100',
  credit_account_code: '170100',
  status: 'POSTED',
  notes: 'Depresiasi bulan berjalan.',
})

const loadDetail = async () => {
  loading.value = true
  error.value = ''

  try {
    const [detailResponse, sppgResponse, accountsResponse] = await Promise.all([
      getAssetById(assetId.value),
      getSppgs(),
      getAccounts(),
    ])
    const currentDetail = detailResponse.item

    if (!currentDetail) {
      throw new Error('Detail asset tidak ditemukan.')
    }

    detail.value = currentDetail
    fallback.value = detailResponse.fallback
    sppgState.value = sppgResponse
    accountsState.value = accountsResponse

    if (currentDetail.asset.sppg_id) {
      assignmentForm.sppg_id = currentDetail.asset.sppg_id
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat detail asset.'
  } finally {
    loading.value = false
  }
}

void loadDetail()

const accountOptions = computed(() => (accountsState.value?.items || []).filter((item) => item.allow_posting))

const assignmentSearchText = (item: unknown) => {
  const row = item as AssetAssignmentRecord
  return [row.sppg_name, row.assigned_to_name, row.assignment_role, row.status, row.notes].filter(Boolean).join(' ')
}

const depreciationSearchText = (item: unknown) => {
  const row = item as AssetDepreciationRecord
  return [row.asset_name, row.debit_account_code, row.credit_account_code, row.status, row.notes].filter(Boolean).join(' ')
}

const showMessage = (text: string, tone: 'success' | 'error') => {
  message.value = text
  messageTone.value = tone
}

const handleCreateAssignment = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await createAssetAssignment(detail.value.asset.id, {
      sppg_id: assignmentForm.sppg_id,
      assigned_to_name: assignmentForm.assigned_to_name,
      assignment_date: assignmentForm.assignment_date,
      end_date: assignmentForm.end_date || undefined,
      assignment_role: assignmentForm.assignment_role,
      status: assignmentForm.status,
      is_active: assignmentForm.is_active,
      notes: assignmentForm.notes || undefined,
    })

    detail.value = {
      ...detail.value,
      assignments: [response.item, ...detail.value.assignments],
    }

    showMessage(
      response.fallback
        ? 'Assignment asset disimpan sebagai fallback mock karena backend assignment asset belum merespons.'
        : 'Assignment asset berhasil dikirim ke backend.',
      'success',
    )
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Gagal membuat assignment asset.', 'error')
  } finally {
    saving.value = false
  }
}

const handleCreateDepreciation = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await createAssetDepreciation(detail.value.asset.id, {
      depreciation_date: depreciationForm.depreciation_date,
      depreciation_amount: depreciationForm.depreciation_amount ? Number(depreciationForm.depreciation_amount) : undefined,
      debit_account_code: depreciationForm.debit_account_code,
      credit_account_code: depreciationForm.credit_account_code,
      status: depreciationForm.status,
      notes: depreciationForm.notes || undefined,
    })

    detail.value = {
      ...detail.value,
      depreciations: [response.item, ...detail.value.depreciations],
    }

    showMessage(
      response.fallback
        ? 'Depresiasi asset disimpan sebagai fallback mock karena backend depreciation asset belum merespons.'
        : 'Depresiasi asset berhasil dikirim ke backend.',
      'success',
    )
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Gagal mencatat depresiasi asset.', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="loading-panel">Memuat detail asset...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="loadDetail">Muat ulang</button>
    </div>
    <template v-else-if="detail">
      <PageHeader
        :title="detail.asset.asset_name"
        subtitle="Detail asset menyatukan register, assignment, dan depresiasi agar lifecycle asset operasional serta finance bisa dilihat dalam satu tempat."
        :badges="['Asset Detail', detail.asset.asset_code, detail.asset.asset_category_name || 'Asset']"
      />

      <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">{{ detail.asset.asset_code }}</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ detail.asset.asset_name }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ detail.asset.notes || '-' }}</p>
            </div>
            <StatusBadge :status="detail.asset.status" />
          </div>

          <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Kategori</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.asset.asset_category_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">SPPG</p>
              <p class="mt-2 text-lg text-app-heading">{{ detail.asset.sppg_name || '-' }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Acquisition Cost</p>
              <p class="mt-2 text-lg text-app-heading">{{ formatCurrency(detail.asset.acquisition_cost) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="eyebrow-text">Residual Value</p>
              <p class="mt-2 text-lg text-app-heading">{{ formatCurrency(detail.asset.residual_value) }}</p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Acquisition Date</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ formatDate(detail.asset.acquisition_date) }}</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Useful Life</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ detail.asset.useful_life_months }} bulan</p>
            </div>
            <div class="surface-subtle rounded-3xl p-4">
              <p class="text-sm text-app-muted">Condition</p>
              <p class="mt-2 text-sm font-medium text-app-heading">{{ detail.asset.condition_status }}</p>
            </div>
          </div>

          <p v-if="fallback" class="mt-4 text-sm text-app-muted">
            Detail asset ini sedang memakai fallback mock agar flow asset tetap bisa direview saat backend belum lengkap.
          </p>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Quick Actions</p>
          <div class="mt-4 grid gap-3">
            <button class="secondary-button" type="button" @click="activeTab = 'assignments'">Tambah Assignment</button>
            <button class="secondary-button" type="button" @click="activeTab = 'depreciations'">Catat Depresiasi</button>
            <RouterLink class="secondary-button" to="/assets">Kembali ke Register</RouterLink>
          </div>
          <p class="mt-4 text-sm text-app-body">
            Aset bisa dipindahkan ke SPPG atau PIC baru lewat assignment, lalu depresiasi dicatat berkala untuk sinkron dengan jurnal.
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
            :class="activeTab === 'assignments' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'assignments'"
          >
            Assignments
          </button>
          <button
            class="rounded-full border px-4 py-2 text-sm transition"
            :class="activeTab === 'depreciations' ? 'border-[var(--color-brand-400)] bg-[var(--color-brand-400)]/15 text-app-heading' : 'border-[var(--app-panel-border)] text-app-body'"
            type="button"
            @click="activeTab = 'depreciations'"
          >
            Depreciations
          </button>
        </div>
      </section>

      <article v-if="activeTab === 'overview'" class="glass-panel p-6">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">Serial Number</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.asset.serial_number || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">Location</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.asset.location_name || '-' }}</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-sm font-semibold text-app-heading">Method</p>
            <p class="mt-2 text-sm text-app-body">{{ detail.asset.depreciation_method }}</p>
          </div>
        </div>
      </article>

      <section v-else-if="activeTab === 'assignments'" class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.assignments"
          :search-text-resolver="assignmentSearchText"
          search-placeholder="Cari SPPG, PIC, role, status, atau catatan..."
          title="Assignment History"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>SPPG</th>
                  <th>Assigned To</th>
                  <th>Date</th>
                  <th>End</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="assignment in items" :key="(assignment as AssetAssignmentRecord).id">
                  <td>{{ (assignment as AssetAssignmentRecord).sppg_name || '-' }}</td>
                  <td>{{ (assignment as AssetAssignmentRecord).assigned_to_name || '-' }}</td>
                  <td>{{ formatDate((assignment as AssetAssignmentRecord).assignment_date) }}</td>
                  <td>
                    {{
                      (assignment as AssetAssignmentRecord).end_date
                        ? formatDate((assignment as AssetAssignmentRecord).end_date!)
                        : '-'
                    }}
                  </td>
                  <td>{{ (assignment as AssetAssignmentRecord).assignment_role }}</td>
                  <td><StatusBadge :status="(assignment as AssetAssignmentRecord).status" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Assign Asset</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateAssignment">
            <select v-model="assignmentForm.sppg_id" class="toolbar-input" required>
              <option v-for="sppg in sppgState?.items || []" :key="sppg.id" :value="sppg.id">
                {{ sppg.name }}
              </option>
            </select>
            <input v-model="assignmentForm.assigned_to_name" class="toolbar-input" placeholder="Assigned to" required />
            <div class="grid gap-4 md:grid-cols-2">
              <input v-model="assignmentForm.assignment_date" class="toolbar-input" type="date" required />
              <input v-model="assignmentForm.end_date" class="toolbar-input" type="date" />
            </div>
            <input v-model="assignmentForm.assignment_role" class="toolbar-input" placeholder="Assignment role" required />
            <select v-model="assignmentForm.status" class="toolbar-input" required>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="RETURNED">RETURNED</option>
              <option value="TRANSFERRED">TRANSFERRED</option>
            </select>
            <label class="surface-subtle inline-flex items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="assignmentForm.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan assignment</span>
            </label>
            <textarea v-model="assignmentForm.notes" class="toolbar-input min-h-24" placeholder="Catatan assignment asset." />
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Simpan Assignment' }}
            </button>
          </form>
        </article>
      </section>

      <section v-else class="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DataTableCard
          :items="detail.depreciations"
          :search-text-resolver="depreciationSearchText"
          search-placeholder="Cari asset, debit, credit, status, atau catatan..."
          title="Depreciation History"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Debit</th>
                  <th>Credit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="depreciation in items" :key="(depreciation as AssetDepreciationRecord).id">
                  <td>{{ formatDate((depreciation as AssetDepreciationRecord).depreciation_date) }}</td>
                  <td>{{ formatCurrency((depreciation as AssetDepreciationRecord).depreciation_amount) }}</td>
                  <td>{{ (depreciation as AssetDepreciationRecord).debit_account_code }}</td>
                  <td>{{ (depreciation as AssetDepreciationRecord).credit_account_code }}</td>
                  <td><StatusBadge :status="(depreciation as AssetDepreciationRecord).status" /></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Record Depreciation</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateDepreciation">
            <input v-model="depreciationForm.depreciation_date" class="toolbar-input" type="date" required />
            <input v-model="depreciationForm.depreciation_amount" class="toolbar-input" min="0" placeholder="Kosongkan untuk auto-calc" type="number" />
            <select v-model="depreciationForm.debit_account_code" class="toolbar-input" required>
              <option v-for="account in accountOptions" :key="account.id" :value="account.code">
                {{ account.code }} - {{ account.name }}
              </option>
            </select>
            <select v-model="depreciationForm.credit_account_code" class="toolbar-input" required>
              <option v-for="account in accountOptions" :key="account.id" :value="account.code">
                {{ account.code }} - {{ account.name }}
              </option>
            </select>
            <select v-model="depreciationForm.status" class="toolbar-input" required>
              <option value="POSTED">POSTED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
            <textarea v-model="depreciationForm.notes" class="toolbar-input min-h-24" placeholder="Catatan depresiasi asset." />
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Catat Depresiasi' }}
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

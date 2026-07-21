<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { env } from '@/config/env'
import { useAsyncState } from '@/composables/useAsyncState'
import { useRoute, useRouter } from 'vue-router'
import { createAsset, getAssetAssignments, getAssetCategories, getAssetDepreciations, getAssets } from '@/services/assets'
import { getSppgs } from '@/services/sppg'
import type { AssetAssignmentRecord, AssetDepreciationRecord, AssetRecord } from '@/types/domain'
import { formatCurrency, formatDate, formatNumber } from '@/utils/format'

const categoriesState = useAsyncState(getAssetCategories)
const assetsState = useAsyncState(getAssets)
const assignmentsState = useAsyncState(getAssetAssignments)
const depreciationsState = useAsyncState(getAssetDepreciations)
const sppgState = useAsyncState(getSppgs)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const route = useRoute()
const router = useRouter()

const resolveAssetTab = (tab: unknown): 'assignments' | 'depreciations' => {
  const value = Array.isArray(tab) ? tab[0] : tab
  return value === 'depreciations' ? 'depreciations' : 'assignments'
}

const activeTab = ref<'assignments' | 'depreciations'>(resolveAssetTab(route.query.tab))

watch(
  () => route.query.tab,
  (tab) => {
    const nextTab = resolveAssetTab(tab)
    if (nextTab !== activeTab.value) {
      activeTab.value = nextTab
    }
  },
)

watch(activeTab, (tab) => {
  if (route.query.tab === tab) return
  void router.replace({
    query: {
      ...route.query,
      tab,
    },
  })
})

const form = reactive({
  sppg_id: 'sppg-jakarta-pusat-01',
  asset_category_id: 'asset-cat-1',
  asset_code: 'AST-NEW-001',
  asset_name: 'Blast Chiller',
  acquisition_date: '2026-07-20',
  acquisition_cost: 36000000,
  residual_value: 3000000,
  useful_life_months: 60,
  depreciation_method: 'STRAIGHT_LINE',
  status: 'ACTIVE',
  serial_number: 'BC-2026-001',
  condition_status: 'GOOD',
  location_name: 'Cold Kitchen',
  is_active: true,
  notes: 'Asset tambahan untuk kontrol suhu pasca produksi.',
})

const assetCount = computed(() => assetsState.data.value?.total || 0)
const activeAssets = computed(() => (assetsState.data.value?.items || []).filter((item) => item.is_active).length)
const totalAcquisitionCost = computed(() =>
  (assetsState.data.value?.items || []).reduce((sum, item) => sum + item.acquisition_cost, 0),
)

const handleCreateAsset = async () => {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createAsset({
      tenant_id: env.devTenantId,
      sppg_id: form.sppg_id,
      asset_category_id: form.asset_category_id,
      asset_code: form.asset_code,
      asset_name: form.asset_name,
      acquisition_date: form.acquisition_date,
      acquisition_cost: Number(form.acquisition_cost),
      residual_value: Number(form.residual_value),
      useful_life_months: Number(form.useful_life_months),
      depreciation_method: form.depreciation_method,
      status: form.status,
      serial_number: form.serial_number,
      condition_status: form.condition_status,
      location_name: form.location_name,
      is_active: form.is_active,
      notes: form.notes,
    })

    if (assetsState.data.value) {
      assetsState.data.value = {
        ...assetsState.data.value,
        items: [response.item, ...assetsState.data.value.items],
        total: assetsState.data.value.total + 1,
      }
    }

    successMessage.value = response.fallback
      ? `Asset ${response.item.asset_name} tersimpan sebagai fallback mock karena backend asset register belum merespons.`
      : `Asset ${response.item.asset_name} berhasil dibuat di backend.`
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pendaftaran asset gagal. Periksa payload atau koneksi backend.'
  } finally {
    saving.value = false
  }
}

const assetSearchText = (item: unknown) => {
  const row = item as AssetRecord
  return [
    row.asset_code,
    row.asset_name,
    row.asset_category_name,
    row.sppg_name,
    row.location_name,
    row.status,
    row.condition_status,
  ]
    .filter(Boolean)
    .join(' ')
}

const assignmentSearchText = (item: unknown) => {
  const row = item as AssetAssignmentRecord
  return [row.asset_code, row.asset_name, row.sppg_name, row.assigned_to_name, row.assignment_role, row.status]
    .filter(Boolean)
    .join(' ')
}

const depreciationSearchText = (item: unknown) => {
  const row = item as AssetDepreciationRecord
  return [row.asset_code, row.asset_name, row.debit_account_code, row.credit_account_code, row.status]
    .filter(Boolean)
    .join(' ')
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Asset Register"
      subtitle="Register asset menampilkan kategori, nilai akuisisi, kondisi, assignment, dan histori depresiasi supaya kontrol asset operasional dan finance tetap sinkron."
      :badges="['Asset Module', 'Register', 'Assignment & Depreciation']"
    />

    <section class="asset-kpi-grid">
      <article class="asset-kpi-card asset-kpi-highlight">
        <p class="text-sm text-app-muted">Total assets</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(assetCount) }}</p>
        <p class="mt-2 text-sm text-app-body">Jumlah asset yang sudah masuk ke register yayasan.</p>
      </article>
      <article class="asset-kpi-card">
        <p class="text-sm text-app-muted">Active assets</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatNumber(activeAssets) }}</p>
        <p class="mt-2 text-sm text-app-body">Asset aktif yang masih dipakai di operasi dapur dan distribusi.</p>
      </article>
      <article class="asset-kpi-card">
        <p class="text-sm text-app-muted">Acquisition value</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ formatCurrency(totalAcquisitionCost) }}</p>
        <p class="mt-2 text-sm text-app-body">Nilai akuisisi total untuk register asset saat ini.</p>
      </article>
    </section>

    <section>
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Asset</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Daftarkan asset baru</h2>
          </div>
          <span class="status-pill">POST /assets</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="handleCreateAsset">
          <div class="grid gap-4 md:grid-cols-2">
            <label class="form-field">
              <span>SPPG</span>
              <select v-model="form.sppg_id" class="toolbar-input" required>
                <option v-for="sppg in sppgState.data.value?.items || []" :key="sppg.id" :value="sppg.id">
                  {{ sppg.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Asset Category</span>
              <select v-model="form.asset_category_id" class="toolbar-input" required>
                <option v-for="category in categoriesState.data.value?.items || []" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </label>
            <label class="form-field">
              <span>Asset Code</span>
              <input v-model="form.asset_code" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Asset Name</span>
              <input v-model="form.asset_name" class="toolbar-input" required />
            </label>
            <label class="form-field">
              <span>Acquisition Date</span>
              <input v-model="form.acquisition_date" class="toolbar-input" type="date" required />
            </label>
            <label class="form-field">
              <span>Acquisition Cost</span>
              <input v-model.number="form.acquisition_cost" class="toolbar-input" min="0" type="number" required />
            </label>
            <label class="form-field">
              <span>Residual Value</span>
              <input v-model.number="form.residual_value" class="toolbar-input" min="0" type="number" required />
            </label>
            <label class="form-field">
              <span>Useful Life (Months)</span>
              <input v-model.number="form.useful_life_months" class="toolbar-input" min="1" type="number" required />
            </label>
            <label class="form-field">
              <span>Condition</span>
              <select v-model="form.condition_status" class="toolbar-input" required>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
              </select>
            </label>
            <label class="form-field">
              <span>Status</span>
              <select v-model="form.status" class="toolbar-input" required>
                <option value="ACTIVE">ACTIVE</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="RETIRED">RETIRED</option>
              </select>
            </label>
            <label class="form-field">
              <span>Serial Number</span>
              <input v-model="form.serial_number" class="toolbar-input" />
            </label>
            <label class="form-field">
              <span>Location</span>
              <input v-model="form.location_name" class="toolbar-input" />
            </label>
          </div>
          <label class="form-field">
            <span>Notes</span>
            <textarea v-model="form.notes" class="toolbar-input min-h-24" />
          </label>
          <div class="flex items-center justify-between gap-3">
            <label class="surface-subtle inline-flex items-center gap-3 rounded-2xl px-4 py-3">
              <input v-model="form.is_active" type="checkbox" />
              <span class="text-sm text-app-heading">Aktifkan asset</span>
            </label>
            <button class="primary-button" :disabled="saving" type="submit">
              {{ saving ? 'Menyimpan...' : 'Simpan Asset' }}
            </button>
          </div>
          <p v-if="successMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {{ errorMessage }}
          </p>
        </form>
      </article>
    </section>

    <section>
      <DataTableCard
        :items="assetsState.data.value?.items || []"
        :search-text-resolver="assetSearchText"
        search-placeholder="Cari code, nama asset, kategori, SPPG, lokasi..."
        title="Daftar Asset"
      >
        <template #table="{ items }">
          <table class="data-table assets-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Kategori</th>
                <th>SPPG</th>
                <th>Acquisition</th>
                <th>Condition</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in items" :key="(asset as AssetRecord).id">
                <td>
                  {{ (asset as AssetRecord).asset_name }}
                  <div class="text-xs text-app-muted">{{ (asset as AssetRecord).asset_code }}</div>
                </td>
                <td>{{ (asset as AssetRecord).asset_category_name || '-' }}</td>
                <td>{{ (asset as AssetRecord).sppg_name || '-' }}</td>
                <td>{{ formatCurrency((asset as AssetRecord).acquisition_cost) }}</td>
                <td>{{ (asset as AssetRecord).condition_status }}</td>
                <td><StatusBadge :status="(asset as AssetRecord).status" /></td>
                <td><RouterLink class="secondary-button" :to="`/assets/${(asset as AssetRecord).id}`">Detail</RouterLink></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="glass-panel p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="eyebrow-text">Asset Insight</p>
          <h2 class="mt-2 font-display text-2xl text-app-heading">Assignment & depresiasi</h2>
        </div>
        <div class="asset-tab-menu">
          <button
            class="asset-tab-button"
            :class="{ 'asset-tab-button-active': activeTab === 'assignments' }"
            type="button"
            @click="activeTab = 'assignments'"
          >
            Assignments
          </button>
          <button
            class="asset-tab-button"
            :class="{ 'asset-tab-button-active': activeTab === 'depreciations' }"
            type="button"
            @click="activeTab = 'depreciations'"
          >
            Depreciations
          </button>
        </div>
      </div>

      <DataTableCard
        v-if="activeTab === 'assignments'"
        :items="assignmentsState.data.value?.items || []"
        :search-text-resolver="assignmentSearchText"
        search-placeholder="Cari asset, SPPG, PIC, role, atau status..."
        title="Asset Assignments"
      >
        <template #table="{ items }">
          <table class="data-table asset-detail-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>SPPG</th>
                <th>Assigned To</th>
                <th>Date</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="assignment in items" :key="(assignment as AssetAssignmentRecord).id">
                <td>{{ (assignment as AssetAssignmentRecord).asset_name || '-' }}</td>
                <td>{{ (assignment as AssetAssignmentRecord).sppg_name || '-' }}</td>
                <td>{{ (assignment as AssetAssignmentRecord).assigned_to_name || '-' }}</td>
                <td>{{ formatDate((assignment as AssetAssignmentRecord).assignment_date) }}</td>
                <td>{{ (assignment as AssetAssignmentRecord).assignment_role }}</td>
                <td><StatusBadge :status="(assignment as AssetAssignmentRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        v-else
        :items="depreciationsState.data.value?.items || []"
        :search-text-resolver="depreciationSearchText"
        search-placeholder="Cari asset, account, atau status depresiasi..."
        title="Asset Depreciations"
      >
        <template #table="{ items }">
          <table class="data-table asset-detail-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="depreciation in items" :key="(depreciation as AssetDepreciationRecord).id">
                <td>{{ (depreciation as AssetDepreciationRecord).asset_name || '-' }}</td>
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
    </section>
  </div>
</template>

<style scoped>
.asset-kpi-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.asset-kpi-card {
  border: 1px solid color-mix(in srgb, var(--app-panel-border) 82%, #67e8f9 18%);
  background:
    radial-gradient(circle at 12% 10%, color-mix(in srgb, #67e8f9 14%, transparent) 0%, transparent 46%),
    var(--app-panel-bg);
  box-shadow: var(--app-shadow);
  border-radius: 1.6rem;
  padding: 1.25rem;
  transition: transform 0.24s ease, border-color 0.24s ease;
}

.asset-kpi-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, #5eead4 42%, var(--app-panel-border) 58%);
}

.asset-kpi-highlight {
  background:
    radial-gradient(circle at 14% 14%, color-mix(in srgb, #2dd4bf 22%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 88% 88%, color-mix(in srgb, #22d3ee 12%, transparent) 0%, transparent 42%),
    var(--app-panel-bg);
}

.assets-table {
  min-width: 980px;
  --asset-col-main: 250px;
  --asset-col-category: 180px;
}

.assets-table th,
.assets-table td {
  white-space: nowrap;
}

.assets-table th:nth-child(1),
.assets-table td:nth-child(1) {
  min-width: var(--asset-col-main);
}

.assets-table th:nth-child(2),
.assets-table td:nth-child(2) {
  min-width: var(--asset-col-category);
}

.assets-table th:nth-child(1),
.assets-table td:nth-child(1),
.assets-table th:nth-child(2),
.assets-table td:nth-child(2) {
  position: sticky;
  z-index: 1;
  background: color-mix(in srgb, var(--app-panel-bg) 88%, var(--app-subtle-bg) 12%);
  backdrop-filter: blur(6px);
}

.assets-table th:nth-child(1),
.assets-table td:nth-child(1) {
  left: 0;
}

.assets-table th:nth-child(2),
.assets-table td:nth-child(2) {
  left: var(--asset-col-main);
}

.assets-table th:nth-child(1),
.assets-table th:nth-child(2) {
  z-index: 3;
}

.assets-table td:nth-child(2),
.assets-table th:nth-child(2) {
  border-right: 1px solid color-mix(in srgb, var(--app-panel-border) 84%, transparent);
}

.asset-detail-table {
  min-width: 880px;
}

.asset-tab-menu {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid var(--app-panel-border);
  padding: 0.25rem;
  background: color-mix(in srgb, var(--app-subtle-bg) 68%, transparent);
}

.asset-tab-button {
  border: 0;
  border-radius: 999px;
  padding: 0.48rem 0.95rem;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--app-muted);
  cursor: pointer;
  background: transparent;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.asset-tab-button:hover {
  color: var(--app-heading);
}

.asset-tab-button-active {
  color: #0f172a;
  background: #5eead4;
}

[data-theme='light'] .asset-tab-button-active {
  color: #0f172a;
  background: #2dd4bf;
}
</style>

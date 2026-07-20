<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { storeToRefs } from 'pinia'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { createDocument, getDocuments } from '@/services/documents-audit'
import { useAppStore } from '@/stores/app'
import type { DocumentRecord } from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const appStore = useAppStore()
const { activeTenantId, activeSppgId } = storeToRefs(appStore)
const documentsState = useAsyncState(getDocuments)
const saving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const selectedType = ref('ALL')
const selectedStatus = ref('ALL')

const form = reactive({
  sppg_id: activeSppgId.value,
  document_type: 'QC_ATTACHMENT',
  title: 'Checklist QC Batch Baru',
  description: 'Lampiran checklist quality control.',
  owner_entity_type: 'meal_plan',
  owner_entity_id: 'mp-1',
  tags: 'qc,checklist',
})

const documentTypes = computed(() =>
  Array.from(new Set((documentsState.data.value?.items || []).map((item) => item.document_type))).sort(),
)

const filteredDocuments = computed(() => {
  const items = documentsState.data.value?.items || []
  return items.filter((item) => {
    const typeMatch = selectedType.value === 'ALL' || item.document_type === selectedType.value
    const statusMatch = selectedStatus.value === 'ALL' || item.status === selectedStatus.value
    return typeMatch && statusMatch
  })
})

const documentSearchText = (item: unknown) => {
  const row = item as DocumentRecord
  return [row.title, row.document_type, row.description, row.owner_entity_type, row.owner_entity_id, row.tags?.join(' '), row.status]
    .filter(Boolean)
    .join(' ')
}

const submit = async () => {
  saving.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const response = await createDocument({
      tenant_id: activeTenantId.value,
      sppg_id: form.sppg_id || undefined,
      document_type: form.document_type,
      title: form.title,
      description: form.description,
      owner_entity_type: form.owner_entity_type,
      owner_entity_id: form.owner_entity_id,
      tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
    })

    if (documentsState.data.value) {
      documentsState.data.value = {
        ...documentsState.data.value,
        items: [response.item, ...documentsState.data.value.items],
        total: documentsState.data.value.total + 1,
      }
    }

    successMessage.value = response.fallback
      ? `Dokumen ${response.item.title} tersimpan sebagai fallback mock.`
      : `Dokumen ${response.item.title} berhasil dibuat di backend.`
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Pembuatan metadata dokumen gagal.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Documents"
      subtitle="Metadata dokumen lintas modul untuk lampiran QC, proof distribusi, finance evidence, dan relasi entity bisnis."
      :badges="['Document Management', 'Versions', 'Entity Links']"
    />

    <section class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-4">
        <section class="glass-panel p-5">
          <div class="toolbar-grid">
            <select v-model="selectedType" class="toolbar-input">
              <option value="ALL">Semua Tipe</option>
              <option v-for="type in documentTypes" :key="type" :value="type">{{ type }}</option>
            </select>
            <select v-model="selectedStatus" class="toolbar-input">
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="DRAFT">DRAFT</option>
            </select>
            <RouterLink class="secondary-button" to="/audit/events">Audit Events</RouterLink>
          </div>
          <p v-if="documentsState.data.value?.fallback" class="mt-3 text-sm text-app-muted">
            Documents memakai fallback mock karena backend belum mengembalikan data siap pakai.
          </p>
        </section>

        <DataTableCard
          :items="filteredDocuments"
          :search-text-resolver="documentSearchText"
          search-placeholder="Cari judul, tipe, owner, tag, atau status..."
          title="Daftar Dokumen"
        >
          <template #table="{ items }">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Dokumen</th>
                  <th>Tipe</th>
                  <th>Owner</th>
                  <th>SPPG</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="document in items" :key="(document as DocumentRecord).id">
                  <td>
                    {{ (document as DocumentRecord).title }}
                    <div class="text-xs text-app-muted">{{ (document as DocumentRecord).tags?.join(', ') || '-' }}</div>
                  </td>
                  <td>{{ (document as DocumentRecord).document_type }}</td>
                  <td>{{ (document as DocumentRecord).owner_entity_type }} / {{ (document as DocumentRecord).owner_entity_id }}</td>
                  <td>{{ (document as DocumentRecord).sppg_name || '-' }}</td>
                  <td><StatusBadge :status="(document as DocumentRecord).status" /></td>
                  <td>{{ (document as DocumentRecord).updated_at ? formatDateTime((document as DocumentRecord).updated_at!) : '-' }}</td>
                  <td><RouterLink class="secondary-button" :to="`/documents/${(document as DocumentRecord).id}`">Detail</RouterLink></td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
      </div>

      <section class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Create Metadata</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Tambah dokumen</h2>
          </div>
          <span class="status-pill">POST /documents</span>
        </div>

        <form class="mt-6 grid gap-4" @submit.prevent="submit">
          <input v-model="form.document_type" class="toolbar-input" placeholder="QC_ATTACHMENT" required />
          <input v-model="form.title" class="toolbar-input" placeholder="Judul dokumen" required />
          <textarea v-model="form.description" class="toolbar-input min-h-24" placeholder="Deskripsi dokumen" required />
          <div class="grid gap-4 md:grid-cols-2">
            <input v-model="form.owner_entity_type" class="toolbar-input" placeholder="meal_plan" required />
            <input v-model="form.owner_entity_id" class="toolbar-input" placeholder="uuid/entity-id" required />
          </div>
          <input v-model="form.tags" class="toolbar-input" placeholder="qc,checklist" />
          <button class="primary-button" :disabled="saving" type="submit">
            {{ saving ? 'Menyimpan...' : 'Simpan Dokumen' }}
          </button>
          <p v-if="successMessage" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
            {{ successMessage }}
          </p>
          <p v-if="errorMessage" class="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700">
            {{ errorMessage }}
          </p>
        </form>
      </section>
    </section>
  </div>
</template>

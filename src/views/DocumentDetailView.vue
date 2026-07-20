<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { createDocumentLink, createDocumentVersion, getDocumentById } from '@/services/documents-audit'
import type { DocumentLinkRecord, DocumentVersionRecord } from '@/types/domain'
import { formatDateTime, formatNumber } from '@/utils/format'

type DocumentTab = 'overview' | 'versions' | 'links'

const route = useRoute()
const documentId = computed(() => String(route.params.documentId || ''))
const detailState = ref<Awaited<ReturnType<typeof getDocumentById>> | null>(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const message = ref('')
const activeTab = ref<DocumentTab>('overview')

const versionForm = reactive({
  file_name: 'document-version.pdf',
  file_mime_type: 'application/pdf',
  file_size_bytes: 204800,
  checksum_sha256: 'checksum-demo',
  storage_backend: 'LOCAL',
  object_key: 'documents/manual/document-version.pdf',
  version_notes: 'Versi baru',
  metadata_source: 'manual-upload',
  uploaded_at: '2026-07-20T11:00:00Z',
})

const linkForm = reactive({
  linked_entity_type: 'meal_plan',
  linked_entity_id: 'mp-1',
  relation_type: 'ATTACHMENT',
})

const loadDetail = async () => {
  loading.value = true
  error.value = ''
  try {
    detailState.value = await getDocumentById(documentId.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Gagal memuat detail dokumen.'
  } finally {
    loading.value = false
  }
}

void loadDetail()

const detail = computed(() => detailState.value?.item ?? null)
const document = computed(() => detail.value?.document ?? null)
const latestVersion = computed(() => detail.value?.versions[0] ?? null)
const metadataPreview = computed(() =>
  JSON.stringify(latestVersion.value?.metadata_json || { message: 'Belum ada metadata versi.' }, null, 2),
)

const versionSearchText = (item: unknown) => {
  const row = item as DocumentVersionRecord
  return [row.file_name, row.file_mime_type, row.storage_backend, row.object_key, row.version_notes].filter(Boolean).join(' ')
}

const linkSearchText = (item: unknown) => {
  const row = item as DocumentLinkRecord
  return [row.linked_entity_type, row.linked_entity_id, row.relation_type].filter(Boolean).join(' ')
}

const handleCreateVersion = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await createDocumentVersion(detail.value.document.id, {
      file_name: versionForm.file_name,
      file_mime_type: versionForm.file_mime_type,
      file_size_bytes: Number(versionForm.file_size_bytes),
      checksum_sha256: versionForm.checksum_sha256,
      storage_backend: versionForm.storage_backend,
      object_key: versionForm.object_key,
      version_notes: versionForm.version_notes,
      metadata_json: { source: versionForm.metadata_source },
      uploaded_at: versionForm.uploaded_at,
    })
    detail.value.versions = [response.item, ...detail.value.versions]
    message.value = response.fallback ? 'Versi dokumen tersimpan sebagai fallback mock.' : 'Versi dokumen berhasil dibuat.'
  } finally {
    saving.value = false
  }
}

const handleCreateLink = async () => {
  if (!detail.value) return
  saving.value = true
  message.value = ''
  try {
    const response = await createDocumentLink(detail.value.document.id, { ...linkForm })
    detail.value.links = [response.item, ...detail.value.links]
    message.value = response.fallback ? 'Link dokumen tersimpan sebagai fallback mock.' : 'Link dokumen berhasil dibuat.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="loading" class="loading-panel">Memuat detail dokumen...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="loadDetail">Muat ulang</button>
    </div>
    <template v-else-if="detail && document">
      <PageHeader
        :title="document.title"
        subtitle="Detail dokumen menampilkan metadata, versi file, dan relasi entity bisnis untuk kebutuhan governance dan audit."
        :badges="['Document Detail', document.document_type, document.status]"
      />

      <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article class="glass-panel p-6">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="eyebrow-text">{{ document.document_type }}</p>
              <h2 class="mt-2 font-display text-2xl text-app-heading">{{ document.title }}</h2>
              <p class="mt-2 text-sm text-app-body">{{ document.description || '-' }}</p>
            </div>
            <StatusBadge :status="document.status" />
          </div>
          <div class="mt-6 grid gap-4 md:grid-cols-3">
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Owner</p><p class="mt-2 font-semibold text-app-heading">{{ document.owner_entity_type }} / {{ document.owner_entity_id }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Versions</p><p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.versions.length) }}</p></div>
            <div class="surface-subtle rounded-3xl p-4"><p class="text-sm text-app-muted">Links</p><p class="mt-2 font-semibold text-app-heading">{{ formatNumber(detail.links.length) }}</p></div>
          </div>
        </article>

        <article class="glass-panel p-6">
          <p class="eyebrow-text">Latest Metadata</p>
          <pre class="mt-4 max-h-80 overflow-auto rounded-2xl border border-[var(--app-panel-border)] bg-black/5 p-4 text-xs text-app-body">{{ metadataPreview }}</pre>
        </article>
      </section>

      <section class="glass-panel p-3">
        <div class="flex flex-wrap gap-2">
          <button class="secondary-button" type="button" @click="activeTab = 'overview'">Overview</button>
          <button class="secondary-button" type="button" @click="activeTab = 'versions'">Versions</button>
          <button class="secondary-button" type="button" @click="activeTab = 'links'">Links</button>
          <RouterLink class="secondary-button" to="/documents">Kembali</RouterLink>
        </div>
      </section>

      <article v-if="activeTab === 'overview'" class="glass-panel p-6">
        <p class="eyebrow-text">Document Tags</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <span v-for="tag in document.tags || []" :key="tag" class="status-pill">{{ tag }}</span>
          <span v-if="!(document.tags || []).length" class="text-sm text-app-muted">Belum ada tag.</span>
        </div>
      </article>

      <section v-else-if="activeTab === 'versions'" class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTableCard :items="detail.versions" :search-text-resolver="versionSearchText" search-placeholder="Cari file, backend, object key..." title="Document Versions">
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Version</th><th>File</th><th>Size</th><th>Backend</th><th>Uploaded</th></tr></thead>
              <tbody>
                <tr v-for="version in items" :key="(version as DocumentVersionRecord).id">
                  <td>v{{ (version as DocumentVersionRecord).version_number }}</td>
                  <td>{{ (version as DocumentVersionRecord).file_name }}</td>
                  <td>{{ formatNumber((version as DocumentVersionRecord).file_size_bytes) }} bytes</td>
                  <td>{{ (version as DocumentVersionRecord).storage_backend }}</td>
                  <td>{{ formatDateTime((version as DocumentVersionRecord).uploaded_at) }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
        <article class="glass-panel p-6">
          <p class="eyebrow-text">Upload Version Metadata</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateVersion">
            <input v-model="versionForm.file_name" class="toolbar-input" required />
            <input v-model="versionForm.file_mime_type" class="toolbar-input" required />
            <input v-model.number="versionForm.file_size_bytes" class="toolbar-input" min="1" type="number" required />
            <input v-model="versionForm.object_key" class="toolbar-input" required />
            <input v-model="versionForm.version_notes" class="toolbar-input" />
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Tambah Versi' }}</button>
          </form>
        </article>
      </section>

      <section v-else class="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DataTableCard :items="detail.links" :search-text-resolver="linkSearchText" search-placeholder="Cari entity atau relation..." title="Document Links">
          <template #table="{ items }">
            <table class="data-table">
              <thead><tr><th>Entity Type</th><th>Entity ID</th><th>Relation</th><th>Created</th></tr></thead>
              <tbody>
                <tr v-for="link in items" :key="(link as DocumentLinkRecord).id">
                  <td>{{ (link as DocumentLinkRecord).linked_entity_type }}</td>
                  <td>{{ (link as DocumentLinkRecord).linked_entity_id }}</td>
                  <td>{{ (link as DocumentLinkRecord).relation_type }}</td>
                  <td>{{ (link as DocumentLinkRecord).created_at ? formatDateTime((link as DocumentLinkRecord).created_at!) : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </template>
        </DataTableCard>
        <article class="glass-panel p-6">
          <p class="eyebrow-text">Link Document</p>
          <form class="mt-5 grid gap-4" @submit.prevent="handleCreateLink">
            <input v-model="linkForm.linked_entity_type" class="toolbar-input" required />
            <input v-model="linkForm.linked_entity_id" class="toolbar-input" required />
            <input v-model="linkForm.relation_type" class="toolbar-input" required />
            <button class="primary-button" :disabled="saving" type="submit">{{ saving ? 'Menyimpan...' : 'Tambah Link' }}</button>
          </form>
        </article>
      </section>

      <p v-if="message" class="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
        {{ message }}
      </p>
    </template>
  </div>
</template>

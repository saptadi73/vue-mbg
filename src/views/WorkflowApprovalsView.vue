<script setup lang="ts">
import { computed, ref } from 'vue'
import DataTableCard from '@/components/common/DataTableCard.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { decideApprovalRequest, getWorkflowDefinitions, getWorkflowDocuments } from '@/services/erp-ops'
import type {
  ApprovalRequestRecord,
  WorkflowDefinitionRecord,
  WorkflowDocumentRecord,
  WorkflowHistoryRecord,
} from '@/types/domain'
import { formatDateTime } from '@/utils/format'

const definitionsState = useAsyncState(getWorkflowDefinitions)
const documentsState = useAsyncState(getWorkflowDocuments)
const approvalActionId = ref('')
const approvalMessage = ref('')
const approvalError = ref('')

const pendingApprovals = computed(() =>
  (documentsState.data.value?.items || []).flatMap((item) => item.approval_requests).filter((item) => item.status === 'PENDING'),
)

const workflowDefinitionSearchText = (item: unknown) => {
  const row = item as WorkflowDefinitionRecord
  return [row.code, row.name, row.document_type, row.status, row.notes].filter(Boolean).join(' ')
}

const workflowDocumentSearchText = (item: unknown) => {
  const row = item as WorkflowDocumentRecord
  return [row.document_type, row.document_id, row.current_state, row.business_status].filter(Boolean).join(' ')
}

const approvalRequestRows = computed(() =>
  (documentsState.data.value?.items || []).flatMap((document) =>
    document.approval_requests.map((request) => ({
      ...request,
      document_type: document.document_type,
      document_id: document.document_id,
    })),
  ),
)

const approvalRequestSearchText = (item: unknown) => {
  const row = item as ApprovalRequestRecord & { document_type: string; document_id: string }
  return [row.title, row.approver_name, row.approver_role, row.status, row.document_type, row.document_id].filter(Boolean).join(' ')
}

const workflowHistoryRows = computed(() =>
  (documentsState.data.value?.items || []).flatMap((document) =>
    document.history.map((entry) => ({
      ...entry,
      document_type: document.document_type,
      document_id: document.document_id,
    })),
  ),
)

const workflowHistorySearchText = (item: unknown) => {
  const row = item as WorkflowHistoryRecord & { document_type: string; document_id: string }
  return [row.action_name, row.actor_name, row.state, row.document_type, row.document_id, row.notes].filter(Boolean).join(' ')
}

const reloadDocuments = async () => {
  await documentsState.execute()
}

const handleDecision = async (approvalRequestId: string, decision: 'APPROVED' | 'REJECTED') => {
  approvalActionId.value = approvalRequestId
  approvalMessage.value = ''
  approvalError.value = ''

  try {
    await decideApprovalRequest(
      approvalRequestId,
      decision,
      decision === 'APPROVED' ? 'Disetujui dari approval queue.' : 'Ditolak untuk revisi dari approval queue.',
    )
    await reloadDocuments()
    approvalMessage.value =
      decision === 'APPROVED'
        ? 'Approval request berhasil disetujui.'
        : 'Approval request berhasil ditolak untuk revisi.'
  } catch (error) {
    approvalError.value = error instanceof Error ? error.message : 'Gagal memproses approval request.'
  } finally {
    approvalActionId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Workflow Approval"
      subtitle="Halaman ini menunjukkan bagaimana approval berjalan di MBG. Definisi workflow mengatur dokumen seperti budget atau meal plan, lalu instance dokumen menyimpan request approval, state aktif, dan history keputusan."
      :badges="['Workflow Definition', 'Approval Queue', 'Document History']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Workflow aktif</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ definitionsState.data.value?.total || 0 }}</p>
        <p class="mt-2 text-sm text-app-body">Definition per tenant aktif.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Pending approvals</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ pendingApprovals.length }}</p>
        <p class="mt-2 text-sm text-app-body">Perlu keputusan agar dokumen lanjut ke state berikutnya.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Budget workflow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Submitted</p>
        <p class="mt-2 text-sm text-app-body">Draft budget akan muncul di queue approval saat disubmit.</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Meal plan workflow</p>
        <p class="mt-3 font-display text-3xl text-app-heading">Approval gate</p>
        <p class="mt-2 text-sm text-app-body">Mencegah reserve material sebelum proses governance selesai.</p>
      </article>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <div v-if="definitionsState.loading.value" class="loading-panel">Memuat workflow definition...</div>
      <DataTableCard
        v-else
        :items="definitionsState.data.value?.items || []"
        :search-text-resolver="workflowDefinitionSearchText"
        search-placeholder="Cari workflow, code, dokumen..."
        title="Workflow Definition Aktif"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Definition</th><th>Document Type</th><th>Version</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as WorkflowDefinitionRecord).id">
                <td>
                  <p>{{ (item as WorkflowDefinitionRecord).name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as WorkflowDefinitionRecord).code }}</p>
                </td>
                <td>{{ (item as WorkflowDefinitionRecord).document_type }}</td>
                <td>{{ (item as WorkflowDefinitionRecord).active_version_number || 1 }}</td>
                <td><StatusBadge :status="(item as WorkflowDefinitionRecord).status" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <div v-if="documentsState.loading.value" class="loading-panel">Memuat workflow dokumen...</div>
      <DataTableCard
        v-else
        :items="documentsState.data.value?.items || []"
        :search-text-resolver="workflowDocumentSearchText"
        search-placeholder="Cari document type, id, state..."
        title="Workflow Document Queue"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Dokumen</th><th>Current State</th><th>Business Status</th><th>Approvals</th><th>History</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as WorkflowDocumentRecord).id">
                <td>{{ (item as WorkflowDocumentRecord).document_type }} / {{ (item as WorkflowDocumentRecord).document_id }}</td>
                <td>{{ (item as WorkflowDocumentRecord).current_state }}</td>
                <td><StatusBadge :status="(item as WorkflowDocumentRecord).business_status" /></td>
                <td>{{ (item as WorkflowDocumentRecord).approval_requests.length }}</td>
                <td>{{ (item as WorkflowDocumentRecord).history.length }}</td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <DataTableCard
        :items="approvalRequestRows"
        :search-text-resolver="approvalRequestSearchText"
        search-placeholder="Cari approver, dokumen, status..."
        title="Approval Requests"
      >
        <template #table="{ items }">
          <div v-if="approvalMessage" class="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {{ approvalMessage }}
          </div>
          <div v-if="approvalError" class="mb-4 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {{ approvalError }}
          </div>

          <table class="data-table">
            <thead><tr><th>Request</th><th>Dokumen</th><th>Approver</th><th>Requested</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as ApprovalRequestRecord & { document_type: string; document_id: string }).id">
                <td>{{ (item as ApprovalRequestRecord & { document_type: string; document_id: string }).title }}</td>
                <td>{{ (item as ApprovalRequestRecord & { document_type: string; document_id: string }).document_type }} / {{ (item as ApprovalRequestRecord & { document_type: string; document_id: string }).document_id }}</td>
                <td>{{ (item as ApprovalRequestRecord & { document_type: string; document_id: string }).approver_name }} | {{ (item as ApprovalRequestRecord & { document_type: string; document_id: string }).approver_role }}</td>
                <td>{{ formatDateTime((item as ApprovalRequestRecord & { document_type: string; document_id: string }).requested_at) }}</td>
                <td><StatusBadge :status="(item as ApprovalRequestRecord & { document_type: string; document_id: string }).status" /></td>
                <td>
                  <div
                    v-if="(item as ApprovalRequestRecord & { document_type: string; document_id: string }).status === 'PENDING'"
                    class="flex flex-wrap gap-2"
                  >
                    <button
                      class="secondary-button"
                      :disabled="approvalActionId === (item as ApprovalRequestRecord & { document_type: string; document_id: string }).id"
                      type="button"
                      @click="handleDecision((item as ApprovalRequestRecord & { document_type: string; document_id: string }).id, 'APPROVED')"
                    >
                      Approve
                    </button>
                    <button
                      class="secondary-button"
                      :disabled="approvalActionId === (item as ApprovalRequestRecord & { document_type: string; document_id: string }).id"
                      type="button"
                      @click="handleDecision((item as ApprovalRequestRecord & { document_type: string; document_id: string }).id, 'REJECTED')"
                    >
                      Reject
                    </button>
                  </div>
                  <span v-else class="text-xs text-app-muted">Selesai</span>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>

      <DataTableCard
        :items="workflowHistoryRows"
        :page-size="6"
        :search-text-resolver="workflowHistorySearchText"
        search-placeholder="Cari actor, action, dokumen..."
        title="Workflow History"
      >
        <template #table="{ items }">
          <table class="data-table">
            <thead><tr><th>Action</th><th>Dokumen</th><th>Actor</th><th>Waktu</th><th>State</th></tr></thead>
            <tbody>
              <tr v-for="item in items" :key="(item as WorkflowHistoryRecord & { document_type: string; document_id: string }).id">
                <td>
                  <p>{{ (item as WorkflowHistoryRecord & { document_type: string; document_id: string }).action_name }}</p>
                  <p class="mt-1 text-xs text-app-muted">{{ (item as WorkflowHistoryRecord & { document_type: string; document_id: string }).notes || 'Tanpa catatan.' }}</p>
                </td>
                <td>{{ (item as WorkflowHistoryRecord & { document_type: string; document_id: string }).document_type }} / {{ (item as WorkflowHistoryRecord & { document_type: string; document_id: string }).document_id }}</td>
                <td>{{ (item as WorkflowHistoryRecord & { document_type: string; document_id: string }).actor_name }}</td>
                <td>{{ formatDateTime((item as WorkflowHistoryRecord & { document_type: string; document_id: string }).created_at) }}</td>
                <td><StatusBadge :status="(item as WorkflowHistoryRecord & { document_type: string; document_id: string }).state" /></td>
              </tr>
            </tbody>
          </table>
        </template>
      </DataTableCard>
    </section>
  </div>
</template>

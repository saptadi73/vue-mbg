<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getWorkflowDefinitions, getWorkflowDocuments } from '@/services/erp-ops'
import { formatDateTime } from '@/utils/format'

const definitionsState = useAsyncState(getWorkflowDefinitions)
const documentsState = useAsyncState(getWorkflowDocuments)

const pendingApprovals = computed(() =>
  (documentsState.data.value?.items || []).flatMap((item) => item.approval_requests).filter((item) => item.status === 'PENDING'),
)
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

    <section class="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Definitions</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Workflow definition aktif</h2>
          </div>
          <button class="secondary-button" @click="definitionsState.execute">Refresh</button>
        </div>

        <div v-if="definitionsState.loading.value" class="loading-panel mt-5">Memuat workflow definition...</div>
        <div v-else-if="definitionsState.data.value" class="mt-5 grid gap-4">
          <div v-for="item in definitionsState.data.value.items" :key="item.id" class="surface-subtle rounded-3xl p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">{{ item.name }}</p>
                <p class="mt-1 text-xs uppercase tracking-[0.2em] text-app-muted">{{ item.code }} · {{ item.document_type }}</p>
              </div>
              <StatusBadge :status="item.status" />
            </div>
            <p class="mt-3 text-sm text-app-body">{{ item.notes }}</p>
            <p class="mt-3 text-xs text-app-muted">Version aktif: {{ item.active_version_number || 1 }}</p>
          </div>
        </div>
      </article>

      <article class="glass-panel p-6">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="eyebrow-text">Document Queue</p>
            <h2 class="mt-2 font-display text-2xl text-app-heading">Approval requests & history</h2>
          </div>
          <button class="secondary-button" @click="documentsState.execute">Refresh</button>
        </div>

        <div v-if="documentsState.loading.value" class="loading-panel mt-5">Memuat workflow dokumen...</div>
        <div v-else-if="documentsState.data.value" class="mt-5 grid gap-4">
          <div v-for="document in documentsState.data.value.items" :key="document.id" class="surface-subtle rounded-3xl p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-app-heading">{{ document.document_type }} / {{ document.document_id }}</p>
                <p class="mt-1 text-sm text-app-body">State: {{ document.current_state }} · Business status: {{ document.business_status }}</p>
              </div>
              <StatusBadge :status="document.business_status" />
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Approval Requests</p>
                <div class="mt-3 grid gap-3">
                  <div v-for="request in document.approval_requests" :key="request.id" class="rounded-2xl border border-[var(--app-panel-border)] p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-app-heading">{{ request.title }}</p>
                        <p class="mt-1 text-sm text-app-body">{{ request.approver_name }} · {{ request.approver_role }}</p>
                      </div>
                      <StatusBadge :status="request.status" />
                    </div>
                    <p class="mt-2 text-xs text-app-muted">Requested {{ formatDateTime(request.requested_at) }}</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-app-muted">History</p>
                <div class="mt-3 grid gap-3">
                  <div v-for="entry in document.history" :key="entry.id" class="rounded-2xl border border-[var(--app-panel-border)] p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-app-heading">{{ entry.action_name }}</p>
                        <p class="mt-1 text-sm text-app-body">{{ entry.actor_name }}</p>
                      </div>
                      <StatusBadge :status="entry.state" />
                    </div>
                    <p class="mt-2 text-xs text-app-muted">{{ formatDateTime(entry.created_at) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

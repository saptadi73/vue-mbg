<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { mockSppgs, mockTenants } from '@/services/mock-data'
import { createSchool, getSchools } from '@/services/master-data'
import { formatDateTime } from '@/utils/format'

const route = useRoute()
const tenantId = computed(() => (typeof route.query.tenantId === 'string' ? route.query.tenantId : mockTenants[0]?.id || ''))
const sppgId = computed(() => (typeof route.query.sppgId === 'string' ? route.query.sppgId : mockSppgs[0]?.id || ''))
const { data, loading, error, execute } = useAsyncState(() => getSchools(tenantId.value, sppgId.value || undefined))

const form = reactive({
  tenant_id: tenantId.value,
  sppg_id: sppgId.value,
  npsn: '',
  name: '',
  school_level: 'SD',
  address: '',
  latitude: -6.9,
  longitude: 107.61,
  is_active: true,
})
const formLoading = ref(false)
const formMessage = ref('')

const submit = async () => {
  formLoading.value = true
  formMessage.value = ''
  try {
    await createSchool({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) })
    formMessage.value = 'Sekolah baru berhasil didaftarkan.'
    execute()
  } finally {
    formLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader title="Schools" subtitle="Master data sekolah penerima manfaat per tenant dan SPPG." :badges="['Schools', tenantId, sppgId]" />
    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <section class="glass-panel overflow-hidden">
        <div class="overflow-x-auto">
          <table class="data-table">
            <thead><tr><th>NPSN</th><th>Nama</th><th>Level</th><th>Status</th><th>Dibuat</th></tr></thead>
            <tbody>
              <tr v-for="item in data?.items || []" :key="item.id">
                <td>{{ item.npsn }}</td><td>{{ item.name }}</td><td>{{ item.school_level }}</td>
                <td><StatusBadge :status="item.is_active ? 'APPROVED' : 'REJECTED'" /></td>
                <td>{{ item.created_at ? formatDateTime(item.created_at) : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="glass-panel p-5">
        <h3 class="font-display text-xl text-app-heading">Tambah School</h3>
        <form class="mt-4 grid gap-4" @submit.prevent="submit">
          <input v-model="form.npsn" class="toolbar-input" placeholder="NPSN" required />
          <input v-model="form.name" class="toolbar-input" placeholder="Nama sekolah" required />
          <select v-model="form.school_level" class="toolbar-input"><option>SD</option><option>SMP</option><option>SMA</option></select>
          <textarea v-model="form.address" class="toolbar-input min-h-24" placeholder="Alamat" required />
          <div class="grid gap-4 md:grid-cols-2">
            <input v-model="form.latitude" class="toolbar-input" step="0.000001" type="number" required />
            <input v-model="form.longitude" class="toolbar-input" step="0.000001" type="number" required />
          </div>
          <button class="primary-button" :disabled="formLoading || loading" type="submit">{{ formLoading ? 'Menyimpan...' : 'Daftarkan School' }}</button>
          <p v-if="formMessage" class="text-sm text-emerald-700">{{ formMessage }}</p>
          <p v-if="error" class="text-sm text-rose-700">{{ error }}</p>
        </form>
      </section>
    </section>
  </div>
</template>

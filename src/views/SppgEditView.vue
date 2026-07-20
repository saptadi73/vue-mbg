<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getSppgById, saveSppgDraft } from '@/services/sppg'

const route = useRoute()
const sppgId = computed(() => String(route.params.sppgId || ''))
const { data, loading, error, execute } = useAsyncState(() => getSppgById(sppgId.value))

const form = reactive({
  code: '',
  name: '',
  address: '',
  latitude: 0,
  longitude: 0,
  radius_km: 0,
  is_active: true,
})

const successMessage = ref('')
const saveLoading = ref(false)

watch(
  () => data.value?.item,
  (item) => {
    if (!item) return
    form.code = item.code
    form.name = item.name
    form.address = item.address
    form.latitude = item.latitude
    form.longitude = item.longitude
    form.radius_km = item.radius_km
    form.is_active = item.is_active
  },
  { immediate: true },
)

const submit = async () => {
  saveLoading.value = true
  successMessage.value = ''
  try {
    await saveSppgDraft(sppgId.value, {
      code: form.code,
      name: form.name,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_km: Number(form.radius_km),
      is_active: form.is_active,
    })
    successMessage.value =
      'Draft perubahan SPPG berhasil disimpan di frontend. Ini aman dipakai sambil menunggu endpoint update backend.'
  } finally {
    saveLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Edit SPPG"
      subtitle="Ubah profil operasional SPPG dan simpan draft frontend-ready sampai endpoint update backend tersedia."
      :badges="[sppgId || 'sppg', 'Draft Edit', 'Safe Mode']"
    />

    <div v-if="loading" class="loading-panel">Memuat data edit SPPG...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <section v-else class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field">
          <span>Code SPPG</span>
          <input v-model="form.code" class="toolbar-input" required />
        </label>
        <label class="form-field">
          <span>Nama SPPG</span>
          <input v-model="form.name" class="toolbar-input" required />
        </label>
        <label class="form-field lg:col-span-2">
          <span>Alamat</span>
          <textarea v-model="form.address" class="toolbar-input min-h-28" required />
        </label>
        <label class="form-field">
          <span>Latitude</span>
          <input v-model="form.latitude" class="toolbar-input" step="0.000001" type="number" required />
        </label>
        <label class="form-field">
          <span>Longitude</span>
          <input v-model="form.longitude" class="toolbar-input" step="0.000001" type="number" required />
        </label>
        <label class="form-field">
          <span>Radius (km)</span>
          <input v-model="form.radius_km" class="toolbar-input" min="0" step="0.1" type="number" required />
        </label>
        <label class="form-field">
          <span>Status</span>
          <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan SPPG</span>
          </label>
        </label>
        <div class="lg:col-span-2 flex flex-wrap gap-3">
          <button class="primary-button" :disabled="saveLoading" type="submit">
            {{ saveLoading ? 'Menyimpan...' : 'Simpan Draft Perubahan' }}
          </button>
          <RouterLink class="secondary-button" :to="`/sppg/${sppgId}`">Kembali ke Detail</RouterLink>
        </div>
        <p v-if="successMessage" class="lg:col-span-2 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-700">
          {{ successMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

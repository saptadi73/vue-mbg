<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { createSppg } from '@/services/sppg'
import { mockTenants } from '@/services/mock-data'

const route = useRoute()
const initialTenantId = typeof route.query.tenantId === 'string' ? route.query.tenantId : mockTenants[0]?.id || ''

const form = reactive({
  tenant_id: initialTenantId,
  code: '',
  name: '',
  address: '',
  latitude: -6.2,
  longitude: 106.816666,
  radius_km: 5,
  is_active: true,
})

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const tenantOptions = computed(() => mockTenants)

const submit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    await createSppg({
      tenant_id: form.tenant_id,
      code: form.code,
      name: form.name,
      address: form.address,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      radius_km: Number(form.radius_km),
      is_active: form.is_active,
    })

    successMessage.value = 'SPPG baru berhasil didaftarkan.'
    form.code = ''
    form.name = ''
    form.address = ''
    form.latitude = -6.2
    form.longitude = 106.816666
    form.radius_km = 5
    form.is_active = true
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Pendaftaran SPPG gagal. Periksa payload atau akses backend.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Pendaftaran SPPG"
      subtitle="Form onboarding dapur/SPPG baru dengan identitas lokasi, radius layanan, dan geo tagging dasar."
      :badges="['POST /sppg', form.tenant_id || 'Tenant Required', 'Geo Setup']"
    />

    <section class="glass-panel p-6">
      <form class="grid gap-5 lg:grid-cols-2" @submit.prevent="submit">
        <label class="form-field lg:col-span-2">
          <span>Tenant</span>
          <select v-model="form.tenant_id" class="toolbar-input" required>
            <option v-for="tenant in tenantOptions" :key="tenant.id" :value="tenant.id">{{ tenant.name }}</option>
          </select>
        </label>

        <label class="form-field">
          <span>Code SPPG</span>
          <input v-model="form.code" class="toolbar-input" placeholder="SPPG-BDG-01" required />
        </label>

        <label class="form-field">
          <span>Nama SPPG</span>
          <input v-model="form.name" class="toolbar-input" placeholder="SPPG Bandung 01" required />
        </label>

        <label class="form-field lg:col-span-2">
          <span>Alamat</span>
          <textarea
            v-model="form.address"
            class="toolbar-input min-h-28"
            placeholder="Jl. Asia Afrika No. 10, Bandung"
            required
          />
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
          <span>Radius Layanan (km)</span>
          <input v-model="form.radius_km" class="toolbar-input" min="0" step="0.1" type="number" required />
        </label>

        <label class="form-field">
          <span>Status SPPG</span>
          <label class="surface-subtle inline-flex w-full items-center gap-3 rounded-2xl px-4 py-3">
            <input v-model="form.is_active" type="checkbox" />
            <span class="text-sm text-app-heading">Aktifkan SPPG setelah pendaftaran</span>
          </label>
        </label>

        <div class="lg:col-span-2 flex flex-wrap items-center gap-3">
          <button class="primary-button" :disabled="loading" type="submit">
            {{ loading ? 'Mendaftarkan...' : 'Daftarkan SPPG' }}
          </button>
          <RouterLink
            class="secondary-button"
            :to="form.tenant_id ? `/sppg?tenantId=${form.tenant_id}` : '/sppg'"
          >
            Kembali ke SPPG
          </RouterLink>
        </div>

        <p
          v-if="successMessage"
          class="lg:col-span-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </p>
        <p
          v-if="errorMessage"
          class="lg:col-span-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700"
        >
          {{ errorMessage }}
        </p>
      </form>
    </section>
  </div>
</template>

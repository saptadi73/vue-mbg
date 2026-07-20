<script setup lang="ts">
import MapPanel from '@/components/gis/MapPanel.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useAsyncState } from '@/composables/useAsyncState'
import { getGisOverview } from '@/services/gis'

const { data, loading, error, execute } = useAsyncState(getGisOverview)
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="GIS Intelligence"
      subtitle="Surface spasial untuk PostGIS: dapur, sekolah, service coverage, dan gap distribusi yang butuh keputusan operasional."
      :badges="['PostGIS', 'Coverage', 'Route Insight']"
    />

    <section class="grid gap-4 xl:grid-cols-4">
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Kitchen nodes</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.kitchens.length || 0 }}</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">School points</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.schools.length || 0 }}</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Coverage layer</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.coverage?.features.length || 0 }}</p>
      </article>
      <article class="glass-panel p-5">
        <p class="text-sm text-app-muted">Gap layer</p>
        <p class="mt-3 font-display text-3xl text-app-heading">{{ data?.unserved?.features.length || 0 }}</p>
      </article>
    </section>

    <div v-if="loading" class="loading-panel">Memuat layer GIS...</div>
    <div v-else-if="error" class="error-panel">
      <p>{{ error }}</p>
      <button class="primary-button mt-3" @click="execute">Muat ulang</button>
    </div>
    <MapPanel v-else-if="data" :dataset="data" />
  </div>
</template>

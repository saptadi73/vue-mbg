<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapDataset } from '@/types/domain'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  dataset: MapDataset
}>()

const appStore = useAppStore()
const { themeMode } = storeToRefs(appStore)
const mapRef = ref<HTMLDivElement | null>(null)
let map: L.Map | null = null
let layers: L.Layer[] = []
let tileLayer: L.TileLayer | null = null

const tileConfig = computed(() =>
  themeMode.value === 'dark'
    ? {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      }
    : {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      },
)

const clearLayers = () => {
  layers.forEach((layer) => layer.remove())
  layers = []
}

const renderLayers = () => {
  if (!map) return
  clearLayers()

  props.dataset.kitchens.forEach((point) => {
    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 9,
      color: '#5cf0c6',
      fillColor: '#5cf0c6',
      fillOpacity: 0.8,
    }).bindPopup(`<strong>${point.name}</strong><br/>Kitchen / SPPG`)
    marker.addTo(map!)
    layers.push(marker)
  })

  props.dataset.schools.forEach((point) => {
    const marker = L.circleMarker([point.latitude, point.longitude], {
      radius: 7,
      color: point.status === 'UNSERVED' ? '#ff7a7a' : '#8fb8ff',
      fillColor: point.status === 'UNSERVED' ? '#ff7a7a' : '#8fb8ff',
      fillOpacity: 0.9,
    }).bindPopup(`<strong>${point.name}</strong><br/>School / ${point.status || 'UNKNOWN'}`)
    marker.addTo(map!)
    layers.push(marker)
  })

  if (props.dataset.coverage) {
    const layer = L.geoJSON(props.dataset.coverage as never, {
      style: { color: '#4fe3c1', weight: 2, fillOpacity: 0.12 },
    }).addTo(map)
    layers.push(layer)
  }

  if (props.dataset.unserved) {
    const layer = L.geoJSON(props.dataset.unserved as never, {
      style: { color: '#ff7a7a', weight: 2, fillOpacity: 0.18, dashArray: '6 4' },
    }).addTo(map)
    layers.push(layer)
  }

  const bounds = L.latLngBounds([])
  props.dataset.kitchens.forEach((point) => bounds.extend([point.latitude, point.longitude]))
  props.dataset.schools.forEach((point) => bounds.extend([point.latitude, point.longitude]))

  if (bounds.isValid()) {
    map.fitBounds(bounds.pad(0.18))
  }
}

const applyBaseMap = () => {
  if (!map) return

  if (tileLayer) {
    map.removeLayer(tileLayer)
  }

  tileLayer = L.tileLayer(tileConfig.value.url, {
    attribution: tileConfig.value.attribution,
  }).addTo(map)
}

onMounted(() => {
  if (!mapRef.value) return

  map = L.map(mapRef.value, { zoomControl: false }).setView([-6.18, 106.82], 12)

  applyBaseMap()
  L.control.zoom({ position: 'bottomright' }).addTo(map)
  renderLayers()
})

watch(() => props.dataset, renderLayers, { deep: true })
watch(themeMode, applyBaseMap)
</script>

<template>
  <section class="glass-panel p-3">
    <div class="mb-3 flex items-center justify-between px-2 pt-2">
      <div>
        <h3 class="font-display text-xl text-app-heading">PostGIS Situational Map</h3>
        <p class="mt-1 text-sm text-app-body">Layer dapur, sekolah, coverage, dan gap layanan dari endpoint GIS backend.</p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs text-app-body">
        <span class="legend-chip"><i class="legend-dot bg-teal-300"></i> Kitchen</span>
        <span class="legend-chip"><i class="legend-dot bg-blue-300"></i> Served School</span>
        <span class="legend-chip"><i class="legend-dot bg-rose-300"></i> Unserved</span>
      </div>
    </div>
    <div ref="mapRef" class="h-[480px] rounded-[28px]"></div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Boxes, PackageSearch, ShieldCheck } from '@lucide/vue'
import FieldOperationsView from '@/views/FieldOperationsView.vue'
import FoodSafetyTraceabilityView from '@/views/FoodSafetyTraceabilityView.vue'
import InventoryView from '@/views/InventoryView.vue'

type Workspace = 'raw-material' | 'inventory' | 'food-security'

const route = useRoute()
const router = useRouter()
const activeWorkspace = computed<Workspace>(() => {
  if (route.query.workspace === 'inventory') return 'inventory'
  if (route.query.workspace === 'food-security') return 'food-security'
  return 'raw-material'
})

const selectWorkspace = (workspace: Workspace) => {
  void router.replace({ name: 'traceability-security', query: { workspace } })
}
</script>

<template>
  <div class="space-y-6">
    <nav
      class="glass-panel grid gap-3 p-3 md:grid-cols-3"
      aria-label="Workspace Traceability, Inventory, dan Food Security"
    >
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
        :class="activeWorkspace === 'raw-material' ? 'primary-button' : 'secondary-button'"
        @click="selectWorkspace('raw-material')"
      >
        <PackageSearch :size="21" />
        <span>
          <b class="block">Traceability Bahan Baku</b>
          <small class="block opacity-80">Barang masuk, keluar, print dan scan QR</small>
        </span>
      </button>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
        :class="activeWorkspace === 'inventory' ? 'primary-button' : 'secondary-button'"
        @click="selectWorkspace('inventory')"
      >
        <Boxes :size="21" />
        <span>
          <b class="block">Inventory</b>
          <small class="block opacity-80">Stok, lot, masa simpan dan kualitas bahan</small>
        </span>
      </button>
      <button
        type="button"
        class="flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition"
        :class="activeWorkspace === 'food-security' ? 'primary-button' : 'secondary-button'"
        @click="selectWorkspace('food-security')"
      >
        <ShieldCheck :size="21" />
        <span>
          <b class="block">Food Security</b>
          <small class="block opacity-80">Kemasan, proses, pengiriman dan penerimaan</small>
        </span>
      </button>
    </nav>

    <FieldOperationsView v-if="activeWorkspace === 'raw-material'" workspace="raw-material" />
    <InventoryView v-else-if="activeWorkspace === 'inventory'" />
    <FoodSafetyTraceabilityView v-else workspace="food-security" />
  </div>
</template>

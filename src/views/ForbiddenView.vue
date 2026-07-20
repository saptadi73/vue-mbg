<script setup lang="ts">
import PageHeader from '@/components/common/PageHeader.vue'
</script>

<template>
  <div class="space-y-6">
    <PageHeader
      title="Akses Ditolak"
      subtitle="Akun aktif kamu belum punya role yang diperlukan untuk membuka halaman atau aksi ini."
      :badges="['403', 'Forbidden', 'Role Guard']"
    />

    <section class="glass-panel p-8">
      <div class="max-w-2xl">
        <p class="text-sm leading-7 text-app-body">
          Kalau ini seharusnya bisa diakses, cek lagi role user aktif, context yayasan, dan scope SPPG dari akun yang sedang login.
        </p>
        <div class="mt-6 flex flex-wrap gap-3">
          <RouterLink class="primary-button" to="/">Kembali ke Dashboard</RouterLink>
          <RouterLink class="secondary-button" to="/login">Login Ulang</RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

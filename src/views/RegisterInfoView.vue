<template>
  <div class="login-shell min-h-screen px-4 py-8">
    <div class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section class="glass-panel p-8 lg:p-10">
        <p class="eyebrow-text">Register</p>
        <h1 class="mt-4 font-display text-4xl text-app-heading lg:text-5xl">Registrasi akun MBG</h1>
        <p class="mt-5 max-w-2xl text-base leading-7 text-app-body">
          Backend MBG saat ini memakai pendaftaran berbasis admin. Akun baru dibuat oleh <strong>super admin</strong> atau <strong>tenant admin</strong> agar tenant, role, dan akses SPPG langsung terpasang dengan benar.
        </p>

        <div class="mt-8 grid gap-4 md:grid-cols-3">
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Flow</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">Admin-created</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">Tenant Scope</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">Mandatory</p>
          </div>
          <div class="surface-subtle rounded-3xl p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-app-muted">SPPG Access</p>
            <p class="mt-2 text-sm font-semibold text-app-heading">Role-aware</p>
          </div>
        </div>
      </section>

      <section class="glass-panel p-8 lg:p-10">
        <p class="eyebrow-text">Next Step</p>
        <h2 class="mt-4 font-display text-3xl text-app-heading">Cara mendapatkan akun</h2>
        <div class="mt-6 grid gap-4 text-sm leading-7 text-app-body">
          <p>1. Login memakai akun admin tenant atau super admin.</p>
          <p>2. Buka halaman manajemen user dan isi data user baru.</p>
          <p>3. Tentukan role, tenant, serta akses SPPG yang sesuai.</p>
        </div>

        <div class="mt-8 flex flex-wrap gap-3">
          <RouterLink class="primary-button" to="/login">Kembali ke Login</RouterLink>
          <RouterLink class="secondary-button" to="/users/create">Buka Form User</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

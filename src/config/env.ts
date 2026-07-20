const trimSlash = (value: string) => value.replace(/\/+$/, '')

export const env = {
  apiBaseUrl: trimSlash(import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'),
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 12000),
  devTenantId: import.meta.env.VITE_DEV_TENANT_ID || 'tenant-demo-mbg',
  devSppgId: import.meta.env.VITE_DEV_SPPG_ID || 'sppg-jakarta-pusat-01',
}

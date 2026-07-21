const trimSlash = (value: string) => value.replace(/\/+$/, '')
const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://api-mbg.gagakrimang.web.id/'
  : 'http://localhost:8000/'

export const env = {
  apiBaseUrl: trimSlash(import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl),
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT || 12000),
  devTenantId: import.meta.env.VITE_DEV_TENANT_ID || 'tenant-demo-mbg',
  devSppgId: import.meta.env.VITE_DEV_SPPG_ID || 'sppg-jakarta-pusat-01',
}

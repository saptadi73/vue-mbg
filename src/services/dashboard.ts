import { apiRequest } from '@/services/http'
import { mockDashboard } from '@/services/mock-data'
import type { DashboardPayload } from '@/types/domain'

export const getDashboardOverview = async (): Promise<DashboardPayload> => {
  try {
    const [tenant, sppg, finance] = await Promise.all([
      apiRequest<Record<string, unknown>>('/api/v1/reporting/dashboard/tenant'),
      apiRequest<Record<string, unknown>>('/api/v1/reporting/dashboard/sppg'),
      apiRequest<Record<string, unknown>>('/api/v1/reporting/dashboard/finance'),
    ])

    return {
      ...mockDashboard,
      tenantKpis: tenant.data?.kpis ? mockDashboard.tenantKpis : mockDashboard.tenantKpis,
      sppgKpis: sppg.data?.kpis ? mockDashboard.sppgKpis : mockDashboard.sppgKpis,
      financeKpis: finance.data?.kpis ? mockDashboard.financeKpis : mockDashboard.financeKpis,
    }
  } catch {
    return mockDashboard
  }
}

import { mockBeneficiaries, mockSchools, mockSppgs } from '@/services/mock-data'
import { apiRequest } from '@/services/http'
import type { BeneficiaryRecord, CreateBeneficiaryPayload } from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

export const getBeneficiaries = async (tenantId?: string, sppgId?: string, schoolId?: string) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/beneficiaries/')
    const items = normalizeArray<BeneficiaryRecord>(payload.data).filter(
      (item) =>
        (!tenantId || item.tenant_id === tenantId) &&
        (!sppgId || item.sppg_id === sppgId) &&
        (!schoolId || item.school_id === schoolId),
    )
    const fallbackItems = mockBeneficiaries.filter(
      (item) =>
        (!tenantId || item.tenant_id === tenantId) &&
        (!sppgId || item.sppg_id === sppgId) &&
        (!schoolId || item.school_id === schoolId),
    )
    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    const fallbackItems = mockBeneficiaries.filter(
      (item) =>
        (!tenantId || item.tenant_id === tenantId) &&
        (!sppgId || item.sppg_id === sppgId) &&
        (!schoolId || item.school_id === schoolId),
    )
    return {
      items: fallbackItems,
      total: fallbackItems.length,
      fallback: true,
    }
  }
}

export const getBeneficiaryById = async (beneficiaryId: string) => {
  try {
    const payload = await apiRequest<BeneficiaryRecord>(`/api/v1/beneficiaries/${beneficiaryId}`)
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: mockBeneficiaries.find((item) => item.id === beneficiaryId) || mockBeneficiaries[0],
      fallback: true,
    }
  }
}

export const createBeneficiary = async (input: CreateBeneficiaryPayload) => {
  try {
    const payload = await apiRequest<BeneficiaryRecord>('/api/v1/beneficiaries/', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-beneficiary-${Date.now()}`,
        tenant_id: input.tenant_id,
        sppg_id: input.sppg_id,
        sppg_name: mockSppgs.find((item) => item.id === input.sppg_id)?.name || '-',
        school_id: input.school_id,
        school_name: mockSchools.find((item) => item.id === input.school_id)?.name || '-',
        full_name: input.full_name,
        beneficiary_type: input.beneficiary_type,
        gender: input.gender,
        date_of_birth: input.date_of_birth,
        classroom_name: input.classroom_name,
        is_active: input.is_active,
        external_reference: `BEN-MOCK-${Date.now()}`,
        created_at: '2026-07-20T10:45:00Z',
      },
      fallback: true,
    }
  }
}

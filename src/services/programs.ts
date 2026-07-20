import {
  mockPrograms,
  mockProgramDetails,
  mockTenants,
  mockSppgs,
} from '@/services/mock-data'
import { apiRequest } from '@/services/http'
import type {
  CreateProgramPayload,
  CreateProgramPeriodPayload,
  CreateProgramSppgAssignmentPayload,
  CreateProgramTenantAssignmentPayload,
  ProgramDetailRecord,
  ProgramPeriodRecord,
  ProgramRecord,
  ProgramSppgAssignmentRecord,
  ProgramTenantAssignmentRecord,
} from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

const normalizeProgramDetail = (data: unknown): ProgramDetailRecord | null => {
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<ProgramDetailRecord>
  if (!candidate.program || !candidate.periods || !candidate.tenant_assignments || !candidate.sppg_assignments) {
    return null
  }
  return candidate as ProgramDetailRecord
}

export const getPrograms = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/programs/')
    const items = normalizeArray<ProgramRecord>(payload.data)
    return {
      items: items.length ? items : mockPrograms,
      total: payload.meta?.total ?? (items.length || mockPrograms.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockPrograms,
      total: mockPrograms.length,
      fallback: true,
    }
  }
}

export const getProgramById = async (programId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/programs/${programId}`)
    const item = normalizeProgramDetail(payload.data)
    if (item) {
      return { item, fallback: false }
    }
  } catch {
    // Fallback below
  }

  return {
    item: mockProgramDetails.find((entry) => entry.program.id === programId) || mockProgramDetails[0],
    fallback: true,
  }
}

export const createProgram = async (input: CreateProgramPayload) => {
  try {
    const response = await apiRequest<ProgramRecord>('/api/v1/programs/', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-program-${Date.now()}`,
        ...input,
        created_at: '2026-07-20T10:00:00Z',
        updated_at: '2026-07-20T10:00:00Z',
      },
      fallback: true,
    }
  }
}

export const createProgramPeriod = async (programId: string, input: CreateProgramPeriodPayload) => {
  try {
    const response = await apiRequest<ProgramPeriodRecord>(`/api/v1/programs/${programId}/periods`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-program-period-${Date.now()}`,
        program_id: programId,
        ...input,
      },
      fallback: true,
    }
  }
}

export const assignTenantToProgram = async (
  programId: string,
  input: CreateProgramTenantAssignmentPayload,
) => {
  try {
    const response = await apiRequest<ProgramTenantAssignmentRecord>(`/api/v1/programs/${programId}/tenants`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-program-tenant-${Date.now()}`,
        program_id: programId,
        tenant_id: input.tenant_id,
        tenant_name: mockTenants.find((tenant) => tenant.id === input.tenant_id)?.name || '-',
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: input.is_active,
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

export const assignSppgToProgram = async (
  programId: string,
  input: CreateProgramSppgAssignmentPayload,
) => {
  try {
    const response = await apiRequest<ProgramSppgAssignmentRecord>(`/api/v1/programs/${programId}/sppg`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-program-sppg-${Date.now()}`,
        program_id: programId,
        tenant_id: input.tenant_id,
        tenant_name: mockTenants.find((tenant) => tenant.id === input.tenant_id)?.name || '-',
        sppg_id: input.sppg_id,
        sppg_name: mockSppgs.find((sppg) => sppg.id === input.sppg_id)?.name || '-',
        start_date: input.start_date,
        end_date: input.end_date,
        is_active: input.is_active,
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

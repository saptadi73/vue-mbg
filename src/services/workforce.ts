import { env } from '@/config/env'
import {
  mockWorkforceAttendance,
  mockWorkforceEmployeeDetails,
  mockWorkforceEmployees,
  mockWorkforcePositions,
  mockWorkforceShifts,
  mockWorkforceTimesheets,
  mockSppgs,
} from '@/services/mock-data'
import { apiRequest } from '@/services/http'
import type {
  CreateWorkforceAssignmentPayload,
  CreateWorkforceEmployeePayload,
  WorkforceAttendanceRecord,
  WorkforceEmployeeAssignmentRecord,
  WorkforceEmployeeDetailRecord,
  WorkforceEmployeeRecord,
  WorkforcePositionRecord,
  WorkforceShiftRecord,
  WorkforceTimesheetRecord,
} from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

const normalizeEmployeeDetail = (data: unknown): WorkforceEmployeeDetailRecord | null => {
  if (!data || typeof data !== 'object') return null

  const candidate = data as Partial<WorkforceEmployeeDetailRecord>
  if (!candidate.employee || !candidate.assignments) return null

  return candidate as WorkforceEmployeeDetailRecord
}

export const getWorkforcePositions = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/positions')
    const items = normalizeArray<WorkforcePositionRecord>(payload.data)
    return {
      items: items.length ? items : mockWorkforcePositions,
      total: payload.meta?.total ?? (items.length || mockWorkforcePositions.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockWorkforcePositions,
      total: mockWorkforcePositions.length,
      fallback: true,
    }
  }
}

export const getWorkforceEmployees = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/employees')
    const items = normalizeArray<WorkforceEmployeeRecord>(payload.data)
    return {
      items: items.length ? items : mockWorkforceEmployees,
      total: payload.meta?.total ?? (items.length || mockWorkforceEmployees.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockWorkforceEmployees,
      total: mockWorkforceEmployees.length,
      fallback: true,
    }
  }
}

export const getWorkforceEmployeeById = async (employeeId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/workforce/employees/${employeeId}`)
    const item = normalizeEmployeeDetail(payload.data)
    if (item) {
      return { item, fallback: false }
    }
  } catch {
    // Fallback handled below
  }

  return {
    item:
      mockWorkforceEmployeeDetails.find((entry) => entry.employee.id === employeeId) ||
      mockWorkforceEmployeeDetails[0],
    fallback: true,
  }
}

export const createWorkforceEmployee = async (input: CreateWorkforceEmployeePayload) => {
  try {
    const response = await apiRequest<WorkforceEmployeeRecord>('/api/v1/workforce/employees', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        tenant_id: input.tenant_id || env.devTenantId,
      }),
    })
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-employee-${Date.now()}`,
        tenant_id: input.tenant_id || env.devTenantId,
        position_id: input.position_id,
        position_name: mockWorkforcePositions.find((position) => position.id === input.position_id)?.name || '-',
        employee_code: input.employee_code,
        full_name: input.full_name,
        employment_type: input.employment_type,
        join_date: input.join_date,
        phone_number: input.phone_number,
        daily_rate: input.daily_rate,
        is_active: input.is_active,
        active_assignment_sppg_id: null,
        active_assignment_sppg_name: null,
      },
      fallback: true,
    }
  }
}

export const assignWorkforceEmployee = async (
  employeeId: string,
  input: CreateWorkforceAssignmentPayload,
) => {
  try {
    const response = await apiRequest<WorkforceEmployeeAssignmentRecord>(
      `/api/v1/workforce/employees/${employeeId}/assignments`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    )
    return { item: response.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-assignment-${Date.now()}`,
        employee_id: employeeId,
        employee_name: mockWorkforceEmployees.find((employee) => employee.id === employeeId)?.full_name || '-',
        sppg_id: input.sppg_id,
        sppg_name: mockSppgs.find((sppg) => sppg.id === input.sppg_id)?.name || 'SPPG Assignment',
        start_date: input.start_date,
        end_date: input.end_date,
        assignment_role: input.assignment_role,
        status: 'ACTIVE',
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

export const getWorkforceShifts = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/shifts')
    const items = normalizeArray<WorkforceShiftRecord>(payload.data)
    return {
      items: items.length ? items : mockWorkforceShifts,
      total: payload.meta?.total ?? (items.length || mockWorkforceShifts.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockWorkforceShifts,
      total: mockWorkforceShifts.length,
      fallback: true,
    }
  }
}

export const getWorkforceAttendance = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/attendance')
    const items = normalizeArray<WorkforceAttendanceRecord>(payload.data)
    return {
      items: items.length ? items : mockWorkforceAttendance,
      total: payload.meta?.total ?? (items.length || mockWorkforceAttendance.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockWorkforceAttendance,
      total: mockWorkforceAttendance.length,
      fallback: true,
    }
  }
}

export const getWorkforceTimesheets = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/workforce/timesheets')
    const items = normalizeArray<WorkforceTimesheetRecord>(payload.data)
    return {
      items: items.length ? items : mockWorkforceTimesheets,
      total: payload.meta?.total ?? (items.length || mockWorkforceTimesheets.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockWorkforceTimesheets,
      total: mockWorkforceTimesheets.length,
      fallback: true,
    }
  }
}

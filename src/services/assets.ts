import {
  mockAssetAssignments,
  mockAssetCategories,
  mockAssetDepreciations,
  mockAssetDetails,
  mockAssets,
  mockSppgs,
} from '@/services/mock-data'
import { apiRequest } from '@/services/http'
import type {
  AssetAssignmentRecord,
  AssetCategoryRecord,
  AssetDepreciationRecord,
  AssetDetailRecord,
  AssetRecord,
  CreateAssetAssignmentPayload,
  CreateAssetCategoryPayload,
  CreateAssetDepreciationPayload,
  CreateAssetPayload,
} from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

const normalizeAssetDetail = (data: unknown): AssetDetailRecord | null => {
  if (!data || typeof data !== 'object') return null
  const candidate = data as Partial<AssetDetailRecord>
  if (!candidate.asset || !candidate.assignments || !candidate.depreciations) return null
  return candidate as AssetDetailRecord
}

export const getAssetCategories = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/assets/categories')
    const items = normalizeArray<AssetCategoryRecord>(payload.data)
    return {
      items: items.length ? items : mockAssetCategories,
      total: payload.meta?.total ?? (items.length || mockAssetCategories.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockAssetCategories,
      total: mockAssetCategories.length,
      fallback: true,
    }
  }
}

export const createAssetCategory = async (input: CreateAssetCategoryPayload) => {
  try {
    const payload = await apiRequest<AssetCategoryRecord>('/api/v1/assets/categories', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-asset-category-${Date.now()}`,
        ...input,
      },
      fallback: true,
    }
  }
}

export const getAssets = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/assets/')
    const items = normalizeArray<AssetRecord>(payload.data)
    return {
      items: items.length ? items : mockAssets,
      total: payload.meta?.total ?? (items.length || mockAssets.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockAssets,
      total: mockAssets.length,
      fallback: true,
    }
  }
}

export const getAssetById = async (assetId: string) => {
  try {
    const payload = await apiRequest<unknown>(`/api/v1/assets/${assetId}`)
    const item = normalizeAssetDetail(payload.data)
    if (item) {
      return { item, fallback: false }
    }
  } catch {
    // fallback below
  }

  return {
    item: mockAssetDetails.find((entry) => entry.asset.id === assetId) || mockAssetDetails[0],
    fallback: true,
  }
}

export const createAsset = async (input: CreateAssetPayload) => {
  try {
    const payload = await apiRequest<AssetRecord>('/api/v1/assets/', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    return {
      item: {
        id: `mock-asset-${Date.now()}`,
        tenant_id: input.tenant_id,
        sppg_id: input.sppg_id,
        sppg_name: mockSppgs.find((item) => item.id === input.sppg_id)?.name || '-',
        asset_category_id: input.asset_category_id,
        asset_category_name: mockAssetCategories.find((item) => item.id === input.asset_category_id)?.name || '-',
        asset_code: input.asset_code,
        asset_name: input.asset_name,
        acquisition_date: input.acquisition_date,
        acquisition_cost: input.acquisition_cost,
        residual_value: input.residual_value,
        useful_life_months: input.useful_life_months,
        depreciation_method: input.depreciation_method,
        status: input.status,
        serial_number: input.serial_number,
        condition_status: input.condition_status,
        location_name: input.location_name,
        is_active: input.is_active,
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

export const getAssetAssignments = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/assets/assignments/')
    const items = normalizeArray<AssetAssignmentRecord>(payload.data)
    return {
      items: items.length ? items : mockAssetAssignments,
      total: payload.meta?.total ?? (items.length || mockAssetAssignments.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockAssetAssignments,
      total: mockAssetAssignments.length,
      fallback: true,
    }
  }
}

export const createAssetAssignment = async (assetId: string, input: CreateAssetAssignmentPayload) => {
  try {
    const payload = await apiRequest<AssetAssignmentRecord>(`/api/v1/assets/${assetId}/assignments`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    const asset = mockAssets.find((item) => item.id === assetId)
    return {
      item: {
        id: `mock-asset-assignment-${Date.now()}`,
        asset_id: assetId,
        asset_code: asset?.asset_code || '-',
        asset_name: asset?.asset_name || '-',
        sppg_id: input.sppg_id,
        sppg_name: mockSppgs.find((item) => item.id === input.sppg_id)?.name || '-',
        assigned_to_name: input.assigned_to_name,
        assignment_date: input.assignment_date,
        end_date: input.end_date,
        assignment_role: input.assignment_role,
        status: input.status,
        is_active: input.is_active,
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

export const getAssetDepreciations = async () => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/assets/depreciations/')
    const items = normalizeArray<AssetDepreciationRecord>(payload.data)
    return {
      items: items.length ? items : mockAssetDepreciations,
      total: payload.meta?.total ?? (items.length || mockAssetDepreciations.length),
      fallback: !items.length,
    }
  } catch {
    return {
      items: mockAssetDepreciations,
      total: mockAssetDepreciations.length,
      fallback: true,
    }
  }
}

export const createAssetDepreciation = async (assetId: string, input: CreateAssetDepreciationPayload) => {
  try {
    const payload = await apiRequest<AssetDepreciationRecord>(`/api/v1/assets/${assetId}/depreciations`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return { item: payload.data, fallback: false }
  } catch {
    const asset = mockAssets.find((item) => item.id === assetId)
    const calculatedAmount =
      input.depreciation_amount ??
      Math.max(((asset?.acquisition_cost || 0) - (asset?.residual_value || 0)) / Math.max(asset?.useful_life_months || 1, 1), 0)

    return {
      item: {
        id: `mock-asset-depreciation-${Date.now()}`,
        asset_id: assetId,
        asset_code: asset?.asset_code || '-',
        asset_name: asset?.asset_name || '-',
        depreciation_date: input.depreciation_date,
        depreciation_amount: calculatedAmount,
        debit_account_code: input.debit_account_code,
        credit_account_code: input.credit_account_code,
        status: input.status,
        notes: input.notes,
      },
      fallback: true,
    }
  }
}

import { apiRequest } from '@/services/http'
import { mockProducts, mockRecipes, mockSchools } from '@/services/mock-data'
import type {
  CreateProductPayload,
  CreateRecipePayload,
  CreateSchoolPayload,
  ProductRecord,
  RecipeRecord,
  SchoolRecord,
} from '@/types/domain'

const normalizeArray = <T>(data: unknown) => (Array.isArray(data) ? (data as T[]) : [])

export const getSchools = async (tenantId?: string, sppgId?: string) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/geography/schools/')
    const items = normalizeArray<SchoolRecord>(payload.data).filter(
      (item) => (!tenantId || item.tenant_id === tenantId) && (!sppgId || item.sppg_id === sppgId),
    )
    const fallbackItems = mockSchools.filter(
      (item) => (!tenantId || item.tenant_id === tenantId) && (!sppgId || item.sppg_id === sppgId),
    )
    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    const fallbackItems = mockSchools.filter(
      (item) => (!tenantId || item.tenant_id === tenantId) && (!sppgId || item.sppg_id === sppgId),
    )
    return { items: fallbackItems, total: fallbackItems.length, fallback: true }
  }
}

export const createSchool = async (input: CreateSchoolPayload) => {
  const response = await apiRequest<SchoolRecord>('/api/v1/geography/schools/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

export const getProducts = async (tenantId?: string) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/products/')
    const items = normalizeArray<ProductRecord>(payload.data).filter(
      (item) => (!tenantId || item.tenant_id === tenantId),
    )
    const fallbackItems = mockProducts.filter((item) => !tenantId || item.tenant_id === tenantId)
    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    const fallbackItems = mockProducts.filter((item) => !tenantId || item.tenant_id === tenantId)
    return { items: fallbackItems, total: fallbackItems.length, fallback: true }
  }
}

export const createProduct = async (input: CreateProductPayload) => {
  const response = await apiRequest<ProductRecord>('/api/v1/products/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

export const getRecipes = async (tenantId?: string) => {
  try {
    const payload = await apiRequest<unknown>('/api/v1/recipes/')
    const items = normalizeArray<RecipeRecord>(payload.data).filter(
      (item) => (!tenantId || item.tenant_id === tenantId),
    )
    const fallbackItems = mockRecipes.filter((item) => !tenantId || item.tenant_id === tenantId)
    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    const fallbackItems = mockRecipes.filter((item) => !tenantId || item.tenant_id === tenantId)
    return { items: fallbackItems, total: fallbackItems.length, fallback: true }
  }
}

export const createRecipe = async (input: CreateRecipePayload) => {
  const response = await apiRequest<RecipeRecord>('/api/v1/recipes/', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

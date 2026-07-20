import { apiRequest } from '@/services/http'
import { mockProducts, mockRecipeLines, mockRecipes, mockSchools } from '@/services/mock-data'
import type {
  CreateProductPayload,
  CreateRecipePayload,
  CreateRecipeLinePayload,
  CreateSchoolPayload,
  ProductRecord,
  RecipeRecord,
  RecipeLineRecord,
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

export const getSchoolById = async (schoolId: string) => {
  try {
    const payload = await apiRequest<SchoolRecord>(`/api/v1/geography/schools/${schoolId}`)
    return { item: payload.data, fallback: false }
  } catch {
    return { item: mockSchools.find((item) => item.id === schoolId) || mockSchools[0], fallback: true }
  }
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

export const getProductById = async (productId: string) => {
  try {
    const payload = await apiRequest<ProductRecord>(`/api/v1/products/${productId}`)
    return { item: payload.data, fallback: false }
  } catch {
    return { item: mockProducts.find((item) => item.id === productId) || mockProducts[0], fallback: true }
  }
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

export const getRecipeById = async (recipeId: string) => {
  try {
    const payload = await apiRequest<RecipeRecord>(`/api/v1/recipes/${recipeId}`)
    return { item: payload.data, fallback: false }
  } catch {
    return { item: mockRecipes.find((item) => item.id === recipeId) || mockRecipes[0], fallback: true }
  }
}

export const getRecipeLines = async (recipeId: string) => {
  try {
    const payload = await apiRequest<RecipeLineRecord[]>(`/api/v1/recipes/${recipeId}/lines`)
    const items = normalizeArray<RecipeLineRecord>(payload.data)
    const fallbackItems = mockRecipeLines.filter((item) => item.recipe_id === recipeId)
    return {
      items: items.length ? items : fallbackItems,
      total: payload.meta?.total ?? (items.length || fallbackItems.length),
      fallback: !items.length,
    }
  } catch {
    const fallbackItems = mockRecipeLines.filter((item) => item.recipe_id === recipeId)
    return { items: fallbackItems, total: fallbackItems.length, fallback: true }
  }
}

export const createRecipeLine = async (recipeId: string, input: CreateRecipeLinePayload) => {
  const response = await apiRequest<RecipeLineRecord>(`/api/v1/recipes/${recipeId}/lines`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}

import { apiRequest } from '@/services/http'
import { mockBudgets, mockInventory, mockMealPlans } from '@/services/mock-data'
import type { BudgetSummary, InventoryBalance, MealPlan } from '@/types/domain'

const totalFromEnvelope = (payload: { meta?: { total?: number } }, fallback: number) =>
  payload.meta?.total ?? fallback

export const getMealPlans = async () => {
  try {
    const payload = await apiRequest<MealPlan[]>('/api/v1/meal-plans/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockMealPlans, total: mockMealPlans.length }
  }
}

export const getInventoryBalances = async () => {
  try {
    const payload = await apiRequest<InventoryBalance[]>('/api/v1/inventory/balances/')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockInventory, total: mockInventory.length }
  }
}

export const getBudgets = async () => {
  try {
    const payload = await apiRequest<BudgetSummary[]>('/api/v1/budgets')
    return { items: payload.data || [], total: totalFromEnvelope(payload, payload.data?.length || 0) }
  } catch {
    return { items: mockBudgets, total: mockBudgets.length }
  }
}

import { createRouter, createWebHistory } from 'vue-router'
import { readStoredSession } from '@/utils/auth-storage'
import DashboardView from '@/views/DashboardView.vue'
import BudgetPlanningView from '@/views/BudgetPlanningView.vue'
import CostingView from '@/views/CostingView.vue'
import FinanceView from '@/views/FinanceView.vue'
import ForbiddenView from '@/views/ForbiddenView.vue'
import GoodsReceiptDetailView from '@/views/GoodsReceiptDetailView.vue'
import GisView from '@/views/GisView.vue'
import InventoryView from '@/views/InventoryView.vue'
import LoginView from '@/views/LoginView.vue'
import MealPlansView from '@/views/MealPlansView.vue'
import OnboardingWizardView from '@/views/OnboardingWizardView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import ProductionCostSheetDetailView from '@/views/ProductionCostSheetDetailView.vue'
import ProductionOrderDetailView from '@/views/ProductionOrderDetailView.vue'
import ProductsView from '@/views/ProductsView.vue'
import RecipeDetailView from '@/views/RecipeDetailView.vue'
import RecipesView from '@/views/RecipesView.vue'
import RegisterInfoView from '@/views/RegisterInfoView.vue'
import ProcurementView from '@/views/ProcurementView.vue'
import SchoolDetailView from '@/views/SchoolDetailView.vue'
import PurchaseOrderDetailView from '@/views/PurchaseOrderDetailView.vue'
import PurchaseRequestDetailView from '@/views/PurchaseRequestDetailView.vue'
import SchoolsView from '@/views/SchoolsView.vue'
import SppgCreateView from '@/views/SppgCreateView.vue'
import SppgDetailView from '@/views/SppgDetailView.vue'
import SppgEditView from '@/views/SppgEditView.vue'
import SppgListView from '@/views/SppgListView.vue'
import SupplierInvoiceDetailView from '@/views/SupplierInvoiceDetailView.vue'
import SupplierPaymentDetailView from '@/views/SupplierPaymentDetailView.vue'
import TenantCreateView from '@/views/TenantCreateView.vue'
import TenantDetailView from '@/views/TenantDetailView.vue'
import TenantsListView from '@/views/TenantsListView.vue'
import UserCreateView from '@/views/UserCreateView.vue'
import UsersListView from '@/views/UsersListView.vue'
import WorkflowApprovalsView from '@/views/WorkflowApprovalsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, bareLayout: true } },
    { path: '/register', name: 'register', component: RegisterInfoView, meta: { guestOnly: true, bareLayout: true } },
    { path: '/forbidden', name: 'forbidden', component: ForbiddenView, meta: { requiresAuth: true } },
    { path: '/', name: 'dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/meal-plans', name: 'meal-plans', component: MealPlansView, meta: { requiresAuth: true } },
    { path: '/inventory', name: 'inventory', component: InventoryView, meta: { requiresAuth: true } },
    { path: '/finance', name: 'finance', component: FinanceView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/costing', name: 'costing', component: CostingView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/budgets', name: 'budgets', component: BudgetPlanningView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/workflow-approvals', name: 'workflow-approvals', component: WorkflowApprovalsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/procurement', name: 'procurement', component: ProcurementView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/purchase-requests/:purchaseRequestId', name: 'purchase-request-detail', component: PurchaseRequestDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/purchase-orders/:purchaseOrderId', name: 'purchase-order-detail', component: PurchaseOrderDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/goods-receipts/:goodsReceiptId', name: 'goods-receipt-detail', component: GoodsReceiptDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/supplier-invoices/:supplierInvoiceId', name: 'supplier-invoice-detail', component: SupplierInvoiceDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/supplier-payments/:supplierPaymentId', name: 'supplier-payment-detail', component: SupplierPaymentDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/production-orders/:productionOrderId', name: 'production-order-detail', component: ProductionOrderDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/production-orders/:productionOrderId/cost-sheet', name: 'production-order-cost-sheet', component: ProductionCostSheetDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/gis', name: 'gis', component: GisView, meta: { requiresAuth: true } },
    { path: '/schools', name: 'schools', component: SchoolsView, meta: { requiresAuth: true } },
    { path: '/schools/:schoolId', name: 'schools-detail', component: SchoolDetailView, meta: { requiresAuth: true } },
    { path: '/products', name: 'products', component: ProductsView, meta: { requiresAuth: true } },
    { path: '/products/:productId', name: 'products-detail', component: ProductDetailView, meta: { requiresAuth: true } },
    { path: '/recipes', name: 'recipes', component: RecipesView, meta: { requiresAuth: true } },
    { path: '/recipes/:recipeId', name: 'recipes-detail', component: RecipeDetailView, meta: { requiresAuth: true } },
    { path: '/onboarding/wizard', name: 'onboarding-wizard', component: OnboardingWizardView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin'] } },
    { path: '/sppg', name: 'sppg', component: SppgListView, meta: { requiresAuth: true } },
    { path: '/sppg/create', name: 'sppg-create', component: SppgCreateView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'operations_manager'] } },
    { path: '/sppg/:sppgId', name: 'sppg-detail', component: SppgDetailView, meta: { requiresAuth: true } },
    { path: '/sppg/:sppgId/edit', name: 'sppg-edit', component: SppgEditView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'operations_manager'] } },
    { path: '/tenants', name: 'tenants', component: TenantsListView, meta: { requiresAuth: true, roles: ['super_admin'] } },
    { path: '/tenants/create', name: 'tenants-create', component: TenantCreateView, meta: { requiresAuth: true, roles: ['super_admin'] } },
    { path: '/tenants/:tenantId', name: 'tenants-detail', component: TenantDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin'] } },
    { path: '/users', name: 'users', component: UsersListView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin'] } },
    { path: '/users/create', name: 'users-create', component: UserCreateView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin'] } },
  ],
})

router.beforeEach((to) => {
  const session = readStoredSession()
  const isAuthenticated = Boolean(session?.accessToken)
  const roles = session?.roles || []

  if (to.meta.guestOnly && isAuthenticated) {
    return '/'
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const hasRole = to.meta.roles.some((role) => roles.includes(String(role)))
    if (!hasRole) {
      return '/forbidden'
    }
  }

  return true
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import { readStoredSession } from '@/utils/auth-storage'

const LoginView = () => import('@/views/LoginView.vue')
const RegisterInfoView = () => import('@/views/RegisterInfoView.vue')
const ForbiddenView = () => import('@/views/ForbiddenView.vue')
const DashboardView = () => import('@/views/DashboardView.vue')
const MealPlansView = () => import('@/views/MealPlansView.vue')
const InventoryView = () => import('@/views/InventoryView.vue')
const FinanceView = () => import('@/views/FinanceView.vue')
const FinanceReportsView = () => import('@/views/FinanceReportsView.vue')
const AccountsView = () => import('@/views/AccountsView.vue')
const JournalEntriesView = () => import('@/views/JournalEntriesView.vue')
const JournalEntryDetailView = () => import('@/views/JournalEntryDetailView.vue')
const CostingView = () => import('@/views/CostingView.vue')
const BudgetPlanningView = () => import('@/views/BudgetPlanningView.vue')
const BudgetDetailView = () => import('@/views/BudgetDetailView.vue')
const WorkflowApprovalsView = () => import('@/views/WorkflowApprovalsView.vue')
const GovernmentClaimsView = () => import('@/views/GovernmentClaimsView.vue')
const GovernmentClaimDetailView = () => import('@/views/GovernmentClaimDetailView.vue')
const FundingAgreementsView = () => import('@/views/FundingAgreementsView.vue')
const FundingAgreementDetailView = () => import('@/views/FundingAgreementDetailView.vue')
const ProcurementView = () => import('@/views/ProcurementView.vue')
const SupplierDetailView = () => import('@/views/SupplierDetailView.vue')
const PurchaseRequestDetailView = () => import('@/views/PurchaseRequestDetailView.vue')
const PurchaseOrderDetailView = () => import('@/views/PurchaseOrderDetailView.vue')
const GoodsReceiptDetailView = () => import('@/views/GoodsReceiptDetailView.vue')
const SupplierInvoiceDetailView = () => import('@/views/SupplierInvoiceDetailView.vue')
const SupplierPaymentDetailView = () => import('@/views/SupplierPaymentDetailView.vue')
const ProductionOrderDetailView = () => import('@/views/ProductionOrderDetailView.vue')
const ProductionCostSheetDetailView = () => import('@/views/ProductionCostSheetDetailView.vue')
const GisView = () => import('@/views/GisView.vue')
const SchoolsView = () => import('@/views/SchoolsView.vue')
const SchoolDetailView = () => import('@/views/SchoolDetailView.vue')
const ProductsView = () => import('@/views/ProductsView.vue')
const ProductDetailView = () => import('@/views/ProductDetailView.vue')
const RecipesView = () => import('@/views/RecipesView.vue')
const RecipeDetailView = () => import('@/views/RecipeDetailView.vue')
const OnboardingWizardView = () => import('@/views/OnboardingWizardView.vue')
const SppgListView = () => import('@/views/SppgListView.vue')
const SppgCreateView = () => import('@/views/SppgCreateView.vue')
const SppgDetailView = () => import('@/views/SppgDetailView.vue')
const SppgEditView = () => import('@/views/SppgEditView.vue')
const TenantsListView = () => import('@/views/TenantsListView.vue')
const TenantCreateView = () => import('@/views/TenantCreateView.vue')
const TenantDetailView = () => import('@/views/TenantDetailView.vue')
const UsersListView = () => import('@/views/UsersListView.vue')
const UserCreateView = () => import('@/views/UserCreateView.vue')

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
    { path: '/finance/reports', name: 'finance-reports', component: FinanceReportsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/accounting/accounts', name: 'accounts', component: AccountsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/accounting/journal-entries', name: 'journal-entries', component: JournalEntriesView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/accounting/journal-entries/:journalEntryId', name: 'journal-entry-detail', component: JournalEntryDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/costing', name: 'costing', component: CostingView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/budgets', name: 'budgets', component: BudgetPlanningView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/budgets/:budgetId', name: 'budget-detail', component: BudgetDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/workflow-approvals', name: 'workflow-approvals', component: WorkflowApprovalsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/government-claims', name: 'government-claims', component: GovernmentClaimsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/government-claims/:claimId', name: 'government-claim-detail', component: GovernmentClaimDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager', 'operations_manager'] } },
    { path: '/funding', name: 'funding', component: FundingAgreementsView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/funding/agreements/:agreementId', name: 'funding-agreement-detail', component: FundingAgreementDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'finance_manager'] } },
    { path: '/procurement', name: 'procurement', component: ProcurementView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
    { path: '/procurement/suppliers/:supplierId', name: 'supplier-detail', component: SupplierDetailView, meta: { requiresAuth: true, roles: ['super_admin', 'tenant_admin', 'procurement_officer', 'operations_manager', 'finance_manager'] } },
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

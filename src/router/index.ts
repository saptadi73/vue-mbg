import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import FinanceView from '@/views/FinanceView.vue'
import GisView from '@/views/GisView.vue'
import InventoryView from '@/views/InventoryView.vue'
import MealPlansView from '@/views/MealPlansView.vue'
import OnboardingWizardView from '@/views/OnboardingWizardView.vue'
import ProductsView from '@/views/ProductsView.vue'
import RecipesView from '@/views/RecipesView.vue'
import SchoolsView from '@/views/SchoolsView.vue'
import SppgCreateView from '@/views/SppgCreateView.vue'
import SppgDetailView from '@/views/SppgDetailView.vue'
import SppgEditView from '@/views/SppgEditView.vue'
import SppgListView from '@/views/SppgListView.vue'
import TenantCreateView from '@/views/TenantCreateView.vue'
import TenantDetailView from '@/views/TenantDetailView.vue'
import TenantsListView from '@/views/TenantsListView.vue'
import UserCreateView from '@/views/UserCreateView.vue'
import UsersListView from '@/views/UsersListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/meal-plans', name: 'meal-plans', component: MealPlansView },
    { path: '/inventory', name: 'inventory', component: InventoryView },
    { path: '/finance', name: 'finance', component: FinanceView },
    { path: '/gis', name: 'gis', component: GisView },
    { path: '/schools', name: 'schools', component: SchoolsView },
    { path: '/products', name: 'products', component: ProductsView },
    { path: '/recipes', name: 'recipes', component: RecipesView },
    { path: '/onboarding/wizard', name: 'onboarding-wizard', component: OnboardingWizardView },
    { path: '/sppg', name: 'sppg', component: SppgListView },
    { path: '/sppg/create', name: 'sppg-create', component: SppgCreateView },
    { path: '/sppg/:sppgId', name: 'sppg-detail', component: SppgDetailView },
    { path: '/sppg/:sppgId/edit', name: 'sppg-edit', component: SppgEditView },
    { path: '/tenants', name: 'tenants', component: TenantsListView },
    { path: '/tenants/create', name: 'tenants-create', component: TenantCreateView },
    { path: '/tenants/:tenantId', name: 'tenants-detail', component: TenantDetailView },
    { path: '/users', name: 'users', component: UsersListView },
    { path: '/users/create', name: 'users-create', component: UserCreateView },
  ],
})

export default router

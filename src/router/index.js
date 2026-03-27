import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/dashboard' },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../pages/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../pages/RegisterPage.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('../components/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../pages/DashboardPage.vue') },
      { path: 'products', name: 'Products', component: () => import('../pages/ProductsPage.vue') },
      { path: 'inventory', name: 'Inventory', component: () => import('../pages/InventoryPage.vue') },
      { path: 'purchases', name: 'Purchases', component: () => import('../pages/PurchasesPage.vue') },
      { path: 'sales', name: 'Sales', component: () => import('../pages/SalesPage.vue') },
      { path: 'suppliers', name: 'Suppliers', component: () => import('../pages/SuppliersPage.vue') },
      { path: 'reports', name: 'Reports', component: () => import('../pages/ReportsPage.vue') },
      { path: 'notifications', name: 'Notifications', component: () => import('../pages/NotificationsPage.vue') },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.loading) await auth.init()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return { name: 'Login' }
  if (to.meta.public && auth.isLoggedIn) return { name: 'Dashboard' }
})

export default router

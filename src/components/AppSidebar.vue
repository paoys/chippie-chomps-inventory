<template>
  <!-- Mobile overlay -->
  <div v-if="isOpen" class="fixed inset-0 bg-black/30 z-20 lg:hidden" @click="$emit('close')"></div>

  <!-- Sidebar -->
  <aside
    class="fixed top-0 left-0 h-full w-64 bg-white border-r border-paw-border z-30 flex flex-col transition-transform duration-300"
    :class="isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-paw-border">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img src="/favicon.svg" alt="Chippie Chomps Logo" class="w-full h-full object-contain rounded-xl" />
      </div>
      <div>
        <div class="font-display font-800 text-gray-800 leading-tight">Chippie Chomps</div>
        <div class="text-xs text-gray-400">Pet Food Supply</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-4 py-4 space-y-1">
      <div class="text-xs font-700 text-gray-400 uppercase tracking-widest px-4 mb-2">Main Menu</div>
      <router-link v-for="item in navItems" :key="item.to" :to="item.to" class="sidebar-link"
        :class="{ active: $route.path === item.to }" @click="$emit('close')">
        <span class="text-lg">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span v-if="item.badge" class="ml-auto badge-red text-xs">{{ item.badge }}</span>
      </router-link>

      <div class="text-xs font-700 text-gray-400 uppercase tracking-widest px-4 mt-4 mb-2">Account</div>

      <!-- User Settings in Sidebar -->
      <button class="sidebar-link w-full text-left" :class="{ active: showSettingsPanel }"
        @click="showSettingsPanel = !showSettingsPanel">
        <span class="text-lg">⚙️</span>
        <span>Settings</span>
        <span class="ml-auto text-xs transition-transform" :class="showSettingsPanel ? 'rotate-180' : ''">▾</span>
      </button>

      <!-- Settings submenu -->
      <transition name="slide-down">
        <div v-if="showSettingsPanel" class="pl-4 space-y-1">
          <button v-for="setting in settingsItems" :key="setting.label"
            class="sidebar-link w-full text-left text-sm py-2" @click="setting.action">
            <span>{{ setting.icon }}</span>
            <span>{{ setting.label }}</span>
          </button>
        </div>
      </transition>
    </nav>

    <!-- User section at bottom -->
    <div class="px-4 py-4 border-t border-paw-border">
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-50 mb-2">
        <div
          class="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {{ authStore.avatarInitials }}
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-gray-800 truncate">{{ authStore.displayName }}</div>
          <div class="text-xs text-gray-400 truncate">{{ authStore.profile?.role || 'Staff' }}</div>
        </div>
      </div>
      <button class="sidebar-link w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600"
        @click="handleLogout">
        <span>🚪</span>
        <span>Sign Out</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAppStore } from '../stores/app'

defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'open-settings'])
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()
const showSettingsPanel = ref(false)

const navItems = computed(() => [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/products', icon: '🛍️', label: 'Products' },
  { to: '/inventory', icon: '📦', label: 'Inventory', badge: appStore.lowStockProducts.length > 0 ? appStore.lowStockProducts.length : null },
  { to: '/purchases', icon: '🛒', label: 'Purchases' },
  { to: '/sales', icon: '💳', label: 'Sales' },
  { to: '/suppliers', icon: '🏭', label: 'Suppliers' },
  { to: '/reports', icon: '📈', label: 'Reports' },
])

const settingsItems = [
  { icon: '👤', label: 'Edit Profile', action: () => { emit('open-settings', 'profile'); emit('close') } },
  { icon: '🔐', label: 'Change Password', action: () => { emit('open-settings', 'password'); emit('close') } },
  { icon: '🎨', label: 'Preferences', action: () => { emit('open-settings', 'preferences'); emit('close') } },
]

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

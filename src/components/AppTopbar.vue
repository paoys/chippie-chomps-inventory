<template>
  <header class="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-white border-b border-paw-border z-10 flex items-center px-4 lg:px-6 gap-3">
    <!-- Mobile menu toggle -->
    <button @click="$emit('toggle-sidebar')" class="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600">
      ☰
    </button>

    <!-- Page title -->
    <div class="flex-1 min-w-0">
      <h1 class="font-display font-700 text-gray-800 text-lg leading-tight truncate">{{ pageTitle }}</h1>
    </div>

    <!-- Right actions -->
    <div class="flex items-center gap-2">
      <!-- Search button -->
      <!-- <button class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 text-sm">🔍</button> -->

      <!-- Notifications -->
      <div class="relative" ref="notifRef">
        <button
          @click="toggleNotifications"
          class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 text-sm relative"
          :class="notifOpen ? 'bg-teal-50 text-teal-600' : ''"
        >
          🔔
          <span
            v-if="notifStore.hasUnread"
            class="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-400 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
          >
            {{ notifStore.unreadCount > 9 ? '9+' : notifStore.unreadCount }}
          </span>
        </button>

        <!-- Notifications Dropdown -->
        <transition name="slide-down">
          <div
            v-if="notifOpen"
            class="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-paw-border overflow-hidden"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div>
                <h3 class="font-display font-700 text-gray-800 text-sm">Notifications</h3>
                <p class="text-xs text-gray-400">{{ notifStore.unreadCount }} unread</p>
              </div>
              <button
                v-if="notifStore.hasUnread"
                @click="notifStore.markAllAsRead()"
                class="text-xs text-teal-600 font-semibold hover:text-teal-700"
              >
                Mark all read
              </button>
            </div>

            <!-- Notifications list -->
            <div class="max-h-80 overflow-y-auto">
              <div v-if="notifStore.notifications.length === 0" class="py-10 text-center text-gray-400">
                <div class="text-3xl mb-2">🔕</div>
                <p class="text-sm">No notifications yet</p>
              </div>

              <div
                v-for="notif in notifStore.notifications"
                :key="notif.id"
                class="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
                :class="{ 'bg-teal-50/40': !notif.is_read }"
                @click="notifStore.markAsRead(notif.id)"
              >
                <span class="text-base flex-shrink-0 mt-0.5">{{ notifStore.typeIcon[notif.type] || 'ℹ️' }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 leading-tight" :class="{ 'text-gray-600': notif.is_read }">
                    {{ notif.title }}
                  </p>
                  <p class="text-xs text-gray-500 mt-0.5 leading-tight">{{ notif.message }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ notifStore.timeAgo(notif.created_at) }}</p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <span v-if="!notif.is_read" class="w-2 h-2 bg-teal-400 rounded-full"></span>
                  <button
                    @click.stop="notifStore.deleteNotification(notif.id)"
                    class="w-6 h-6 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 text-xs items-center justify-center hidden group-hover:flex"
                  >✕</button>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-4 py-3 border-t border-gray-100 text-center">
              <button class="text-xs text-teal-600 font-semibold hover:text-teal-700">View all notifications</button>
            </div>
          </div>
        </transition>
      </div>

      <!-- User menu -->
      <div class="relative" ref="userRef">
        <button
          @click="toggleUser"
          class="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-gray-100 transition-colors"
          :class="userOpen ? 'bg-gray-100' : ''"
        >
          <div class="w-8 h-8 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
            {{ authStore.avatarInitials }}
          </div>
          <div class="hidden sm:block text-left">
            <div class="text-sm font-semibold text-gray-800 leading-tight">{{ authStore.displayName }}</div>
            <div class="text-xs text-gray-400 leading-tight">{{ authStore.profile?.role || 'Staff' }}</div>
          </div>
          <span class="text-gray-400 text-xs hidden sm:block">▾</span>
        </button>

        <!-- User Dropdown -->
        <transition name="slide-down">
          <div v-if="userOpen" class="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-2xl border border-paw-border overflow-hidden">
            <!-- User header -->
            <div class="px-4 py-4 bg-gradient-to-br from-teal-50 to-white border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {{ authStore.avatarInitials }}
                </div>
                <div>
                  <div class="font-display font-700 text-gray-800">{{ authStore.displayName }}</div>
                  <div class="text-xs text-gray-500">{{ authStore.user?.email }}</div>
                  <span class="badge-green text-xs mt-0.5 inline-block">{{ authStore.profile?.role || 'Staff' }}</span>
                </div>
              </div>
            </div>

            <!-- Menu items -->
            <div class="py-1.5">
              <button
                v-for="item in userMenuItems"
                :key="item.label"
                @click="item.action"
                class="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left"
                :class="item.danger ? 'text-red-500 hover:bg-red-50' : ''"
              >
                <span class="text-base w-5 text-center">{{ item.icon }}</span>
                <span class="font-medium">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationsStore } from '../stores/notifications'

const emit = defineEmits(['toggle-sidebar', 'open-settings'])
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notifStore = useNotificationsStore()

const notifOpen = ref(false)
const userOpen = ref(false)
const notifRef = ref(null)
const userRef = ref(null)

const pageTitles = {
  '/dashboard': '📊 Dashboard',
  '/products': '🛍️ Products',
  '/inventory': '📦 Inventory',
  '/purchases': '🛒 Purchases',
  '/sales': '💳 Sales',
  '/suppliers': '🏭 Suppliers',
  '/reports': '📈 Reports',
}

const pageTitle = computed(() => pageTitles[route.path] || 'Chippie Chomps')

function toggleNotifications() {
  notifOpen.value = !notifOpen.value
  userOpen.value = false
}

function toggleUser() {
  userOpen.value = !userOpen.value
  notifOpen.value = false
}

const userMenuItems = [
  { icon: '👤', label: 'Edit Profile', action: () => { openSettings('profile'); userOpen.value = false } },
  { icon: '🔐', label: 'Change Password', action: () => { openSettings('password'); userOpen.value = false } },
  { icon: '🎨', label: 'Preferences', action: () => { openSettings('preferences'); userOpen.value = false } },
  { icon: '🚪', label: 'Sign Out', action: handleLogout, danger: true },
]

function openSettings(tab) {
  emit('open-settings', tab)
}

async function handleLogout() {
  userOpen.value = false
  await authStore.logout()
  router.push('/login')
}

// Close dropdowns on outside click
function handleClick(e) {
  if (notifRef.value && !notifRef.value.contains(e.target)) notifOpen.value = false
  if (userRef.value && !userRef.value.contains(e.target)) userOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClick)
  notifStore.fetchNotifications().catch(() => notifStore.loadMockNotifications())
})
onUnmounted(() => document.removeEventListener('click', handleClick))
</script>

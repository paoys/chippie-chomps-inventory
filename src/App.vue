<template>
  <!-- <div v-if="authStore.loading" class="fixed inset-0 bg-paw-bg flex items-center justify-center">
    <div class="text-center">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl shadow-soft mb-4 animate-pulse">
        <span class="text-3xl">🐾</span>
      </div>
      <p class="text-gray-500 text-sm">Loading Chippie Chomps...</p>
    </div>
  </div> -->
  <!-- <router-view v-else /> -->
  <router-view />
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useNotificationsStore } from './stores/notifications'
import { useAppStore } from './stores/app'

const authStore = useAuthStore()
const notifStore = useNotificationsStore()
const appStore = useAppStore()

onMounted(async () => {
  await authStore.init()
  if (authStore.isLoggedIn) {
    appStore.loadAll()
    notifStore.fetchNotifications().catch(() => notifStore.loadMockNotifications())
  }
})
</script>

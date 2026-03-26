<template>
  <div class="flex h-screen overflow-hidden">
    <AppSidebar
      :is-open="sidebarOpen"
      @close="sidebarOpen = false"
      @open-settings="openSettings"
    />

    <div class="flex-1 flex flex-col min-w-0 lg:ml-64">
      <AppTopbar
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
        @open-settings="openSettings"
      />

      <main class="flex-1 overflow-y-auto pt-16">
        <div class="p-4 lg:p-6">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- Settings Modal -->
    <UserSettingsModal
      v-model="settingsOpen"
      :initial-tab="settingsTab"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppTopbar from './AppTopbar.vue'
import UserSettingsModal from './UserSettingsModal.vue'

const sidebarOpen = ref(false)
const settingsOpen = ref(false)
const settingsTab = ref('profile')

function openSettings(tab = 'profile') {
  settingsTab.value = tab
  settingsOpen.value = true
}
</script>

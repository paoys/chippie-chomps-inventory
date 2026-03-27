<template>
  <div class="space-y-5">
    <!-- Header actions -->
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div class="flex gap-2 flex-wrap">
        <button
          v-for="f in filters"
          :key="f.value"
          @click="activeFilter = f.value"
          class="px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
          :class="activeFilter === f.value
            ? 'bg-teal-500 text-white border-teal-500'
            : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
        >
          {{ f.label }}
          <span v-if="f.count !== undefined" class="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
            :class="activeFilter === f.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'">
            {{ f.count }}
          </span>
        </button>
      </div>
      <div class="flex gap-2">
        <button
          v-if="notifStore.hasUnread"
          @click="notifStore.markAllAsRead()"
          class="btn-secondary text-sm py-2 flex items-center gap-2"
        >
          ✅ Mark all as read
        </button>
        <button
          v-if="notifStore.notifications.length > 0"
          @click="confirmClearAll = true"
          class="btn-danger text-sm py-2 flex items-center gap-2"
        >
          🗑️ Clear all
        </button>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div v-for="stat in stats" :key="stat.label" class="card py-4 flex items-center gap-3">
        <div :class="`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${stat.bg}`">{{ stat.icon }}</div>
        <div>
          <div class="font-display font-800 text-lg text-gray-800">{{ stat.value }}</div>
          <div class="text-xs text-gray-500">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <!-- Notifications list -->
    <div class="card p-0 overflow-hidden">
      <div v-if="notifStore.loading" class="py-16 text-center text-gray-400">
        <div class="text-3xl mb-2">🔔</div>
        <p class="text-sm">Loading notifications...</p>
      </div>

      <div v-else-if="filtered.length === 0" class="py-16 text-center text-gray-400">
        <div class="text-4xl mb-3">🔕</div>
        <p class="font-semibold text-gray-500">No notifications</p>
        <p class="text-sm mt-1">
          {{ activeFilter === 'unread' ? "You're all caught up!" : "Nothing here yet." }}
        </p>
      </div>

      <div v-else>
        <!-- Group by date -->
        <div v-for="group in groupedNotifs" :key="group.label">
          <!-- Date header -->
          <div class="px-6 py-2 bg-gray-50/60 border-b border-gray-100">
            <span class="text-xs font-700 text-gray-400 uppercase tracking-widest">{{ group.label }}</span>
          </div>

          <!-- Notification row -->
          <div
            v-for="notif in group.items"
            :key="notif.id"
            class="flex items-start gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group"
            :class="{ 'bg-teal-50/30': !notif.is_read }"
            @click="notifStore.markAsRead(notif.id)"
          >
            <!-- Type icon -->
            <div :class="`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${typeColors[notif.type] || 'bg-gray-100'}`">
              {{ notifStore.typeIcon[notif.type] || 'ℹ️' }}
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-semibold leading-tight"
                  :class="notif.is_read ? 'text-gray-600' : 'text-gray-800'">
                  {{ notif.title }}
                </p>
                <span class="text-xs text-gray-400 flex-shrink-0 mt-0.5">{{ notifStore.timeAgo(notif.created_at) }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-1 leading-relaxed">{{ notif.message }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span :class="`text-xs font-semibold px-2 py-0.5 rounded-full ${typeBadge[notif.type] || 'badge-blue'}`">
                  {{ notif.type || 'info' }}
                </span>
                <span v-if="!notif.is_read" class="text-xs text-teal-600 font-semibold">● Unread</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                v-if="!notif.is_read"
                @click.stop="notifStore.markAsRead(notif.id)"
                class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 flex items-center justify-center text-xs"
                title="Mark as read"
              >✓</button>
              <button
                @click.stop="notifStore.deleteNotification(notif.id)"
                class="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs"
                title="Delete"
              >🗑️</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clear All Confirm Modal -->
    <AppModal v-model="confirmClearAll" title="🗑️ Clear All Notifications" size="sm">
      <p class="text-gray-600">This will permanently delete all <strong>{{ notifStore.notifications.length }}</strong> notifications. This cannot be undone.</p>
      <template #footer>
        <button @click="confirmClearAll = false" class="btn-secondary">Cancel</button>
        <button @click="clearAll" class="btn-danger" :disabled="clearing">
          <span v-if="clearing" class="animate-spin text-xs mr-1">⏳</span>
          Clear All
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNotificationsStore } from '../stores/notifications'
import AppModal from '../components/AppModal.vue'

const notifStore = useNotificationsStore()
const activeFilter = ref('all')
const confirmClearAll = ref(false)
const clearing = ref(false)

const filters = computed(() => [
  { label: 'All', value: 'all', count: notifStore.notifications.length },
  { label: 'Unread', value: 'unread', count: notifStore.unreadCount },
  { label: 'Read', value: 'read', count: notifStore.notifications.filter(n => n.is_read).length },
  { label: 'Warnings', value: 'warning', count: notifStore.notifications.filter(n => n.type === 'warning').length },
  { label: 'Success', value: 'success', count: notifStore.notifications.filter(n => n.type === 'success').length },
])

const filtered = computed(() => {
  if (activeFilter.value === 'all') return notifStore.notifications
  if (activeFilter.value === 'unread') return notifStore.notifications.filter(n => !n.is_read)
  if (activeFilter.value === 'read') return notifStore.notifications.filter(n => n.is_read)
  return notifStore.notifications.filter(n => n.type === activeFilter.value)
})

// Group notifications by Today / Yesterday / Older
const groupedNotifs = computed(() => {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups = { Today: [], Yesterday: [], 'This Week': [], Older: [] }

  filtered.value.forEach(n => {
    const d = new Date(n.created_at).toDateString()
    const diff = Date.now() - new Date(n.created_at).getTime()
    if (d === today) groups['Today'].push(n)
    else if (d === yesterday) groups['Yesterday'].push(n)
    else if (diff < 7 * 86400000) groups['This Week'].push(n)
    else groups['Older'].push(n)
  })

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
})

const stats = computed(() => [
  { icon: '🔔', label: 'Total', value: notifStore.notifications.length, bg: 'bg-teal-50' },
  { icon: '●', label: 'Unread', value: notifStore.unreadCount, bg: 'bg-blue-50' },
  { icon: '⚠️', label: 'Warnings', value: notifStore.notifications.filter(n => n.type === 'warning').length, bg: 'bg-yellow-50' },
  { icon: '✅', label: 'Success', value: notifStore.notifications.filter(n => n.type === 'success').length, bg: 'bg-teal-50' },
])

const typeColors = {
  success: 'bg-teal-100',
  warning: 'bg-yellow-100',
  error: 'bg-red-100',
  info: 'bg-blue-100',
}

const typeBadge = {
  success: 'badge-green',
  warning: 'badge-yellow',
  error: 'badge-red',
  info: 'badge-blue',
}

async function clearAll() {
  clearing.value = true
  // Delete all one by one
  const ids = [...notifStore.notifications.map(n => n.id)]
  for (const id of ids) {
    await notifStore.deleteNotification(id)
  }
  clearing.value = false
  confirmClearAll.value = false
}

onMounted(() => {
  if (notifStore.notifications.length === 0) {
    notifStore.fetchNotifications().catch(() => notifStore.loadMockNotifications())
  }
})
</script>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref([])
  const loading = ref(false)

  const unreadCount = computed(() => notifications.value.filter(n => !n.is_read).length)
  const hasUnread = computed(() => unreadCount.value > 0)

  async function fetchNotifications() {
    const auth = useAuthStore()
    if (!auth.user) return
    loading.value = true
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
    if (!error && data) notifications.value = data
    loading.value = false
  }

  async function markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    if (!error) {
      const n = notifications.value.find(n => n.id === id)
      if (n) n.is_read = true
    }
  }

  async function markAllAsRead() {
    const auth = useAuthStore()
    if (!auth.user) return
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', auth.user.id)
    if (!error) notifications.value.forEach(n => n.is_read = true)
  }

  async function deleteNotification(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
    if (!error) {
      notifications.value = notifications.value.filter(n => n.id !== id)
    }
  }

  // Fallback mock notifications when Supabase not configured
  function loadMockNotifications() {
    notifications.value = [
      { id: '1', title: 'Welcome to Chippie Chomps! 🐾', message: 'Your account is ready. Start managing your pet food inventory.', type: 'success', is_read: false, created_at: new Date().toISOString() },
      { id: '2', title: 'Low Stock Alert ⚠️', message: 'Tuna Delight Wet Pack is running low (8 units remaining).', type: 'warning', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
      { id: '3', title: 'New Supplier Added', message: 'Wholesome Paws Ltd has been added to your supplier list.', type: 'info', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
      { id: '4', title: 'Sales Target Reached 🎉', message: "You've reached 80% of this month's sales target!", type: 'success', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
    ]
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    const hrs = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    if (hrs < 24) return `${hrs}h ago`
    return `${days}d ago`
  }

  const typeIcon = {
    success: '✅',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️',
  }

  return {
    notifications, loading,
    unreadCount, hasUnread,
    fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
    loadMockNotifications, timeAgo, typeIcon
  }
})

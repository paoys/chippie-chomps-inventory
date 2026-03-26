<template>
  <transition name="modal">
    <div v-if="modelValue" class="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
      @click.self="$emit('update:modelValue', false)">
      <div class="modal-box bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 class="font-display font-800 text-gray-800">⚙️ Settings</h2>
          <button @click="$emit('update:modelValue', false)"
            class="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-100 px-6">
          <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
            class="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors -mb-px"
            :class="activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'">
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="px-6 py-5 max-h-[60vh] overflow-y-auto">

          <!-- Profile Tab -->
          <div v-if="activeTab === 'profile'" class="space-y-4">
            <!-- Avatar -->
            <div class="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
              <div
                class="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                {{ authStore.avatarInitials }}
              </div>
              <div>
                <p class="font-semibold text-gray-800">{{ authStore.displayName }}</p>
                <p class="text-sm text-gray-500">{{ authStore.user?.email }}</p>
                <span class="badge-green text-xs mt-1 inline-block">{{ authStore.profile?.role || 'Staff' }}</span>
              </div>
            </div>

            <!-- Success/Error messages -->
            <div v-if="profileSuccess"
              class="bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              ✅ Profile updated successfully!
            </div>
            <div v-if="profileError"
              class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              ❌ {{ profileError }}
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <input v-model="profileForm.full_name" type="text" class="input" placeholder="Your full name" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
              <input v-model="profileForm.username" type="text" class="input" placeholder="Username" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <input :value="authStore.user?.email" type="email" class="input bg-gray-50 cursor-not-allowed" disabled />
              <p class="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
            </div>
          </div>

          <!-- Password Tab -->
          <div v-if="activeTab === 'password'" class="space-y-4">
            <div v-if="passwordSuccess"
              class="bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              ✅ Password changed successfully!
            </div>
            <div v-if="passwordError"
              class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              ❌ {{ passwordError }}
            </div>

            <div class="p-4 bg-yellow-50 rounded-xl text-sm text-yellow-700 flex items-start gap-2">
              <span>⚠️</span>
              <p>Choose a strong password. You will remain logged in after changing it.</p>
            </div>

            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">New Password</label>
              <div class="relative">
                <input v-model="passwordForm.newPassword" :type="showPwd ? 'text' : 'password'" class="input pr-10"
                  placeholder="At least 8 characters" />
                <button type="button" @click="showPwd = !showPwd"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  {{ showPwd ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Confirm New Password</label>
              <input v-model="passwordForm.confirmPassword" :type="showPwd ? 'text' : 'password'" class="input"
                placeholder="Repeat new password" />
              <p v-if="passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword"
                class="text-xs text-red-500 mt-1">
                Passwords do not match.
              </p>
            </div>
          </div>

          <!-- Preferences Tab -->
          <div v-if="activeTab === 'preferences'" class="space-y-5">
            <div v-if="prefSuccess"
              class="bg-teal-50 border border-teal-200 text-teal-700 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
              ✅ Preferences saved!
            </div>

            <div>
              <h3 class="font-semibold text-gray-800 mb-3">🔔 Notification Settings</h3>
              <div class="space-y-3">
                <label v-for="item in notifPrefs" :key="item.key"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-teal-50 transition-colors">
                  <div>
                    <p class="text-sm font-semibold text-gray-700">{{ item.label }}</p>
                    <p class="text-xs text-gray-400">{{ item.desc }}</p>
                  </div>
                  <div @click="prefsForm[item.key] = !prefsForm[item.key]"
                    class="w-10 h-5 rounded-full transition-colors cursor-pointer flex-shrink-0"
                    :class="prefsForm[item.key] ? 'bg-teal-500' : 'bg-gray-300'">
                    <div class="w-4 h-4 bg-white rounded-full shadow-sm mt-0.5 transition-transform"
                      :class="prefsForm[item.key] ? 'translate-x-5' : 'translate-x-0.5'"></div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <h3 class="font-semibold text-gray-800 mb-3">🌐 Display</h3>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Currency</label>
                  <select v-model="prefsForm.currency" class="input">
                    <option>₱ PHP - Philippine Peso</option>
                    <option>$ USD - US Dollar</option>
                    <option>€ EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Date Format</label>
                  <select v-model="prefsForm.dateFormat" class="input">
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button @click="$emit('update:modelValue', false)" class="btn-secondary">Cancel</button>
          <button @click="saveCurrentTab" class="btn-primary flex items-center gap-2" :disabled="saving">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'

const props = defineProps({ modelValue: Boolean, initialTab: { type: String, default: 'profile' } })
const emit = defineEmits(['update:modelValue'])
const authStore = useAuthStore()

const activeTab = ref(props.initialTab)
const saving = ref(false)
const showPwd = ref(false)

// Profile form
const profileForm = ref({
  full_name: authStore.profile?.full_name || '',
  username: authStore.profile?.username || '',
})

// Password form
const passwordForm = ref({ newPassword: '', confirmPassword: '' })
const passwordSuccess = ref(false)
const passwordError = ref('')

// Profile messages
const profileSuccess = ref(false)
const profileError = ref('')

// Preferences
const prefsForm = ref({
  lowStockAlerts: true,
  salesAlerts: false,
  newSupplierAlerts: true,
  currency: '₱ PHP - Philippine Peso',
  dateFormat: 'MM/DD/YYYY',
})
const prefSuccess = ref(false)

const tabs = [
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'password', icon: '🔐', label: 'Password' },
  { id: 'preferences', icon: '🎨', label: 'Preferences' },
]

const notifPrefs = [
  { key: 'lowStockAlerts', label: 'Low Stock Alerts', desc: 'Get notified when items run low' },
  { key: 'salesAlerts', label: 'Sales Milestones', desc: 'Celebrate hitting sales targets' },
  { key: 'newSupplierAlerts', label: 'Supplier Updates', desc: 'Updates from your suppliers' },
]

watch(() => props.initialTab, (v) => { if (v) activeTab.value = v })
watch(() => props.modelValue, (v) => {
  if (v) {
    profileForm.value = { full_name: authStore.profile?.full_name || '', username: authStore.profile?.username || '' }
    profileSuccess.value = false
    profileError.value = ''
    passwordSuccess.value = false
    passwordError.value = ''
    prefSuccess.value = false
    passwordForm.value = { newPassword: '', confirmPassword: '' }
  }
})

async function saveCurrentTab() {
  saving.value = true

  if (activeTab.value === 'profile') {
    profileSuccess.value = false
    profileError.value = ''
    const result = await authStore.updateProfile(profileForm.value)
    if (result.success) profileSuccess.value = true
    else profileError.value = authStore.error || 'Failed to update profile.'
  }

  else if (activeTab.value === 'password') {
    passwordSuccess.value = false
    passwordError.value = ''
    if (passwordForm.value.newPassword.length < 8) {
      passwordError.value = 'Password must be at least 8 characters.'
    } else if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
      passwordError.value = 'Passwords do not match.'
    } else {
      const result = await authStore.changePassword(passwordForm.value.newPassword)
      if (result.success) {
        passwordSuccess.value = true
        passwordForm.value = { newPassword: '', confirmPassword: '' }
      } else {
        passwordError.value = authStore.error || 'Failed to change password.'
      }
    }
  }

  else if (activeTab.value === 'preferences') {
    // Save preferences to localStorage for now
    localStorage.setItem('chippie_prefs', JSON.stringify(prefsForm.value))
    prefSuccess.value = true
    setTimeout(() => prefSuccess.value = false, 3000)
  }

  saving.value = false
}
</script>

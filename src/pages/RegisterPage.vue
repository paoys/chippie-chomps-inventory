<template>
  <div class="min-h-screen bg-paw-bg flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-teal-100 rounded-full opacity-40 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200 rounded-full opacity-30 blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4">
          <img src="/favicon.svg" alt="Chippie Chomps Logo" class="w-full h-full object-contain rounded-xl" />
        </div>
        <h1 class="font-display font-900 text-3xl text-gray-800">Chippie Chomps</h1>
        <p class="text-gray-500 mt-1 text-sm">Pet Food Supply Management</p>
      </div>

      <div class="card">
        <h2 class="font-display font-800 text-xl text-gray-800 mb-1">Create your account</h2>
        <p class="text-gray-500 text-sm mb-6">Fill in your details to get started</p>

        <!-- Success state -->
        <div v-if="success" class="bg-teal-50 border border-teal-200 rounded-xl p-4 text-center">
          <div class="text-4xl mb-2">🎉</div>
          <h3 class="font-display font-700 text-teal-700 mb-1">Account Created!</h3>
          <p class="text-sm text-teal-600 mb-3">Check your email to confirm your account, then sign in.</p>
          <router-link to="/login" class="btn-primary inline-block text-sm px-6 py-2">Go to Login</router-link>
        </div>

        <template v-else>
          <!-- Error -->
          <div v-if="authStore.error"
            class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
            <span>❌</span> {{ authStore.error }}
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <!-- Full Name -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✏️</span>
                <input v-model="form.fullName" type="text" class="input pl-9" placeholder="Your full name" />
              </div>
            </div>

            <!-- Username -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Username <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
                <input v-model="form.username" type="text" class="input pl-9"
                  :class="{ 'border-red-400 focus:border-red-400 focus:ring-red-200': fieldErrors.username }"
                  placeholder="Choose a username" autocomplete="username" required @blur="validateUsername" />
              </div>
              <p v-if="fieldErrors.username" class="text-xs text-red-500 mt-1">{{ fieldErrors.username }}</p>
              <p class="text-xs text-gray-400 mt-1">Only letters, numbers and underscores. Min 3 characters.</p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">📧</span>
                <input v-model="form.email" type="email" class="input pl-9"
                  :class="{ 'border-red-400 focus:border-red-400 focus:ring-red-200': fieldErrors.email }"
                  placeholder="your@email.com" autocomplete="email" required @blur="validateEmail" />
              </div>
              <p v-if="fieldErrors.email" class="text-xs text-red-500 mt-1">{{ fieldErrors.email }}</p>
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Password <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input v-model="form.password" type="password" class="input pl-9 pr-10"
                  :class="{ 'border-red-400': fieldErrors.password }" placeholder="At least 8 characters"
                  autocomplete="new-password" required @input="checkPasswordStrength" />
              </div>
              <!-- Password strength -->
              <div v-if="form.password" class="mt-2">
                <div class="flex gap-1">
                  <div v-for="i in 4" :key="i" class="flex-1 h-1.5 rounded-full transition-all duration-300"
                    :class="i <= passwordStrength ? strengthColors[passwordStrength] : 'bg-gray-200'"></div>
                </div>
                <p class="text-xs mt-1" :class="strengthTextColors[passwordStrength]">{{
                  strengthLabels[passwordStrength] }}</p>
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Confirm Password <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
                <input v-model="form.confirmPassword" type="password" class="input pl-9"
                  :class="{ 'border-red-400': form.confirmPassword && form.password !== form.confirmPassword }"
                  placeholder="Repeat your password" autocomplete="new-password" required />
              </div>
              <p v-if="form.confirmPassword && form.password !== form.confirmPassword"
                class="text-xs text-red-500 mt-1">Passwords do not match.</p>
            </div>

            <button type="submit" class="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
              :disabled="authStore.loading || !isFormValid">
              <span v-if="authStore.loading" class="animate-spin">⏳</span>
              <span>{{ authStore.loading ? 'Creating account...' : 'Create Account' }}</span>
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-5">
            Already have an account?
            <router-link to="/login" class="text-teal-600 font-semibold hover:text-teal-700">Sign in →</router-link>
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const form = ref({ fullName: '', username: '', email: '', password: '', confirmPassword: '' })
const success = ref(false)
const fieldErrors = ref({})
const passwordStrength = ref(0)

const strengthColors = { 1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-teal-500' }
const strengthTextColors = { 1: 'text-red-500', 2: 'text-orange-500', 3: 'text-yellow-600', 4: 'text-teal-600' }
const strengthLabels = { 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' }

onMounted(() => { authStore.error = null })

function checkPasswordStrength() {
  const p = form.value.password
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  passwordStrength.value = Math.max(1, score)
}

function validateUsername() {
  const u = form.value.username
  if (!u) { fieldErrors.value.username = 'Username is required.'; return }
  if (u.length < 3) { fieldErrors.value.username = 'At least 3 characters.'; return }
  if (!/^[a-zA-Z0-9_]+$/.test(u)) { fieldErrors.value.username = 'Only letters, numbers, underscores.'; return }
  fieldErrors.value.username = ''
}

function validateEmail() {
  const e = form.value.email
  if (!e) { fieldErrors.value.email = 'Email is required.'; return }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { fieldErrors.value.email = 'Invalid email address.'; return }
  fieldErrors.value.email = ''
}

const isFormValid = computed(() => {
  return form.value.username?.length >= 3
    && form.value.email
    && form.value.password?.length >= 8
    && form.value.password === form.value.confirmPassword
    && !fieldErrors.value.username
    && !fieldErrors.value.email
})

async function handleRegister() {
  validateUsername()
  validateEmail()
  if (!isFormValid.value) return

  const result = await authStore.register({
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
    fullName: form.value.fullName,
  })

  if (result.success) success.value = true
}
</script>

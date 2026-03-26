<template>
  <div class="min-h-screen bg-paw-bg flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-teal-100 rounded-full opacity-40 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-200 rounded-full opacity-30 blur-3xl"></div>
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-50 rounded-full opacity-20 blur-3xl">
      </div>
    </div>

    <div class="w-full max-w-md relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 mb-4">
          <img src="/favicon.svg" alt="Chippie Chomps Logo" class="w-full h-full object-contain rounded-xl" />
        </div>
        <h1 class="font-display font-900 text-3xl text-gray-800">Chippie Chomps</h1>
        <p class="text-gray-500 mt-1 text-sm">Pet Food Supply Management</p>
      </div>

      <!-- Card -->
      <div class="card">
        <h2 class="font-display font-800 text-xl text-gray-800 mb-1">Welcome back!</h2>
        <p class="text-gray-500 text-sm mb-6">Sign in with your username and password</p>

        <!-- Error -->
        <div v-if="authStore.error"
          class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <span>❌</span> {{ authStore.error }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">👤</span>
              <input v-model="form.username" type="text" class="input pl-9" placeholder="Enter your username"
                autocomplete="username" required />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
              <input v-model="form.password" type="password" class="input pl-9" placeholder="Enter your password"
                autocomplete="current-password" required />
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" class="btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            :disabled="authStore.loading">
            <span v-if="authStore.loading" class="animate-spin">⏳</span>
            <span>{{ authStore.loading ? 'Signing in...' : 'Sign In' }}</span>
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-5">
          Don't have an account?
          <router-link to="/register" class="text-teal-600 font-semibold hover:text-teal-700">Create account
            →</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const form = ref({ username: '', password: '' })

onMounted(() => {
  authStore.error = null
})

async function handleLogin() {
  const result = await authStore.login(form.value)

  if (result.success) {
    router.push('/dashboard')
  }
}
</script>

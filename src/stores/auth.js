import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const isLoggedIn = computed(() => !!user.value)
  const displayName = computed(() => profile.value?.username || profile.value?.full_name || user.value?.email || 'User')
  const avatarInitials = computed(() => {
    const name = displayName.value
    return name.slice(0, 2).toUpperCase()
  })

  // Fetch profile from Supabase
  async function fetchProfile(userId) {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (!err && data) profile.value = data
  }

  // Initialize: restore session
  async function init() {
    loading.value = true
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      user.value = session.user
      await fetchProfile(session.user.id)
    }
    loading.value = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        user.value = session.user
        await fetchProfile(session.user.id)
      } else {
        user.value = null
        profile.value = null
      }
    })
  }

  // Register: username + email + password
  async function register({ username, email, password, fullName }) {
    error.value = null
    loading.value = true

    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      error.value = 'Username is already taken.'
      loading.value = false
      return { success: false }
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName || username }
      }
    })

    loading.value = false
    if (signUpError) {
      error.value = signUpError.message
      return { success: false }
    }

    return { success: true, data }
  }

  // Login: username + password
  async function login({ username, password }) {
    error.value = null
    loading.value = true

    // Look up email from username
    const { data: email, error: rpcError } = await supabase.rpc('get_email_by_username', {
      input_username: username
    })

    if (rpcError || !email) {
      error.value = 'Username not found. Please check your username.'
      loading.value = false
      return { success: false }
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password,
    })

    if (signInError) {
      error.value = 'Incorrect password. Please try again.'
      loading.value = false
      return { success: false }
    }

    user.value = data.user
    await fetchProfile(data.user.id)
    return { success: true }
  }

  // Logout
  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  // Update profile
  async function updateProfile(updates) {
    if (!user.value) return { success: false }
    error.value = null

    const { data, error: updateErr } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.value.id)
      .select()
      .single()

    if (updateErr) {
      error.value = updateErr.message
      return { success: false }
    }

    profile.value = data
    return { success: true }
  }

  // Change password
  async function changePassword(newPassword) {
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    if (err) {
      error.value = err.message
      return { success: false }
    }
    return { success: true }
  }

  return {
    user, profile, loading, error,
    isLoggedIn, displayName, avatarInitials,
    init, register, login, logout, updateProfile, changePassword, fetchProfile
  }
})

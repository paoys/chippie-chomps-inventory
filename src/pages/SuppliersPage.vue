<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input v-model="search" class="input pl-9 w-56" placeholder="Search suppliers..." />
      </div>
      <button @click="openAdd" class="btn-primary flex items-center gap-2">
        <span>＋</span> Add Supplier
      </button>
    </div>

    <div v-if="appStore.error" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">❌ {{
      appStore.error }}</div>

    <div v-if="appStore.loading" class="text-center py-12 text-gray-400 text-sm">Loading suppliers...</div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="s in filtered" :key="s.id"
        class="card hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-2xl flex-shrink-0">🏭
            </div>
            <div>
              <div class="font-display font-700 text-gray-800">{{ s.name }}</div>
              <span :class="s.status === 'Active' ? 'badge-green' : 'badge-yellow'">{{ s.status }}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="openEdit(s)"
              class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 flex items-center justify-center text-xs">✏️</button>
            <button @click="confirmDelete(s)"
              class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs">🗑️</button>
          </div>
        </div>
        <div class="space-y-1.5 text-sm">
          <div class="flex items-center gap-2 text-gray-600"><span>👤</span> {{ s.contact }}</div>
          <div class="flex items-center gap-2 text-gray-600"><span>📧</span> {{ s.email }}</div>
          <div class="flex items-center gap-2 text-gray-600"><span>📞</span> {{ s.phone }}</div>
          <div class="flex items-center gap-2 text-gray-600"><span>📍</span> {{ s.address }}</div>
        </div>
      </div>
      <div v-if="filtered.length === 0 && !appStore.loading" class="col-span-full text-center py-12 text-gray-400">No
        suppliers found.</div>
    </div>

    <div>
      <!-- Add/Edit Modal -->
      <AppModal v-model="modalOpen" :title="editing ? '✏️ Edit Supplier' : '🏭 Add Supplier'">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Company Name *</label>
            <input v-model="form.name" class="input" placeholder="Supplier company name" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Contact Person</label>
              <input v-model="form.contact" class="input" placeholder="Full name" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
              <input v-model="form.phone" class="input" placeholder="+63 9XX XXX XXXX" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input v-model="form.email" type="email" class="input" placeholder="supplier@email.com" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
            <input v-model="form.address" class="input" placeholder="City, Province" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
            <select v-model="form.status" class="input">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </div>
          <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-sm">❌ {{
            saveError }}</div>
        </div>
        <template #footer>
          <button @click="modalOpen = false" class="btn-secondary">Cancel</button>
          <button @click="saveSupplier" class="btn-primary flex items-center gap-2" :disabled="saving || !form.name">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            {{ editing ? 'Save Changes' : 'Add Supplier' }}
          </button>
        </template>
      </AppModal>

      <!-- Delete confirm -->
      <AppModal v-model="deleteModal" title="🗑️ Remove Supplier" size="sm">
        <p class="text-gray-600">Remove <strong>{{ deletingSupplier?.name }}</strong> from your supplier list?</p>
        <template #footer>
          <button @click="deleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="doDelete" class="btn-danger" :disabled="saving">Remove</button>
        </template>
      </AppModal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import AppModal from '../components/AppModal.vue'

const appStore = useAppStore()
const search = ref('')
const modalOpen = ref(false)
const deleteModal = ref(false)
const editing = ref(null)
const deletingSupplier = ref(null)
const saving = ref(false)
const saveError = ref('')

const defaultForm = () => ({ name: '', contact: '', email: '', phone: '', address: '', status: 'Active' })
const form = ref(defaultForm())

const filtered = computed(() => appStore.suppliers.filter(s =>
  !search.value || s.name.toLowerCase().includes(search.value.toLowerCase()) || (s.contact || '').toLowerCase().includes(search.value.toLowerCase())
))

function openAdd() { editing.value = null; form.value = defaultForm(); saveError.value = ''; modalOpen.value = true }
function openEdit(s) { editing.value = s; form.value = { ...s }; saveError.value = ''; modalOpen.value = true }
function confirmDelete(s) { deletingSupplier.value = s; deleteModal.value = true }

async function saveSupplier() {
  if (!form.value.name) return
  saving.value = true; saveError.value = ''
  let result
  if (editing.value) result = await appStore.updateSupplier(editing.value.id, form.value)
  else result = await appStore.addSupplier(form.value)
  saving.value = false
  if (result) modalOpen.value = false
  else saveError.value = appStore.error || 'Failed to save supplier.'
}

async function doDelete() {
  saving.value = true
  await appStore.deleteSupplier(deletingSupplier.value.id)
  saving.value = false
  deleteModal.value = false
}

onMounted(async () => {
  if (appStore.suppliers.length === 0) await appStore.loadSuppliers()
})
</script>

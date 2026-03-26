<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div class="flex gap-3 flex-wrap">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input v-model="search" class="input pl-9 w-56" placeholder="Search purchases..." @input="resetPage" />
        </div>
        <select v-model="statusFilter" class="input w-auto" @change="resetPage">
          <option value="">All Status</option>
          <option>Pending</option>
          <option>In Transit</option>
          <option>Received</option>
        </select>
      </div>
      <button @click="modalOpen = true" class="btn-primary flex items-center gap-2">
        <span>＋</span> New Purchase Order
      </button>
    </div>

    <div class="card p-0 overflow-hidden">
      <div v-if="appStore.loading" class="px-6 py-12 text-center text-gray-400 text-sm">Loading purchases...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50/60">
            <tr>
              <th v-for="h in headers" :key="h"
                class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide px-6 py-3">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in paginated" :key="p.id" class="table-row">
              <td class="px-6 py-3 font-mono text-xs text-gray-500">#PO{{ String(p.id).padStart(4, '0') }}</td>
              <td class="px-6 py-3 text-sm font-semibold text-gray-800">{{ p.product }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ p.supplier }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ p.qty }} units</td>
              <td class="px-6 py-3 font-bold text-teal-600">₱{{ Number(p.total).toLocaleString() }}</td>
              <td class="px-6 py-3 text-sm text-gray-400">{{ p.date }}</td>
              <td class="px-6 py-3"><span :class="statusBadge(p.status)">{{ p.status }}</span></td>
              <td class="px-6 py-3">
                <select v-if="p.status !== 'Received'" :value="p.status"
                  @change="updateStatus(p.id, $event.target.value)" class="input py-1 text-xs w-28">
                  <option>Pending</option>
                  <option>In Transit</option>
                  <option>Received</option>
                </select>
                <span v-else class="text-xs text-gray-400">Completed</span>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="8" class="px-6 py-12 text-center text-gray-400">No purchase orders found.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">Showing {{ ((page - 1) * perPage) + 1 }}–{{ Math.min(page * perPage,
          filtered.length) }} of {{ filtered.length }}</span>
        <div class="flex items-center gap-1">
          <button @click="page--" :disabled="page === 1"
            class="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">‹</button>
          <button v-for="p in pageNumbers" :key="p" @click="typeof p === 'number' && (page = p)"
            class="w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors"
            :class="p === page ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 hover:bg-gray-50'">{{ p
            }}</button>
          <button @click="page++" :disabled="page === totalPages"
            class="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">›</button>
        </div>
      </div>
    </div>

    <div>
      <!-- New PO Modal -->
      <AppModal v-model="modalOpen" title="🛒 New Purchase Order">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Supplier *</label>
            <select v-model="form.supplier" class="input">
              <option value="">Select supplier</option>
              <option v-for="s in appStore.suppliers" :key="s.id" :value="s.name">{{ s.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product *</label>
            <select v-model="form.product" class="input">
              <option value="">Select product</option>
              <option v-for="p in appStore.products" :key="p.id" :value="p.name">{{ p.image }} {{ p.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Quantity *</label>
              <input v-model.number="form.qty" type="number" min="1" class="input" @input="calcTotal" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Unit Cost (₱)</label>
              <input v-model.number="form.unitCost" type="number" class="input" @input="calcTotal" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Order Date</label>
            <input v-model="form.date" type="date" class="input" />
          </div>
          <div v-if="form.qty && form.unitCost" class="p-3 bg-teal-50 rounded-xl">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Total Cost:</span>
              <span class="font-bold text-teal-700 text-lg">₱{{ form.total.toLocaleString() }}</span>
            </div>
          </div>
          <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-sm">❌ {{
            saveError }}</div>
        </div>
        <template #footer>
          <button @click="modalOpen = false" class="btn-secondary">Cancel</button>
          <button @click="savePO" class="btn-primary flex items-center gap-2"
            :disabled="saving || !form.product || !form.supplier">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            Create Order
          </button>
        </template>
      </AppModal>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '../stores/app'
import AppModal from '../components/AppModal.vue'

const appStore = useAppStore()
const search = ref('')
const statusFilter = ref('')
const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')
const page = ref(1)
const perPage = 10
const headers = ['PO #', 'Product', 'Supplier', 'Qty', 'Total', 'Date', 'Status', 'Action']

const defaultForm = () => ({ product: '', supplier: '', qty: 1, unitCost: 0, total: 0, date: new Date().toISOString().slice(0, 10), status: 'Pending' })
const form = ref(defaultForm())

const filtered = computed(() => appStore.purchases.filter(p => {
  const s = search.value.toLowerCase()
  return (!s || p.product.toLowerCase().includes(s) || p.supplier.toLowerCase().includes(s))
    && (!statusFilter.value || p.status === statusFilter.value)
}))

const totalPages = computed(() => Math.ceil(filtered.value.length / perPage))
const paginated = computed(() => filtered.value.slice((page.value - 1) * perPage, page.value * perPage))
const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = page.value
  if (cur <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (cur >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', cur - 1, cur, cur + 1, '...', total]
})

function resetPage() { page.value = 1 }
watch([search, statusFilter], resetPage)

function statusBadge(s) { return s === 'Received' ? 'badge-green' : s === 'In Transit' ? 'badge-blue' : 'badge-yellow' }
function calcTotal() { form.value.total = form.value.qty * form.value.unitCost }

async function updateStatus(id, status) {
  await appStore.updatePurchaseStatus(id, status)
}

async function savePO() {
  if (!form.value.product || !form.value.supplier) return
  saving.value = true; saveError.value = ''
  const result = await appStore.addPurchase({ ...form.value })
  saving.value = false
  if (result) { modalOpen.value = false; form.value = defaultForm() }
  else saveError.value = appStore.error || 'Failed to create purchase order.'
}

onMounted(async () => {
  if (appStore.purchases.length === 0) await appStore.loadPurchases()
  if (appStore.suppliers.length === 0) await appStore.loadSuppliers()
  if (appStore.products.length === 0) await appStore.loadProducts()
})
</script>

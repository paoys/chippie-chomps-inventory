<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div class="flex gap-3 flex-wrap">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input v-model="search" class="input pl-9 w-56" placeholder="Search sales..." @input="resetPage" />
        </div>
        <input v-model="dateFilter" type="date" class="input w-auto" title="Filter by date" @change="resetPage" />
      </div>
      <button @click="modalOpen = true" class="btn-primary flex items-center gap-2">
        <span>＋</span> Record Sale
      </button>
    </div>

    <!-- Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card flex items-center gap-3 py-4">
        <div class="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">💳</div>
        <div>
          <div class="font-display font-800 text-xl text-gray-800">₱{{ totalRevenue.toLocaleString() }}</div>
          <div class="text-xs text-gray-500">Total Revenue</div>
        </div>
      </div>
      <div class="card flex items-center gap-3 py-4">
        <div class="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center text-xl">📦</div>
        <div>
          <div class="font-display font-800 text-xl text-gray-800">{{ totalQty }}</div>
          <div class="text-xs text-gray-500">Units Sold</div>
        </div>
      </div>
      <div class="card flex items-center gap-3 py-4">
        <div class="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">🧾</div>
        <div>
          <div class="font-display font-800 text-xl text-gray-800">{{ appStore.sales.length }}</div>
          <div class="text-xs text-gray-500">All Transactions</div>
        </div>
      </div>
    </div>

    <div class="card p-0 overflow-hidden">
      <div v-if="appStore.loading" class="px-6 py-12 text-center text-gray-400 text-sm">Loading sales...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50/60">
            <tr>
              <th v-for="h in headers" :key="h"
                class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide px-6 py-3">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in paginated" :key="s.id" class="table-row">
              <td class="px-6 py-3 font-mono text-xs text-gray-500">#{{ String(s.id).padStart(4, '0') }}</td>
              <td class="px-6 py-3 font-semibold text-gray-800 text-sm">{{ s.product }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ s.customer }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ s.qty }} units</td>
              <td class="px-6 py-3 font-bold text-teal-600">₱{{ Number(s.total).toLocaleString() }}</td>
              <td class="px-6 py-3 text-sm text-gray-400">{{ s.date }}</td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400">No sales records found.</td>
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
      <!-- Record Sale Modal -->
      <AppModal v-model="modalOpen" title="💳 Record Sale">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product *</label>
            <select v-model="form.product_id" class="input" @change="onProductChange">
              <option value="">Select product</option>
              <option v-for="p in appStore.products" :key="p.id" :value="p.id">
                {{ p.image }} {{ p.name }} ({{ p.stock }} in stock)
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Customer</label>
            <input v-model="form.customer" class="input" placeholder="Customer name or Walk-in" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Quantity *</label>
              <input v-model.number="form.qty" type="number" min="1" class="input" @input="calcTotal" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Unit Price (₱)</label>
              <input v-model.number="form.unitPrice" type="number" class="input" @input="calcTotal" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Date</label>
            <input v-model="form.date" type="date" class="input" />
          </div>
          <div v-if="form.qty && form.unitPrice" class="p-3 bg-teal-50 rounded-xl">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Total Amount:</span>
              <span class="font-bold text-teal-700 text-lg">₱{{ form.total.toLocaleString() }}</span>
            </div>
          </div>
          <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-sm">❌ {{
            saveError }}</div>
        </div>
        <template #footer>
          <button @click="modalOpen = false" class="btn-secondary">Cancel</button>
          <button @click="saveSale" class="btn-primary flex items-center gap-2"
            :disabled="saving || !form.product_id || !form.qty">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            Record Sale
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
const dateFilter = ref('')
const modalOpen = ref(false)
const saving = ref(false)
const saveError = ref('')
const page = ref(1)
const perPage = 10
const headers = ['Order #', 'Product', 'Customer', 'Qty', 'Total', 'Date']

const defaultForm = () => ({ product_id: '', product: '', customer: 'Walk-in', qty: 1, unitPrice: 0, total: 0, date: new Date().toISOString().slice(0, 10) })
const form = ref(defaultForm())

const filtered = computed(() => appStore.sales.filter(s => {
  const q = search.value.toLowerCase()
  const matchQ = !q || s.product.toLowerCase().includes(q) || (s.customer || '').toLowerCase().includes(q)
  const matchDate = !dateFilter.value || s.date === dateFilter.value
  return matchQ && matchDate
}))

const totalRevenue = computed(() => filtered.value.reduce((a, b) => a + Number(b.total), 0))
const totalQty = computed(() => filtered.value.reduce((a, b) => a + Number(b.qty), 0))
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
watch([search, dateFilter], resetPage)

function onProductChange() {
  const p = appStore.products.find(x => x.id === form.value.product_id)
  if (p) { form.value.product = p.name; form.value.unitPrice = Number(p.price); calcTotal() }
}
function calcTotal() { form.value.total = form.value.qty * form.value.unitPrice }

async function saveSale() {
  if (!form.value.product_id || !form.value.qty) return
  saving.value = true; saveError.value = ''
  const result = await appStore.addSale({ ...form.value })
  saving.value = false
  if (result) { modalOpen.value = false; form.value = defaultForm() }
  else saveError.value = appStore.error || 'Failed to record sale.'
}

onMounted(async () => {
  if (appStore.sales.length === 0) await appStore.loadSales()
  if (appStore.products.length === 0) await appStore.loadProducts()
})
</script>

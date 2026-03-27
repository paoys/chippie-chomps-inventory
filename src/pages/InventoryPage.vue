<template>
  <div class="space-y-5">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="s in summary" :key="s.label" class="card flex items-center gap-3 py-4">
        <div :class="`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${s.bg}`">{{ s.icon }}
        </div>
        <div>
          <div class="font-display font-800 text-xl text-gray-800">{{ s.value }}</div>
          <div class="text-xs text-gray-500">{{ s.label }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div class="flex gap-3 flex-wrap">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input v-model="search" class="input pl-9 w-52" placeholder="Search inventory..." @input="resetPage" />
        </div>
        <select v-model="statusFilter" class="input w-auto" @change="resetPage">
          <option value="">All Status</option>
          <option value="ok">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
          <option value="out">Out of Stock</option>
        </select>
      </div>
      <button @click="adjustModal = true" class="btn-primary flex items-center gap-2">
        <span>📝</span> Adjust Stock
      </button>
    </div>

    <div class="card p-0 overflow-hidden">
      <div v-if="appStore.loadingProducts" class="px-6 py-12 text-center text-gray-400 text-sm">Loading inventory...</div>
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
              <td class="px-6 py-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ p.image }}</span>
                  <div>
                    <div class="font-semibold text-gray-800 text-sm">{{ p.name }}</div>
                    <div class="text-xs text-gray-400">{{ p.category }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3">
                <span class="font-bold text-lg"
                  :class="p.stock === 0 ? 'text-gray-400' : p.stock <= 5 ? 'text-red-500' : p.stock <= p.min_stock ? 'text-yellow-600' : 'text-teal-600'">
                  {{ p.stock }}
                </span>
                <span class="text-xs text-gray-400 ml-1">units</span>
              </td>
              <td class="px-6 py-3 text-sm text-gray-500">{{ p.min_stock }} units</td>
              <td class="px-6 py-3">
                <div class="flex items-center gap-2">
                  <div class="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" :class="stockBarColor(p)"
                      :style="{ width: Math.min(100, (p.stock / (p.min_stock * 2)) * 100) + '%' }"></div>
                  </div>
                  <span :class="stockBadge(p).cls">{{ stockBadge(p).label }}</span>
                </div>
              </td>
              <td class="px-6 py-3 text-sm text-gray-500">{{ p.supplier }}</td>
              <td class="px-6 py-3">
                <button @click="openAdjust(p)"
                  class="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1">
                  <span>📝</span> Adjust
                </button>
              </td>
            </tr>
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400">No items found.</td>
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
      <!-- Adjust Stock Modal -->
      <AppModal v-model="adjustModal" title="📝 Adjust Stock" size="sm">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product</label>
            <select v-model="adjustForm.productId" class="input">
              <option value="">Select product</option>
              <option v-for="p in appStore.products" :key="p.id" :value="p.id">{{ p.image }} {{ p.name }} ({{ p.stock }}
                units)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Adjustment Type</label>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="t in adjustTypes" :key="t.value" @click="adjustForm.type = t.value"
                class="py-2 px-3 rounded-xl text-sm font-semibold border transition-all"
                :class="adjustForm.type === t.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'">
                {{ t.label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Quantity</label>
            <input v-model.number="adjustForm.qty" type="number" min="1" class="input" placeholder="Enter quantity" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Reason (optional)</label>
            <input v-model="adjustForm.reason" class="input" placeholder="e.g. Received shipment, Damaged goods..." />
          </div>
          <div v-if="adjustForm.productId && adjustForm.qty" class="p-3 bg-teal-50 rounded-xl text-sm text-teal-700">
            <span class="font-semibold">Preview: </span>{{ previewAdjust }}
          </div>
        </div>
        <template #footer>
          <button @click="adjustModal = false" class="btn-secondary">Cancel</button>
          <button @click="doAdjust" class="btn-primary flex items-center gap-2"
            :disabled="saving || !adjustForm.productId || !adjustForm.qty">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            Apply Adjustment
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
const adjustModal = ref(false)
const saving = ref(false)
const page = ref(1)
const perPage = 10
const adjustForm = ref({ productId: '', type: 'add', qty: 0, reason: '' })
const adjustTypes = [{ label: '+ Add', value: 'add' }, { label: '- Remove', value: 'remove' }, { label: '= Set', value: 'set' }]
const headers = ['Product', 'Current Stock', 'Min Threshold', 'Status', 'Supplier', 'Action']

const summary = computed(() => {
  const ps = appStore.products
  return [
    { icon: '📦', label: 'Total Items', value: ps.length, bg: 'bg-teal-100' },
    { icon: '✅', label: 'In Stock', value: ps.filter(p => p.stock > p.min_stock).length, bg: 'bg-teal-100' },
    { icon: '⚠️', label: 'Low Stock', value: ps.filter(p => p.stock > 0 && p.stock <= p.min_stock).length, bg: 'bg-yellow-100' },
    { icon: '❌', label: 'Out of Stock', value: ps.filter(p => p.stock === 0).length, bg: 'bg-red-100' },
  ]
})

const filtered = computed(() => appStore.products.filter(p => {
  const s = search.value.toLowerCase()
  const matchSearch = !s || p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s)
  let matchStatus = true
  if (statusFilter.value === 'ok') matchStatus = p.stock > p.min_stock
  else if (statusFilter.value === 'low') matchStatus = p.stock > 0 && p.stock <= p.min_stock
  else if (statusFilter.value === 'critical') matchStatus = p.stock > 0 && p.stock <= 5
  else if (statusFilter.value === 'out') matchStatus = p.stock === 0
  return matchSearch && matchStatus
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

function stockBarColor(p) {
  if (p.stock === 0) return 'bg-gray-300'
  if (p.stock <= 5) return 'bg-red-400'
  if (p.stock <= p.min_stock) return 'bg-yellow-400'
  return 'bg-teal-400'
}
function stockBadge(p) {
  if (p.stock === 0) return { label: 'Out of Stock', cls: 'badge-red' }
  if (p.stock <= 5) return { label: 'Critical', cls: 'badge-red' }
  if (p.stock <= p.min_stock) return { label: 'Low Stock', cls: 'badge-yellow' }
  return { label: 'In Stock', cls: 'badge-green' }
}

function openAdjust(p) {
  adjustForm.value = { productId: p.id, type: 'add', qty: 0, reason: '' }
  adjustModal.value = true
}

const previewAdjust = computed(() => {
  const p = appStore.products.find(x => x.id === adjustForm.value.productId)
  if (!p) return ''
  const { type, qty } = adjustForm.value
  let newStock = type === 'add' ? p.stock + qty : type === 'remove' ? p.stock - qty : qty
  newStock = Math.max(0, newStock)
  return `${p.name}: ${p.stock} → ${newStock} units`
})

async function doAdjust() {
  if (!adjustForm.value.productId || !adjustForm.value.qty) return
  saving.value = true
  await appStore.adjustStock(adjustForm.value.productId, adjustForm.value.type, adjustForm.value.qty)
  saving.value = false
  adjustModal.value = false
}

onMounted(async () => {
  if (appStore.products.length === 0) await appStore.loadProducts()
})
</script>

<template>
  <div class="space-y-5">
    <!-- Export bar -->
    <div class="flex items-center justify-between">
      <h2 class="font-display font-700 text-gray-800">Reports & Analytics</h2>
      <div class="flex gap-2">
        <button @click="exportCSV('sales')" class="btn-secondary flex items-center gap-2 text-sm py-2">
          📥 Export Sales CSV
        </button>
        <button @click="exportCSV('purchases')" class="btn-secondary flex items-center gap-2 text-sm py-2">
          📥 Export Purchases CSV
        </button>
        <button @click="exportCSV('products')" class="btn-secondary flex items-center gap-2 text-sm py-2">
          📥 Export Inventory CSV
        </button>
      </div>
    </div>

    <!-- KPI row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="k in kpis" :key="k.label" class="card text-center py-5">
        <div class="text-3xl mb-1">{{ k.icon }}</div>
        <div class="font-display font-800 text-xl text-gray-800">{{ k.value }}</div>
        <div class="text-xs text-gray-500 mt-0.5">{{ k.label }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Sales by Category (real data) -->
      <div class="card">
        <h2 class="font-display font-700 text-gray-800 mb-4">Sales by Product</h2>
        <div v-if="salesByProduct.length === 0" class="text-center py-6 text-gray-400 text-sm">No sales data yet.</div>
        <div v-else class="space-y-3">
          <div v-for="item in salesByProduct" :key="item.name" class="flex items-center gap-3">
            <div class="w-8 text-lg text-center">{{ item.icon }}</div>
            <div class="flex-1">
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium text-gray-700 truncate max-w-[140px]">{{ item.name }}</span>
                <span class="font-semibold text-teal-600 ml-2">₱{{ item.revenue.toLocaleString() }}</span>
              </div>
              <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-teal-400 rounded-full transition-all duration-700" :style="{ width: item.pct + '%' }"></div>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-8 text-right">{{ item.pct }}%</span>
          </div>
        </div>
      </div>

      <!-- Inventory Value (real data) -->
      <div class="card">
        <h2 class="font-display font-700 text-gray-800 mb-4">Inventory Value</h2>
        <div v-if="inventoryValue.length === 0" class="text-center py-6 text-gray-400 text-sm">No products yet.</div>
        <div v-else class="space-y-2 max-h-64 overflow-y-auto">
          <div v-for="p in inventoryValue" :key="p.name" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ p.image }}</span>
              <div>
                <div class="text-sm font-medium text-gray-700">{{ p.name }}</div>
                <div class="text-xs text-gray-400">{{ p.stock }} units × ₱{{ Number(p.price).toLocaleString() }}</div>
              </div>
            </div>
            <div class="text-sm font-bold text-gray-800">₱{{ (p.stock * Number(p.price)).toLocaleString() }}</div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between">
          <span class="font-semibold text-gray-600">Total Inventory Value</span>
          <span class="font-display font-800 text-teal-600">₱{{ totalInventoryValue.toLocaleString() }}</span>
        </div>
      </div>
    </div>

    <!-- Recent Sales table with pagination -->
    <div class="card p-0 overflow-hidden">
      <div class="px-6 py-4 flex items-center justify-between border-b border-gray-100">
        <h2 class="font-display font-700 text-gray-800">📋 Recent Sales</h2>
        <span class="text-xs text-gray-400">{{ appStore.sales.length }} total transactions</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50/60">
            <tr>
              <th v-for="h in ['Order #','Product','Customer','Qty','Total','Date']" :key="h" class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide px-6 py-3">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in paginatedSales" :key="s.id" class="table-row">
              <td class="px-6 py-3 font-mono text-xs text-gray-500">#{{ String(s.id).padStart(4,'0') }}</td>
              <td class="px-6 py-3 font-semibold text-gray-800 text-sm">{{ s.product }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ s.customer }}</td>
              <td class="px-6 py-3 text-sm text-gray-600">{{ s.qty }}</td>
              <td class="px-6 py-3 font-bold text-teal-600">₱{{ Number(s.total).toLocaleString() }}</td>
              <td class="px-6 py-3 text-sm text-gray-400">{{ s.date }}</td>
            </tr>
            <tr v-if="appStore.sales.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400">No sales recorded yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="salesTotalPages > 1" class="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-400">Page {{ salesPage }} of {{ salesTotalPages }}</span>
        <div class="flex items-center gap-1">
          <button @click="salesPage--" :disabled="salesPage===1" class="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">‹</button>
          <button v-for="p in salesPageNumbers" :key="p" @click="typeof p==='number' && (salesPage=p)"
            class="w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors"
            :class="p===salesPage ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 hover:bg-gray-50'">{{ p }}</button>
          <button @click="salesPage++" :disabled="salesPage===salesTotalPages" class="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">›</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const salesPage = ref(1)
const perPage = 10

// KPIs from real data
const kpis = computed(() => {
  const totalRev = appStore.sales.reduce((a, b) => a + Number(b.total), 0)
  const totalQty = appStore.sales.reduce((a, b) => a + Number(b.qty), 0)
  const totalCost = appStore.purchases.filter(p => p.status === 'Received').reduce((a, b) => a + Number(b.total), 0)
  const margin = totalRev > 0 ? Math.round(((totalRev - totalCost) / totalRev) * 100) : 0
  return [
    { icon: '💰', label: 'Total Revenue', value: `₱${totalRev.toLocaleString()}` },
    { icon: '📦', label: 'Units Sold', value: totalQty.toLocaleString() },
    { icon: '🛒', label: 'Purchase Cost', value: `₱${totalCost.toLocaleString()}` },
    { icon: '📈', label: 'Gross Margin', value: `${margin}%` },
  ]
})

// Sales by product
const salesByProduct = computed(() => {
  const map = {}
  appStore.sales.forEach(s => {
    if (!map[s.product]) map[s.product] = { name: s.product, revenue: 0, icon: '🐾' }
    map[s.product].revenue += Number(s.total)
  })
  // Match icons from products
  Object.values(map).forEach(item => {
    const prod = appStore.products.find(p => p.name === item.name)
    if (prod) item.icon = prod.image
  })
  const sorted = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 7)
  const maxRev = sorted[0]?.revenue || 1
  return sorted.map(p => ({ ...p, pct: Math.round((p.revenue / maxRev) * 100) }))
})

// Inventory value
const inventoryValue = computed(() =>
  [...appStore.products].sort((a, b) => (b.stock * Number(b.price)) - (a.stock * Number(a.price)))
)
const totalInventoryValue = computed(() =>
  appStore.products.reduce((sum, p) => sum + p.stock * Number(p.price), 0)
)

// Paginated sales for report table
const salesTotalPages = computed(() => Math.ceil(appStore.sales.length / perPage))
const paginatedSales = computed(() => appStore.sales.slice((salesPage.value - 1) * perPage, salesPage.value * perPage))
const salesPageNumbers = computed(() => {
  const total = salesTotalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = salesPage.value
  if (cur <= 4) return [1,2,3,4,5,'...',total]
  if (cur >= total-3) return [1,'...',total-4,total-3,total-2,total-1,total]
  return [1,'...',cur-1,cur,cur+1,'...',total]
})

// CSV Export
function exportCSV(type) {
  let headers, rows, filename

  if (type === 'sales') {
    headers = ['Order #', 'Product', 'Customer', 'Quantity', 'Unit Price', 'Total', 'Date']
    rows = appStore.sales.map(s => [
      `#${String(s.id).padStart(4,'0')}`, s.product, s.customer,
      s.qty, s.unit_price || '', s.total, s.date
    ])
    filename = 'chippie-sales.csv'
  } else if (type === 'purchases') {
    headers = ['PO #', 'Product', 'Supplier', 'Quantity', 'Unit Cost', 'Total', 'Date', 'Status']
    rows = appStore.purchases.map(p => [
      `#PO${String(p.id).padStart(4,'0')}`, p.product, p.supplier,
      p.qty, p.unit_cost || '', p.total, p.date, p.status
    ])
    filename = 'chippie-purchases.csv'
  } else {
    headers = ['Name', 'Category', 'Price', 'Stock', 'Min Stock', 'Supplier', 'SKU', 'Inventory Value']
    rows = appStore.products.map(p => [
      p.name, p.category, p.price, p.stock, p.min_stock, p.supplier || '', p.sku || '',
      (p.stock * Number(p.price)).toFixed(2)
    ])
    filename = 'chippie-inventory.csv'
  }

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(async () => {
  await Promise.all([
    appStore.products.length === 0 ? appStore.loadProducts() : Promise.resolve(),
    appStore.sales.length === 0 ? appStore.loadSales() : Promise.resolve(),
    appStore.purchases.length === 0 ? appStore.loadPurchases() : Promise.resolve(),
  ])
})
</script>

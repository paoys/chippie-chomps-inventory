<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="stat in stats" :key="stat.label" class="card flex items-start gap-4 hover:shadow-hover hover:-translate-y-0.5 transition-all duration-300">
        <div :class="`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${stat.bg}`">{{ stat.icon }}</div>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-gray-500 mb-1">{{ stat.label }}</div>
          <div class="font-display font-800 text-2xl text-gray-800">{{ stat.value }}</div>
          <div :class="`text-xs mt-1 ${stat.subClass || 'text-gray-400'}`">{{ stat.sub }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <!-- Sales chart -->
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-6">
          <h2 class="font-display font-700 text-gray-800">Sales Overview</h2>
          <select v-model="chartPeriod" @change="reloadChart" class="input w-auto text-sm py-1.5">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="month">This month</option>
          </select>
        </div>
        <div v-if="chartLoading" class="h-48 flex items-center justify-center text-gray-400 text-sm">Loading chart...</div>
        <div v-else-if="chartBars.length === 0" class="h-48 flex items-center justify-center text-gray-400 text-sm">No sales data for this period.</div>
        <div v-else class="h-48 flex items-end gap-1 px-2 overflow-x-auto">
          <div v-for="(bar, i) in chartBars" :key="i" class="flex-1 min-w-[28px] flex flex-col items-center gap-1">
            <div
              class="w-full rounded-t-xl transition-all duration-500 hover:opacity-80 cursor-pointer"
              :class="bar.isToday ? 'bg-teal-500' : 'bg-teal-200'"
              :style="{ height: maxBar > 0 ? (bar.value / maxBar * 150) + 'px' : '4px' }"
              :title="'₱' + bar.value.toLocaleString()"
            ></div>
            <div class="text-xs text-gray-400 whitespace-nowrap">{{ bar.label }}</div>
          </div>
        </div>
        <div class="mt-3 text-right text-sm font-semibold text-teal-600">
          Total: ₱{{ chartTotal.toLocaleString() }}
        </div>
      </div>

      <!-- Top Products by sales -->
      <div class="card">
        <h2 class="font-display font-700 text-gray-800 mb-4">Top Products</h2>
        <div v-if="topProductsComputed.length === 0" class="text-center py-6 text-gray-400 text-sm">No sales yet.</div>
        <div v-else class="space-y-3">
          <div v-for="p in topProductsComputed" :key="p.name" class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-base">{{ p.icon }}</div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 truncate">{{ p.name }}</div>
              <div class="flex items-center gap-2 mt-0.5">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-teal-400 rounded-full transition-all duration-700" :style="{ width: p.pct + '%' }"></div>
                </div>
                <span class="text-xs text-gray-400">{{ p.qty }} sold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Low Stock Alert -->
    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display font-700 text-gray-800">⚠️ Low Stock Alert</h2>
        <router-link to="/inventory" class="text-sm text-teal-600 font-semibold hover:text-teal-700">View All →</router-link>
      </div>
      <div v-if="appStore.loadingProducts && appStore.loadingSales" class="text-center py-8 text-gray-400 text-sm">Loading...</div>
      <div v-else-if="appStore.lowStockProducts.length === 0" class="text-center py-12 text-gray-400">
        <div class="text-4xl mb-3">🎉</div>
        <div class="font-semibold">All products are well-stocked!</div>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide pb-3">Product</th>
              <th class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide pb-3">Category</th>
              <th class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide pb-3">Stock</th>
              <th class="text-left text-xs font-700 text-gray-400 uppercase tracking-wide pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in appStore.lowStockProducts" :key="p.id" class="table-row">
              <td class="py-3 pr-4">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{{ p.image }}</span>
                  <span class="font-medium text-gray-700 text-sm">{{ p.name }}</span>
                </div>
              </td>
              <td class="py-3 pr-4 text-sm text-gray-500">{{ p.category }}</td>
              <td class="py-3 pr-4 font-bold text-red-500 text-sm">{{ p.stock }} units</td>
              <td class="py-3">
                <span :class="p.stock <= 5 ? 'badge-red' : 'badge-yellow'">
                  {{ p.stock <= 5 ? 'Critical' : 'Low Stock' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const chartPeriod = ref('7d')
const chartLoading = ref(false)
const rawChartData = ref([])

const todayStr = new Date().toISOString().slice(0, 10)

const stats = computed(() => {
  const todaySales = appStore.sales.filter(s => s.date === todayStr)
  const todayTotal = todaySales.reduce((a, b) => a + Number(b.total), 0)
  return [
    { icon: '🛍️', label: 'Total Products', value: appStore.totalProducts, sub: `${appStore.lowStockProducts.length} low stock`, bg: 'bg-teal-100', subClass: 'text-teal-600' },
    { icon: '⚠️', label: 'Low Stock Items', value: appStore.lowStockProducts.length, sub: 'Needs restocking', bg: 'bg-red-100', subClass: 'text-red-500' },
    { icon: '💰', label: 'Sales Today', value: `₱${todayTotal.toLocaleString()}`, sub: `${todaySales.length} transactions`, bg: 'bg-yellow-100', subClass: 'text-yellow-600' },
  ]
})

// Build chart bars from raw sales data grouped by date/day
const chartBars = computed(() => {
  if (rawChartData.value.length === 0) return []
  
  const grouped = {}
  rawChartData.value.forEach(s => {
    const d = s.date
    if (!grouped[d]) grouped[d] = 0
    grouped[d] += Number(s.total)
  })

  // Generate all dates in range
  const bars = []
  const now = new Date()
  let startDate, days

  if (chartPeriod.value === '7d') {
    startDate = new Date(now); startDate.setDate(now.getDate() - 6); days = 7
  } else if (chartPeriod.value === '30d') {
    startDate = new Date(now); startDate.setDate(now.getDate() - 29); days = 30
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    days = now.getDate()
  }

  for (let i = 0; i < days; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    const isToday = key === todayStr
    let label
    if (chartPeriod.value === '7d') {
      label = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]
    } else {
      label = String(d.getDate())
    }
    bars.push({ label, value: grouped[key] || 0, isToday })
  }
  return bars
})

const maxBar = computed(() => Math.max(...chartBars.value.map(b => b.value), 1))
const chartTotal = computed(() => chartBars.value.reduce((a, b) => a + b.value, 0))

// Top products by qty sold
const topProductsComputed = computed(() => {
  const map = {}
  appStore.sales.forEach(s => {
    if (!map[s.product]) map[s.product] = { name: s.product, qty: 0, icon: '🐾' }
    map[s.product].qty += Number(s.qty)
  })
  // Try to match icon from products
  Object.values(map).forEach(item => {
    const prod = appStore.products.find(p => p.name === item.name)
    if (prod) item.icon = prod.image
  })
  const sorted = Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 5)
  const maxQty = sorted[0]?.qty || 1
  return sorted.map(p => ({ ...p, pct: Math.round((p.qty / maxQty) * 100) }))
})

async function reloadChart() {
  chartLoading.value = true
  rawChartData.value = await appStore.loadDashboardSalesChart(chartPeriod.value)
  chartLoading.value = false
}

onMounted(async () => {
  await Promise.all([
    appStore.products.length === 0 ? appStore.loadProducts() : Promise.resolve(),
    appStore.sales.length === 0 ? appStore.loadSales() : Promise.resolve(),
  ])
  await reloadChart()
})
</script>

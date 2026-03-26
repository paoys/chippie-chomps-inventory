import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAppStore = defineStore('app', () => {
  const products = ref([])
  const suppliers = ref([])
  const sales = ref([])
  const purchases = ref([])
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalProducts = computed(() => products.value.length)
  const lowStockProducts = computed(() => products.value.filter(p => p.stock <= p.min_stock))

  // Categories
  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) categories.value = data
  }

  async function addCategory(name) {
    const { data, error: err } = await supabase.from('categories').insert({ name }).select().single()
    if (!err && data) { categories.value.push(data); return data }
    return null
  }

  // Products
  async function loadProducts() {
    loading.value = true
    const { data, error: err } = await supabase.from('products').select('*').order('name')
    if (err) { error.value = err.message; loading.value = false; return }
    products.value = data || []
    loading.value = false
  }

  async function addProduct(product) {
    const { data, error: err } = await supabase.from('products').insert(product).select().single()
    if (err) { error.value = err.message; return null }
    products.value.push(data)
    return data
  }

  async function updateProduct(id, updates) {
    const { data, error: err } = await supabase
      .from('products').update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single()
    if (err) { error.value = err.message; return null }
    const idx = products.value.findIndex(p => p.id === id)
    if (idx !== -1) products.value[idx] = data
    return data
  }

  async function deleteProduct(id) {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) { error.value = err.message; return false }
    products.value = products.value.filter(p => p.id !== id)
    return true
  }

  // Suppliers
  async function loadSuppliers() {
    loading.value = true
    const { data, error: err } = await supabase.from('suppliers').select('*').order('name')
    if (err) { error.value = err.message; loading.value = false; return }
    suppliers.value = data || []
    loading.value = false
  }

  async function addSupplier(supplier) {
    const { data, error: err } = await supabase.from('suppliers').insert(supplier).select().single()
    if (err) { error.value = err.message; return null }
    suppliers.value.push(data)
    return data
  }

  async function updateSupplier(id, updates) {
    const { data, error: err } = await supabase.from('suppliers').update(updates).eq('id', id).select().single()
    if (err) { error.value = err.message; return null }
    const idx = suppliers.value.findIndex(s => s.id === id)
    if (idx !== -1) suppliers.value[idx] = data
    return data
  }

  async function deleteSupplier(id) {
    const { error: err } = await supabase.from('suppliers').delete().eq('id', id)
    if (err) { error.value = err.message; return false }
    suppliers.value = suppliers.value.filter(s => s.id !== id)
    return true
  }

  // Sales
  async function loadSales() {
    loading.value = true
    const { data, error: err } = await supabase.from('sales').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
    if (err) { error.value = err.message; loading.value = false; return }
    sales.value = data || []
    loading.value = false
  }

  async function addSale(sale) {
    const payload = {
      product: sale.product, product_id: sale.product_id || null,
      customer: sale.customer, qty: sale.qty,
      unit_price: sale.unitPrice, total: sale.total, date: sale.date,
    }
    const { data, error: err } = await supabase.from('sales').insert(payload).select().single()
    if (err) { error.value = err.message; return null }
    if (sale.product_id) {
      const product = products.value.find(p => p.id === sale.product_id)
      if (product) await updateProduct(sale.product_id, { stock: Math.max(0, product.stock - sale.qty) })
    }
    sales.value.unshift(data)
    return data
  }

  // Purchases
  async function loadPurchases() {
    loading.value = true
    const { data, error: err } = await supabase.from('purchases').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
    if (err) { error.value = err.message; loading.value = false; return }
    purchases.value = data || []
    loading.value = false
  }

  async function addPurchase(purchase) {
    const payload = {
      supplier: purchase.supplier, product: purchase.product,
      qty: purchase.qty, unit_cost: purchase.unitCost,
      total: purchase.total, date: purchase.date, status: purchase.status || 'Pending',
    }
    const { data, error: err } = await supabase.from('purchases').insert(payload).select().single()
    if (err) { error.value = err.message; return null }
    purchases.value.unshift(data)
    return data
  }

  async function updatePurchaseStatus(id, status) {
    const { data, error: err } = await supabase.from('purchases').update({ status }).eq('id', id).select().single()
    if (err) { error.value = err.message; return null }
    const idx = purchases.value.findIndex(p => p.id === id)
    if (idx !== -1) purchases.value[idx] = data
    return data
  }

  // Inventory adjust
  async function adjustStock(productId, type, qty) {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false
    let newStock = type === 'add' ? product.stock + qty : type === 'remove' ? product.stock - qty : qty
    newStock = Math.max(0, newStock)
    return await updateProduct(productId, { stock: newStock })
  }

  // Dashboard sales chart data
  async function loadDashboardSalesChart(period) {
    let startDate
    const now = new Date()
    if (period === '30d') { startDate = new Date(now); startDate.setDate(now.getDate() - 29) }
    else if (period === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1) }
    else { startDate = new Date(now); startDate.setDate(now.getDate() - 6) }
    const { data, error: err } = await supabase.from('sales').select('date, total').gte('date', startDate.toISOString().slice(0, 10)).order('date')
    if (err || !data) return []
    return data
  }

  async function loadAll() {
    await Promise.all([loadProducts(), loadSuppliers(), loadSales(), loadPurchases(), loadCategories()])
  }

  return {
    products, suppliers, sales, purchases, categories, loading, error,
    totalProducts, lowStockProducts,
    loadAll, loadProducts, loadSuppliers, loadSales, loadPurchases, loadCategories,
    addProduct, updateProduct, deleteProduct,
    addSupplier, updateSupplier, deleteSupplier,
    addSale, addPurchase, updatePurchaseStatus,
    adjustStock, addCategory, loadDashboardSalesChart,
  }
})

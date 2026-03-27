import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

export const useAppStore = defineStore('app', () => {
  const products = ref([])
  const suppliers = ref([])
  const sales = ref([])
  const purchases = ref([])
  const categories = ref([])

  // Independent loading states per entity
  const loadingProducts = ref(false)
  const loadingSuppliers = ref(false)
  const loadingSales = ref(false)
  const loadingPurchases = ref(false)
  const loadingCategories = ref(false)

  // Keep a generic loading for backward compat
  const loading = computed(() =>
    loadingProducts.value || loadingSuppliers.value ||
    loadingSales.value || loadingPurchases.value || loadingCategories.value
  )

  const error = ref(null)

  const totalProducts = computed(() => products.value.length)
  const lowStockProducts = computed(() => products.value.filter(p => p.stock <= p.min_stock))

  // ─── Categories ────────────────────────────────────────────────────────────
  async function loadCategories() {
    loadingCategories.value = true
    const { data, error: err } = await supabase.from('categories').select('*').order('name')
    if (err) { error.value = err.message; loadingCategories.value = false; return }
    if (data) categories.value = data
    loadingCategories.value = false
  }

  async function addCategory(name) {
    const { data, error: err } = await supabase.from('categories').insert({ name }).select().single()
    if (err) { error.value = err.message; return null }
    categories.value.push(data)
    // Sort alphabetically
    categories.value.sort((a, b) => a.name.localeCompare(b.name))
    return data
  }

  async function deleteCategory(id) {
    const { error: err } = await supabase.from('categories').delete().eq('id', id)
    if (err) { error.value = err.message; return false }
    categories.value = categories.value.filter(c => c.id !== id)
    return true
  }

  // ─── Products ──────────────────────────────────────────────────────────────
  async function loadProducts() {
    loadingProducts.value = true
    const { data, error: err } = await supabase.from('products').select('*').order('name')
    if (err) { error.value = err.message; loadingProducts.value = false; return }
    products.value = data || []
    loadingProducts.value = false
  }

  async function addProduct(product) {
    const { data, error: err } = await supabase.from('products').insert(product).select().single()
    if (err) { error.value = err.message; return null }
    products.value.push(data)
    products.value.sort((a, b) => a.name.localeCompare(b.name))
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

  // ─── Suppliers ─────────────────────────────────────────────────────────────
  async function loadSuppliers() {
    loadingSuppliers.value = true
    const { data, error: err } = await supabase.from('suppliers').select('*').order('name')
    if (err) { error.value = err.message; loadingSuppliers.value = false; return }
    suppliers.value = data || []
    loadingSuppliers.value = false
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

  // ─── Sales ─────────────────────────────────────────────────────────────────
  async function loadSales() {
    loadingSales.value = true
    const { data, error: err } = await supabase
      .from('sales').select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (err) { error.value = err.message; loadingSales.value = false; return }
    sales.value = data || []
    loadingSales.value = false
  }

  async function addSale(sale) {
    const payload = {
      product: sale.product, product_id: sale.product_id || null,
      customer: sale.customer, qty: sale.qty,
      unit_price: sale.unitPrice, total: sale.total, date: sale.date,
    }
    const { data, error: err } = await supabase.from('sales').insert(payload).select().single()
    if (err) { error.value = err.message; return null }
    // Reduce stock
    if (sale.product_id) {
      const product = products.value.find(p => p.id === sale.product_id)
      if (product) await updateProduct(sale.product_id, { stock: Math.max(0, product.stock - sale.qty) })
    }
    sales.value.unshift(data)
    return data
  }

  // ─── Purchases ─────────────────────────────────────────────────────────────
  async function loadPurchases() {
    loadingPurchases.value = true
    const { data, error: err } = await supabase
      .from('purchases').select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (err) { error.value = err.message; loadingPurchases.value = false; return }
    purchases.value = data || []
    loadingPurchases.value = false
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

  /**
   * Update purchase status.
   * When status changes TO "Received", automatically replenish stock
   * for the matched product by the PO's qty.
   */
  async function updatePurchaseStatus(id, newStatus) {
    const po = purchases.value.find(p => p.id === id)
    if (!po) return null

    const prevStatus = po.status

    const { data, error: err } = await supabase
      .from('purchases').update({ status: newStatus }).eq('id', id).select().single()
    if (err) { error.value = err.message; return null }

    const idx = purchases.value.findIndex(p => p.id === id)
    if (idx !== -1) purchases.value[idx] = data

    // Auto-replenish stock when PO moves to Received
    if (newStatus === 'Received' && prevStatus !== 'Received') {
      // Find the matching product by name (case-insensitive)
      const product = products.value.find(
        p => p.name.toLowerCase() === po.product.toLowerCase()
      )
      if (product) {
        await updateProduct(product.id, { stock: product.stock + po.qty })
      } else {
        // Product not loaded yet — fetch from DB and update directly
        const { data: prodData } = await supabase
          .from('products').select('id, stock').ilike('name', po.product).maybeSingle()
        if (prodData) {
          await supabase.from('products')
            .update({ stock: prodData.stock + po.qty, updated_at: new Date().toISOString() })
            .eq('id', prodData.id)
        }
      }
    }

    return data
  }

  // ─── Inventory adjust ──────────────────────────────────────────────────────
  async function adjustStock(productId, type, qty) {
    const product = products.value.find(p => p.id === productId)
    if (!product) return false
    let newStock = type === 'add' ? product.stock + qty
      : type === 'remove' ? product.stock - qty
      : qty
    newStock = Math.max(0, newStock)
    return await updateProduct(productId, { stock: newStock })
  }

  // ─── Dashboard chart ───────────────────────────────────────────────────────
  async function loadDashboardSalesChart(period) {
    let startDate
    const now = new Date()
    if (period === '30d') { startDate = new Date(now); startDate.setDate(now.getDate() - 29) }
    else if (period === 'month') { startDate = new Date(now.getFullYear(), now.getMonth(), 1) }
    else { startDate = new Date(now); startDate.setDate(now.getDate() - 6) }
    const { data, error: err } = await supabase
      .from('sales').select('date, total')
      .gte('date', startDate.toISOString().slice(0, 10)).order('date')
    if (err || !data) return []
    return data
  }

  // ─── Legacy loadAll (still available if needed) ───────────────────────────
  async function loadAll() {
    await Promise.all([loadProducts(), loadSuppliers(), loadSales(), loadPurchases(), loadCategories()])
  }

  return {
    products, suppliers, sales, purchases, categories,
    loading, loadingProducts, loadingSuppliers, loadingSales, loadingPurchases, loadingCategories,
    error, totalProducts, lowStockProducts,
    loadAll, loadProducts, loadSuppliers, loadSales, loadPurchases, loadCategories,
    addProduct, updateProduct, deleteProduct,
    addSupplier, updateSupplier, deleteSupplier,
    addSale, addPurchase, updatePurchaseStatus,
    addCategory, deleteCategory, adjustStock, loadDashboardSalesChart,
  }
})

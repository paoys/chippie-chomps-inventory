<template>
  <div class="space-y-5">
    <div class="flex flex-wrap items-center gap-3 justify-between">
      <div class="flex items-center gap-3 flex-wrap">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input v-model="search" class="input pl-9 w-56" placeholder="Search products..." @input="resetPage" />
        </div>
        <select v-model="filterCat" class="input w-auto" @change="resetPage">
          <option value="">All Categories</option>
          <option v-for="c in appStore.categories" :key="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div class="flex gap-2">
        <button @click="manageCatsOpen = true" class="btn-secondary flex items-center gap-2">
          🗂️ Categories
        </button>
        <button @click="openAdd" class="btn-primary flex items-center gap-2">
          <span>＋</span> Add Product
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="appStore.error" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">❌ {{
      appStore.error }}</div>

    <div class="card p-0 overflow-hidden">
      <!-- Loading -->
      <div v-if="appStore.loadingProducts" class="px-6 py-12 text-center text-gray-400 text-sm">Loading products...</div>
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
                    <div class="text-xs text-gray-400">{{ p.sku }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3"><span class="badge-blue">{{ p.category }}</span></td>
              <td class="px-6 py-3 font-semibold text-gray-800">₱{{ Number(p.price).toLocaleString() }}</td>
              <td class="px-6 py-3">
                <span :class="p.stock <= 5 ? 'badge-red' : p.stock <= p.min_stock ? 'badge-yellow' : 'badge-green'">
                  {{ p.stock }} units
                </span>
              </td>
              <td class="px-6 py-3 text-sm text-gray-500">{{ p.supplier }}</td>
              <td class="px-6 py-3">
                <div class="flex items-center gap-2">
                  <button @click="openEdit(p)"
                    class="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 flex items-center justify-center text-xs">✏️</button>
                  <button @click="confirmDelete(p)"
                    class="w-7 h-7 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center text-xs">🗑️</button>
                </div>
              </td>
            </tr>
            <tr v-if="filtered.length === 0 && !appStore.loadingProducts">
              <td colspan="6" class="px-6 py-12 text-center text-gray-400">No products found.</td>
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
          <button v-for="p in pageNumbers" :key="p" @click="page = p"
            class="w-8 h-8 rounded-lg border text-xs font-semibold flex items-center justify-center transition-colors"
            :class="p === page ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 hover:bg-gray-50'">{{ p
            }}</button>
          <button @click="page++" :disabled="page === totalPages"
            class="w-8 h-8 rounded-lg border border-gray-200 text-sm flex items-center justify-center disabled:opacity-40 hover:bg-gray-50">›</button>
        </div>
      </div>
    </div>

    <div>
      <!-- Add/Edit Modal -->
      <AppModal v-model="modalOpen" :title="editingProduct ? '✏️ Edit Product' : '➕ Add Product'">
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Product Name *</label>
              <input v-model="form.name" class="input" placeholder="e.g. Chippie Chicken Bites" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Category *</label>
              <select v-if="!showNewCat" v-model="form.category" class="input">
                <option value="">Select category</option>
                <option v-for="c in appStore.categories" :key="c.id" :value="c.name">{{ c.name }}</option>
                <option value="__new__">+ New Category</option>
              </select>
              <div v-else class="flex gap-2">
                <input v-model="newCatName" class="input flex-1" placeholder="New category name"
                  @keyup.enter="saveNewCategory" />
                <button @click="saveNewCategory" class="btn-primary px-3 py-2 text-sm">Add</button>
                <button @click="showNewCat = false; newCatName = ''" class="btn-secondary px-3 py-2 text-sm">✕</button>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Price (₱) *</label>
              <input v-model.number="form.price" type="number" class="input" placeholder="0.00" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Current Stock</label>
              <input v-model.number="form.stock" type="number" class="input" placeholder="0" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Min Stock Threshold</label>
              <input v-model.number="form.min_stock" type="number" class="input" placeholder="10" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Emoji Icon</label>
              <input v-model="form.image" class="input" placeholder="🐾" maxlength="4" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">SKU</label>
              <input v-model="form.sku" class="input" placeholder="PRD-001" />
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Supplier</label>
              <select v-model="form.supplier" class="input">
                <option value="">Select supplier</option>
                <option v-for="s in appStore.suppliers" :key="s.id" :value="s.name">{{ s.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="saveError" class="bg-red-50 border border-red-200 text-red-600 rounded-xl px-3 py-2 text-sm">❌ {{
            saveError }}</div>
        </div>
        <template #footer>
          <button @click="modalOpen = false" class="btn-secondary">Cancel</button>
          <button @click="saveProduct" class="btn-primary flex items-center gap-2" :disabled="saving">
            <span v-if="saving" class="animate-spin text-xs">⏳</span>
            {{ editingProduct ? 'Save Changes' : 'Add Product' }}
          </button>
        </template>
      </AppModal>

      <!-- Manage Categories Modal -->
      <AppModal v-model="manageCatsOpen" title="🗂️ Manage Categories">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Add New Category</label>
            <div class="flex gap-2">
              <input v-model="newCatNameManage" class="input flex-1" placeholder="Category name" @keyup.enter="addCategoryFromManage" />
              <button @click="addCategoryFromManage" class="btn-primary px-4 py-2 text-sm" :disabled="!newCatNameManage.trim()">Add</button>
            </div>
            <p v-if="catAddSuccess" class="text-xs text-teal-600 mt-1">✅ Category added!</p>
            <p v-if="catAddError" class="text-xs text-red-500 mt-1">❌ {{ catAddError }}</p>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Existing Categories</label>
            <div v-if="appStore.loadingCategories" class="text-center py-4 text-gray-400 text-sm">Loading...</div>
            <div v-else-if="appStore.categories.length === 0" class="text-center py-4 text-gray-400 text-sm">No categories yet.</div>
            <div v-else class="space-y-1.5 max-h-64 overflow-y-auto">
              <div v-for="cat in appStore.categories" :key="cat.id"
                class="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                <div class="flex items-center gap-2">
                  <span class="text-sm">🏷️</span>
                  <span class="text-sm font-medium text-gray-700">{{ cat.name }}</span>
                  <span class="text-xs text-gray-400">({{ appStore.products.filter(p => p.category === cat.name).length }} products)</span>
                </div>
                <button @click="confirmDeleteCat(cat)"
                  class="w-7 h-7 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete category">🗑️</button>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <button @click="manageCatsOpen = false" class="btn-secondary">Close</button>
        </template>
      </AppModal>

      <!-- Delete Category Confirm -->
      <AppModal v-model="deleteCatModal" title="🗑️ Delete Category" size="sm">
        <div class="space-y-3">
          <p class="text-gray-600">Delete category <strong>{{ deletingCat?.name }}</strong>?</p>
          <div v-if="appStore.products.filter(p => p.category === deletingCat?.name).length > 0"
            class="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl px-4 py-3 text-sm">
            ⚠️ <strong>{{ appStore.products.filter(p => p.category === deletingCat?.name).length }} products</strong> use this category.
            They will keep the category name but it won't appear in the category filter.
          </div>
          <p v-else class="text-sm text-gray-500">No products are using this category.</p>
        </div>
        <template #footer>
          <button @click="deleteCatModal = false" class="btn-secondary">Cancel</button>
          <button @click="doDeleteCat" class="btn-danger" :disabled="deletingCatSaving">
            <span v-if="deletingCatSaving" class="animate-spin text-xs mr-1">⏳</span>
            Delete Category
          </button>
        </template>
      </AppModal>

      <!-- Delete confirm -->
      <AppModal v-model="deleteModal" title="🗑️ Delete Product" size="sm">
        <p class="text-gray-600">Are you sure you want to delete <strong>{{ deletingProduct?.name }}</strong>? This
          action
          cannot be undone.</p>
        <template #footer>
          <button @click="deleteModal = false" class="btn-secondary">Cancel</button>
          <button @click="doDelete" class="btn-danger" :disabled="saving">Delete</button>
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
const filterCat = ref('')
const modalOpen = ref(false)
const deleteModal = ref(false)
const editingProduct = ref(null)
const deletingProduct = ref(null)
const saving = ref(false)
const saveError = ref('')
const showNewCat = ref(false)
const newCatName = ref('')
const page = ref(1)
const perPage = 10
const headers = ['Product', 'Category', 'Price', 'Stock', 'Supplier', 'Actions']

const defaultForm = () => ({ name: '', category: '', price: 0, stock: 0, min_stock: 10, image: '🐾', sku: '', supplier: '' })
const form = ref(defaultForm())

const filtered = computed(() => appStore.products.filter(p => {
  const s = search.value.toLowerCase()
  return (!s || p.name.toLowerCase().includes(s) || p.category.toLowerCase().includes(s) || (p.sku || '').toLowerCase().includes(s))
    && (!filterCat.value || p.category === filterCat.value)
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
watch([search, filterCat], resetPage)

// Watch for __new__ category selection
watch(() => form.value.category, (val) => {
  if (val === '__new__') {
    showNewCat.value = true
    form.value.category = ''
  }
})

const manageCatsOpen = ref(false)
const newCatNameManage = ref('')
const catAddSuccess = ref(false)
const catAddError = ref('')
const deleteCatModal = ref(false)
const deletingCat = ref(null)
const deletingCatSaving = ref(false)

async function addCategoryFromManage() {
  if (!newCatNameManage.value.trim()) return
  catAddSuccess.value = false
  catAddError.value = ''
  const exists = appStore.categories.find(c => c.name.toLowerCase() === newCatNameManage.value.trim().toLowerCase())
  if (exists) { catAddError.value = 'Category already exists.'; return }
  const result = await appStore.addCategory(newCatNameManage.value.trim())
  if (result) {
    catAddSuccess.value = true
    newCatNameManage.value = ''
    setTimeout(() => catAddSuccess.value = false, 2000)
  } else {
    catAddError.value = appStore.error || 'Failed to add category.'
  }
}

function confirmDeleteCat(cat) {
  deletingCat.value = cat
  deleteCatModal.value = true
}

async function doDeleteCat() {
  if (!deletingCat.value) return
  deletingCatSaving.value = true
  await appStore.deleteCategory(deletingCat.value.id)
  deletingCatSaving.value = false
  deleteCatModal.value = false
  deletingCat.value = null
}

function openAdd() {
  editingProduct.value = null
  form.value = defaultForm()
  saveError.value = ''
  showNewCat.value = false
  modalOpen.value = true
}

function openEdit(p) {
  editingProduct.value = p
  form.value = { ...p }
  saveError.value = ''
  showNewCat.value = false
  modalOpen.value = true
}

function confirmDelete(p) {
  deletingProduct.value = p
  deleteModal.value = true
}

async function saveProduct() {
  if (!form.value.name || !form.value.category) { saveError.value = 'Name and category are required.'; return }
  saving.value = true
  saveError.value = ''
  const payload = {
    name: form.value.name, category: form.value.category,
    price: form.value.price, stock: form.value.stock,
    min_stock: form.value.min_stock, image: form.value.image || '🐾',
    sku: form.value.sku || null, supplier: form.value.supplier || null,
  }
  let result
  if (editingProduct.value) result = await appStore.updateProduct(editingProduct.value.id, payload)
  else result = await appStore.addProduct(payload)
  saving.value = false
  if (result) modalOpen.value = false
  else saveError.value = appStore.error || 'Failed to save product.'
}

async function doDelete() {
  saving.value = true
  await appStore.deleteProduct(deletingProduct.value.id)
  saving.value = false
  deleteModal.value = false
}

onMounted(async () => {
  await Promise.all([
    appStore.products.length === 0 ? appStore.loadProducts() : Promise.resolve(),
    appStore.suppliers.length === 0 ? appStore.loadSuppliers() : Promise.resolve(),
    appStore.categories.length === 0 ? appStore.loadCategories() : Promise.resolve(),
  ])
})
</script>

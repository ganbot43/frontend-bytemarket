<template>
  <div class="prod-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Productos</h1>
        <p class="sp-page-toolbar__sub">
          {{ total }} productos en catálogo
        </p>
      </div>
      <button class="sp-page-btn" @click="openDrawer()">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Nuevo producto
      </button>
    </div>
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th" style="width: 72px">Imagen</th>
              <th class="sp-th">Producto</th>
              <th class="sp-th">Precio</th>
              <th class="sp-th">Stock</th>
              <th class="sp-th">Nuevo</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id" class="sp-tr">
              <td class="sp-td">
                <div class="sp-table-img">
                  <img v-if="product.images?.[0]?.url" :src="product.images[0].url" :alt="product.name" />
                  <Image v-else class="w-5 h-5 text-current opacity-50" stroke-width="1.5" />
                </div>
              </td>
              <td class="sp-td">
                <p class="sp-table-title">{{ product.name }}</p>
                <p class="sp-table-sub" v-if="product.category?.name">{{ product.category.name }}</p>
              </td>
              <td class="sp-td">
                <span class="sp-table-amount">{{ formatPrice.format(product.price) }}</span>
              </td>
              <td class="sp-td">
                <span class="sp-table-num" :class="{ 'sp-table-num--low': product.stock < 5 }">{{ product.stock
                  }}</span>
              </td>
              <td class="sp-td">
                <span class="sp-badge" :class="product.nuevoLanzamiento ? 'sp-badge--warning' : 'sp-badge--neutral'">
                  <span class="sp-badge__dot"></span>
                  {{ product.nuevoLanzamiento ? 'Sí' : 'No' }}
                </span>
              </td>
              <td class="sp-td">
                <span class="sp-badge" :class="product.isActive ? 'sp-badge--success' : 'sp-badge--danger'">
                  <span class="sp-badge__dot"></span>
                  {{ product.isActive ? "Activo" : "Inactivo" }}
                </span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{ formatDateTime(product.createdAt) }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--edit" @click="openDrawer(product)" title="Editar">
                    <Pencil class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button class="sp-table-btn sp-table-btn--del" @click="deleteProduct(product.id)" title="Eliminar">
                    <Trash2 class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!products.length">
              <td colspan="8" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Inbox class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">No hay productos aún</p>
                  <button class="sp-table-empty__cta" @click="openDrawer()">Crear el primero</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sp-table-footer"
        style="display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; gap:1rem">
        <div class="sp-table-meta">Página {{ page + 1 }} — {{ total }} registros</div>
        <div style="display:flex; gap:0.35rem; align-items:center">
          <button v-for="p in totalPages" :key="p" @click="page = p - 1; fetchProducts()" :disabled="p - 1 === page"
            class="sp-table-btn" style="min-width:36px; padding:.45rem .6rem; font-size:0.875rem"
            :style="{ fontWeight: p - 1 === page ? 600 : 400, background: p - 1 === page ? '#3b82f6' : 'transparent', color: p - 1 === page ? 'white' : 'inherit' }">{{
            p }}</button>
        </div>
      </div>
    </div>

    <!-- ══ DRAWER ══ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="drawerOpen" class="sp-drawer-overlay" @click.self="closeDrawer" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <aside v-if="drawerOpen" class="sp-drawer-panel" role="dialog" aria-modal="true">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">{{ isEditing ? "Editar" : "Nuevo" }}</p>
              <h2 class="sp-drawer-header__title">{{ isEditing ? form.name || "Producto" : "Crear producto" }}</h2>
            </div>
            <button class="sp-drawer-close" @click="closeDrawer" aria-label="Cerrar">
              <X class="w-4 h-4" stroke-width="1.8" />
            </button>
          </div>
          <div class="sp-drawer-body">
            <!-- ── Zona de imágenes ── -->
            <div class="prod-img-section">
              <div class="prod-img-section__header">
                <span class="sp-drawer-label">Imágenes</span>
                <span class="prod-img-counter">{{ allSlots.length }} / {{ MAX_IMAGES }}</span>
              </div>
              <div class="prod-img-grid">
                <div v-for="(url, i) in images" :key="`url-${i}`" class="prod-img-thumb"
                  :class="{ 'prod-img-thumb--primary': i === 0 }" draggable="true" @dragstart="onDragStart('url', i)"
                  @dragover.prevent @drop="onDrop('url', i)">
                  <img :src="url" :alt="`Imagen ${i + 1}`" />
                  <div class="prod-img-thumb__overlay">
                    <button class="prod-img-thumb__remove" @click="removeImageByUrl(i)" title="Eliminar">
                      <X class="w-3 h-3 text-current" stroke-width="1.6" />
                    </button>
                  </div>
                  <span v-if="i === 0" class="prod-img-thumb__badge">Principal</span>
                </div>
                <div v-for="(p, i) in previews" :key="`file-${i}`" class="prod-img-thumb prod-img-thumb--new"
                  :class="{ 'prod-img-thumb--primary': images.length === 0 && i === 0 }" draggable="true"
                  @dragstart="onDragStart('file', i)" @dragover.prevent @drop="onDrop('file', i)">
                  <img :src="p" :alt="`Preview ${i + 1}`" />
                  <div class="prod-img-thumb__overlay">
                    <button class="prod-img-thumb__remove" @click="removePreview(i)" title="Eliminar">
                      <X class="w-3 h-3 text-current" stroke-width="1.6" />
                    </button>
                  </div>
                  <span v-if="images.length === 0 && i === 0" class="prod-img-thumb__badge">Principal</span>
                  <span class="prod-img-thumb__new-badge">Nueva</span>
                </div>
                <label v-if="allSlots.length < MAX_IMAGES" class="prod-img-add"
                  :class="{ 'prod-img-add--drag': isDraggingOver }" @dragover.prevent="isDraggingOver = true"
                  @dragleave="isDraggingOver = false" @drop.prevent="onDropFile($event)">
                  <input ref="fileInputRef" type="file" accept="image/*" multiple class="prod-img-add__input"
                    @change="onFilesSelected" />
                  <Plus class="w-5 h-5 text-current" stroke-width="1.8" />
                  <span>Agregar</span>
                </label>
              </div>
              <label v-if="allSlots.length === 0" class="prod-img-dropzone"
                :class="{ 'prod-img-dropzone--active': isDraggingOver }" @dragover.prevent="isDraggingOver = true"
                @dragleave="isDraggingOver = false" @drop.prevent="onDropFile($event)">
                <input type="file" accept="image/*" multiple class="prod-img-add__input" @change="onFilesSelected" />
                <ImagePlus class="w-7 h-7 text-current" stroke-width="1.2" />
                <span class="prod-img-dropzone__title">Arrastra imágenes aquí</span>
                <span class="prod-img-dropzone__sub">o haz clic para seleccionar · jpg, png, webp · máx 2 MB</span>
              </label>
              <p v-if="imgError" class="prod-img-error">
                <AlertCircle class="w-3 h-3 text-current" stroke-width="1.2" />
                {{ imgError }}
              </p>
              <p v-if="allSlots.length > 0" class="prod-img-hint">La primera imagen es la principal · arrastra para
                reordenar</p>
            </div>

            <!-- ── Campos ── -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Nombre <span class="sp-drawer-req">*</span></label>
              <input v-model="form.name" class="sp-drawer-input" placeholder="Ej. Crema hidratante" />
            </div>
            <div class="sp-drawer-row">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Precio (S/) <span class="sp-drawer-req">*</span></label>
                <input v-model.number="form.price" type="number" step="0.01" min="0" class="sp-drawer-input"
                  placeholder="0.00" />
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Precio antes (S/)</label>
                <input v-model.number="form.comparePrice" type="number" step="0.01" min="0" class="sp-drawer-input"
                  placeholder="Opcional" />
                <p class="sp-drawer-hint">
                  <template v-if="descuentoPct">
                    Se mostrará <strong>-{{ descuentoPct }}%</strong> en la tienda.
                  </template>
                  <template v-else>
                    Déjalo vacío si no hay rebaja. Debe ser mayor al precio actual.
                  </template>
                </p>
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Stock</label>
                <input v-model.number="form.stock" type="number" min="0" class="sp-drawer-input" placeholder="0" />
              </div>
            </div>
            <div class="sp-drawer-row">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Categoría</label>
                <select v-model="form.categoryId" class="sp-drawer-input sp-drawer-select">
                  <option :value="null">Sin categoría</option>
                  <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Subcategoría</label>
                <select v-model="form.subcategoryId" class="sp-drawer-input sp-drawer-select">
                  <option :value="null">Sin subcategoría</option>
                  <option v-for="s in subcategoryOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="sp-drawer-field">
              <div class="sp-drawer-field-header">
                <label class="sp-drawer-label">Descripción</label>
                <span class="sp-drawer-field-counter">{{ (form.description || '').length }} / 1000</span>
              </div>
              <textarea v-model="form.description" class="sp-drawer-input sp-drawer-textarea" rows="3" maxlength="1000"
                placeholder="Descripción del producto..." />
            </div>
            <div class="sp-drawer-switches">
              <label class="sp-drawer-switch">
                <input type="checkbox" v-model="form.trackStock" class="sp-drawer-switch__input" />
                <span class="sp-drawer-switch__track"><span class="sp-drawer-switch__thumb"></span></span>
                <span class="sp-drawer-switch__label">Rastrear stock</span>
              </label>
              <label class="sp-drawer-switch">
                <input type="checkbox" v-model="form.isFeatured" class="sp-drawer-switch__input" />
                <span class="sp-drawer-switch__track"><span class="sp-drawer-switch__thumb"></span></span>
                <span class="sp-drawer-switch__label">Producto destacado</span>
              </label>
              <label class="sp-drawer-switch">
                <input type="checkbox" v-model="form.nuevoLanzamiento" class="sp-drawer-switch__input" />
                <span class="sp-drawer-switch__track"><span class="sp-drawer-switch__thumb"></span></span>
                <span class="sp-drawer-switch__label">Nuevo lanzamiento</span>
              </label>
              <label class="sp-drawer-switch">
                <input type="checkbox" v-model="form.isActive" class="sp-drawer-switch__input" />
                <span class="sp-drawer-switch__track"><span class="sp-drawer-switch__thumb"></span></span>
                <span class="sp-drawer-switch__label">Activo</span>
              </label>
            </div>
            <p v-if="formError" class="sp-drawer-error">{{ formError }}</p>
          </div>
          <div class="sp-drawer-footer">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="closeDrawer">Cancelar</button>
            <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="saving" @click="save">
              <Loader2 v-if="saving" class="sp-drawer-spin w-3.5 h-3.5" stroke-width="2" />
              <Check v-else class="w-3.5 h-3.5 text-current" stroke-width="1.8" />
              {{ isEditing ? "Guardar cambios" : "Crear producto" }}
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Plus, Image, Pencil, Trash2, Inbox, X, ImagePlus, AlertCircle, Loader2, Check } from "lucide-vue-next";
import type { Product } from "~/types"
definePageMeta({ middleware: "auth", layout: "admin" })
useSeoMeta({ title: "Productos — Admin" })

const formatPrice = useFormatPrice()
const { formatDateTime } = useFormatDateTime()

// ── Paginación ──
const page = ref<number>(0)
const limit = ref<number>(10)
const total = ref<number>(0)
const products = ref<Product[]>([])
const loading = ref<boolean>(false)

const totalPages = computed<number>(() => Math.ceil((total.value || 0) / limit.value))

async function fetchProducts() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/admin/products', {
      query: { limit: limit.value, offset: page.value * limit.value }
    })
    products.value = res?.data ?? []
    total.value = res?.total ?? products.value.length
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchProducts())

const { data: categoriesData } = await useFetch("/api/admin/categories")
const { data: subsData } = await useFetch("/api/admin/subcategories")

// ── Drawer state ──
const drawerOpen = ref(false)
const editingId = ref<number | null>(null)
const isEditing = computed(() => !!editingId.value)
const saving = ref(false)
const formError = ref("")

// ── Image state ──
const images = ref<string[]>([])
const selectedFiles = ref<File[]>([])
const previews = ref<string[]>([])
const imgError = ref("")
const isDraggingOver = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const MAX_IMAGES = 5
const MAX_SIZE = 2 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]

const allSlots = computed(() => [...images.value, ...previews.value])

let dragSrc: { type: "url" | "file"; index: number } | null = null

function onDragStart(type: "url" | "file", index: number) {
  dragSrc = { type, index }
}

function onDrop(type: "url" | "file", dropIndex: number) {
  if (!dragSrc) return
  if (dragSrc.type === type) {
    if (type === "url") {
      const [item] = images.value.splice(dragSrc.index, 1)
      images.value.splice(dropIndex, 0, item)
    } else {
      const [file] = selectedFiles.value.splice(dragSrc.index, 1)
      const [preview] = previews.value.splice(dragSrc.index, 1)
      selectedFiles.value.splice(dropIndex, 0, file)
      previews.value.splice(dropIndex, 0, preview)
    }
  }
  dragSrc = null
}

function onDropFile(e: DragEvent) {
  isDraggingOver.value = false
  addFiles(Array.from(e.dataTransfer?.files ?? []))
}

function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement
  addFiles(Array.from(input.files ?? []))
  input.value = ""
}

function addFiles(files: File[]) {
  imgError.value = ""
  const remaining = MAX_IMAGES - allSlots.value.length
  if (remaining <= 0) { imgError.value = `Ya tienes el máximo de ${MAX_IMAGES} imágenes`; return }
  const toAdd = files.slice(0, remaining)
  for (const f of toAdd) {
    if (!ALLOWED.includes(f.type)) { imgError.value = "Tipo no permitido: solo jpg, png, webp o gif"; return }
    if (f.size > MAX_SIZE) { imgError.value = "Cada imagen debe ser menor a 2 MB"; return }
    selectedFiles.value.push(f)
    previews.value.push(URL.createObjectURL(f))
  }
  if (files.length > remaining) imgError.value = `Solo se agregaron ${remaining} de ${files.length} (límite alcanzado)`
}

function removePreview(index: number) {
  URL.revokeObjectURL(previews.value[index])
  previews.value.splice(index, 1)
  selectedFiles.value.splice(index, 1)
}

function removeImageByUrl(index: number) {
  images.value.splice(index, 1)
}

// ── Form ──
const emptyForm = () => ({
  name: "",
  price: 0,
  comparePrice: null as number | null,
  stock: 0,
  description: "",
  categoryId: null as number | null,
  subcategoryId: null as number | null,
  trackStock: true,
  isFeatured: false,
  nuevoLanzamiento: false,
  isActive: true,
})

const form = reactive(emptyForm())

function openDrawer(product?: any) {
  formError.value = ""
  imgError.value = ""
  if (product) {
    editingId.value = product.id
    Object.assign(form, {
      name: product.name,
      price: product.price,
      comparePrice: product.comparePrice ?? null,
      stock: product.stock,
      description: product.description ?? "",
      categoryId: product.categoryId ?? null,
      subcategoryId: product.subcategoryId ?? null,
      trackStock: product.trackStock ?? true,
      isFeatured: product.isFeatured ?? false,
      nuevoLanzamiento: product.nuevoLanzamiento ?? false,
      isActive: product.isActive ?? true,
    })
    images.value = product.images?.map((i: any) => i.url) ?? []
  } else {
    editingId.value = null
    Object.assign(form, emptyForm())
    images.value = []
  }
  selectedFiles.value = []
  previews.value.forEach(URL.revokeObjectURL)
  previews.value = []
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
}

const categoryOptions = computed(() =>
  (categoriesData.value?.data ?? []).map((c: any) => ({ label: c.name, value: c.id }))
)

const subcategoryOptions = computed(() =>
  (subsData.value?.data ?? [])
    .filter((s: any) => !form.categoryId || s.categoryId === form.categoryId)
    .map((s: any) => ({ label: s.name, value: s.id }))
)

const descuentoPct = computed(() => {
  const antes = Number(form.comparePrice)
  const ahora = Number(form.price)
  if (!antes || !ahora || antes <= ahora) return 0
  return Math.round(((antes - ahora) / antes) * 100)
})

async function save() {
  if (!form.name || !form.price) { formError.value = "Nombre y precio son requeridos"; return }
  saving.value = true
  formError.value = ""
  try {
    let uploadedUrls: string[] = []
    if (selectedFiles.value.length) uploadedUrls = await uploadFiles(selectedFiles.value)
    const finalUrls = [...images.value, ...uploadedUrls].slice(0, MAX_IMAGES)
    const body: any = {
      ...form,
      /* Un "precio antes" que no supera al actual no es una rebaja: se
         envía null para que la tienda no pinte un descuento de 0%. */
      comparePrice:
        Number(form.comparePrice) > Number(form.price)
          ? Number(form.comparePrice)
          : null,
      images: finalUrls.map((u: string, i: number) => ({ url: u, isPrimary: i === 0 })),
    }
    if (isEditing.value) {
      await $fetch(`/api/admin/products/${editingId.value}`, { method: "PUT", body })
    } else {
      await $fetch("/api/admin/products", { method: "POST", body })
    }
    useAppToast().add({ title: isEditing.value ? "Producto actualizado" : "Producto creado", color: "success" })
    closeDrawer()
    await fetchProducts()
  } catch (e: any) {
    formError.value = e?.data?.message ?? "Error al guardar"
  } finally {
    saving.value = false
  }
}

async function uploadFiles(files: File[]) {
  return Promise.all(files.map(async (file) => {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("folder", "products")
    const res: any = await $fetch("/api/upload/image", { method: "POST", body: fd })
    return res.url
  }))
}

async function deleteProduct(id: number) {
  if (!confirm("¿Eliminar este producto?")) return
  await $fetch(`/api/admin/products/${id}`, { method: "DELETE" })
  await fetchProducts()
  useAppToast().add({ title: "Producto eliminado", color: "success" })
}
</script>

<style scoped>
/* (sin cambios — igual al original) */
.prod-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.prod-img-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.prod-img-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.prod-img-counter {
  font-size: var(--sp-text-xs);
  font-weight: 600;
  color: var(--sp-text-soft);
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  padding: 0.1rem 0.55rem;
}

.prod-img-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.prod-img-thumb {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--sp-radius-md);
  overflow: hidden;
  border: 1.5px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  cursor: grab;
  transition: border-color 0.15s, transform 0.15s;
}

.prod-img-thumb:active {
  cursor: grabbing;
  transform: scale(0.97);
}

.prod-img-thumb--primary {
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--sp-primary) 15%, transparent);
}

.prod-img-thumb--new {
  border-style: dashed;
}

.prod-img-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.prod-img-thumb__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 4px;
  transition: background 0.15s;
}

.prod-img-thumb:hover .prod-img-thumb__overlay {
  background: rgba(0, 0, 0, 0.35);
}

.prod-img-thumb__remove {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
}

.prod-img-thumb:hover .prod-img-thumb__remove {
  opacity: 1;
}

.prod-img-thumb__remove:hover {
  background: #dc2626;
}

.prod-img-thumb__badge {
  position: absolute;
  bottom: 4px;
  left: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: var(--sp-primary);
  color: #fff;
  border-radius: var(--sp-radius-pill);
  padding: 1px 6px;
  pointer-events: none;
}

.prod-img-thumb__new-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: var(--sp-radius-pill);
  padding: 1px 5px;
  pointer-events: none;
}

.prod-img-add {
  aspect-ratio: 1;
  border-radius: var(--sp-radius-md);
  border: 1.5px dashed var(--sp-border);
  background: var(--sp-surface-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  color: var(--sp-text-soft);
  font-size: 10px;
  font-weight: 600;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}

.prod-img-add:hover,
.prod-img-add--drag {
  border-color: var(--sp-primary);
  background: var(--sp-primary-soft, color-mix(in srgb, var(--sp-primary) 8%, transparent));
  color: var(--sp-primary);
}

.prod-img-add__input {
  display: none;
}

.prod-img-dropzone {
  width: 100%;
  padding: 1.5rem 1rem;
  border-radius: var(--sp-radius-lg);
  border: 1.5px dashed var(--sp-border);
  background: var(--sp-surface-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  cursor: pointer;
  color: var(--sp-text-soft);
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
}

.prod-img-dropzone:hover,
.prod-img-dropzone--active {
  border-color: var(--sp-primary);
  background: var(--sp-primary-soft, color-mix(in srgb, var(--sp-primary) 8%, transparent));
  color: var(--sp-primary);
}

.prod-img-dropzone__title {
  font-size: var(--sp-text-sm);
  font-weight: 600;
}

.prod-img-dropzone__sub {
  font-size: var(--sp-text-xs);
  opacity: 0.7;
}

.prod-img-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--sp-text-xs);
  color: var(--sp-danger);
  font-weight: 500;
}

.prod-img-hint {
  font-size: 0.68rem;
  color: var(--sp-text-muted);
  font-weight: 500;
}

.sp-drawer-field-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.sp-drawer-field-counter {
  font-size: var(--sp-text-xs);
  font-weight: 500;
  color: var(--sp-text-soft);
}
</style>
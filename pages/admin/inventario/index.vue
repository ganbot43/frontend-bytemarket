<template>
  <div class="prod-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Inventario</h1>
        <p class="sp-page-toolbar__sub">Movimientos de inventario</p>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center">
        <button class="sp-page-btn" @click="openDrawer">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
          Nuevo movimiento
        </button>
      </div>
    </div>
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <div class="sp-table-filters" style="
            padding: 0.9rem 1.1rem;
            border-bottom: 1px solid var(--sp-border);
            background: transparent;
          ">
          <div style="
              display: flex;
              gap: 1rem;
              align-items: center;
              flex-wrap: wrap;
            ">
            <div style="
                display: flex;
                gap: 0.5rem;
                align-items: center;
                flex: 0 1 350px;
              ">
              <label style="
                  display: flex;
                  gap: 0.5rem;
                  align-items: center;
                  width: 100%;
                ">
                Producto:
                <div style="position: relative; width: 100%">
                  <input v-model="filterProductSearch" type="text" class="sp-drawer-input" placeholder="Buscar..." />
                  <div v-if="filterProductSearch && filterFilteredProducts.length" class="product-list" style="
                      position: absolute;
                      top: 100%;
                      left: 0;
                      right: 0;
                      margin-top: 0.25rem;
                      background: white;
                      border: 1px solid var(--sp-border);
                      border-radius: 0.375rem;
                      z-index: 10;
                    ">
                    <div style="display: flex; flex-direction: column; gap: 0">
                      <button v-for="p in filterFilteredProducts" :key="p.id" type="button"
                        class="sp-drawer-btn sp-drawer-btn--ghost" style="
                          text-align: left;
                          border-radius: 0;
                          border-bottom: 1px solid var(--sp-border);
                          padding: 0.5rem 0.75rem;
                        " @click="selectFilterProduct(p)">
                        {{ p.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </label>
              <div v-if="filterSelectedProduct" style="
                  padding: 0.25rem 0.5rem;
                  background: #f0f0f0;
                  border-radius: 0.25rem;
                  font-size: 0.875rem;
                  white-space: nowrap;
                ">
                {{ filterSelectedProduct.name }}
                <button type="button" @click="
                  filterSelectedProduct = null;
                filters.productId = null;
                " style="
                    margin-left: 0.5rem;
                    cursor: pointer;
                    font-weight: bold;
                  ">
                  &times;
                </button>
              </div>
            </div>
            <label style="display: flex; gap: 0.5rem; align-items: center">Tipo:
              <select v-model="filters.type" class="sp-drawer-input sp-drawer-select">
                <option value="">Todos</option>
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
                <option value="adjustment">Ajuste</option>
              </select>
            </label>
            <button class="sp-page-btn" style="padding: 0.4rem 0.8rem; height: auto" @click="applyFilters">
              Filtrar
            </button>
          </div>
        </div>

        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Producto</th>
              <th class="sp-th">Tipo</th>
              <th class="sp-th">Cantidad</th>
              <th class="sp-th">Cambio</th>
              <th class="sp-th">Motivo</th>
              <th class="sp-th">Usuario</th>
              <th class="sp-th">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ m.productName || m.productId }}</p>
                <p class="sp-table-sub" v-if="m.productName && (m.relatedOrderId || m.reason)">
                  <span v-if="m.relatedOrderId">Pedido {{ m.relatedOrderId }}</span>
                  <span v-if="m.relatedOrderId && m.reason"> · </span>
                  <span v-if="m.reason">{{ m.reason }}</span>
                </p>
              </td>
              <td class="sp-td">{{ typeLabel(m.movementType) }}</td>
              <td class="sp-td">{{ m.quantity }}</td>
              <td class="sp-td">
                <span :style="{
                  color:
                    (m.delta ?? 0) > 0
                      ? '#16a34a'
                      : (m.delta ?? 0) < 0
                        ? '#ef4444'
                        : '#6b7280',
                  fontWeight: 600,
                }">{{ formatSigned(m.delta) }}</span>
              </td>
              <td class="sp-td">{{ m.reason }}</td>
              <td class="sp-td">{{ m.createdByName || m.createdBy }}</td>
              <td class="sp-td sp-td--muted">
                {{ new Date(m.createdAt).toLocaleString() }}
              </td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="7" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="currentColor" stroke-width="1.5" />
                      <path d="M12 12v4M10 14h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                    </svg>
                  </div>
                  <p class="sp-table-empty__msg">No hay movimientos aún</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="sp-table-footer" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          gap: 1rem;
        ">
        <div class="sp-table-meta">
          Página {{ page + 1 }} — {{ total }} registros
        </div>
        <div style="display: flex; gap: 0.35rem; align-items: center">
          <button v-for="p in totalPages" :key="p" @click="
            page = p - 1;
          fetchMovements();
          " :disabled="p - 1 === page" class="sp-table-btn" style="
              min-width: 36px;
              padding: 0.45rem 0.6rem;
              font-size: 0.875rem;
            " :style="{
              fontWeight: p - 1 === page ? 600 : 400,
              background: p - 1 === page ? '#3b82f6' : 'transparent',
              color: p - 1 === page ? 'white' : 'inherit',
            }">
            {{ p }}
          </button>
        </div>
      </div>
    </div>

    <!-- DRAWER: inline form -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="showForm" class="sp-drawer-overlay" @click.self="closeDrawer" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <aside v-if="showForm" class="sp-drawer-panel" role="dialog" aria-modal="true">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">Nuevo</p>
              <h2 class="sp-drawer-header__title">Crear movimiento</h2>
            </div>
            <button class="sp-drawer-close" @click="closeDrawer" aria-label="Cerrar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="sp-drawer-body">
            <form @submit.prevent="submitMovement">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Producto <span class="sp-drawer-req">*</span></label>
                <input v-model="productSearch" class="sp-drawer-input" placeholder="Buscar producto por nombre o SKU" />
                <div class="product-list" v-if="filteredProducts.length" style="margin-top: 0.5rem">
                  <div style="display: flex; flex-direction: column; gap: 0.35rem">
                    <button v-for="p in filteredProducts" :key="p.id" type="button"
                      class="sp-drawer-btn sp-drawer-btn--ghost" @click="selectProduct(p)">
                      {{ p.name }} — stock: {{ p.stock ?? 0 }}
                    </button>
                  </div>
                </div>
                <div v-if="selectedProduct" style="margin-top: 0.5rem">
                  Seleccionado: <strong>{{ selectedProduct.name }}</strong> (ID:
                  {{ selectedProduct.id }})
                </div>
              </div>

              <div class="sp-drawer-row">
                <div class="sp-drawer-field">
                  <label class="sp-drawer-label">Tipo</label>
                  <select v-model="form.movementType" class="sp-drawer-input sp-drawer-select">
                    <option value="entry">Entrada</option>
                    <option value="exit">Salida</option>
                    <option value="adjustment">Ajuste</option>
                  </select>
                </div>
                <div class="sp-drawer-field">
                  <label class="sp-drawer-label">Cantidad</label>
                  <input v-model.number="form.quantity" type="number" min="1" required class="sp-drawer-input" />
                </div>
              </div>

              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Motivo</label>
                <input v-model="form.reason" type="text" class="sp-drawer-input" />
              </div>

              <p v-if="formError" class="sp-drawer-error">{{ formError }}</p>

              <div class="sp-drawer-footer">
                <button type="button" class="sp-drawer-btn sp-drawer-btn--ghost" @click="closeDrawer">
                  Cancelar
                </button>
                <button type="submit" class="sp-drawer-btn sp-drawer-btn--primary">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth", layout: "admin" });
import { ref, reactive, onMounted, watch, computed } from "vue";
import { useAppToast } from "~/composables/useToast";

const showForm = ref<boolean>(false);
const refreshKey = ref<number>(0);

// list state
const items = ref<any[]>([]);
const total = ref<number>(0);
const loading = ref<boolean>(false);
const error = ref<any>(null);
const page = ref<number>(0);
const limit = ref<number>(10);
const filters = reactive<{ productId: number | null; type: string }>({
  productId: null,
  type: "",
});

// filter product selector
const filterProductSearch = ref<string>("");
const filterSelectedProduct = ref<any | null>(null);
const filterProducts = ref<any[]>([]);

// form state
const form = reactive<{
  productId: number | null;
  movementType: string;
  quantity: number;
  reason: string;
}>({ productId: null, movementType: "entry", quantity: 1, reason: "" });
const productSearch = ref<string>("");
const products = ref<any[]>([]);
const selectedProduct = ref<any | null>(null);
const formError = ref<string>("");

function typeLabel(t: string | undefined): string {
  if (!t) return "";
  if (t === "entry") return "Entrada";
  if (t === "exit") return "Salida";
  if (t === "adjustment") return "Ajuste";
  return String(t);
}

function formatSigned(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  const v = Number(n);
  return v > 0 ? `+${v}` : `${v}`;
}

async function fetchMovements() {
  loading.value = true;
  error.value = null;
  try {
    const params: any = {
      limit: limit.value,
      offset: page.value * limit.value,
    };
    if (filters.productId) params.productId = filters.productId;
    if (filters.type) params.type = filters.type;
    const res: any = await $fetch("/api/admin/inventory/movements", {
      query: params,
    });
    items.value = res?.data || [];
    total.value = res?.total ?? items.value.length;
  } catch (err: any) {
    error.value = err?.message || String(err);
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 0;
  fetchMovements();
}

const totalPages = computed<number>(() => {
  return Math.ceil((total.value || 0) / limit.value);
});

onMounted(() => {
  fetchMovements();
  loadProducts();
});
watch(() => refreshKey.value, fetchMovements);

function openDrawer() {
  formError.value = "";
  showForm.value = true;
}
function closeDrawer() {
  showForm.value = false;
}

// backfill
async function runBackfill() {
  const toast = useAppToast();
  try {
    const res = await $fetch("/api/admin/inventory/backfill", {
      method: "POST",
      body: {},
    });
    const created = res?.created ?? 0;
    const processed = res?.processedOrders ?? 0;
    toast.add({
      title: "Reconstrucción completa",
      description: `${created} movimientos creados para ${processed} pedidos`,
      color: "success",
    });
    refreshKey.value++;
  } catch (err) {
    const e: any = err;
    toast.add({
      title: "Error",
      description: e?.message ?? String(e),
      color: "error",
    });
  }
}

// products for selector
async function loadProducts() {
  try {
    const res: any = await $fetch("/api/admin/products");
    products.value = res?.data || res || [];
    filterProducts.value = res?.data || res || [];
  } catch (e) {
    // ignore
  }
}

const filteredProducts = computed<any[]>(() => {
  const q = (productSearch.value || "").toLowerCase().trim();
  if (!q) return products.value.slice(0, 20);
  return products.value
    .filter((p: any) => (p.name || "").toLowerCase().includes(q))
    .slice(0, 50);
});

const filterFilteredProducts = computed<any[]>(() => {
  const q = (filterProductSearch.value || "").toLowerCase().trim();
  if (!q) return filterProducts.value.slice(0, 20);
  return filterProducts.value
    .filter((p: any) => (p.name || "").toLowerCase().includes(q))
    .slice(0, 50);
});

function selectFilterProduct(p: any) {
  filterSelectedProduct.value = p;
  filters.productId = p.id;
  filterProductSearch.value = "";
}

function selectProduct(p: any) {
  selectedProduct.value = p;
  form.productId = p.id;
  productSearch.value = p.name;
}

async function submitMovement() {
  formError.value = "";
  try {
    if (!form.productId) throw new Error("Seleccione un producto");
    await $fetch("/api/admin/inventory/movements", {
      method: "POST",
      body: form,
    });
    showForm.value = false;
    refreshKey.value++;
  } catch (err: any) {
    formError.value = err?.message || String(err);
  }
}
</script>

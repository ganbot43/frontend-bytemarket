<template>
  <div class="orders-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Pedidos</h1>
        <p class="sp-page-toolbar__sub">
          {{ total }} pedidos {{ statusFilter ? "filtrados" : "en total" }}
        </p>
      </div>
    </div>

    <SharedBarraTabla v-model="busqueda" placeholder="Buscar por código, cliente o teléfono…" />

    <!-- Filtros -->
    <div class="orders-filters">
      <button v-for="s in statusOptions" :key="s.value" class="orders-filter-btn"
        :class="{ 'orders-filter-btn--active': statusFilter === s.value }" @click="setStatusFilter(s.value)">
        {{ s.label }}
      </button>
    </div>

    <!-- Tabla -->
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Código</th>
              <th class="sp-th">Cliente</th>
              <th class="sp-th">Canal</th>
              <th class="sp-th">Total</th>
              <th class="sp-th">Pago</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th sp-th--center" style="width: 110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id" class="sp-tr sp-tr--clickable" @click="openOrder(order.id)">
              <td class="sp-td">
                <span class="orders-code">{{ order.orderCode }}</span>
              </td>
              <td class="sp-td">
                <p class="sp-table-title">{{ order.customerName }}</p>
              </td>
              <td class="sp-td">
                <span class="orders-canal" :class="`orders-canal--${order.canal}`">
                  {{ canalLabel(order.canal) }}
                </span>
              </td>
              <td class="sp-td">
                <span class="sp-table-amount">{{ formatPrice.format(order.total) }}</span>
              </td>
              <td class="sp-td">
                <span class="orders-pago" :class="order.estadoDePago === 'paid' ? 'orders-pago--ok' : 'orders-pago--due'">
                  {{ order.estadoDePago === "paid" ? "Cobrado" : "Por cobrar" }}
                </span>
                <span v-if="order.paymentMethodLabel" class="orders-forma">
                  {{ order.paymentMethodLabel }}
                </span>
              </td>
              <td class="sp-td">
                <AdminEtiquetaEstadoPedido :status="order.status" />
              </td>
              <td class="sp-td sp-td--muted">
                <span class="orders-date">{{ formatDateTime(order.createdAt) }}</span>
              </td>
              <td class="sp-td sp-td--center" @click.stop>
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--view" title="Ver pedido" @click="openOrder(order.id)">
                    <Eye class="w-3.5 h-3.5" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!orders.length">
              <td colspan="8" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Inbox class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">
                    No hay pedidos{{ statusFilter ? " con este estado" : "" }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SharedPaginacion v-model:pagina="page" :total="total" :limite="limit" />
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
          <div class="modal-box">
            <PedidoModal v-if="selectedOrderId" :order-id="selectedOrderId" @close="modalOpen = false"
              @updated="onOrderUpdated" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Eye, Inbox } from "lucide-vue-next";
import PedidoModal from "./pedidoModal.vue"
definePageMeta({ middleware: "auth", layout: "admin" })
useSeoMeta({ title: "Pedidos · Admin" })

const formatPrice = useFormatPrice()
const { formatDateTime } = useFormatDateTime()

// ── Paginación y filtros ──
const page = ref<number>(0)
const limit = ref<number>(10)
const total = ref<number>(0)
const orders = ref<any[]>([])
// Los filtros se inicializan desde la URL: las tarjetas del dashboard
// enlazan aquí ya filtradas (?status=voucher_sent), y antes ese parámetro se
// ignoraba y la lista salía completa.
const route = useRoute()
const statusFilter = ref<string>(String(route.query.status ?? ""))
const busqueda = ref(String(route.query.buscar ?? ""))

const totalPages = computed<number>(() => Math.ceil((total.value || 0) / limit.value))

async function fetchOrders() {
  try {
    const query: any = { limit: limit.value, offset: page.value * limit.value }
    if (statusFilter.value) query.status = statusFilter.value
    if (busqueda.value.trim()) query.q = busqueda.value.trim()
    const res: any = await $fetch("/api/admin/orders", { query })
    orders.value = res?.data ?? []
    total.value = res?.total ?? orders.value.length
  } catch (e) {
    // ignore
  }
}

function setStatusFilter(value: string) {
  statusFilter.value = value
  page.value = 0
  fetchOrders()
}

watch(busqueda, () => {
  page.value = 0
  fetchOrders()
})
watch(page, () => fetchOrders())

onMounted(() => {
  fetchOrders()
  window.addEventListener("keydown", onKeydown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown)
})

/* Nombre legible del canal. El backend manda la clave ("caja", "whatsapp")
   y ya resuelve el null de los pedidos anteriores a la caja como "web". */
const CANALES: Record<string, string> = {
  web: "Tienda web",
  caja: "Caja",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  telefono: "Teléfono",
  otro: "Otro",
}
const canalLabel = (c?: string) => CANALES[c ?? "web"] ?? c ?? "Tienda web"

const statusOptions = [
  { value: "", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "voucher_sent", label: "Comprobante enviado" },
  { value: "payment_validated", label: "Pago validado" },
  { value: "in_preparation", label: "En preparación" },
  { value: "delivered", label: "Entregados" },
  { value: "cancelled", label: "Cancelados" },
]

// ── Modal ──
const modalOpen = ref(false)
const selectedOrderId = ref<number | null>(null)

function openOrder(id: number) {
  selectedOrderId.value = id
  modalOpen.value = true
}

async function onOrderUpdated() {
  await fetchOrders()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") modalOpen.value = false
}
</script>

<style scoped>
/* Canal y estado de pago: sin esto, una venta de mostrador y una de la
   tienda web se veían idénticas en la lista, y "cobrado" no se distinguía
   de "entregado pero sin pagar". */
.orders-canal {
  display: inline-block; padding: 0.12rem 0.5rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; background: #f1f5f9; color: #475569;
}
.orders-canal--caja { background: #ecfdf5; color: #047857; }
.orders-canal--whatsapp { background: #f0fdf4; color: #15803d; }
.orders-canal--instagram, .orders-canal--facebook { background: #fdf2f8; color: #be185d; }
.orders-canal--telefono { background: #eff6ff; color: #1d4ed8; }

.orders-pago { display: block; font-size: 0.75rem; font-weight: 700; }
.orders-pago--ok { color: #15803d; }
.orders-pago--due { color: #b45309; }
.orders-forma { display: block; font-size: 0.68rem; color: #64748b; }

.orders-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.orders-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.orders-filter-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.85rem;
  border-radius: var(--sp-radius-pill);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  color: var(--sp-text-muted);
  font-size: var(--sp-text-xs);
  font-weight: 600;
  font-family: var(--sp-font);
  cursor: pointer;
  transition: background var(--sp-t-fast) var(--sp-ease), color var(--sp-t-fast) var(--sp-ease), border-color var(--sp-t-fast) var(--sp-ease);
  white-space: nowrap;
}

.orders-filter-btn:hover {
  background: var(--sp-surface-solid);
  color: var(--sp-text);
}

.orders-filter-btn--active {
  background: var(--sp-primary-soft);
  color: var(--sp-primary-ink);
  border-color: rgba(0, 174, 239, 0.22);
  box-shadow: 0 2px 8px rgba(0, 174, 239, 0.1);
}

.sp-tr--clickable {
  cursor: pointer;
}

.sp-tr--clickable:hover td {
  background: var(--sp-surface-subtle, #f9f9f9);
}

.orders-code {
  font-family: "Courier New", Courier, monospace;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-primary);
  letter-spacing: 0.02em;
}

.orders-date {
  font-size: var(--sp-text-xs);
  font-variant-numeric: tabular-nums;
}
</style>
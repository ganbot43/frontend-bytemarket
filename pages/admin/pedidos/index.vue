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
              <th class="sp-th">Total</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th" style="width: 60px" />
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
                <span class="sp-table-amount">{{ formatPrice.format(order.total) }}</span>
              </td>
              <td class="sp-td">
                <AdminEtiquetaEstadoPedido :status="order.status" />
              </td>
              <td class="sp-td sp-td--muted">
                <span class="orders-date">{{ formatDateTime(order.createdAt) }}</span>
              </td>
              <td class="sp-td" @click.stop>
                <button class="sp-table-btn sp-table-btn--view" title="Ver pedido" @click="openOrder(order.id)">
                  <Eye class="w-3.5 h-3.5" stroke-width="2" />
                </button>
              </td>
            </tr>
            <tr v-if="!orders.length">
              <td colspan="6" class="sp-table-empty">
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

      <div class="sp-table-footer"
        style="display:flex; align-items:center; justify-content:space-between; padding:.75rem 1rem; gap:1rem">
        <div class="sp-table-meta">Página {{ page + 1 }} — {{ total }} registros</div>
        <div style="display:flex; gap:0.35rem; align-items:center">
          <button v-for="p in totalPages" :key="p" @click="page = p - 1; fetchOrders()" :disabled="p - 1 === page"
            class="sp-table-btn" style="min-width:36px; padding:.45rem .6rem; font-size:0.875rem"
            :style="{ fontWeight: p - 1 === page ? 600 : 400, background: p - 1 === page ? '#3b82f6' : 'transparent', color: p - 1 === page ? 'white' : 'inherit' }">{{
            p }}</button>
        </div>
      </div>
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
useSeoMeta({ title: "Pedidos — Admin" })

const formatPrice = useFormatPrice()
const { formatDateTime } = useFormatDateTime()

// ── Paginación y filtros ──
const page = ref<number>(0)
const limit = ref<number>(10)
const total = ref<number>(0)
const orders = ref<any[]>([])
const statusFilter = ref<string>("")

const totalPages = computed<number>(() => Math.ceil((total.value || 0) / limit.value))

async function fetchOrders() {
  try {
    const query: any = { limit: limit.value, offset: page.value * limit.value }
    if (statusFilter.value) query.status = statusFilter.value
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

onMounted(() => {
  fetchOrders()
  window.addEventListener("keydown", onKeydown)
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown)
})

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
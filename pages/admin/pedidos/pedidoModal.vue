<template>
  <!-- Cargando -->
  <template v-if="!order && !error">
    <div class="sp-modal-state">
      <Loader2 class="pmo-spin w-6 h-6 text-current" stroke-width="2" />
      <p class="sp-modal-state__text">Cargando pedido...</p>
    </div>
  </template>

  <!-- Error -->
  <template v-else-if="error">
    <div class="sp-modal-state">
      <div class="sp-table-empty__icon">
        <AlertCircle class="w-6 h-6 text-current" stroke-width="1.5" />
      </div>
      <p class="sp-modal-state__text">No se pudo cargar el pedido.</p>
      <div class="sp-modal-state__actions">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="refresh()">
          Reintentar
        </button>
        <button
          class="sp-drawer-btn sp-drawer-btn--primary"
          @click="$emit('close')"
        >
          Cerrar
        </button>
      </div>
    </div>
  </template>

  <!-- Contenido -->
  <template v-else-if="order">
    <!-- Header -->
    <div class="sp-modal-header">
      <div class="pmo-header-inner">
        <div class="pmo-header-avatar">
            <Package class="w-5 h-5 text-(--sp-primary)" stroke-width="1.5" />
        </div>
        <div class="pmo-header-info">
          <div class="pmo-header-top">
            <h2 class="sp-modal-header__title">{{ order.orderCode }}</h2>
            <AdminEtiquetaEstadoPedido :status="order.status" />
          </div>
          <p class="sp-modal-header__meta mt-1">
            {{ formatDateTime(order.createdAt) }} · {{ order.customerName }}
          </p>
        </div>
      </div>
      <button class="sp-modal-close" @click="$emit('close')">✕</button>
    </div>

    <!-- Body -->
    <div class="sp-modal-body">
      <!-- Barra de progreso -->
      <div class="pmo-progress-bar">
        <div class="pmo-progress-track">
          <template v-for="(step, i) in progressSteps" :key="step.value">
            <div class="pmo-progress-node">
              <div
                class="pmo-progress-dot"
                :class="{
                  'pmo-progress-dot--done': stepIsDone(step.value),
                  'pmo-progress-dot--active': stepIsActive(step.value),
                }"
              >
                <Check v-if="stepIsDone(step.value)" class="w-2.5 h-2.5" stroke-width="2.5" />
                <div
                  v-else-if="stepIsActive(step.value)"
                  class="pmo-progress-dot__inner"
                />
              </div>
              <span
                class="pmo-progress-label"
                :class="{
                  'pmo-progress-label--done': stepIsDone(step.value),
                  'pmo-progress-label--active': stepIsActive(step.value),
                }"
                >{{ step.short }}</span
              >
            </div>
            <div
              v-if="i < progressSteps.length - 1"
              class="pmo-progress-line"
              :class="{
                'pmo-progress-line--done':
                  stepIsDone(step.value) || stepIsActive(step.value),
              }"
            />
          </template>
        </div>
      </div>

      <!-- Grid principal -->
      <div class="pmo-grid">
        <!-- Columna izquierda -->
        <div class="pmo-col">
          <!-- Cliente -->
          <section class="pmo-card">
            <p class="pmo-card__label">
              <User class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              Cliente
            </p>
            <div class="pmo-fields">
              <div class="pmo-field">
                <span class="pmo-field__key">Nombre</span>
                <span class="pmo-field__val">{{ order.customerName }}</span>
              </div>
              <div class="pmo-field">
                <span class="pmo-field__key">Teléfono</span>
                <span
                  class="pmo-field__val"
                  :class="{ 'pmo-field__val--empty': !order.customerPhone }"
                >
                  {{ order.customerPhone || "Sin teléfono" }}
                </span>
              </div>
              <div class="pmo-field pmo-field--full">
                <span class="pmo-field__key">Dirección</span>
                <span
                  class="pmo-field__val"
                  :class="{ 'pmo-field__val--empty': !order.customerAddress }"
                >
                  {{ order.customerAddress || "Sin dirección" }}
                </span>
              </div>
              <div v-if="order.customerNotes" class="pmo-field pmo-field--full">
                <span class="pmo-field__key">Notas</span>
                <span class="pmo-field__val pmo-field__val--note">{{
                  order.customerNotes
                }}</span>
              </div>
            </div>
          </section>

          <!-- Método de pago -->
          <section class="pmo-card">
            <p class="pmo-card__label">
              <CreditCard class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              Método de pago
            </p>
            <div v-if="order.paymentMethodLabel" class="pmo-payment">
              <div class="pmo-payment__header">
                <span class="pmo-payment__name">{{
                  order.paymentMethodLabel
                }}</span>
                <!-- <span v-if="order.paymentMethodType" class="pmo-pill">{{
                  order.paymentMethodType
                }}</span> -->
              </div>
              <div class="pmo-payment__details">
                <div
                  v-if="order.paymentMethodAccountName"
                  class="pmo-payment__row"
                >
                  <span>Titular</span
                  ><span>{{ order.paymentMethodAccountName }}</span>
                </div>
                <div
                  v-if="order.paymentMethodAccountNumber"
                  class="pmo-payment__row"
                >
                  <span>Cuenta</span
                  ><span class="pmo-mono">{{
                    order.paymentMethodAccountNumber
                  }}</span>
                </div>
                <div v-if="order.paymentMethodQrUrl" class="pmo-payment__row">
                  <span>QR</span>
                  <a
                    :href="order.paymentMethodQrUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="pmo-link"
                  >
                    Ver QR
                    <ExternalLink class="w-2.5 h-2.5" stroke-width="1.5" />
                  </a>
                </div>
              </div>
            </div>
            <p v-else class="pmo-field__val pmo-field__val--empty">
              Sin método registrado
            </p>
          </section>

          <!-- Productos -->
          <section class="pmo-card">
            <p class="pmo-card__label">
              <ShoppingBag class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              Productos
            </p>
            <div class="pmo-items">
              <div v-for="item in order.items" :key="item.id" class="pmo-item">
                <div class="pmo-item__left">
                  <span class="pmo-item__name">{{ item.productName }}</span>
                  <span class="pmo-item__qty">×{{ item.quantity }}</span>
                </div>
                <span class="pmo-item__price">{{
                  formatPrice.format(item.subtotal)
                }}</span>
              </div>
            </div>
            <div class="pmo-total">
              <span class="pmo-total__label">Total del pedido</span>
              <span class="pmo-total__amount">{{
                formatPrice.format(order.total)
              }}</span>
            </div>
          </section>
        </div>

        <!-- Columna derecha -->
        <div class="pmo-col">
          <!-- Gestionar estado -->
          <section class="pmo-card">
            <p class="pmo-card__label">
              <CheckCircle2 class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              Actualizar estado
            </p>

            <!-- Lista numerada de estados -->
            <div class="pmo-status-list">
              <div
                v-for="(opt, i) in statusOptions"
                :key="opt.value"
                class="pmo-status-row"
                :class="{
                  'pmo-status-row--done': isDone(opt.value),
                  'pmo-status-row--current': opt.value === order.status,
                  'pmo-status-row--upcoming': isUpcoming(opt.value),
                  'pmo-status-row--danger': opt.value === 'cancelled',
                }"
              >
                <div class="pmo-status-row__num">
                  <Check v-if="isDone(opt.value)" class="w-3 h-3 text-current" stroke-width="2.5" />
                  <span v-else>{{
                    opt.value === "cancelled" ? "✕" : i + 1
                  }}</span>
                </div>
                <span class="pmo-status-row__label">{{ opt.label }}</span>
                <span
                  v-if="opt.value === order.status"
                  class="pmo-status-row__badge"
                  >actual</span
                >
              </div>
            </div>

            <!-- Select + nota -->
            <div class="pmo-status-form">
              <div class="pmo-form-group">
                <label class="pmo-label">Cambiar a</label>
                <select
                  v-model="newStatus"
                  class="sp-drawer-input sp-drawer-select"
                >
                  <option
                    v-for="opt in statusOptions"
                    :key="opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <div class="pmo-form-group">
                <label class="pmo-label">
                  Nota interna <span class="pmo-label--opt">(opcional)</span>
                </label>
                <textarea
                  v-model="statusNote"
                  rows="2"
                  class="sp-drawer-input sp-drawer-textarea"
                  placeholder="Ej: Pago confirmado por transferencia..."
                />
              </div>

              <button
                class="pmo-save-btn"
                :disabled="
                  updating || (newStatus === order.status && !statusNote.trim())
                "
                @click="changeStatus"
              >
                <Loader2 v-if="updating" class="pmo-spin w-4 h-4 text-current" stroke-width="2" />
                {{ updating ? "Actualizando..." : "Confirmar cambio" }}
              </button>
            </div>
          </section>

          <!-- Historial -->
          <section class="pmo-card">
            <p class="pmo-card__label">
              <History class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              Historial
            </p>
            <AdminLineaTempoEstadoPedido :logs="timelineLogs" />
          </section>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import { Loader2, AlertCircle, Package, Check, User, CreditCard, ExternalLink, ShoppingBag, CheckCircle2, History } from "lucide-vue-next";
import type { Order } from "~/types";

const props = defineProps<{ orderId: number | string }>();
const emit = defineEmits<{ close: []; updated: [] }>();

const formatPrice = useFormatPrice();
const { formatDateTime } = useFormatDateTime();

const {
  data: order,
  refresh,
  error,
} = await useFetch<Order>(() => `/api/admin/orders/${String(props.orderId)}`);

const newStatus = ref("pending");
const statusNote = ref("");
const updating = ref(false);

const statusOptions = [
  { label: "Pendiente", value: "pending" },
  { label: "Comprobante enviado", value: "voucher_sent" },
  { label: "Pago validado", value: "payment_validated" },
  { label: "En preparación", value: "in_preparation" },
  { label: "Entregado", value: "delivered" },
  { label: "Cancelado", value: "cancelled" },
];

const progressSteps = [
  { value: "pending", short: "Pendiente" },
  { value: "voucher_sent", short: "Comprobante" },
  { value: "payment_validated", short: "Pago validado" },
  { value: "in_preparation", short: "Preparación" },
  { value: "delivered", short: "Entregado" },
];

const statusOrder = statusOptions.map((o) => o.value);

function isDone(value: string) {
  if (!order.value) return false;
  if (value === "cancelled") return false;
  return statusOrder.indexOf(value) < statusOrder.indexOf(order.value.status);
}

function isUpcoming(value: string) {
  if (!order.value) return false;
  if (value === "cancelled") return false;
  return statusOrder.indexOf(value) > statusOrder.indexOf(order.value.status);
}

function stepIsDone(value: string) {
  if (!order.value) return false;
  return statusOrder.indexOf(value) < statusOrder.indexOf(order.value.status);
}

function stepIsActive(value: string) {
  return order.value?.status === value;
}

async function changeStatus() {
  updating.value = true;
  try {
    await $fetch(`/api/admin/orders/${props.orderId}/status`, {
      method: "PUT",
      body: { status: newStatus.value, note: statusNote.value },
    });
    statusNote.value = "";
    await refresh();
    emit("updated");
    useAppToast().add({ title: "Estado actualizado", color: "success" });
  } catch {
    useAppToast().add({ title: "Error al actualizar", color: "error" });
  } finally {
    updating.value = false;
  }
}

watch(
  () => props.orderId,
  (id) => {
    if (id) refresh().catch(() => {});
  },
);

watch(
  () => order.value,
  (o) => {
    if (o) newStatus.value = o.status || "pending";
  },
  { immediate: true },
);

const timelineLogs = computed(() =>
  (order.value?.statusLogs ?? []).map((log) => ({
    ...log,
    note: log.note ?? undefined,
  })),
);
</script>

<style scoped>
/* ── Header ── */
.pmo-header-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.pmo-header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  background: var(
    --sp-primary-soft,
    color-mix(in srgb, var(--sp-primary) 10%, transparent)
  );
  border: 1px solid
    var(
      --sp-primary-border,
      color-mix(in srgb, var(--sp-primary) 20%, transparent)
    );
  display: flex;
  align-items: center;
  justify-content: center;
}

.pmo-header-info {
  min-width: 0;
}

.pmo-header-top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* ── Barra de progreso ── */
.pmo-progress-bar {
  background: var(--sp-surface-muted);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 14px 18px 10px;
  margin-bottom: 1rem;
}

.pmo-progress-track {
  display: flex;
  align-items: flex-start;
}

.pmo-progress-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.pmo-progress-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--sp-border-strong);
  background: var(--sp-surface-solid);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sp-text-soft);
  transition: all 0.2s ease;
}

.pmo-progress-dot--done {
  border-color: var(--sp-success);
  background: var(--sp-success-soft);
  color: var(--sp-success);
}
.pmo-progress-dot--active {
  border-color: var(--sp-primary);
  background: var(--sp-primary-soft);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--sp-primary) 12%, transparent);
}

.pmo-progress-dot__inner {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sp-primary);
}

.pmo-progress-line {
  flex: 1;
  height: 2px;
  background: var(--sp-border-strong);
  margin-top: 10px;
  transition: background 0.2s;
}
.pmo-progress-line--done {
  background: var(--sp-success);
}

.pmo-progress-label {
  font-size: 10px;
  font-weight: 500;
  color: var(--sp-text-soft);
  white-space: nowrap;
  text-align: center;
}
.pmo-progress-label--done {
  color: var(--sp-success);
}
.pmo-progress-label--active {
  color: var(--sp-primary);
  font-weight: 700;
}

/* ── Grid ── */
.pmo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}

@media (max-width: 640px) {
  .pmo-grid {
    grid-template-columns: 1fr;
  }
  .pmo-progress-bar {
    overflow-x: auto;
  }
}

.pmo-col {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Card ── */
.pmo-card {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 1.1rem 1.15rem;
  box-shadow: var(--sp-shadow-xs);
}

.pmo-card__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--sp-text-soft);
  margin: 0 0 0.9rem;
}

/* ── Fields ── */
.pmo-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pmo-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--sp-surface-muted);
  border-radius: var(--sp-radius-md);
  padding: 8px 10px;
}

.pmo-field--full {
  grid-column: 1 / -1;
}

.pmo-field__key {
  font-size: 10px;
  color: var(--sp-text-soft);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.pmo-field__val {
  font-size: var(--sp-text-sm);
  color: var(--sp-text-strong);
  font-weight: 500;
  line-height: 1.4;
}
.pmo-field__val--empty {
  color: var(--sp-text-soft);
  font-style: italic;
  font-weight: 400;
}
.pmo-field__val--note {
  color: var(--sp-text-muted);
  font-weight: 400;
  font-size: var(--sp-text-xs);
}

/* ── Pago ── */
.pmo-payment {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pmo-payment__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--sp-surface-muted);
  border-radius: var(--sp-radius-md);
}

.pmo-payment__name {
  font-size: var(--sp-text-sm);
  font-weight: 600;
  color: var(--sp-text-strong);
}

.pmo-pill {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 8px;
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  color: var(--sp-text-muted);
}

.pmo-payment__details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.pmo-payment__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 10px;
  background: var(--sp-surface-muted);
  border-radius: var(--sp-radius-sm);
  font-size: var(--sp-text-xs);
}

.pmo-payment__row span:first-child {
  color: var(--sp-text-soft);
}
.pmo-payment__row span:last-child {
  font-weight: 600;
  color: var(--sp-text-strong);
}

.pmo-mono {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.pmo-link {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-weight: 600;
  color: var(--sp-primary);
  text-decoration: none;
}
.pmo-link:hover {
  text-decoration: underline;
}

/* ── Items ── */
.pmo-items {
  display: flex;
  flex-direction: column;
}

.pmo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--sp-border);
}
.pmo-item:last-child {
  border-bottom: none;
}

.pmo-item__left {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.pmo-item__name {
  font-size: var(--sp-text-sm);
  color: var(--sp-text);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pmo-item__qty {
  flex-shrink: 0;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  padding: 1px 7px;
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  color: var(--sp-text-muted);
}

.pmo-item__price {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-strong);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  margin-left: 8px;
}

/* ── Total ── */
.pmo-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  margin-top: 2px;
  border-top: 2px solid var(--sp-border-strong);
}
.pmo-total__label {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text);
}
.pmo-total__amount {
  font-size: var(--sp-text-lg, 1.05rem);
  font-weight: 800;
  color: var(--sp-primary);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* ══════════════════════════════════
   LISTA NUMERADA DE ESTADOS
   ══════════════════════════════════ */
.pmo-status-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--sp-border);
}

.pmo-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  border-radius: var(--sp-radius-md);
}

.pmo-status-row__num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  border: 1.5px solid var(--sp-border-strong);
  color: var(--sp-text-muted);
  background: var(--sp-surface-muted);
}

.pmo-status-row__label {
  flex: 1;
  font-size: var(--sp-text-xs);
  font-weight: 500;
  color: var(--sp-text-soft);
}

.pmo-status-row__badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 7px;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
  border: 1px solid
    var(
      --sp-primary-border,
      color-mix(in srgb, var(--sp-primary) 25%, transparent)
    );
}

/* Estado completado */
.pmo-status-row--done .pmo-status-row__num {
  background: var(--sp-success-soft);
  border-color: var(--sp-success);
  color: var(--sp-success);
}
.pmo-status-row--done .pmo-status-row__label {
  color: var(--sp-text-muted);
  text-decoration: line-through;
  text-decoration-color: var(--sp-border-strong);
}

/* Estado actual */
.pmo-status-row--current {
  background: var(--sp-surface-muted);
}
.pmo-status-row--current .pmo-status-row__num {
  background: var(--sp-primary-soft);
  border-color: var(--sp-primary);
  color: var(--sp-primary);
}
.pmo-status-row--current .pmo-status-row__label {
  color: var(--sp-text-strong);
  font-weight: 700;
}

/* Próximos */
.pmo-status-row--upcoming .pmo-status-row__label {
  color: var(--sp-text-soft);
}

/* Cancelado */
.pmo-status-row--danger .pmo-status-row__num {
  border-color: var(--sp-danger);
  color: var(--sp-danger);
  background: var(--sp-danger-soft);
}
.pmo-status-row--danger .pmo-status-row__label {
  color: var(--sp-danger);
}

/* ── Formulario de cambio ── */
.pmo-status-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pmo-form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pmo-label {
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-text);
}
.pmo-label--opt {
  color: var(--sp-text-soft);
  font-weight: 500;
}

/* ── Botón guardar ── */
.pmo-save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 0.65rem 1.25rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-action);
  color: #fff;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  font-family: var(--sp-font);
  border: none;
  cursor: pointer;
  box-shadow:
    0 2px 6px rgba(15, 45, 107, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition:
    transform var(--sp-t-fast) var(--sp-ease),
    box-shadow var(--sp-t-fast) var(--sp-ease),
    opacity var(--sp-t-fast) var(--sp-ease);
}

.pmo-save-btn:hover:not(:disabled) {
  background: var(--sp-action-hover);
  transform: translateY(-1px);
  box-shadow:
    0 4px 12px rgba(15, 45, 107, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
.pmo-save-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ── Spinner ── */
@keyframes pmo-spin {
  to {
    transform: rotate(360deg);
  }
}
.pmo-spin {
  animation: pmo-spin 0.75s linear infinite;
  flex-shrink: 0;
}
</style>

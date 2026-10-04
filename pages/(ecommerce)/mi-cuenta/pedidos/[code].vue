<template>
  <div class="dp">
    <!-- ── Carga ── -->
    <div v-if="pending" class="dp__loading">
      <div class="cp-skeleton" style="height: 20px; width: 30%" />
      <div class="cp-skeleton" style="height: 220px" />
      <div class="cp-skeleton" style="height: 180px" />
    </div>

    <!-- ── No existe o no es suyo ── -->
    <div v-else-if="!order" class="dp__empty">
      <h1 class="dp__empty-title">No encontramos ese pedido</h1>
      <p class="dp__empty-text">
        El código no existe o pertenece a otra cuenta.
      </p>
      <NuxtLink to="/mi-cuenta/pedidos" class="btn btn-primary btn-sm">
        Volver a mis pedidos
      </NuxtLink>
    </div>

    <template v-else>
      <!-- ── Cabecera ── -->
      <NuxtLink to="/mi-cuenta/pedidos" class="dp__back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        Mis pedidos
      </NuxtLink>

      <header class="dp__head">
        <div>
          <h1 class="dp__title">Pedido {{ order.orderCode }}</h1>
          <p class="dp__date">Realizado el {{ formatearFecha(order.createdAt) }}</p>
        </div>
        <EcommerceEstadoPedido :status="order.status" />
      </header>

      <!-- ── Qué pasa ahora ── -->
      <p v-if="ayuda(order.status)" class="dp__help" :class="`dp__help--${tono(order.status)}`">
        {{ ayuda(order.status) }}
      </p>

      <!-- ── Avance ──
           Antes solo había una lista de registros con fecha. Una barra de
           pasos responde de un vistazo a "¿por dónde va lo mío?". -->
      <ol v-if="!estaCancelado(order.status)" class="dp__steps">
        <li
          v-for="(paso, i) in FLUJO_ESTADOS"
          :key="paso"
          class="dp__step"
          :class="{
            'is-done': i < pasoActual,
            'is-now': i === pasoActual,
          }"
        >
          <span class="dp__step-dot" aria-hidden="true">
            <svg v-if="i < pasoActual" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>
          <span class="dp__step-label">{{ etiqueta(paso) }}</span>
        </li>
      </ol>

      <div class="dp__grid">
        <!-- ── Artículos ── -->
        <section class="dp__card">
          <h2 class="dp__card-title">Artículos</h2>

          <ul class="dp__items">
            <li v-for="item in order.items" :key="item.id" class="dp__item">
              <span class="dp__item-qty">{{ item.quantity }}×</span>
              <span class="dp__item-name">{{ item.productName }}</span>
              <span class="dp__item-unit">{{ formatPrice.format(item.unitPrice) }}</span>
              <span class="dp__item-sub">{{ formatPrice.format(item.subtotal) }}</span>
            </li>
          </ul>

          <dl class="dp__totals">
            <div v-if="order.subtotal != null && order.subtotal !== order.total">
              <dt>Subtotal</dt>
              <dd>{{ formatPrice.format(order.subtotal) }}</dd>
            </div>
            <div class="dp__totals-grand">
              <dt>Total</dt>
              <dd>{{ formatPrice.format(order.total) }}</dd>
            </div>
          </dl>
        </section>

        <div class="dp__side">
          <!-- ── Entrega ── -->
          <section class="dp__card">
            <h2 class="dp__card-title">Entrega</h2>
            <dl class="dp__info">
              <div>
                <dt>Destinatario</dt>
                <dd>{{ order.customerName }}</dd>
              </div>
              <div v-if="order.customerPhone">
                <dt>Teléfono</dt>
                <dd>{{ order.customerPhone }}</dd>
              </div>
              <div v-if="order.customerAddress">
                <dt>Dirección</dt>
                <dd>{{ order.customerAddress }}</dd>
              </div>
              <div v-if="order.customerReference">
                <dt>Referencia</dt>
                <dd>{{ order.customerReference }}</dd>
              </div>
              <div v-if="order.customerNotes">
                <dt>Notas</dt>
                <dd>{{ order.customerNotes }}</dd>
              </div>
            </dl>
          </section>

          <!-- ── Pago ── -->
          <section v-if="order.paymentMethodLabel" class="dp__card">
            <h2 class="dp__card-title">Pago</h2>
            <dl class="dp__info">
              <div>
                <dt>Método</dt>
                <dd>{{ order.paymentMethodLabel }}</dd>
              </div>
              <div v-if="order.paymentMethodAccountNumber">
                <dt>Cuenta</dt>
                <dd>{{ order.paymentMethodAccountNumber }}</dd>
              </div>
              <div v-if="order.paymentMethodAccountName">
                <dt>Titular</dt>
                <dd>{{ order.paymentMethodAccountName }}</dd>
              </div>
            </dl>

            <a
              v-if="order.status === 'pending'"
              :href="waLink(`Hola, adjunto el comprobante del pedido ${order.orderCode} por S/ ${Number(order.total).toFixed(2)}`)"
              target="_blank"
              rel="noopener noreferrer"
              class="dp__wa"
            >
              <LandingWaIcon :size="15" />
              Enviar comprobante
            </a>
          </section>

          <!-- ── Historial ── -->
          <section v-if="order.statusLogs?.length" class="dp__card">
            <h2 class="dp__card-title">Historial</h2>
            <ol class="dp__timeline">
              <li v-for="log in order.statusLogs" :key="log.id">
                <span class="dp__tl-dot" aria-hidden="true" />
                <span class="dp__tl-body">
                  <span class="dp__tl-status">{{ etiqueta(log.status) }}</span>
                  <span class="dp__tl-date">{{ formatearFechaHora(log.createdAt) }}</span>
                  <span v-if="log.note" class="dp__tl-note">{{ log.note }}</span>
                </span>
              </li>
            </ol>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const formatPrice = useFormatPrice();
const { etiqueta, ayuda, tono, paso, estaCancelado, FLUJO_ESTADOS } = useEstadoPedido();
const { waLink } = useWhatsapp();

const { data: order, pending } = await useFetch<any>(
  () => `/api/my-orders/${route.params.code}`,
  /* Sin esto, un 404 (pedido de otra cuenta) reventaría la página
     entera en vez de mostrar el mensaje de "no encontrado". */
  { default: () => null },
);

useSeoMeta({
  title: () => `Pedido ${route.params.code} — ByteMarket`,
  robots: "noindex, nofollow",
});

const pasoActual = computed(() => {
  const i = paso(order.value?.status ?? "");
  return i === -1 ? 0 : i;
});

const formatearFecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const formatearFechaHora = (valor: string) =>
  new Date(valor).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
</script>

<style scoped>
.dp {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.dp__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.dp__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}

.dp__back svg {
  width: 13px;
  height: 13px;
}

.dp__back:hover {
  color: var(--accent-strong);
}

.dp__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
}

.dp__title {
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.dp__date {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  margin-top: 2px;
}

/* ── Aviso de situación ── */
.dp__help {
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid;
  border-radius: var(--radius-sm);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  line-height: var(--leading-normal);
}

.dp__help--espera {
  background: var(--cp-warning-bg);
  border-color: var(--cp-warning-border);
  color: var(--cp-warning-text);
}

.dp__help--progreso {
  background: var(--accent-quiet);
  border-color: var(--accent-line);
  color: var(--accent-strong);
}

.dp__help--ok {
  background: var(--cp-success-bg);
  border-color: var(--cp-success-border);
  color: var(--cp-success-text);
}

.dp__help--cancelado {
  background: var(--surface-inset);
  border-color: var(--line);
  color: var(--ink-muted);
}

/* ── Pasos ── */
.dp__steps {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: var(--sp-2);
  margin: 0;
  padding: var(--sp-5) var(--sp-4);
  list-style: none;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  counter-reset: paso;
}

.dp__step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  text-align: center;
}

/* Filete de unión entre pasos, por detrás de los puntos */
.dp__step::before {
  content: "";
  position: absolute;
  top: 11px;
  left: -50%;
  width: 100%;
  height: 2px;
  background: var(--line);
}

.dp__step:first-child::before {
  display: none;
}

.dp__step.is-done::before,
.dp__step.is-now::before {
  background: var(--accent);
}

.dp__step-dot {
  position: relative;
  z-index: 1;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--line);
  border-radius: 50%;
  background: var(--surface-raised);
  color: #fff;
}

.dp__step-dot svg {
  width: 12px;
  height: 12px;
}

.dp__step.is-done .dp__step-dot {
  background: var(--accent);
  border-color: var(--accent);
}

.dp__step.is-now .dp__step-dot {
  border-color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-quiet);
}

.dp__step-label {
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: 0.01em;
  color: var(--ink-faint);
  line-height: 1.3;
}

.dp__step.is-done .dp__step-label,
.dp__step.is-now .dp__step-label {
  color: var(--ink-strong);
}

/* ── Disposición ── */
.dp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: var(--sp-4);
  align-items: start;
}

.dp__side {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
}

.dp__card {
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.dp__card-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  padding-bottom: var(--sp-3);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-3);
}

/* ── Artículos ── */
.dp__items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.dp__item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  gap: var(--sp-3);
  align-items: baseline;
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line-soft);
}

.dp__item-qty {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
}

.dp__item-name {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-strong);
  line-height: var(--leading-snug);
}

.dp__item-unit {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dp__item-sub {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.dp__totals {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: var(--sp-4) 0 0;
}

.dp__totals > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.dp__totals dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
}

.dp__totals dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.dp__totals-grand {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line);
}

.dp__totals-grand dt {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.dp__totals-grand dd {
  font-size: 1.25rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
}

/* ── Fichas de datos ── */
.dp__info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0;
}

.dp__info > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.dp__info dt {
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.dp__info dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-strong);
  line-height: var(--leading-normal);
  word-break: break-word;
}

.dp__wa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  width: 100%;
  height: 42px;
  margin-top: var(--sp-4);
  border-radius: var(--radius-sm);
  background: #25d366;
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  transition: background var(--t-base) var(--ease-smooth);
}

.dp__wa:hover {
  background: #1fb855;
  color: #fff;
}

/* ── Historial ── */
.dp__timeline {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.dp__timeline li {
  position: relative;
  display: flex;
  gap: var(--sp-3);
  padding-left: 2px;
}

/* Filete vertical que une los registros */
.dp__timeline li:not(:last-child)::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 14px;
  bottom: calc(-1 * var(--sp-4));
  width: 1px;
  background: var(--line);
}

.dp__tl-dot {
  width: 9px;
  height: 9px;
  flex-shrink: 0;
  margin-top: 4px;
  border-radius: 50%;
  background: var(--accent);
}

.dp__timeline li:not(:first-child) .dp__tl-dot {
  background: var(--line-strong);
}

.dp__tl-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dp__tl-status {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.dp__tl-date {
  font-size: 0.625rem;
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.dp__tl-note {
  margin-top: 3px;
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
}

/* ── Vacío ── */
.dp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-12) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface-sunken);
}

.dp__empty-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.dp__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 40ch;
}

/* ═══ Responsive ═══ */
@media (max-width: 860px) {
  .dp__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 620px) {
  /* Los pasos se apilan: cinco etiquetas en horizontal se cortan. */
  .dp__steps {
    grid-auto-flow: row;
    grid-auto-columns: auto;
    gap: 0;
    padding: var(--sp-4);
  }

  .dp__step {
    flex-direction: row;
    align-items: center;
    gap: var(--sp-3);
    text-align: left;
    padding: var(--sp-2) 0;
  }

  .dp__step::before {
    top: auto;
    bottom: 50%;
    left: 11px;
    width: 2px;
    height: 100%;
  }

  .dp__step-label {
    font-size: var(--fs-xs);
  }

  .dp__item {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .dp__item-unit {
    display: none;
  }
}
</style>

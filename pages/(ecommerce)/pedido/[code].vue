<template>
  <div class="cf">
    <div class="cp-container">
      <!-- ── Carga ── -->
      <div v-if="pending" class="cf__loading">
        <div class="cp-skeleton" style="height: 120px" />
        <div class="cp-skeleton" style="height: 260px" />
      </div>

      <!-- ── Sin sesión o pedido ajeno ── -->
      <div v-else-if="!order" class="cf__state">
        <h1 class="cf__state-title">
          {{ sinSesion ? "Inicia sesión para ver tu pedido" : "No encontramos ese pedido" }}
        </h1>
        <p class="cf__state-text">
          {{
            sinSesion
              ? "Por seguridad, el detalle de un pedido solo se muestra a la cuenta que lo hizo."
              : "El código no existe o pertenece a otra cuenta."
          }}
        </p>
        <div class="cf__state-actions">
          <NuxtLink v-if="sinSesion" :to="loginHref" class="btn btn-primary btn-sm">
            Iniciar sesión
          </NuxtLink>
          <NuxtLink to="/productos" class="btn btn-outline btn-sm">Ver catálogo</NuxtLink>
        </div>
      </div>

      <template v-else>
        <!-- ── Confirmación ── -->
        <header class="cf__hero">
          <span class="cf__check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 5 5L20 7" />
            </svg>
          </span>

          <h1 class="cf__title">¡Pedido confirmado!</h1>
          <p class="cf__lead">
            Guardamos tu pedido <strong>{{ order.orderCode }}</strong>.
            Te escribiremos por WhatsApp para coordinar la entrega.
          </p>

          <EcommerceEstadoPedido :status="order.status" />
        </header>

        <!-- Qué toca hacer ahora. El estado real, no un texto fijo:
             antes decía siempre "Procesando pedido". -->
        <p v-if="ayuda(order.status)" class="cf__next">
          <strong>Siguiente paso:</strong> {{ ayuda(order.status) }}
        </p>

        <div class="cf__grid">
          <!-- ── Productos ── -->
          <section class="cf__card">
            <h2 class="cf__card-title">Tu pedido</h2>

            <ul class="cf__items">
              <li v-for="item in order.items" :key="item.id">
                <span class="cf__item-qty">{{ item.quantity }}×</span>
                <span class="cf__item-name">{{ item.productName }}</span>
                <span class="cf__item-sub">{{ formatPrice.format(item.subtotal) }}</span>
              </li>
            </ul>

            <!-- El desglose solo aparece si hubo cupón: sin descuento,
                 repetir el subtotal junto al total no aporta nada. -->
            <dl v-if="Number(order.discountApplied) > 0" class="cf__breakdown">
              <div>
                <dt>Subtotal</dt>
                <dd>{{ formatPrice.format(order.subtotal) }}</dd>
              </div>
              <div class="cf__breakdown-save">
                <dt>
                  Cupón
                  <span v-if="order.couponCode" class="cf__coupon">{{ order.couponCode }}</span>
                </dt>
                <dd>− {{ formatPrice.format(order.discountApplied) }}</dd>
              </div>
            </dl>

            <div class="cf__total">
              <span>Total</span>
              <strong>{{ formatPrice.format(order.total) }}</strong>
            </div>

            <dl v-if="order.customerAddress" class="cf__ship">
              <div>
                <dt>Entregar a</dt>
                <dd>{{ order.customerName }}</dd>
              </div>
              <div>
                <dt>Dirección</dt>
                <dd>{{ order.customerAddress }}</dd>
              </div>
              <div v-if="order.customerReference">
                <dt>Referencia</dt>
                <dd>{{ order.customerReference }}</dd>
              </div>
            </dl>
          </section>

          <!-- ── Pago ── -->
          <section v-if="order.paymentMethodLabel" class="cf__card cf__card--pay">
            <h2 class="cf__card-title">Cómo pagar</h2>

            <p class="cf__pay-method">{{ order.paymentMethodLabel }}</p>

            <dl v-if="order.paymentMethodAccountNumber || order.paymentMethodAccountName" class="cf__pay-data">
              <div v-if="order.paymentMethodAccountNumber">
                <dt>Número / cuenta</dt>
                <dd>
                  <span>{{ order.paymentMethodAccountNumber }}</span>
                  <button type="button" class="cf__copy" @click="copiar(order.paymentMethodAccountNumber)">
                    {{ copiado ? "Copiado" : "Copiar" }}
                  </button>
                </dd>
              </div>
              <div v-if="order.paymentMethodAccountName">
                <dt>Titular</dt>
                <dd>{{ order.paymentMethodAccountName }}</dd>
              </div>
              <div>
                <dt>Monto exacto</dt>
                <dd class="cf__pay-amount">{{ formatPrice.format(order.total) }}</dd>
              </div>
            </dl>

            <div v-if="order.paymentMethodQrUrl" class="cf__qr">
              <SharedImagen
                :src="order.paymentMethodQrUrl"
                alt="Código QR para pagar"
                fit="contain"
              />
            </div>

            <a :href="waUrl" target="_blank" rel="noopener noreferrer" class="cf__wa">
              <LandingWaIcon :size="16" />
              Enviar comprobante por WhatsApp
            </a>

            <p class="cf__pay-note">
              Tu pedido se despacha cuando confirmemos el pago.
            </p>
          </section>
        </div>

        <div class="cf__foot">
          <NuxtLink :to="`/mi-cuenta/pedidos/${order.orderCode}`" class="btn btn-outline btn-sm">
            Seguir mi pedido
          </NuxtLink>
          <NuxtLink to="/productos" class="btn btn-ghost btn-sm">Seguir comprando</NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default" });

const route = useRoute();
const formatPrice = useFormatPrice();
const { ayuda } = useEstadoPedido();
const businessState = useBusinessConfig();
const { WA_NUMBER } = useWhatsapp();

const code = computed(() => String(route.params.code));

/* `default` evita que un 401/404 rompa la página entera: se muestra el
   mensaje correspondiente en su lugar. */
const { data: order, error, pending } = await useFetch<any>(
  () => `/api/orders/${code.value}`,
  { default: () => null },
);

const sinSesion = computed(() => error.value?.statusCode === 401);

const loginHref = computed(
  () => `/login?redirect=${encodeURIComponent(`/pedido/${code.value}`)}`,
);

useSeoMeta({
  title: () => `Pedido ${code.value} — ByteMarket`,
  /* Página personal: no aporta a los buscadores y su contenido es
     distinto para cada visitante. */
  robots: "noindex, nofollow",
});

const waNumero = computed(() =>
  String(businessState.value?.whatsapp || WA_NUMBER).replace(/\D/g, ""),
);

const waUrl = computed(() => {
  const total = Number(order.value?.total ?? 0).toFixed(2);
  const texto = `Hola, realicé el pedido ${order.value?.orderCode} por S/ ${total}. Adjunto el comprobante de pago.`;
  return `https://wa.me/${waNumero.value}?text=${encodeURIComponent(texto)}`;
});

const copiado = ref(false);

async function copiar(valor: string) {
  try {
    await navigator.clipboard.writeText(valor);
    copiado.value = true;
    setTimeout(() => (copiado.value = false), 1800);
  } catch {
    /* Sin permiso de portapapeles el número sigue a la vista. */
  }
}
</script>

<style scoped>
.cf {
  padding-block: var(--sp-8) var(--section-y);
}

.cf__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  max-width: 900px;
  margin-inline: auto;
}

/* ── Confirmación ── */
.cf__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  text-align: center;
  max-width: 44ch;
  margin: 0 auto var(--sp-6);
}

.cf__check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--cp-success-bg);
  border: 1px solid var(--cp-success-border);
  color: var(--cp-success);
}

.cf__check svg {
  width: 26px;
  height: 26px;
}

.cf__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.cf__lead {
  font-size: var(--fs-sm);
  line-height: var(--leading-normal);
  color: var(--ink-muted);
}

.cf__lead strong {
  font-family: var(--font-mono);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.cf__next {
  max-width: 900px;
  margin: 0 auto var(--sp-5);
  padding: var(--sp-3) var(--sp-4);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-sm);
  background: var(--accent-quiet);
  font-size: var(--fs-xs);
  line-height: var(--leading-normal);
  color: var(--accent-strong);
  text-align: center;
}

.cf__next strong {
  font-weight: var(--fw-black);
}

/* ── Disposición ── */
.cf__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
  align-items: start;
  max-width: 900px;
  margin-inline: auto;
}

.cf__card {
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.cf__card--pay {
  background: var(--surface-sunken);
}

.cf__card-title {
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
.cf__items {
  margin: 0;
  padding: 0;
  list-style: none;
}

.cf__items li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: var(--sp-3);
  align-items: baseline;
  padding: var(--sp-2) 0;
}

.cf__item-qty {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
}

.cf__item-name {
  font-size: var(--fs-xs);
  color: var(--ink-strong);
  line-height: var(--leading-snug);
}

.cf__item-sub {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cf__breakdown {
  margin: var(--sp-3) 0 0;
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.cf__breakdown > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.cf__breakdown dt,
.cf__breakdown dd {
  margin: 0;
  font-size: var(--fs-sm);
  color: var(--ink-muted, #64748b);
}

.cf__breakdown dd {
  font-variant-numeric: tabular-nums;
}

.cf__breakdown-save dt,
.cf__breakdown-save dd {
  color: #15803d;
  font-weight: var(--fw-bold);
}

.cf__coupon {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.72rem;
  letter-spacing: 0.04em;
  opacity: 0.85;
}

/* Con desglose arriba, el total ya no necesita su propia línea divisoria. */
.cf__breakdown + .cf__total {
  border-top: none;
  padding-top: 0;
  margin-top: var(--sp-1);
}

.cf__total {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-top: var(--sp-3);
  margin-top: var(--sp-2);
  border-top: 1px solid var(--line);
}

.cf__total span {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.cf__total strong {
  font-size: 1.375rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.cf__ship {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: var(--sp-4) 0 0;
  padding-top: var(--sp-4);
  border-top: 1px solid var(--line-soft);
}

.cf__ship > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cf__ship dt {
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.cf__ship dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-strong);
  line-height: var(--leading-normal);
}

/* ── Pago ── */
.cf__pay-method {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  margin-bottom: var(--sp-3);
}

.cf__pay-data {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
}

.cf__pay-data > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.cf__pay-data dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  flex-shrink: 0;
}

.cf__pay-data dd {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.cf__pay-amount {
  font-size: var(--fs-sm) !important;
  color: var(--accent-strong) !important;
}

.cf__copy {
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-xs);
  background: var(--surface-raised);
  padding: 2px 8px;
  font-family: inherit;
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  color: var(--accent-strong);
  white-space: nowrap;
}

.cf__copy:hover {
  background: var(--accent-soft);
}

.cf__qr {
  width: 160px;
  height: 160px;
  margin: var(--sp-4) auto 0;
  padding: var(--sp-2);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: #fff;
}

.cf__wa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  width: 100%;
  height: 46px;
  margin-top: var(--sp-4);
  border-radius: var(--radius-sm);
  background: #25d366;
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  transition: background var(--t-base) var(--ease-smooth);
}

.cf__wa:hover {
  background: #1fb855;
  color: #fff;
}

.cf__pay-note {
  margin-top: var(--sp-3);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--ink-muted);
  text-align: center;
}

/* ── Pie ── */
.cf__foot {
  display: flex;
  justify-content: center;
  gap: var(--sp-2);
  margin-top: var(--sp-6);
}

/* ── Estados ── */
.cf__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-16) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  max-width: 560px;
  margin-inline: auto;
}

.cf__state-title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.cf__state-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 44ch;
}

.cf__state-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

@media (max-width: 820px) {
  .cf__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 480px) {
  .cf__foot {
    flex-direction: column;
  }
}
</style>

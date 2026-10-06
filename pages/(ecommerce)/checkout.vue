<template>
  <div class="ck">
    <div class="cp-container">
      <nav class="ck__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/productos">Catálogo</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="ck__crumb-now">Finalizar pedido</span>
      </nav>

      <ClientOnly>
        <!-- ── Carrito vacío ──
             Antes esto redirigía a /carrito, una ruta que no existe: el
             comprador caía en un 404 al recargar el checkout. -->
        <div v-if="cartStore.isEmpty && !justOrdered" class="ck__empty">
          <span class="ck__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="18" cy="20" r="1.4" />
              <path d="M2 3h2.2l2.3 12.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H5.3" />
            </svg>
          </span>
          <h1 class="ck__empty-title">No hay nada que confirmar</h1>
          <p class="ck__empty-text">
            Tu carrito está vacío. Agrega las piezas que necesitas y vuelve
            para finalizar el pedido.
          </p>
          <NuxtLink to="/productos" class="btn btn-primary">Ver catálogo</NuxtLink>
        </div>

        <!-- ── Checkout ── -->
        <template v-else>
          <header class="ck__head">
            <h1 class="ck__title">Finalizar pedido</h1>
            <p class="ck__sub">
              Revisa tus datos y elige cómo pagar. Te confirmamos el pedido por
              WhatsApp.
            </p>
          </header>

          <form class="ck__grid" @submit.prevent="submitOrder">
            <!-- ═══ Columna del formulario ═══ -->
            <div class="ck__main">
              <!-- ① Datos -->
              <section class="ck__block">
                <div class="ck__block-head">
                  <span class="ck__step" aria-hidden="true">1</span>
                  <div>
                    <h2 class="ck__block-title">Datos de entrega</h2>
                    <p class="ck__block-sub">A dónde llevamos el pedido y con quién coordinamos.</p>
                  </div>
                </div>

                <div class="ck__fields">
                  <div class="ck__row">
                    <div class="ck__field">
                      <label class="ck__label" for="ck-name">
                        Nombre completo <span class="ck__req">*</span>
                      </label>
                      <input
                        id="ck-name"
                        v-model="form.customerName"
                        type="text"
                        class="ck__input"
                        :class="{ 'is-invalid': touched && !nameOk }"
                        placeholder="Juan García"
                        autocomplete="name"
                        required
                      />
                      <span v-if="touched && !nameOk" class="ck__hint ck__hint--error">
                        Escribe tu nombre (al menos 2 caracteres).
                      </span>
                    </div>

                    <div class="ck__field">
                      <label class="ck__label" for="ck-phone">
                        Teléfono <span class="ck__req">*</span>
                      </label>
                      <input
                        id="ck-phone"
                        v-model="form.customerPhone"
                        type="tel"
                        inputmode="tel"
                        class="ck__input"
                        :class="{ 'is-invalid': touched && !phoneOk }"
                        placeholder="999 999 999"
                        autocomplete="tel"
                        required
                      />
                      <span
                        class="ck__hint"
                        :class="{ 'ck__hint--error': touched && !phoneOk }"
                      >
                        Por aquí te confirmamos el pedido.
                      </span>
                    </div>
                  </div>

                  <div class="ck__field">
                    <label class="ck__label" for="ck-address">
                      Dirección de entrega <span class="ck__req">*</span>
                    </label>
                    <input
                      id="ck-address"
                      v-model="form.customerAddress"
                      type="text"
                      class="ck__input"
                      :class="{ 'is-invalid': touched && !addressOk }"
                      placeholder="Av. Principal 123, distrito, ciudad"
                      autocomplete="street-address"
                      required
                    />
                    <span v-if="touched && !addressOk" class="ck__hint ck__hint--error">
                      Necesitamos una dirección para coordinar el envío.
                    </span>
                  </div>

                  <div class="ck__field">
                    <label class="ck__label" for="ck-reference">
                      Referencia <span class="ck__opt">opcional</span>
                    </label>
                    <input
                      id="ck-reference"
                      v-model="form.customerReference"
                      type="text"
                      class="ck__input"
                      placeholder="Cerca al parque, edificio azul, portón negro…"
                      autocomplete="address-line2"
                    />
                  </div>

                  <p v-if="usandoGuardados" class="ck__saved">
                    Usamos los datos de tu cuenta. Cámbialos aquí solo para este
                    pedido, o edítalos en
                    <NuxtLink to="/mi-cuenta">mi cuenta</NuxtLink>.
                  </p>

                  <div class="ck__field">
                    <label class="ck__label" for="ck-notes">
                      Notas <span class="ck__opt">opcional</span>
                    </label>
                    <textarea
                      id="ck-notes"
                      v-model="form.customerNotes"
                      class="ck__input ck__textarea"
                      rows="3"
                      maxlength="500"
                      placeholder="Horario preferido, modelo exacto de tu equipo, instrucciones…"
                    />
                  </div>
                </div>
              </section>

              <!-- ② Pago -->
              <section class="ck__block">
                <div class="ck__block-head">
                  <span class="ck__step" aria-hidden="true">2</span>
                  <div>
                    <h2 class="ck__block-title">Método de pago</h2>
                    <p class="ck__block-sub">Elige uno; te mostramos los datos para transferir.</p>
                  </div>
                </div>

                <div v-if="methods.length" class="ck__methods">
                  <label
                    v-for="pm in methods"
                    :key="pm.id"
                    class="ck__method"
                    :class="{ 'is-on': form.paymentMethodId === pm.id }"
                  >
                    <input
                      v-model="form.paymentMethodId"
                      type="radio"
                      name="paymentMethod"
                      :value="pm.id"
                      class="ck__method-input"
                    />

                    <span class="ck__method-dot" aria-hidden="true" />

                    <span class="ck__method-body">
                      <span class="ck__method-label">{{ pm.label }}</span>
                      <span v-if="pm.accountNumber" class="ck__method-meta">
                        {{ pm.accountNumber }}
                      </span>
                    </span>
                  </label>

                  <!-- Datos de la cuenta elegida: sin esto el comprador
                       confirma y no sabe a dónde transferir. -->
                  <div v-if="selectedMethod" class="ck__payinfo">
                    <p class="ck__payinfo-title">Datos para el pago</p>

                    <dl class="ck__payinfo-list">
                      <div>
                        <dt>Medio</dt>
                        <dd>{{ selectedMethod.label }}</dd>
                      </div>
                      <div v-if="selectedMethod.accountNumber">
                        <dt>Número / cuenta</dt>
                        <dd class="ck__payinfo-copy">
                          <span>{{ selectedMethod.accountNumber }}</span>
                          <button type="button" @click="copyAccount">
                            {{ copied ? "Copiado" : "Copiar" }}
                          </button>
                        </dd>
                      </div>
                      <div v-if="selectedMethod.accountName">
                        <dt>Titular</dt>
                        <dd>{{ selectedMethod.accountName }}</dd>
                      </div>
                    </dl>

                    <div v-if="selectedMethod.qrUrl" class="ck__qr">
                      <SharedImagen
                        :src="selectedMethod.qrUrl"
                        :alt="`Código QR de ${selectedMethod.label}`"
                        fit="contain"
                      />
                    </div>

                    <p class="ck__payinfo-note">
                      Paga después de confirmar el pedido y envíanos la constancia
                      por WhatsApp para despacharlo.
                    </p>
                  </div>

                  <p v-if="touched && !form.paymentMethodId" class="ck__hint ck__hint--error">
                    Elige un método de pago.
                  </p>
                </div>

                <!-- Sin métodos configurados no hay forma de cobrar: se dice
                     y se ofrece la salida por WhatsApp. -->
                <p v-else class="ck__nomethods">
                  No hay métodos de pago disponibles en este momento.
                  <a :href="waLink('Hola, quiero coordinar el pago de un pedido')" target="_blank" rel="noopener noreferrer">
                    Escríbenos por WhatsApp
                  </a>
                  y lo coordinamos.
                </p>
              </section>
            </div>

            <!-- ═══ Resumen ═══ -->
            <div class="ck__aside">
              <EcommerceResumenCarrito
                :descuento-cupon="cupon?.discount ?? 0"
                :codigo-cupon="cupon?.code ?? null"
              >
                <template #cupon>
                  <EcommerceCampoCupon
                    :subtotal="cartStore.subtotal"
                    @aplicado="cupon = $event"
                  />
                </template>

                <template #acciones>
                  <p v-if="error" class="ck__error" role="alert">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v5M12 16.5v.01" />
                    </svg>
                    {{ error }}
                  </p>

                  <button type="submit" class="ck__submit" :disabled="submitting">
                    <span v-if="submitting" class="ck__spin" aria-hidden="true" />
                    {{ submitting ? "Procesando…" : "Confirmar pedido" }}
                  </button>

                  <NuxtLink to="/productos" class="ck__keep">Seguir comprando</NuxtLink>
                </template>
              </EcommerceResumenCarrito>
            </div>
          </form>
        </template>

        <!-- El checkout depende del carrito, que vive en el navegador: el
             servidor no puede saber qué hay dentro. El esqueleto copia la
             silueta real para que el contenido no salte al hidratar. -->
        <template #fallback>
          <div class="ck__loading">
            <div class="cp-skeleton ck__loading-title" />
            <div class="ck__loading-grid">
              <div class="ck__loading-col">
                <div class="cp-skeleton ck__loading-block" />
                <div class="cp-skeleton ck__loading-block ck__loading-block--sm" />
              </div>
              <div class="cp-skeleton ck__loading-aside" />
            </div>
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth-customer" });

const cartStore = useCartStore();
const { user } = useUserSession();
const { waLink } = useWhatsapp();

useSeoMeta({
  title: "Finalizar pedido — ByteMarket",
  description: "Confirma tus datos de entrega y método de pago.",
  robots: "noindex, nofollow",
});

type PaymentMethod = {
  id: number;
  type: string;
  label: string;
  qrUrl: string | null;
  accountNumber: string | null;
  accountName: string | null;
};

const { data: paymentData } = await useFetch<{ data: PaymentMethod[] }>(
  "/api/payment-methods",
  { query: { active: true }, default: () => ({ data: [] }) },
);

const methods = computed(() => paymentData.value?.data ?? []);

/* Datos guardados del cliente, para no pedir en cada compra lo que ya
   nos dijo una vez. Se editan en /mi-cuenta. */
const { data: perfil } = await useFetch<{
  name: string;
  phone: string | null;
  address: string | null;
  addressReference: string | null;
}>("/api/mi-perfil", { default: () => null });

/* Lo que devolvió /api/coupons/validate. Es una previsualización: el
   importe que vale es el que recalcula order-service al confirmar. */
const cupon = ref<{ code: string; discount: number } | null>(null);

const form = reactive({
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  customerReference: "",
  customerNotes: "",
  paymentMethodId: null as number | null,
});

/* Se rellena cuando llega el perfil, sin pisar lo que el usuario ya
   haya escrito: puede querer enviar este pedido a otra dirección. */
watch(
  perfil,
  (p) => {
    if (!p) return;
    if (!form.customerName) form.customerName = p.name ?? user.value?.name ?? "";
    if (!form.customerPhone) form.customerPhone = p.phone ?? "";
    if (!form.customerAddress) form.customerAddress = p.address ?? "";
    if (!form.customerReference) form.customerReference = p.addressReference ?? "";
  },
  { immediate: true },
);

/* Con un solo método configurado, obligar a elegirlo es un clic sin
   decisión detrás. */
watch(
  methods,
  (list) => {
    if (list.length === 1 && form.paymentMethodId === null) {
      form.paymentMethodId = list[0].id;
    }
  },
  { immediate: true },
);

const selectedMethod = computed(
  () => methods.value.find((m) => m.id === form.paymentMethodId) ?? null,
);

const submitting = ref(false);
const error = ref("");
const touched = ref(false);
const copied = ref(false);

/* Tras confirmar, el store se vacía antes de que termine la navegación.
   Sin esta bandera la página pintaría "carrito vacío" durante ese
   instante, justo después de una compra correcta. */
const justOrdered = ref(false);

/* Solo se avisa si el perfil aportó realmente una dirección. */
const usandoGuardados = computed(
  () => Boolean(perfil.value?.address) && form.customerAddress === perfil.value?.address,
);

const nameOk = computed(() => form.customerName.trim().length >= 2);
/* Los móviles peruanos son 9 dígitos; se aceptan prefijos y separadores
   y se cuenta solo lo numérico. */
const phoneOk = computed(() => form.customerPhone.replace(/\D/g, "").length >= 9);
const addressOk = computed(() => form.customerAddress.trim().length >= 5);

const canSubmit = computed(
  () => nameOk.value && phoneOk.value && addressOk.value && form.paymentMethodId !== null,
);

async function copyAccount() {
  const value = selectedMethod.value?.accountNumber;
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1800);
  } catch {
    /* Sin permiso de portapapeles el número sigue visible para copiarlo
       a mano; no vale la pena molestar con un error. */
  }
}

async function submitOrder() {
  touched.value = true;
  error.value = "";

  if (!canSubmit.value) {
    error.value = "Revisa los campos marcados antes de confirmar.";
    return;
  }

  if (cartStore.isEmpty) {
    error.value = "Tu carrito está vacío.";
    return;
  }

  submitting.value = true;

  try {
    const order = await $fetch<any>("/api/orders", {
      method: "POST",
      body: {
        ...form,
        /* Solo el código: el descuento lo vuelve a calcular el backend
           contra los precios del catálogo. Mandar el importe desde aquí
           dejaría el total a merced del navegador. */
        couponCode: cupon.value?.code ?? null,
        items: cartStore.items.map((i) => ({
          productId: Number(i.id),
          quantity: Number(i.qty ?? 0),
        })),
      },
    });

    justOrdered.value = true;
    cartStore.clear();
    await navigateTo(`/pedido/${order.orderCode}`);
  } catch (e: any) {
    justOrdered.value = false;
    error.value =
      e?.data?.message ?? "No se pudo procesar el pedido. Inténtalo nuevamente.";
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.ck {
  padding-block: var(--sp-6) var(--section-y);
}

/* ── Migas y cabecera ── */
.ck__crumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-5);
}

.ck__crumb a:hover {
  color: var(--accent-strong);
}

.ck__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.ck__head {
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-6);
}

.ck__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.ck__sub {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  margin-top: 4px;
  max-width: 56ch;
}

/* ── Disposición ── */
.ck__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--sp-8);
  align-items: start;
}

.ck__main {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  min-width: 0;
}

/* El resumen acompaña el scroll: el total y el botón no deben perderse
   mientras se rellena un formulario largo. */
.ck__aside {
  position: sticky;
  top: calc(var(--header-total) + var(--sp-4));
  min-width: 0;
}

/* ── Bloques ── */
.ck__block {
  padding: var(--sp-6);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.ck__block-head {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-5);
}

/* Número en lugar de icono: numera los pasos, que es lo que el
   comprador quiere saber (cuánto falta). */
.ck__step {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--cp-navy-900);
  color: #fff;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
}

.ck__block-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.ck__block-sub {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  margin-top: 2px;
}

/* ── Campos ── */
.ck__fields {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.ck__row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
}

.ck__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.ck__label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
}

.ck__req {
  color: var(--cp-danger);
}

.ck__opt {
  font-weight: var(--fw-regular);
  color: var(--ink-faint);
}

.ck__input {
  width: 100%;
  height: 44px;
  padding: 0 var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-family: inherit;
  font-size: var(--fs-sm);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.ck__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

.ck__input.is-invalid {
  border-color: var(--cp-danger);
}

.ck__textarea {
  height: auto;
  padding: var(--sp-3) var(--sp-4);
  line-height: var(--leading-normal);
  resize: vertical;
}

.ck__hint {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

.ck__hint--error {
  color: var(--cp-danger);
  font-weight: var(--fw-semibold);
}

.ck__saved {
  padding: var(--sp-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--ink-muted);
}

.ck__saved a {
  color: var(--accent-strong);
  font-weight: var(--fw-bold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ── Métodos de pago ── */
.ck__methods {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ck__method {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  cursor: pointer;
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.ck__method:hover {
  border-color: var(--line-strong);
}

.ck__method.is-on {
  border-color: var(--accent);
  background: var(--accent-quiet);
}

/* El radio nativo se oculta pero se conserva: da navegación por teclado
   y agrupación accesible gratis. */
.ck__method-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.ck__method-dot {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid var(--line-strong);
  border-radius: 50%;
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.ck__method.is-on .ck__method-dot {
  border-color: var(--accent-strong);
  box-shadow: inset 0 0 0 4px var(--surface-raised),
    inset 0 0 0 10px var(--accent-strong);
}

.ck__method-input:focus-visible + .ck__method-dot {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.ck__method-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.ck__method-label {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
}

.ck__method-meta {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Datos de pago ── */
.ck__payinfo {
  margin-top: var(--sp-2);
  padding: var(--sp-4);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-sm);
  background: var(--accent-quiet);
}

.ck__payinfo-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
  margin-bottom: var(--sp-3);
}

.ck__payinfo-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ck__payinfo-list > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.ck__payinfo-list dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  flex-shrink: 0;
}

.ck__payinfo-list dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  text-align: right;
}

.ck__payinfo-copy {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  font-variant-numeric: tabular-nums;
}

.ck__payinfo-copy button {
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

.ck__payinfo-copy button:hover {
  background: var(--accent-soft);
}

.ck__qr {
  width: 150px;
  height: 150px;
  margin: var(--sp-4) auto 0;
  padding: var(--sp-2);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: #fff;
}

.ck__payinfo-note {
  margin-top: var(--sp-3);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--ink-muted);
}

.ck__nomethods {
  padding: var(--sp-5);
  border: 1px dashed var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-sunken);
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  text-align: center;
}

.ck__nomethods a {
  color: var(--accent-strong);
  font-weight: var(--fw-bold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

/* ── Acciones del resumen ── */
.ck__error {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  margin-top: var(--sp-4);
  padding: var(--sp-3);
  border: 1px solid var(--cp-error-border);
  border-radius: var(--radius-sm);
  background: var(--cp-error-bg);
  color: var(--cp-error-text);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  line-height: var(--leading-snug);
}

.ck__error svg {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}

.ck__submit {
  width: 100%;
  height: 50px;
  margin-top: var(--sp-4);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  border: 0;
  border-radius: var(--radius-sm);
  background: var(--action-bg);
  color: var(--action-ink);
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  transition: background var(--t-base) var(--ease-smooth);
}

.ck__submit:hover:not(:disabled) {
  background: var(--action-bg-hover);
}

.ck__submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ck__spin {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ck-spin 0.7s linear infinite;
}

@keyframes ck-spin {
  to {
    transform: rotate(360deg);
  }
}

.ck__keep {
  display: block;
  margin-top: var(--sp-3);
  text-align: center;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}

.ck__keep:hover {
  color: var(--accent-strong);
}

/* ── Estados ── */
.ck__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-16) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
}

.ck__empty-icon {
  color: var(--ink-faint);
}

.ck__empty-icon svg {
  width: 44px;
  height: 44px;
}

.ck__empty-title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.ck__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 44ch;
  margin-bottom: var(--sp-3);
}

.ck__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-6);
}

.ck__loading-title {
  height: 34px;
  width: 38%;
  max-width: 20rem;
}

.ck__loading-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: var(--sp-8);
  align-items: start;
}

.ck__loading-col {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.ck__loading-block {
  height: 24rem;
  border-radius: var(--radius);
}

.ck__loading-block--sm {
  height: 14rem;
}

.ck__loading-aside {
  height: 30rem;
  border-radius: var(--radius);
}

@media (max-width: 1000px) {
  .ck__loading-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
  }
}

/* ═══ Responsive ═══ */
@media (max-width: 1000px) {
  .ck__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-5);
  }

  /* Deja de acompañar el scroll: apilado quedaría flotando sobre el
     propio formulario. */
  .ck__aside {
    position: static;
  }
}

@media (max-width: 560px) {
  .ck__row {
    grid-template-columns: minmax(0, 1fr);
  }

  .ck__block {
    padding: var(--sp-4);
  }
}
</style>

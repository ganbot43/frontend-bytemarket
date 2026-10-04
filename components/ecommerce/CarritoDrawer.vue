<template>
  <Teleport to="body">
    <Transition name="cd-fade">
      <div v-if="cartStore.isOpen" class="cd__scrim" @click="close" />
    </Transition>

    <Transition name="cd-slide">
      <aside
        v-if="cartStore.isOpen"
        class="cd"
        role="dialog"
        aria-label="Carrito de compras"
        aria-modal="true"
      >
        <!-- ── Cabecera ── -->
        <header class="cd__head">
          <div class="cd__head-text">
            <h2 class="cd__title">Mi carrito</h2>
            <p class="cd__sub">
              {{
                cartStore.isEmpty
                  ? "Todavía no hay nada aquí"
                  : `${cartStore.itemCount} ${cartStore.itemCount === 1 ? "producto" : "productos"}`
              }}
            </p>
          </div>

          <button type="button" class="cd__close" aria-label="Cerrar carrito" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <!-- ── Cuerpo ── -->
        <div class="cd__body">
          <!-- Vacío -->
          <div v-if="cartStore.isEmpty" class="cd__empty">
            <span class="cd__empty-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="20" r="1.4" />
                <circle cx="18" cy="20" r="1.4" />
                <path d="M2 3h2.2l2.3 12.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H5.3" />
              </svg>
            </span>
            <p class="cd__empty-title">Tu carrito está vacío</p>
            <p class="cd__empty-text">
              Busca la pieza por modelo o revisa el catálogo por categoría.
            </p>
            <NuxtLink to="/productos" class="btn btn-primary btn-sm" @click="close">
              Ver catálogo
            </NuxtLink>
          </div>

          <!-- Con productos -->
          <TransitionGroup v-else name="cd-item" tag="ul" class="cd__list">
            <li v-for="item in cartStore.items" :key="item.id">
              <EcommerceElementoCarrito
                :item="item"
                @increment="cartStore.increment(item.id)"
                @decrement="cartStore.decrement(item.id)"
                @remove="cartStore.remove(item.id)"
              />
            </li>
          </TransitionGroup>
        </div>

        <!-- ── Pie ── -->
        <footer v-if="!cartStore.isEmpty" class="cd__foot">
          <dl class="cd__summary">
            <div>
              <dt>Subtotal</dt>
              <dd>{{ fmt(cartStore.subtotal) }}</dd>
            </div>
            <div v-if="cartStore.discount > 0" class="cd__summary-save">
              <dt>Descuento</dt>
              <dd>− {{ fmt(cartStore.discount) }}</dd>
            </div>
            <div class="cd__summary-total">
              <dt>Total</dt>
              <dd>{{ fmt(cartStore.total) }}</dd>
            </div>
          </dl>

          <p class="cd__note">El envío se calcula al confirmar el pedido.</p>

          <NuxtLink to="/checkout" class="cd__checkout" @click="close">
            Continuar al pago
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>

          <div class="cd__foot-links">
            <button type="button" class="cd__link" @click="close">Seguir comprando</button>
            <button type="button" class="cd__link cd__link--danger" @click="confirmClear">
              Vaciar carrito
            </button>
          </div>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const cartStore = useCartStore();

/**
 * Formatea un número como moneda PEN.
 * parseFloat primero: pinia-plugin-persistedstate puede rehidratar
 * cadenas desde localStorage y nunca debe llegar NaN al template.
 */
function fmt(amount: unknown): string {
  const num = parseFloat(String(amount));
  if (!Number.isFinite(num)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}

function close() {
  cartStore.isOpen = false;
}

function confirmClear() {
  if (confirm("¿Vaciar el carrito? Esta acción no se puede deshacer.")) {
    cartStore.clear();
  }
}

/* El cajón bloquea el scroll del fondo mientras está abierto. */
watch(
  () => cartStore.isOpen,
  (open) => {
    if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
  },
);

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && cartStore.isOpen) close();
}

onMounted(() => {
  /* El estado del carrito se persiste, pero "abierto" no debería:
     recargar no puede dejar al usuario con el cajón encima. */
  cartStore.isOpen = false;
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  if (import.meta.client) document.body.style.overflow = "";
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   CAJÓN DEL CARRITO

   Tres zonas fijas: cabecera, lista con scroll propio
   y pie anclado. El total y el botón de pago nunca se
   van de la vista, por larga que sea la lista.
═══════════════════════════════════════════════════ */

.cd__scrim {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: var(--overlay);
}

.cd {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 210;
  width: min(420px, 100vw);
  display: flex;
  flex-direction: column;
  background: var(--surface-raised);
  border-left: 1px solid var(--line-soft);
  box-shadow: var(--shadow-lg);
}

/* ── Cabecera ── */
.cd__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  flex-shrink: 0;
}

.cd__title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.cd__sub {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  margin-top: 2px;
}

.cd__close {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-body);
  transition:
    background var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.cd__close svg {
  width: 16px;
  height: 16px;
}

.cd__close:hover {
  background: var(--surface-inset);
  color: var(--ink-strong);
}

/* ── Cuerpo ── */
.cd__body {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.cd__list {
  margin: 0;
  padding: var(--sp-3);
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

/* ── Vacío ── */
.cd__empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-8) var(--sp-6);
  text-align: center;
}

.cd__empty-icon {
  color: var(--ink-faint);
  margin-bottom: var(--sp-2);
}

.cd__empty-icon svg {
  width: 42px;
  height: 42px;
}

.cd__empty-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.cd__empty-text {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  max-width: 32ch;
  margin-bottom: var(--sp-3);
}

/* ── Pie ── */
.cd__foot {
  flex-shrink: 0;
  padding: var(--sp-5);
  border-top: 1px solid var(--line-soft);
  background: var(--surface-sunken);
}

.cd__summary {
  margin: 0 0 var(--sp-3);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.cd__summary > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.cd__summary dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
}

.cd__summary dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.cd__summary-save dd {
  color: var(--cp-success);
}

.cd__summary-total {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--line-soft);
}

.cd__summary-total dt {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.cd__summary-total dd {
  font-size: 1.375rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.cd__note {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
  margin-bottom: var(--sp-4);
}

.cd__checkout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  height: 48px;
  border-radius: var(--radius-sm);
  background: var(--action-bg);
  color: var(--action-ink);
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  transition: background var(--t-base) var(--ease-smooth);
}

.cd__checkout svg {
  width: 15px;
  height: 15px;
  transition: transform var(--t-base) var(--ease-smooth);
}

.cd__checkout:hover {
  background: var(--action-bg-hover);
  color: var(--action-ink);
}

.cd__checkout:hover svg {
  transform: translateX(3px);
}

.cd__foot-links {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-top: var(--sp-3);
}

.cd__link {
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
  transition: color var(--t-fast) var(--ease-smooth);
}

.cd__link:hover {
  color: var(--ink-strong);
}

.cd__link--danger:hover {
  color: var(--cp-danger);
}

/* ── Transiciones ── */
.cd-fade-enter-active,
.cd-fade-leave-active {
  transition: opacity var(--t-base) var(--ease-smooth);
}
.cd-fade-enter-from,
.cd-fade-leave-to {
  opacity: 0;
}

.cd-slide-enter-active,
.cd-slide-leave-active {
  transition: transform var(--t-base) var(--ease-smooth);
}
.cd-slide-enter-from,
.cd-slide-leave-to {
  transform: translateX(100%);
}

.cd-item-enter-active,
.cd-item-leave-active {
  transition:
    opacity var(--t-base) var(--ease-smooth),
    transform var(--t-base) var(--ease-smooth);
}
.cd-item-enter-from,
.cd-item-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.cd-item-leave-active {
  position: absolute;
  width: calc(100% - var(--sp-6));
}

@media (max-width: 480px) {
  .cd {
    width: 100vw;
  }
}
</style>

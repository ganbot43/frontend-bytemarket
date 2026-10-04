<template>
  <aside class="rc">
    <header class="rc__head">
      <h2 class="rc__title">Tu pedido</h2>
      <span class="rc__count">
        {{ cartStore.itemCount }} {{ cartStore.itemCount === 1 ? "artículo" : "artículos" }}
      </span>
    </header>

    <!-- ── Artículos ──
         Editables aquí mismo: descubrir en el último paso que pediste
         dos en vez de uno y tener que volver al catálogo pierde ventas. -->
    <ul class="rc__items">
      <li v-for="item in cartStore.items" :key="item.id" class="rc__item">
        <span class="rc__thumb">
          <SharedImagen :src="item.image" :alt="item.name" fit="contain" />
        </span>

        <span class="rc__info">
          <span class="rc__name" :title="item.name">{{ item.name }}</span>

          <span v-if="editable" class="rc__qty" role="group" aria-label="Cantidad">
            <button
              type="button"
              :aria-label="`Quitar una unidad de ${item.name}`"
              @click="cartStore.decrement(item.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span>{{ item.qty }}</span>
            <button
              type="button"
              :aria-label="`Agregar una unidad de ${item.name}`"
              :disabled="atMax(item)"
              @click="cartStore.increment(item.id)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </span>

          <span v-else class="rc__qty-static">× {{ item.qty }}</span>
        </span>

        <span class="rc__line">
          <span class="rc__line-total">{{ formatPrice.format(lineTotal(item)) }}</span>
          <button
            v-if="editable"
            type="button"
            class="rc__drop"
            :aria-label="`Quitar ${item.name} del pedido`"
            @click="cartStore.remove(item.id)"
          >
            Quitar
          </button>
        </span>
      </li>
    </ul>

    <!-- ── Totales ── -->
    <dl class="rc__totals">
      <div>
        <dt>Subtotal</dt>
        <dd>{{ formatPrice.format(cartStore.subtotal) }}</dd>
      </div>

      <div v-if="cartStore.discount > 0" class="rc__totals-save">
        <dt>Descuento</dt>
        <dd>− {{ formatPrice.format(cartStore.discount) }}</dd>
      </div>

      <div class="rc__totals-shipping">
        <dt>Envío</dt>
        <dd>Por coordinar</dd>
      </div>
    </dl>

    <div class="rc__grand">
      <span>Total</span>
      <strong>{{ formatPrice.format(cartStore.total) }}</strong>
    </div>

    <p class="rc__note">
      Precios en soles con IGV incluido. El costo de envío se coordina contigo
      tras confirmar el pedido.
    </p>

    <!-- El botón de confirmar lo pone el checkout; el carrito lateral no
         necesita ninguno aquí. -->
    <slot name="acciones" />
  </aside>
</template>

<script setup lang="ts">
import type { CartItem } from "~/stores/cart";

withDefaults(defineProps<{ editable?: boolean }>(), { editable: true });

const cartStore = useCartStore();
const formatPrice = useFormatPrice();

const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const lineTotal = (item: CartItem) => toNumber(item.price) * toNumber(item.qty);

/* Mismo tope que aplica el store al incrementar: el botón se desactiva
   en lugar de dejar de responder sin explicación. */
const atMax = (item: CartItem) =>
  toNumber(item.qty) >= (toNumber(item.stock) || 99);
</script>

<style scoped>
.rc {
  display: flex;
  flex-direction: column;
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

/* ── Cabecera ── */
.rc__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
}

.rc__title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.rc__count {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

/* ── Artículos ── */
.rc__items {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
  /* Con quince piezas la columna se haría más alta que la pantalla y el
     total quedaría fuera de vista. */
  max-height: 22rem;
  overflow-y: auto;
}

.rc__item {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: var(--sp-3);
  align-items: center;
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line-soft);
}

.rc__thumb {
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xs);
  background: var(--surface-media);
  overflow: hidden;
}

.rc__thumb :deep(img) {
  padding: 3px;
}

.rc__info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.rc__name {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  line-height: var(--leading-snug);
  color: var(--ink-strong);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rc__qty {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.rc__qty button {
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--ink-strong);
  transition: background var(--t-fast) var(--ease-smooth);
}

.rc__qty button svg {
  width: 11px;
  height: 11px;
}

.rc__qty button:hover:not(:disabled) {
  background: var(--surface-inset);
}

.rc__qty button:disabled {
  color: var(--ink-faint);
  cursor: not-allowed;
}

.rc__qty > span {
  min-width: 26px;
  text-align: center;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.rc__qty-static {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.rc__line {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.rc__line-total {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.rc__drop {
  border: 0;
  background: transparent;
  padding: 0;
  font-family: inherit;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-faint);
  transition: color var(--t-fast) var(--ease-smooth);
}

.rc__drop:hover {
  color: var(--cp-danger);
}

/* ── Totales ── */
.rc__totals {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
  padding: var(--sp-4) 0;
}

.rc__totals > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.rc__totals dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
}

.rc__totals dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.rc__totals-save dd {
  color: var(--cp-success);
}

.rc__totals-shipping dd {
  font-weight: var(--fw-medium);
  color: var(--ink-muted);
}

.rc__grand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-top: var(--sp-4);
  border-top: 1px solid var(--line);
}

.rc__grand span {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.rc__grand strong {
  font-size: 1.5rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rc__note {
  margin-top: var(--sp-3);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--ink-faint);
}

@media (max-width: 520px) {
  .rc {
    padding: var(--sp-4);
  }

  .rc__item {
    grid-template-columns: 44px minmax(0, 1fr) auto;
  }

  .rc__thumb {
    width: 44px;
    height: 44px;
  }
}
</style>

<template>
  <article class="ci">
    <div class="ci__media">
      <SharedImagen :src="item.image" :alt="item.name" fit="contain" />
    </div>

    <div class="ci__body">
      <div class="ci__top">
        <p class="ci__name" :title="item.name">{{ item.name }}</p>

        <button
          type="button"
          class="ci__remove"
          :aria-label="`Quitar ${item.name} del carrito`"
          @click="$emit('remove')"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p v-if="item.variant" class="ci__variant">{{ item.variant }}</p>

      <div class="ci__prices">
        <span class="ci__unit">{{ fmt(safePrice) }} c/u</span>
        <template v-if="discountPct > 0">
          <span class="ci__was">{{ fmt(safeOriginal) }}</span>
          <span class="ci__off">-{{ discountPct }}%</span>
        </template>
      </div>

      <div class="ci__foot">
        <div class="ci__qty" role="group" aria-label="Cantidad">
          <button type="button" aria-label="Reducir cantidad" @click="$emit('decrement')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
          <span aria-live="polite">{{ safeQty }}</span>
          <button
            type="button"
            aria-label="Aumentar cantidad"
            :disabled="atMax"
            @click="$emit('increment')"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <span class="ci__subtotal">{{ fmt(safePrice * safeQty) }}</span>
      </div>

      <!-- Aviso de tope: sin esto el botón "+" simplemente deja de
           responder y parece que la página se rompió. -->
      <p v-if="atMax && safeStock > 0" class="ci__limit">
        Es todo el stock disponible.
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
interface CartItemType {
  id: number | string;
  name: string;
  image?: string;
  emoji?: string;
  variant?: string;
  price: number | string;
  originalPrice?: number | string;
  qty: number | string;
  stock?: number | string;
}

const props = defineProps<{ item: CartItemType }>();

defineEmits<{ increment: []; decrement: []; remove: [] }>();

/* Helpers para nunca tener NaN en el template: los valores vienen de
   localStorage y pueden llegar como cadenas. */
const toNumber = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const safePrice = computed(() => toNumber(props.item.price));
const safeOriginal = computed(() => toNumber(props.item.originalPrice));
const safeStock = computed(() => toNumber(props.item.stock));

const safeQty = computed(() => {
  const n = toNumber(props.item.qty);
  return n > 0 ? Math.floor(n) : 1;
});

/* Mismo tope que aplica el store al incrementar (99 sin control de
   inventario): el botón se desactiva en lugar de no hacer nada. */
const atMax = computed(() => safeQty.value >= (safeStock.value || 99));

const discountPct = computed(() => {
  if (!safeOriginal.value || safeOriginal.value <= safePrice.value) return 0;
  return Math.round((1 - safePrice.value / safeOriginal.value) * 100);
});

function fmt(amount: unknown): string {
  const num = parseFloat(String(amount));
  if (!Number.isFinite(num)) return "S/ 0.00";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(num);
}
</script>

<style scoped>
.ci {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: var(--sp-3);
  padding: var(--sp-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  transition: border-color var(--t-base) var(--ease-smooth);
}

.ci:hover {
  border-color: var(--line);
}

.ci__media {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xs);
  background: var(--surface-media);
  overflow: hidden;
}

.ci__media :deep(img) {
  padding: 4px;
}

.ci__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ci__top {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
}

.ci__name {
  flex: 1;
  min-width: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  line-height: var(--leading-snug);
  color: var(--ink-strong);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ci__remove {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--ink-faint);
  transition:
    color var(--t-fast) var(--ease-smooth),
    background var(--t-fast) var(--ease-smooth);
}

.ci__remove svg {
  width: 13px;
  height: 13px;
}

.ci__remove:hover {
  color: var(--cp-danger);
  background: var(--cp-error-bg);
}

.ci__variant {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
}

.ci__prices {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  flex-wrap: wrap;
}

.ci__unit {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

.ci__was {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
  text-decoration: line-through;
}

.ci__off {
  font-size: 0.625rem;
  font-weight: var(--fw-black);
  color: var(--cp-success);
}

.ci__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.ci__qty {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  overflow: hidden;
}

.ci__qty button {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--ink-strong);
  transition: background var(--t-fast) var(--ease-smooth);
}

.ci__qty button svg {
  width: 12px;
  height: 12px;
}

.ci__qty button:hover:not(:disabled) {
  background: var(--surface-inset);
}

.ci__qty button:disabled {
  color: var(--ink-faint);
  cursor: not-allowed;
}

.ci__qty span {
  min-width: 28px;
  text-align: center;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.ci__subtotal {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.ci__limit {
  margin-top: 4px;
  font-size: 0.625rem;
  font-weight: var(--fw-semibold);
  color: var(--cp-warning);
}
</style>

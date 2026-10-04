<template>
  <div class="ip">
    <!-- ── Identidad ── -->
    <div class="ip__head">
      <NuxtLink
        v-if="producto?.category"
        :to="`/productos?categoria=${producto.category.slug}`"
        class="ip__cat"
      >
        {{ typeLabel }}
      </NuxtLink>

      <h1 class="ip__name">{{ producto?.name }}</h1>

      <p class="ip__stock" :class="`ip__stock--${stockTone}`">
        <span class="ip__stock-dot" aria-hidden="true" />
        {{ detailedStockLabel }}
      </p>
    </div>

    <!-- ── Precio ──
         Lo primero que se mira. El ahorro se dice en soles, no solo en
         porcentaje: "ahorras S/ 40" pesa más que "-18%". -->
    <div class="ip__pricing">
      <div class="ip__price-row">
        <span class="ip__price">{{ formatPrice.format(price) }}</span>
        <template v-if="comparePrice">
          <span class="ip__was">{{ formatPrice.format(comparePrice) }}</span>
          <span class="ip__off">-{{ discountPct }}%</span>
        </template>
      </div>

      <p v-if="comparePrice" class="ip__saving">
        Ahorras {{ formatPrice.format(saving) }}
      </p>
      <p class="ip__tax">Precio final. IGV incluido.</p>
    </div>

    <!-- ── Compra ── -->
    <div class="ip__buy">
      <div class="ip__qty" :class="{ 'is-disabled': isOut }">
        <button
          type="button"
          aria-label="Quitar una unidad"
          :disabled="isOut || cantidad <= 1"
          @click="setCantidad(cantidad - 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M5 12h14" />
          </svg>
        </button>

        <input
          :value="cantidad"
          type="number"
          min="1"
          :max="maxCantidad"
          inputmode="numeric"
          aria-label="Cantidad"
          :disabled="isOut"
          @input="setCantidad(Number(($event.target as HTMLInputElement).value))"
        />

        <button
          type="button"
          aria-label="Agregar una unidad"
          :disabled="isOut || cantidad >= maxCantidad"
          @click="setCantidad(cantidad + 1)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <button
        type="button"
        class="ip__add"
        :disabled="isOut || estoyAgregando"
        @click="manejarAgregar"
      >
        <span v-if="estoyAgregando" class="ip__spinner" aria-hidden="true" />
        {{ isOut ? "Sin stock" : estoyAgregando ? "Agregando…" : "Añadir al carrito" }}
      </button>

      <ClientOnly>
        <button
          type="button"
          class="ip__fav"
          :class="{ 'is-on': isFavorite }"
          :aria-pressed="isFavorite"
          :aria-label="isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          @click="toggleFavorite"
        >
          <svg viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9z" />
          </svg>
        </button>
      </ClientOnly>
    </div>

    <!-- Agotado: la única salida útil es avisar por WhatsApp -->
    <a
      v-if="isOut"
      :href="waLink(`Hola, ¿cuándo vuelve a haber stock de: ${producto?.name}?`)"
      target="_blank"
      rel="noopener noreferrer"
      class="ip__restock"
    >
      <LandingWaIcon :size="15" />
      Avísame cuando vuelva a haber stock
    </a>

    <a
      v-else
      :href="waLink(`Hola, quiero consultar por: ${producto?.name}`)"
      target="_blank"
      rel="noopener noreferrer"
      class="ip__ask"
    >
      <LandingWaIcon :size="15" />
      ¿Dudas de compatibilidad? Consúltanos
    </a>

    <!-- ── Servicio ── -->
    <ul class="ip__perks">
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M2 7h11v10H2zM13 10h4l4 4v3h-8z" /><circle cx="6" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
        </svg>
        <span><strong>Envío a todo el Perú</strong> Lima y provincias, con seguimiento.</span>
      </li>
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 2.5 4 6v6c0 4.6 3.2 8.5 8 9.5 4.8-1 8-4.9 8-9.5V6z" /><path d="m9 12 2 2 4-4" />
        </svg>
        <span><strong>Garantía</strong> Cambio si la pieza sale fallada.</span>
      </li>
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="7" y="2.5" width="10" height="19" rx="2" /><path d="M11 18.5h2" />
        </svg>
        <span><strong>Compatibilidad</strong> Confirmamos tu modelo antes de enviar.</span>
      </li>
    </ul>

    <!-- ── Descripción ── -->
    <section v-if="producto?.description" class="ip__desc">
      <h2 class="ip__desc-title">Descripción</h2>
      <p class="ip__desc-text">{{ producto.description }}</p>
    </section>

    <!-- ── Ficha técnica ──
         Tabla, no párrafo: son datos que se consultan, no que se leen. -->
    <section class="ip__specs">
      <h2 class="ip__desc-title">Detalle</h2>
      <dl class="ip__specs-list">
        <div v-if="producto?.category">
          <dt>Categoría</dt>
          <dd>{{ producto.category.name }}</dd>
        </div>
        <div v-if="producto?.subcategory">
          <dt>Tipo</dt>
          <dd>{{ producto.subcategory.name }}</dd>
        </div>
        <div>
          <dt>Código</dt>
          <dd class="ip__mono">{{ producto?.slug ?? "—" }}</dd>
        </div>
        <div>
          <dt>Disponibilidad</dt>
          <dd>{{ detailedStockLabel }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useFavoritesStore } from "~/stores/favorites";
import { useProductDisplay } from "~/composables/useProductDisplay";

const props = defineProps<{
  producto: any;
  estoyAgregando?: boolean;
}>();

const emit = defineEmits<{ agregarAlCarrito: [cantidad: number] }>();

const formatPrice = useFormatPrice();
const favorites = useFavoritesStore();
const toast = useAppToast();
const { waLink } = useWhatsapp();

const {
  image,
  typeLabel,
  price,
  comparePrice,
  discountPct,
  saving,
  tracked,
  stock,
  isOut,
  stockTone,
} = useProductDisplay(() => props.producto);

/* "En stock" a secas no ayuda a decidir: saber que quedan 3 unidades
   sí. Y si el producto no controla inventario, no se inventa una cifra. */
const detailedStockLabel = computed(() => {
  if (!tracked.value) return "Disponible";
  if (stock.value <= 0) return "Agotado";
  if (stock.value <= 5)
    return `Quedan ${stock.value} ${stock.value === 1 ? "unidad" : "unidades"}`;
  return "En stock";
});

/* Sin control de inventario no hay tope real; 99 evita que el campo
   acepte cifras absurdas. */
const maxCantidad = computed(() =>
  tracked.value ? Math.max(1, stock.value) : 99,
);

const cantidad = ref(1);

function setCantidad(value: number) {
  const n = Number.isFinite(value) ? Math.floor(value) : 1;
  cantidad.value = Math.min(Math.max(1, n), maxCantidad.value);
}

/* Si el tope baja (otro producto, stock actualizado) la cantidad se
   ajusta sola en vez de enviar más de lo que hay. */
watch(maxCantidad, (max) => {
  if (cantidad.value > max) cantidad.value = Math.max(1, max);
});

watch(
  () => props.producto?.id,
  () => {
    cantidad.value = 1;
  },
);

const isFavorite = computed(() =>
  props.producto ? favorites.has(props.producto.id) : false,
);

function toggleFavorite() {
  if (!props.producto) return;
  const added = favorites.toggle({
    id: props.producto.id,
    name: props.producto.name,
    slug: props.producto.slug,
    price: props.producto.price,
    comparePrice: props.producto.comparePrice ?? null,
    image: image.value,
  });
  toast.add({
    title: added ? "Guardado en favoritos" : "Quitado de favoritos",
    description: props.producto.name,
    color: added ? "success" : "neutral",
  });
}

function manejarAgregar() {
  if (isOut.value) return;
  emit("agregarAlCarrito", cantidad.value);
  cantidad.value = 1;
}
</script>

<style scoped>
.ip {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

/* ── Identidad ── */
.ip__head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ip__cat {
  align-self: flex-start;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.ip__cat:hover {
  color: var(--accent);
}

.ip__name {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  line-height: 1.14;
  color: var(--ink-strong);
}

.ip__stock {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.ip__stock-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.ip__stock--ok {
  color: var(--cp-success);
}
.ip__stock--low {
  color: var(--cp-warning);
}
.ip__stock--none {
  color: var(--ink-faint);
}

/* ── Precio ── */
.ip__pricing {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-sunken);
}

.ip__price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--sp-3);
}

.ip__price {
  font-size: clamp(1.75rem, 1.4rem + 1.4vw, 2.25rem);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.ip__was {
  font-size: var(--fs-sm);
  color: var(--ink-faint);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

.ip__off {
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  background: var(--cp-navy-900);
  color: #fff;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-wide);
}

.ip__saving {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--cp-success);
}

.ip__tax {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

/* ── Compra ── */
.ip__buy {
  display: flex;
  align-items: stretch;
  gap: var(--sp-2);
}

.ip__qty {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  overflow: hidden;
}

.ip__qty.is-disabled {
  opacity: 0.5;
}

.ip__qty button {
  width: 40px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--ink-strong);
  transition: background var(--t-fast) var(--ease-smooth);
}

.ip__qty button svg {
  width: 15px;
  height: 15px;
}

.ip__qty button:hover:not(:disabled) {
  background: var(--surface-inset);
}

.ip__qty button:disabled {
  color: var(--ink-faint);
  cursor: not-allowed;
}

.ip__qty input {
  width: 46px;
  height: 48px;
  border: 0;
  border-inline: 1px solid var(--line-soft);
  border-radius: 0;
  background: transparent;
  text-align: center;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  -moz-appearance: textfield;
}

.ip__qty input:focus {
  outline: none;
  box-shadow: none;
}

.ip__qty input::-webkit-outer-spin-button,
.ip__qty input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.ip__add {
  flex: 1;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  border: 1px solid var(--action-bg);
  border-radius: var(--radius-sm);
  background: var(--action-bg);
  color: var(--action-ink);
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth);
}

.ip__add:hover:not(:disabled) {
  background: var(--action-bg-hover);
  border-color: var(--action-bg-hover);
}

.ip__add:disabled {
  background: var(--surface-inset);
  border-color: var(--line-soft);
  color: var(--ink-faint);
  cursor: not-allowed;
}

.ip__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: ip-spin 0.7s linear infinite;
}

@keyframes ip-spin {
  to {
    transform: rotate(360deg);
  }
}

.ip__fav {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-muted);
  transition:
    color var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.ip__fav svg {
  width: 19px;
  height: 19px;
}

.ip__fav:hover {
  color: var(--ink-strong);
  border-color: var(--line-strong);
}

.ip__fav.is-on {
  color: var(--accent-strong);
  border-color: var(--accent-line);
  background: var(--accent-quiet);
}

/* ── Enlaces de contacto ── */
.ip__ask,
.ip__restock {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  height: 44px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  color: var(--ink-body);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.ip__ask:hover,
.ip__restock:hover {
  border-color: #25d366;
  color: #128c46;
  background: rgba(37, 211, 102, 0.06);
}

.ip__restock {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

/* ── Servicio ── */
.ip__perks {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0;
  padding: var(--sp-4) 0;
  list-style: none;
  border-block: 1px solid var(--line-soft);
}

.ip__perks li {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
}

.ip__perks svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--accent-strong);
}

.ip__perks span {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
}

.ip__perks strong {
  display: block;
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

/* ── Descripción y ficha ── */
.ip__desc-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: var(--sp-3);
}

.ip__desc-text {
  font-size: var(--fs-sm);
  line-height: var(--leading-relaxed);
  color: var(--ink-body);
  white-space: pre-line;
}

.ip__specs-list {
  margin: 0;
  display: flex;
  flex-direction: column;
}

.ip__specs-list > div {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr);
  gap: var(--sp-3);
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line-soft);
}

.ip__specs-list > div:first-child {
  border-top: 1px solid var(--line-soft);
}

.ip__specs-list dt {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}

.ip__specs-list dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-strong);
}

.ip__mono {
  font-family: var(--font-mono);
  font-size: var(--fs-2xs) !important;
  color: var(--ink-muted) !important;
  word-break: break-all;
}

@media (max-width: 560px) {
  .ip__buy {
    flex-wrap: wrap;
  }

  .ip__add {
    order: 3;
    flex-basis: 100%;
  }

  .ip__fav {
    margin-left: auto;
  }

  .ip__specs-list > div {
    grid-template-columns: 110px minmax(0, 1fr);
  }
}
</style>

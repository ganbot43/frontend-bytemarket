<template>
  <article v-if="product" class="pc" :class="{ 'pc--out': isOut }">
    <!-- ── Imagen ──
         contain sobre superficie tenue: recortar una pantalla o una
         batería esconde justo la pieza que el comprador viene a mirar. -->
    <div class="pc__media">
      <NuxtLink :to="href" class="pc__media-link" :aria-label="product.name">
        <SharedImagen :src="image" :alt="product.name" fit="contain" class="pc__img" />
      </NuxtLink>

      <!-- Marcas: planas, una sola a la vez. El descuento manda sobre
           "nuevo" porque es lo que decide la compra. -->
      <div class="pc__tags">
        <span v-if="hasDiscount" class="pc__tag pc__tag--sale">-{{ discountPct }}%</span>
        <span v-else-if="product.nuevoLanzamiento" class="pc__tag pc__tag--new">Nuevo</span>
        <span v-else-if="product.isFeatured" class="pc__tag pc__tag--quiet">Destacado</span>
      </div>

      <!-- Favorito — esquina opuesta a la etiqueta para que nunca se pisen -->
      <ClientOnly>
        <button
          type="button"
          class="pc__fav"
          :class="{ 'is-on': isFavorite }"
          :aria-pressed="isFavorite"
          :aria-label="isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          :title="isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'"
          @click.stop.prevent="toggleFavorite"
        >
          <svg viewBox="0 0 24 24" :fill="isFavorite ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8">
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9z" />
          </svg>
        </button>
      </ClientOnly>

      <span v-if="isOut" class="pc__veil">Sin stock</span>
    </div>

    <!-- ── Datos ── -->
    <div class="pc__body">
      <p v-if="typeLabel" class="pc__type">{{ typeLabel }}</p>

      <h3 class="pc__name">
        <NuxtLink :to="href" class="pc__name-link">{{ product.name }}</NuxtLink>
      </h3>

      <div class="pc__prices">
        <span class="pc__price">{{ formatPrice.format(price) }}</span>
        <span v-if="comparePrice" class="pc__was">{{ formatPrice.format(comparePrice) }}</span>
      </div>

      <p class="pc__stock" :class="`pc__stock--${stockTone}`">
        <span class="pc__stock-dot" aria-hidden="true" />
        {{ stockLabel }}
      </p>
    </div>

    <!-- ── Acción ── -->
    <div class="pc__foot">
      <button
        type="button"
        class="pc__buy"
        :disabled="adding || isOut"
        @click.stop.prevent="addToCart"
      >
        <span v-if="adding" class="pc__spinner" aria-hidden="true" />
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M2 3h2.2l2.3 12.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H5.3" />
        </svg>
        {{ isOut ? "No disponible" : adding ? "Agregando…" : "Añadir" }}
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useCartStore } from "~/stores/cart";
import { useFavoritesStore } from "~/stores/favorites";
import { useFormatPrice } from "~/composables/useFormatPrice";
import { useProductDisplay, type DisplayProduct } from "~/composables/useProductDisplay";

const props = defineProps<{ product?: DisplayProduct }>();

const cartStore = useCartStore();
const favorites = useFavoritesStore();
/* Con sesión, el favorito además se guarda en la cuenta y sobrevive
   al cambio de dispositivo. Sin ella sigue siendo solo del navegador. */
const { loggedIn } = useUserSession();
const toast = useAppToast();
const formatPrice = useFormatPrice();
const adding = ref(false);

const {
  image,
  typeLabel,
  price,
  comparePrice,
  hasDiscount,
  discountPct,
  isOut,
  stockLabel,
  stockTone,
} = useProductDisplay(() => props.product);

const href = computed(() => `/productos/${props.product?.slug ?? ""}`);

const isFavorite = computed(() =>
  props.product ? favorites.has(props.product.id) : false,
);

function toggleFavorite() {
  if (!props.product) return;
  const added = favorites.toggleSincronizado({
    id: props.product.id,
    name: props.product.name,
    slug: props.product.slug,
    price: props.product.price,
    comparePrice: props.product.comparePrice ?? null,
    image: image.value,
  }, loggedIn.value);
  toast.add({
    title: added ? "Guardado en favoritos" : "Quitado de favoritos",
    description: props.product.name,
    color: added ? "success" : "neutral",
  });
}

async function addToCart() {
  if (isOut.value || !props.product) return;
  adding.value = true;
  cartStore.add({
    id: props.product.id,
    name: props.product.name,
    price: props.product.price,
    originalPrice: comparePrice.value ?? undefined,
    quantity: 1,
    image: image.value ?? undefined,
    stock: props.product.trackStock === false ? undefined : props.product.stock,
  });
  toast.add({
    title: "Agregado al carrito",
    description: props.product.name,
    color: "success",
  });
  await new Promise((r) => setTimeout(r, 420));
  adding.value = false;
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   TARJETA DE PRODUCTO — BYTEMARKET

   Criterio: una tienda de repuestos se juzga por datos,
   no por decoración. La foto se ve completa, el precio
   pesa, y la disponibilidad se dice siempre.

   La tarjeta no se levanta al pasar el cursor: en una
   rejilla de veinte, veinte tarjetas flotando es ruido.
   Se marca con el filete y una sombra corta.
═══════════════════════════════════════════════════ */

.pc {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--surface-raised);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  overflow: hidden;
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.pc:hover {
  border-color: var(--line);
  box-shadow: var(--shadow-md);
}

.pc--out {
  opacity: 0.78;
}

/* ── Imagen ── */
.pc__media {
  position: relative;
  aspect-ratio: 1 / 1;
  background: var(--surface-media);
  border-bottom: 1px solid var(--line-soft);
}

.pc__media-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: var(--sp-5);
}

.pc__img {
  width: 100%;
  height: 100%;
  transition: transform var(--t-slow) var(--ease-smooth);
}

.pc:hover .pc__img {
  transform: scale(1.035);
}

/* ── Marcas ── */
.pc__tags {
  position: absolute;
  top: var(--sp-3);
  left: var(--sp-3);
  display: flex;
  gap: var(--sp-1);
  pointer-events: none;
}

.pc__tag {
  padding: 3px 8px;
  border-radius: var(--radius-xs);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: 1.55;
}

.pc__tag--sale {
  background: var(--cp-navy-900);
  color: #fff;
}

.pc__tag--new {
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
}

.pc__tag--quiet {
  background: var(--surface-inset);
  color: var(--ink-muted);
}

/* ── Favorito ── */
.pc__fav {
  position: absolute;
  top: var(--sp-2);
  right: var(--sp-2);
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: var(--surface-raised);
  color: var(--ink-faint);
  transition:
    color var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.pc__fav svg {
  width: 16px;
  height: 16px;
}

.pc__fav:hover {
  color: var(--cp-navy-900);
  border-color: var(--line);
}

.pc__fav.is-on {
  color: var(--cp-cyan-500);
  border-color: var(--accent-line);
  background: var(--accent-quiet);
}

/* ── Velo de agotado ── */
.pc__veil {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.68);
  color: var(--ink-muted);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  pointer-events: none;
}

/* ── Datos ── */
.pc__body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
}

/* Etiqueta técnica: minúscula, en versalitas, sin recuadro.
   Informa sin competir con el nombre. */
.pc__type {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.pc__name {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  min-height: 2.4em;
}

.pc__name-link {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: inherit;
}

.pc__name-link::after {
  /* El área clicable cubre la tarjeta; los botones se elevan por encima. */
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
}

.pc:hover .pc__name-link {
  color: var(--accent-strong);
}

/* ── Precio ── */
.pc__prices {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  flex-wrap: wrap;
  margin-top: var(--sp-1);
}

.pc__price {
  font-size: 1.25rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}

.pc__was {
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  text-decoration: line-through;
  font-variant-numeric: tabular-nums;
}

/* ── Disponibilidad ── */
.pc__stock {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.pc__stock-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.pc__stock--ok {
  color: var(--cp-success);
}
.pc__stock--low {
  color: var(--cp-warning);
}
.pc__stock--none {
  color: var(--ink-faint);
}

/* ── Acción ── */
.pc__foot {
  position: relative;
  z-index: 1;
  padding: 0 var(--sp-4) var(--sp-4);
}

.pc__buy {
  width: 100%;
  height: 40px;
  border: 1px solid var(--action-bg);
  border-radius: var(--radius-sm);
  background: var(--action-bg);
  color: var(--action-ink);
  font-family: inherit;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.pc__buy svg {
  width: 15px;
  height: 15px;
}

.pc__buy:hover:not(:disabled) {
  background: var(--action-bg-hover);
  border-color: var(--action-bg-hover);
}

.pc__buy:disabled {
  background: var(--surface-inset);
  border-color: var(--line-soft);
  color: var(--ink-faint);
  cursor: not-allowed;
}

.pc__spinner {
  width: 13px;
  height: 13px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: pc-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes pc-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Móvil — la tarjeta se compacta, no se recorta ── */
@media (max-width: 640px) {
  .pc__media-link {
    padding: var(--sp-3);
  }

  .pc__body {
    padding: var(--sp-3) var(--sp-3) var(--sp-2);
  }

  .pc__foot {
    padding: 0 var(--sp-3) var(--sp-3);
  }

  .pc__price {
    font-size: 1.0625rem;
  }

  .pc__buy {
    height: 36px;
  }
}
</style>

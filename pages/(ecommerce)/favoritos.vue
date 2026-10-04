<template>
  <div class="fav">
    <div class="cp-container">
      <nav class="fav__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="fav__crumb-now">Favoritos</span>
      </nav>

      <header class="fav__head">
        <div class="fav__head-text">
          <h1 class="fav__title">Favoritos</h1>
          <p class="fav__sub">
            <ClientOnly>
              <template v-if="favorites.count">
                {{ favorites.count }} {{ favorites.count === 1 ? "pieza guardada" : "piezas guardadas" }}
                en este navegador.
              </template>
              <template v-else>Lo que guardes se queda aquí para cuando vuelvas.</template>
              <template #fallback>Cargando tu lista…</template>
            </ClientOnly>
          </p>
        </div>

        <ClientOnly>
          <button
            v-if="favorites.count"
            type="button"
            class="btn btn-ghost btn-sm"
            @click="clearAll"
          >
            Vaciar lista
          </button>
        </ClientOnly>
      </header>

      <ClientOnly>
        <!-- ── Con piezas guardadas ── -->
        <div v-if="favorites.count" class="fav__grid">
          <article v-for="item in favorites.sorted" :key="item.id" class="fav__card">
            <NuxtLink :to="`/productos/${item.slug}`" class="fav__media">
              <SharedImagen :src="item.image" :alt="item.name" fit="contain" />
            </NuxtLink>

            <div class="fav__body">
              <h2 class="fav__name">
                <NuxtLink :to="`/productos/${item.slug}`">{{ item.name }}</NuxtLink>
              </h2>

              <div class="fav__prices">
                <span class="fav__price">{{ formatPrice.format(item.price) }}</span>
                <span v-if="item.comparePrice && item.comparePrice > item.price" class="fav__was">
                  {{ formatPrice.format(item.comparePrice) }}
                </span>
              </div>

              <!-- El precio guardado es una foto del momento en que se
                   añadió; la ficha manda. Se avisa en vez de callarlo. -->
              <p class="fav__note">Confirma el precio en la ficha antes de comprar.</p>
            </div>

            <div class="fav__actions">
              <button type="button" class="btn btn-primary btn-sm fav__add" @click="addToCart(item)">
                Añadir al carrito
              </button>
              <button
                type="button"
                class="fav__remove"
                :aria-label="`Quitar ${item.name} de favoritos`"
                @click="favorites.remove(item.id)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </article>
        </div>

        <!-- ── Lista vacía ── -->
        <div v-else class="fav__empty">
          <span class="fav__empty-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9z" />
            </svg>
          </span>
          <h2 class="fav__empty-title">Todavía no has guardado nada</h2>
          <p class="fav__empty-text">
            Toca el corazón en cualquier producto para tenerlo a mano y comparar
            antes de decidir.
          </p>
          <NuxtLink to="/productos" class="btn btn-primary">Explorar el catálogo</NuxtLink>
        </div>

        <template #fallback>
          <div class="fav__grid">
            <div v-for="i in 4" :key="`sk-${i}`" class="cp-skeleton fav__skeleton" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCartStore } from "~/stores/cart";
import { useFavoritesStore, type FavoriteItem } from "~/stores/favorites";
import { useFormatPrice } from "~/composables/useFormatPrice";

definePageMeta({ layout: "default" });

const favorites = useFavoritesStore();
const cartStore = useCartStore();
const toast = useAppToast();
const formatPrice = useFormatPrice();

/* Lista personal: no aporta nada a los buscadores y su contenido varía
   por visitante. */
useSeoMeta({
  title: "Favoritos — ByteMarket",
  description: "Las piezas que guardaste para revisar más tarde.",
  robots: "noindex, nofollow",
});

function addToCart(item: FavoriteItem) {
  cartStore.add({
    id: item.id,
    name: item.name,
    price: item.price,
    originalPrice: item.comparePrice ?? undefined,
    quantity: 1,
    image: item.image ?? undefined,
  });
  toast.add({
    title: "Agregado al carrito",
    description: item.name,
    color: "success",
  });
}

function clearAll() {
  const total = favorites.count;
  favorites.clear();
  toast.add({
    title: "Lista vacía",
    description: `Se quitaron ${total} ${total === 1 ? "pieza" : "piezas"}.`,
    color: "neutral",
  });
}
</script>

<style scoped>
.fav {
  padding-block: var(--sp-6) var(--section-y);
}

.fav__crumb {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-5);
}

.fav__crumb a:hover {
  color: var(--accent-strong);
}

.fav__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.fav__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4);
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-6);
}

.fav__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.fav__sub {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  margin-top: 4px;
}

/* ── Rejilla ── */
.fav__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--sp-4);
}

.fav__skeleton {
  height: 132px;
  border-radius: var(--radius);
}

/* Tarjeta horizontal: una lista de deseos se repasa leyendo nombres,
   no mirando fotos grandes. */
.fav__card {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  gap: var(--sp-4);
  padding: var(--sp-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  transition: border-color var(--t-base) var(--ease-smooth);
}

.fav__card:hover {
  border-color: var(--line);
}

.fav__media {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1 / 1;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-media);
  overflow: hidden;
}

.fav__media :deep(img) {
  padding: var(--sp-2);
}

.fav__body {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.fav__name {
  font-size: var(--fs-sm);
  font-weight: var(--fw-semibold);
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fav__name a:hover {
  color: var(--accent-strong);
}

.fav__prices {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
}

.fav__price {
  font-size: 1.125rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
}

.fav__was {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
  text-decoration: line-through;
}

.fav__note {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

.fav__actions {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

.fav__add {
  flex: 1;
}

.fav__remove {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-muted);
  transition:
    color var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth);
}

.fav__remove svg {
  width: 15px;
  height: 15px;
}

.fav__remove:hover {
  color: var(--cp-danger);
  border-color: var(--cp-danger);
}

/* ── Vacío ── */
.fav__empty {
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

.fav__empty-icon {
  color: var(--ink-faint);
}

.fav__empty-icon svg {
  width: 44px;
  height: 44px;
}

.fav__empty-title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.fav__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 44ch;
  margin-bottom: var(--sp-3);
}

@media (max-width: 560px) {
  .fav__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .fav__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .fav__card {
    grid-template-columns: 84px minmax(0, 1fr);
  }
}
</style>

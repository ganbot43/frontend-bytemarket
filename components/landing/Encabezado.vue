<template>
  <header class="hd" :class="{ 'hd--stuck': stuck }">
    <!-- ═══ FRANJA 1 — servicio ═══
         La tienda promete tres cosas antes de que el usuario mire nada:
         a dónde llega, qué garantía hay y por dónde preguntar. -->
    <div class="hd__top cp-dark">
      <div class="hd__top-inner">
        <ul class="hd__promises">
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M2 7h11v10H2zM13 10h4l4 4v3h-8z" />
              <circle cx="6" cy="17" r="2" />
              <circle cx="17" cy="17" r="2" />
            </svg>
            Envíos a todo el Perú
          </li>
          <li>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2.5 4 6v6c0 4.6 3.2 8.5 8 9.5 4.8-1 8-4.9 8-9.5V6z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Garantía en cada repuesto
          </li>
          <li class="hd__promises-wide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="7" y="2.5" width="10" height="19" rx="2" />
              <path d="M11 18.5h2" />
            </svg>
            Asesoría por modelo de equipo
          </li>
        </ul>

        <div class="hd__top-links">
          <a
            :href="waLink('Hola ByteMarket, quisiera hacer una consulta')"
            target="_blank"
            rel="noopener noreferrer"
            class="hd__top-wa"
          >
            <LandingWaIcon :size="13" />
            {{ waDisplay }}
          </a>
          <NuxtLink to="/mi-cuenta/pedidos">Seguir mi pedido</NuxtLink>
        </div>
      </div>
    </div>

    <!-- ═══ FRANJA 2 — logo · buscador · cuenta ═══ -->
    <div class="hd__main">
      <div class="hd__main-inner">
        <button
          type="button"
          class="hd__burger"
          :class="{ 'is-open': drawerOpen }"
          :aria-expanded="drawerOpen"
          aria-label="Abrir menú"
          @click="drawerOpen = !drawerOpen"
        >
          <span /><span /><span />
        </button>

        <!-- Un solo logo, el que se configura en el panel. Antes eran
             dos imágenes y la del nombre estaba escrita a mano: al
             cambiar el logo desde Configuración solo cambiaba la mitad. -->
        <NuxtLink to="/" class="hd__logo" :aria-label="`${nombre} — Inicio`">
          <img :src="logo" :alt="nombre" class="hd__logo-img" />
        </NuxtLink>

        <!-- El buscador ocupa el centro: en una tienda de repuestos la
             gente llega con un modelo en la cabeza, no a explorar. -->
        <div class="hd__search">
          <EcommerceBuscador />
        </div>

        <div class="hd__actions">
          <ClientOnly>
            <NuxtLink :to="accountHref" class="hd__action" :aria-label="accountLabel">
              <span class="hd__action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="8" r="3.6" />
                  <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                </svg>
              </span>
              <span class="hd__action-text">
                <small>{{ loggedIn ? "Hola," : "Ingresa" }}</small>
                <strong>{{ accountLabel }}</strong>
              </span>
            </NuxtLink>

            <template #fallback>
              <span class="hd__action">
                <span class="hd__action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="3.6" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
                  </svg>
                </span>
                <span class="hd__action-text"><small>Ingresa</small><strong>Mi cuenta</strong></span>
              </span>
            </template>
          </ClientOnly>

          <ClientOnly>
            <NuxtLink to="/favoritos" class="hd__action hd__action--icon" aria-label="Favoritos">
              <span class="hd__action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9z" />
                </svg>
                <span v-if="favorites.count" class="hd__pip">{{ favorites.count }}</span>
              </span>
              <span class="hd__action-text">
                <small>Guardados</small>
                <strong>Favoritos</strong>
              </span>
            </NuxtLink>
          </ClientOnly>

          <ClientOnly>
            <button type="button" class="hd__cart" @click="cartStore.open()" aria-label="Abrir carrito">
              <span class="hd__action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="18" cy="20" r="1.4" />
                  <path d="M2 3h2.2l2.3 12.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.8-1.4L21 7H5.3" />
                </svg>
                <span v-if="cartStore.itemCount" class="hd__pip hd__pip--cart">{{ cartStore.itemCount }}</span>
              </span>
              <span class="hd__action-text">
                <small>Mi carrito</small>
                <strong>{{ cartTotalLabel }}</strong>
              </span>
            </button>
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- ═══ FRANJA 3 — navegación de catálogo ═══ -->
    <nav class="hd__cats" aria-label="Categorías">
      <div class="hd__cats-inner">
        <div
          ref="megaRef"
          class="hd__all"
          @mouseenter="openMega"
          @mouseleave="scheduleClose"
        >
          <button
            type="button"
            class="hd__all-btn"
            :class="{ 'is-open': megaOpen }"
            :aria-expanded="megaOpen"
            @click="megaOpen ? closeMega() : openMega()"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Todas las categorías
          </button>

          <Transition name="hd-mega">
            <div v-if="megaOpen" class="hd__mega">
              <div class="hd__mega-grid">
                <!-- Columna de categorías -->
                <ul class="hd__mega-cats">
                  <li v-for="cat in categories" :key="cat.id">
                    <NuxtLink
                      :to="`/productos?categoria=${cat.slug}`"
                      class="hd__mega-cat"
                      :class="{ 'is-active': hoverCatId === cat.id }"
                      @mouseenter="hoverCatId = cat.id"
                      @click="closeMega"
                    >
                      <span>{{ cat.name }}</span>
                      <small v-if="cat.productCount">{{ cat.productCount }}</small>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </NuxtLink>
                  </li>
                  <li v-if="!categories.length" class="hd__mega-empty">Cargando categorías…</li>
                </ul>

                <!-- Panel de subcategorías de la categoría señalada -->
                <div class="hd__mega-panel">
                  <div class="hd__mega-head">
                    <p class="hd__mega-title">{{ hoverCat?.name ?? "Catálogo" }}</p>
                    <NuxtLink
                      v-if="hoverCat"
                      :to="`/productos?categoria=${hoverCat.slug}`"
                      class="hd__mega-all"
                      @click="closeMega"
                    >
                      Ver todo
                    </NuxtLink>
                  </div>

                  <ul v-if="hoverSubs.length" class="hd__mega-subs">
                    <li v-for="sub in hoverSubs" :key="sub.id">
                      <NuxtLink
                        :to="`/productos?categoria=${hoverCat?.slug}&subcategoria=${sub.slug}`"
                        class="hd__mega-sub"
                        @click="closeMega"
                      >
                        {{ sub.name }}
                        <small v-if="sub.productCount">{{ sub.productCount }}</small>
                      </NuxtLink>
                    </li>
                  </ul>

                  <p v-else class="hd__mega-note">
                    Esta categoría no tiene subdivisiones. Entra a “Ver todo” para
                    revisarla completa.
                  </p>

                  <NuxtLink to="/productos?nuevoLanzamiento=1" class="hd__mega-promo" @click="closeMega">
                    <span class="hd__mega-promo-tag">Novedades</span>
                    <span class="hd__mega-promo-text">Lo último que entró al almacén</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </NuxtLink>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Accesos rápidos: las categorías con más piezas primero -->
        <ul class="hd__quick">
          <li v-for="cat in quickCategories" :key="cat.id">
            <NuxtLink :to="`/productos?categoria=${cat.slug}`" class="hd__quick-link">
              {{ cat.name }}
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/productos?nuevoLanzamiento=1" class="hd__quick-link">Novedades</NuxtLink>
          </li>
          <li>
            <NuxtLink to="/productos" class="hd__quick-link">Todo el catálogo</NuxtLink>
          </li>
        </ul>

        <NuxtLink to="/sobre-nosotros" class="hd__cats-aside">Sobre nosotros</NuxtLink>
      </div>
    </nav>

    <!-- ═══ Buscador móvil — vive fuera del cajón para estar siempre a mano ═══ -->
    <div class="hd__search-mobile">
      <EcommerceBuscador placeholder="Buscar repuesto o modelo…" />
    </div>

    <!-- ═══ Cajón móvil ═══ -->
    <Transition name="hd-fade">
      <div v-if="drawerOpen" class="hd__scrim" @click="drawerOpen = false" />
    </Transition>

    <Transition name="hd-slide">
      <aside v-if="drawerOpen" class="hd__drawer" aria-label="Menú">
        <div class="hd__drawer-head">
          <span class="hd__drawer-title">Categorías</span>
          <button type="button" class="hd__drawer-close" aria-label="Cerrar menú" @click="drawerOpen = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="hd__drawer-body">
          <NuxtLink to="/productos" class="hd__drawer-link" @click="drawerOpen = false">
            Todo el catálogo
          </NuxtLink>
          <NuxtLink to="/productos?nuevoLanzamiento=1" class="hd__drawer-link" @click="drawerOpen = false">
            Novedades
          </NuxtLink>

          <div v-for="cat in categories" :key="cat.id" class="hd__drawer-group">
            <button
              type="button"
              class="hd__drawer-toggle"
              :class="{ 'is-open': openGroupId === cat.id }"
              @click="openGroupId = openGroupId === cat.id ? null : cat.id"
            >
              {{ cat.name }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            <div v-if="openGroupId === cat.id" class="hd__drawer-subs">
              <NuxtLink
                :to="`/productos?categoria=${cat.slug}`"
                class="hd__drawer-sub"
                @click="drawerOpen = false"
              >
                Ver toda la categoría
              </NuxtLink>
              <NuxtLink
                v-for="sub in subsFor(cat.id)"
                :key="sub.id"
                :to="`/productos?categoria=${cat.slug}&subcategoria=${sub.slug}`"
                class="hd__drawer-sub"
                @click="drawerOpen = false"
              >
                {{ sub.name }}
              </NuxtLink>
            </div>
          </div>

          <hr class="hd__drawer-rule" />

          <NuxtLink to="/favoritos" class="hd__drawer-link" @click="drawerOpen = false">Favoritos</NuxtLink>
          <NuxtLink :to="accountHref" class="hd__drawer-link" @click="drawerOpen = false">{{ accountLabel }}</NuxtLink>
          <NuxtLink to="/mi-cuenta/pedidos" class="hd__drawer-link" @click="drawerOpen = false">Seguir mi pedido</NuxtLink>
          <NuxtLink to="/sobre-nosotros" class="hd__drawer-link" @click="drawerOpen = false">Sobre nosotros</NuxtLink>

          <a
            :href="waLink('Hola ByteMarket, quisiera hacer una consulta')"
            target="_blank"
            rel="noopener noreferrer"
            class="hd__drawer-wa"
            @click="drawerOpen = false"
          >
            <LandingWaIcon :size="16" />
            Escribir por WhatsApp
          </a>
        </nav>
      </aside>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { useCartStore } from "~/stores/cart";
import { useFavoritesStore } from "~/stores/favorites";
import { useFormatPrice } from "~/composables/useFormatPrice";

interface Subcategory {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  productCount?: number;
}
interface Category {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
}

const route = useRoute();
const { loggedIn, user } = useUserSession();
const cartStore = useCartStore();
const favorites = useFavoritesStore();
const formatPrice = useFormatPrice();
const businessState = useBusinessConfig();
const { logo, nombre } = useLogo();
const { waLink, WA_NUMBER } = useWhatsapp();

const stuck = ref(false);
const drawerOpen = ref(false);
const openGroupId = ref<number | null>(null);

const cartTotalLabel = computed(() => formatPrice.format(cartStore.total));

const accountHref = computed(() => {
  if (!loggedIn.value) return "/login";
  return user.value?.role === "admin" ? "/admin" : "/mi-cuenta";
});

const accountLabel = computed(() => {
  if (!loggedIn.value) return "Mi cuenta";
  if (user.value?.role === "admin") return "Panel admin";
  /* Solo el nombre de pila: el apellido completo desborda la cabecera. */
  const name = String((user.value as any)?.name ?? "").trim();
  return name ? name.split(" ")[0] : "Mi cuenta";
});

const waDisplay = computed(() => {
  const raw = String(businessState.value?.whatsapp || WA_NUMBER).replace(/\D/g, "");
  const local = raw.startsWith("51") ? raw.slice(2) : raw;
  return local.length === 9
    ? `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
    : `+${raw}`;
});

/* ── Catálogo ──
   Se pide una sola vez y alimenta la barra, el mega menú y el cajón.
   useState comparte el resultado entre navegaciones sin volver a pedirlo. */
const catalog = useState<{ categories: Category[]; subcategories: Subcategory[] }>(
  "header-catalog",
  () => ({ categories: [], subcategories: [] }),
);

const categories = computed(() => catalog.value.categories);

/* Los seis con más piezas: una barra con quince categorías deja de ser
   navegación y pasa a ser una lista. */
const quickCategories = computed(() =>
  [...categories.value]
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 6),
);

const subsFor = (categoryId: number) =>
  catalog.value.subcategories.filter((s) => s.categoryId === categoryId);

async function loadCatalog() {
  if (catalog.value.categories.length) return;
  try {
    const res = await $fetch<{
      data: Array<Category & { subcategories?: Subcategory[] }>;
    }>("/api/categories", { query: { active: true } });

    catalog.value = {
      categories: res.data.map(({ subcategories: _s, ...c }) => c),
      subcategories: res.data.flatMap((c) =>
        (c.subcategories ?? []).map((s) => ({ ...s, categoryId: c.id })),
      ),
    };
  } catch {
    /* Sin catálogo la barra queda con "Todo el catálogo", que sigue
       siendo navegable: no vale la pena romper la cabecera por esto. */
  }
}

/* ── Mega menú ── */
const megaRef = ref<HTMLElement | null>(null);
const megaOpen = ref(false);
const hoverCatId = ref<number | null>(null);
let closeTimer: ReturnType<typeof setTimeout> | null = null;

const hoverCat = computed(
  () => categories.value.find((c) => c.id === hoverCatId.value) ?? categories.value[0] ?? null,
);
const hoverSubs = computed(() => (hoverCat.value ? subsFor(hoverCat.value.id) : []));

function openMega() {
  if (closeTimer) clearTimeout(closeTimer);
  megaOpen.value = true;
  if (hoverCatId.value === null && categories.value.length) {
    hoverCatId.value = categories.value[0].id;
  }
}

function closeMega() {
  megaOpen.value = false;
}

/* Margen al salir con el ratón: cruzar de la columna al panel pasa por
   unos píxeles fuera del menú y cerrarlo ahí lo vuelve inusable. */
function scheduleClose() {
  if (closeTimer) clearTimeout(closeTimer);
  closeTimer = setTimeout(closeMega, 180);
}

function onScroll() {
  stuck.value = window.scrollY > 4;
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== "Escape") return;
  closeMega();
  drawerOpen.value = false;
}

/* El cajón bloquea el scroll del fondo mientras está abierto. */
watch(drawerOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
});

/* Navegar cierra todo: en móvil el cajón se quedaba abierto encima de
   la página nueva. */
watch(() => route.fullPath, () => {
  drawerOpen.value = false;
  closeMega();
});

onMounted(() => {
  onScroll();
  loadCatalog();
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  document.removeEventListener("keydown", onKeydown);
  if (closeTimer) clearTimeout(closeTimer);
  if (import.meta.client) document.body.style.overflow = "";
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   CABECERA — BYTEMARKET

   Tres franjas, como cualquier tienda seria: servicio,
   identidad + búsqueda + cuenta, y catálogo. Cada una
   responde a una pregunta distinta del comprador.
═══════════════════════════════════════════════════════ */

.hd {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--surface-raised);
  border-bottom: 1px solid var(--line-soft);
  transition: box-shadow var(--t-base) var(--ease-smooth);
}

.hd--stuck {
  box-shadow: var(--shadow-sm);
}

/* ── FRANJA 1 ── */
.hd__top {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.hd__top-inner {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-pad);
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-6);
}

.hd__promises {
  display: flex;
  align-items: center;
  gap: var(--sp-6);
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
}

.hd__promises li {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  letter-spacing: 0.01em;
  color: var(--ink-muted);
  white-space: nowrap;
}

.hd__promises svg {
  width: 14px;
  height: 14px;
  color: var(--accent);
  flex-shrink: 0;
}

.hd__top-links {
  display: flex;
  align-items: center;
  gap: var(--sp-5);
  flex-shrink: 0;
}

.hd__top-links a {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
  white-space: nowrap;
}

.hd__top-links a:hover {
  color: #fff;
}

.hd__top-wa {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--accent) !important;
}

/* ── FRANJA 2 ── */
.hd__main-inner {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-pad);
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: var(--sp-6);
}

.hd__burger {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 38px;
  height: 38px;
  margin-left: -6px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  flex-shrink: 0;
}

.hd__burger span {
  width: 16px;
  height: 1.6px;
  border-radius: 2px;
  background: var(--ink-strong);
  transition:
    transform var(--t-base) var(--ease-smooth),
    opacity var(--t-fast) var(--ease-smooth);
}

.hd__burger.is-open span:nth-child(1) {
  transform: translateY(5.6px) rotate(45deg);
}
.hd__burger.is-open span:nth-child(2) {
  opacity: 0;
}
.hd__burger.is-open span:nth-child(3) {
  transform: translateY(-5.6px) rotate(-45deg);
}

.hd__logo {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: opacity var(--t-fast) var(--ease-smooth);
}

.hd__logo:hover {
  opacity: 0.85;
}

/* max-width además de la altura: un logo apaisado subido desde el panel
   podría empujar el buscador fuera de la barra. */
.hd__logo-img {
  height: 40px;
  width: auto;
  max-width: 190px;
  object-fit: contain;
  object-position: left center;
}

.hd__search {
  flex: 1;
  min-width: 0;
  max-width: 620px;
}

/* ── Acciones ── */
.hd__actions {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-left: auto;
  flex-shrink: 0;
}

.hd__action,
.hd__cart {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 46px;
  padding: 0 var(--sp-3);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-body);
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.hd__action:hover,
.hd__cart:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.hd__action-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hd__action-icon svg {
  width: 21px;
  height: 21px;
}

.hd__action-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  line-height: 1.1;
  text-align: left;
}

.hd__action-text small {
  font-size: 0.625rem;
  font-weight: var(--fw-medium);
  color: var(--ink-muted);
  white-space: nowrap;
}

.hd__action-text strong {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
  letter-spacing: var(--tracking-tight);
  white-space: nowrap;
  max-width: 11ch;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Contador sobre el icono */
.hd__pip {
  position: absolute;
  top: -5px;
  right: -7px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  background: var(--cp-navy-900);
  color: #fff;
  font-size: 0.625rem;
  font-weight: var(--fw-black);
  line-height: 1;
  border: 2px solid var(--surface-raised);
}

.hd__pip--cart {
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
}

/* El carrito es la única acción con marco: es el final del embudo. */
.hd__cart {
  border-color: var(--line);
  padding-inline: var(--sp-4);
  margin-left: var(--sp-2);
}

.hd__cart:hover {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
}

/* ── FRANJA 3 ── */
.hd__cats {
  border-top: 1px solid var(--line-soft);
  background: var(--surface-raised);
}

.hd__cats-inner {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-pad);
  height: var(--catbar-height);
  display: flex;
  align-items: center;
  gap: var(--sp-5);
}

.hd__all {
  position: relative;
  flex-shrink: 0;
  align-self: stretch;
  display: flex;
  align-items: center;
}

.hd__all-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 34px;
  padding: 0 var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.hd__all-btn svg {
  width: 15px;
  height: 15px;
}

.hd__all-btn:hover,
.hd__all-btn.is-open {
  background: var(--cp-navy-900);
  border-color: var(--cp-navy-900);
  color: #fff;
}

.hd__quick {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
  overflow: hidden;
}

.hd__quick-link {
  display: inline-flex;
  align-items: center;
  height: 32px;
  padding: 0 var(--sp-3);
  border-radius: var(--radius-xs);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-body);
  white-space: nowrap;
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.hd__quick-link:hover,
.hd__quick-link.router-link-active {
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.hd__cats-aside {
  margin-left: auto;
  flex-shrink: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-muted);
  white-space: nowrap;
}

.hd__cats-aside:hover {
  color: var(--accent-strong);
}

/* ── MEGA MENÚ ── */
.hd__mega {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: min(760px, calc(100vw - 2 * var(--container-pad)));
  background: var(--surface-raised);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.hd__mega-grid {
  display: grid;
  grid-template-columns: 254px 1fr;
}

.hd__mega-cats {
  margin: 0;
  padding: var(--sp-3);
  list-style: none;
  background: var(--surface-sunken);
  border-right: 1px solid var(--line-soft);
  max-height: 380px;
  overflow-y: auto;
}

.hd__mega-cat {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-height: 38px;
  padding: 0 var(--sp-3);
  border-radius: var(--radius-xs);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  color: var(--ink-body);
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.hd__mega-cat span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hd__mega-cat small {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-faint);
}

.hd__mega-cat svg {
  width: 13px;
  height: 13px;
  opacity: 0;
  transition: opacity var(--t-fast) var(--ease-smooth);
}

.hd__mega-cat.is-active {
  background: var(--surface-raised);
  color: var(--accent-strong);
  font-weight: var(--fw-semibold);
}

.hd__mega-cat.is-active svg {
  opacity: 1;
}

.hd__mega-empty {
  padding: var(--sp-4) var(--sp-3);
  font-size: var(--fs-xs);
  color: var(--ink-faint);
}

.hd__mega-panel {
  padding: var(--sp-5);
  display: flex;
  flex-direction: column;
  min-height: 260px;
}

.hd__mega-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-bottom: var(--sp-3);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-3);
}

.hd__mega-title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.hd__mega-all {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.hd__mega-subs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 2px var(--sp-4);
  margin: 0 0 var(--sp-4);
  padding: 0;
  list-style: none;
  flex: 1;
  align-content: start;
}

.hd__mega-sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  min-height: 32px;
  padding: 0 var(--sp-2);
  border-radius: var(--radius-xs);
  font-size: var(--fs-xs);
  color: var(--ink-body);
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.hd__mega-sub small {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-faint);
}

.hd__mega-sub:hover {
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.hd__mega-note {
  flex: 1;
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  margin-bottom: var(--sp-4);
}

.hd__mega-promo {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  border-radius: var(--radius-sm);
  background: var(--accent-quiet);
  border: 1px solid var(--accent-line);
  color: var(--ink-strong);
  transition: background var(--t-base) var(--ease-smooth);
}

.hd__mega-promo:hover {
  background: var(--accent-soft);
}

.hd__mega-promo-tag {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.hd__mega-promo-text {
  flex: 1;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}

.hd__mega-promo svg {
  width: 15px;
  height: 15px;
  color: var(--accent-strong);
}

/* ── Buscador móvil ── */
.hd__search-mobile {
  display: none;
  padding: 0 var(--container-pad) var(--sp-3);
}

/* ── Cajón móvil ── */
.hd__scrim {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: var(--overlay);
}

.hd__drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 120;
  width: min(330px, 86vw);
  display: flex;
  flex-direction: column;
  background: var(--surface-raised);
  border-right: 1px solid var(--line-soft);
  box-shadow: var(--shadow-lg);
}

.hd__drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding-inline: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  flex-shrink: 0;
}

.hd__drawer-title {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.hd__drawer-close {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-body);
}

.hd__drawer-close svg {
  width: 16px;
  height: 16px;
}

.hd__drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--sp-3) var(--sp-3) var(--sp-8);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hd__drawer-link,
.hd__drawer-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  width: 100%;
  min-height: 46px;
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--ink-body);
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-align: left;
}

.hd__drawer-link:hover,
.hd__drawer-toggle:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.hd__drawer-toggle svg {
  width: 15px;
  height: 15px;
  color: var(--ink-faint);
  flex-shrink: 0;
  transition: transform var(--t-base) var(--ease-smooth);
}

.hd__drawer-toggle.is-open svg {
  transform: rotate(180deg);
}

.hd__drawer-subs {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 2px 0 var(--sp-2) var(--sp-3);
  margin-left: var(--sp-3);
  border-left: 1px solid var(--line-soft);
}

.hd__drawer-sub {
  min-height: 38px;
  display: flex;
  align-items: center;
  padding: 0 var(--sp-3);
  border-radius: var(--radius-xs);
  font-size: var(--fs-xs);
  color: var(--ink-muted);
}

.hd__drawer-sub:hover {
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.hd__drawer-rule {
  margin: var(--sp-3) var(--sp-3);
  border: 0;
  height: 1px;
  background: var(--line-soft);
}

.hd__drawer-wa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  height: 44px;
  margin: var(--sp-3) var(--sp-3) 0;
  border-radius: var(--radius-sm);
  background: var(--action-bg);
  color: var(--action-ink);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
}

/* ── Transiciones ── */
.hd-mega-enter-active,
.hd-mega-leave-active {
  transition:
    opacity var(--t-fast) var(--ease-smooth),
    transform var(--t-fast) var(--ease-smooth);
}
.hd-mega-enter-from,
.hd-mega-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

.hd-fade-enter-active,
.hd-fade-leave-active {
  transition: opacity var(--t-base) var(--ease-smooth);
}
.hd-fade-enter-from,
.hd-fade-leave-to {
  opacity: 0;
}

.hd-slide-enter-active,
.hd-slide-leave-active {
  transition: transform var(--t-base) var(--ease-smooth);
}
.hd-slide-enter-from,
.hd-slide-leave-to {
  transform: translateX(-100%);
}

/* ═══════════════════════════════════════════════════════
   RESPONSIVE
═══════════════════════════════════════════════════════ */

/* El nombre de la acción desaparece antes que el icono. */
@media (max-width: 1180px) {
  .hd__action-text {
    display: none;
  }

  .hd__action,
  .hd__cart {
    width: 44px;
    padding: 0;
    justify-content: center;
  }

  .hd__cart {
    padding-inline: 0;
  }
}

@media (max-width: 1024px) {
  /* La barra de categorías se reemplaza por el cajón: en tablet no
     caben y apilarlas duplicaría la altura del header. */
  .hd__cats {
    display: none;
  }

  .hd__burger {
    display: flex;
  }

  .hd__search {
    display: none;
  }

  .hd__search-mobile {
    display: block;
  }

  .hd__logo {
    margin-right: auto;
  }
}

@media (max-width: 860px) {
  .hd__promises-wide {
    display: none;
  }
}

@media (max-width: 640px) {
  .hd__promises li:nth-child(2) {
    display: none;
  }

  .hd__top-links a:not(.hd__top-wa) {
    display: none;
  }

  .hd__main-inner {
    gap: var(--sp-3);
  }

  .hd__logo-img {
    height: 32px;
    max-width: 140px;
  }
}

@media (max-width: 420px) {
  .hd__logo-img {
    max-width: 112px;
  }
}
</style>

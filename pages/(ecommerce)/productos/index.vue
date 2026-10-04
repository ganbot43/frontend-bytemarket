<template>
  <div class="cat">
    <div class="cp-container">
      <!-- ═══ Cabecera ═══ -->
      <nav class="cat__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/productos">Catálogo</NuxtLink>
        <template v-if="activeCategory">
          <span aria-hidden="true">/</span>
          <!-- La categoría solo es enlace si hay una subcategoría después;
               si es el último nivel, se marca como posición actual. -->
          <NuxtLink v-if="activeSubcategory" :to="`/productos?categoria=${activeCategory.slug}`">
            {{ activeCategory.name }}
          </NuxtLink>
          <span v-else class="cat__crumb-now">{{ activeCategory.name }}</span>
        </template>
        <template v-if="activeSubcategory">
          <span aria-hidden="true">/</span>
          <span class="cat__crumb-now">{{ activeSubcategory.name }}</span>
        </template>
      </nav>

      <header class="cat__head">
        <h1 class="cat__title">{{ pageTitle }}</h1>
        <p class="cat__count">
          <template v-if="pending">Buscando…</template>
          <template v-else>
            <strong>{{ total }}</strong>
            {{ total === 1 ? "producto" : "productos" }}
            <template v-if="filters.q"> para “{{ filters.q }}”</template>
          </template>
        </p>
      </header>

      <div class="cat__layout">
        <!-- ═══ Filtros ═══ -->
        <aside
          class="cat__aside"
          :class="{ 'is-open': asideOpen }"
          aria-label="Filtros"
        >
          <div class="cat__aside-head">
            <span>Filtros</span>
            <button type="button" class="cat__aside-close" aria-label="Cerrar filtros" @click="asideOpen = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="cat__aside-body">
            <!-- Categorías -->
            <section class="cat__block">
              <p class="cat__block-title">Categorías</p>

              <button
                type="button"
                class="cat__cat"
                :class="{ 'is-active': !filters.categoria && !filters.nuevoLanzamiento }"
                @click="selectCategory(null)"
              >
                Todo el catálogo
              </button>

              <button
                type="button"
                class="cat__cat"
                :class="{ 'is-active': filters.nuevoLanzamiento }"
                @click="toggleNovedades"
              >
                Novedades
              </button>

              <div v-for="cat in categories" :key="cat.id" class="cat__cat-group">
                <button
                  type="button"
                  class="cat__cat"
                  :class="{ 'is-active': filters.categoria === cat.slug && !filters.subcategoria }"
                  @click="selectCategory(cat.slug)"
                >
                  {{ cat.name }}
                  <small>{{ cat.productCount }}</small>
                </button>

                <!-- Las subcategorías solo se despliegan en la categoría
                     abierta: mostrarlas todas convierte el panel en una
                     lista de cincuenta enlaces. -->
                <div v-if="filters.categoria === cat.slug && cat.subcategories?.length" class="cat__subs">
                  <button
                    v-for="sub in cat.subcategories"
                    :key="sub.id"
                    type="button"
                    class="cat__sub"
                    :class="{ 'is-active': filters.subcategoria === sub.slug }"
                    @click="selectSubcategory(sub.slug)"
                  >
                    {{ sub.name }}
                    <small>{{ sub.productCount }}</small>
                  </button>
                </div>
              </div>
            </section>

            <!-- Precio -->
            <section class="cat__block">
              <p class="cat__block-title">Precio (S/)</p>
              <div class="cat__price">
                <input
                  v-model.number="priceDraft.min"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="cat__price-input"
                  placeholder="Desde"
                  aria-label="Precio mínimo"
                  @keydown.enter="applyPrice"
                />
                <span aria-hidden="true">—</span>
                <input
                  v-model.number="priceDraft.max"
                  type="number"
                  min="0"
                  inputmode="numeric"
                  class="cat__price-input"
                  placeholder="Hasta"
                  aria-label="Precio máximo"
                  @keydown.enter="applyPrice"
                />
              </div>
              <button type="button" class="btn btn-soft btn-sm cat__price-apply" @click="applyPrice">
                Aplicar
              </button>
            </section>

            <button
              v-if="activeFilters.length"
              type="button"
              class="btn btn-ghost btn-sm cat__clear"
              @click="resetFilters"
            >
              Quitar todos los filtros
            </button>
          </div>
        </aside>

        <Transition name="cat-fade">
          <div v-if="asideOpen" class="cat__scrim" @click="asideOpen = false" />
        </Transition>

        <!-- ═══ Resultados ═══ -->
        <div class="cat__main">
          <!-- Barra de herramientas -->
          <div class="cat__toolbar">
            <button type="button" class="cat__filter-btn" @click="asideOpen = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filtros
              <span v-if="activeFilters.length" class="cat__filter-pip">{{ activeFilters.length }}</span>
            </button>

            <div class="cat__sort">
              <label for="cat-sort">Ordenar</label>
              <select id="cat-sort" v-model="sortModel" class="cat__sort-select">
                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <!-- Filtros activos -->
          <ul v-if="activeFilters.length" class="cat__pills">
            <li v-for="pill in activeFilters" :key="pill.key">
              <button type="button" class="cat__pill" @click="pill.clear()">
                {{ pill.label }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </li>
          </ul>

          <!-- Carga -->
          <div v-if="pending" class="cp-grid">
            <div v-for="i in filters.limit" :key="`sk-${i}`" class="cat__skeleton">
              <div class="cp-skeleton cat__skeleton-media" />
              <div class="cp-skeleton cat__skeleton-line" style="width: 42%" />
              <div class="cp-skeleton cat__skeleton-line" style="width: 88%" />
              <div class="cp-skeleton cat__skeleton-line" style="width: 50%; height: 18px" />
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="cat__state">
            <h2 class="cat__state-title">No pudimos cargar el catálogo</h2>
            <p class="cat__state-text">{{ error.message || "Vuelve a intentarlo en un momento." }}</p>
            <button type="button" class="btn btn-primary btn-sm" @click="() => refresh()">Reintentar</button>
          </div>

          <!-- Productos -->
          <div v-else-if="products.length" class="cp-grid">
            <EcommerceTarjetaProducto
              v-for="product in products"
              :key="product.id"
              :product="product"
            />
          </div>

          <!-- Sin resultados -->
          <div v-else class="cat__state">
            <h2 class="cat__state-title">Sin resultados</h2>
            <p class="cat__state-text">
              <template v-if="filters.q">
                No encontramos nada para “{{ filters.q }}”. Prueba con el modelo
                del equipo o el tipo de pieza.
              </template>
              <template v-else>
                Ningún producto coincide con estos filtros.
              </template>
            </p>
            <button type="button" class="btn btn-primary btn-sm" @click="resetFilters">
              Quitar los filtros
            </button>
          </div>

          <!-- Paginación -->
          <nav v-if="totalPages > 1 && !pending" class="cat__pager" aria-label="Paginación">
            <button
              type="button"
              class="cat__pager-btn"
              :disabled="filters.page <= 1"
              @click="goToPage(filters.page - 1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
              Anterior
            </button>

            <ul class="cat__pager-list">
              <li v-for="(page, i) in pageList" :key="`p-${i}`">
                <span v-if="page === '…'" class="cat__pager-gap">…</span>
                <button
                  v-else
                  type="button"
                  class="cat__pager-num"
                  :class="{ 'is-active': page === filters.page }"
                  :aria-current="page === filters.page ? 'page' : undefined"
                  @click="goToPage(page as number)"
                >
                  {{ page }}
                </button>
              </li>
            </ul>

            <button
              type="button"
              class="cat__pager-btn"
              :disabled="filters.page >= totalPages"
              @click="goToPage(filters.page + 1)"
            >
              Siguiente
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DisplayProduct } from "~/composables/useProductDisplay";

definePageMeta({ layout: "default" });

type Subcategory = { id: number; name: string; slug: string; productCount: number };
type Category = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
  subcategories?: Subcategory[];
};

const route = useRoute();
const asideOpen = ref(false);

const sortOptions = [
  { value: "", label: "Más recientes" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
  { value: "nombre-asc", label: "Nombre: A → Z" },
  { value: "nombre-desc", label: "Nombre: Z → A" },
];

/* ── Estado de filtros, siempre derivado de la URL ──
   La URL es la fuente de verdad: así un enlace a una categoría filtrada
   se puede compartir y el botón atrás del navegador funciona. */
const readQuery = (value: unknown) => (Array.isArray(value) ? value[0] : value);

const toStringOrNull = (value: unknown) => {
  const raw = readQuery(value);
  if (raw == null) return null;
  const str = String(raw).trim();
  return str || null;
};

const toNumberOrNull = (value: unknown) => {
  const raw = readQuery(value);
  if (raw == null || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

const toBool = (value: unknown) => {
  const raw = String(readQuery(value) ?? "");
  return raw === "1" || raw === "true";
};

const toPositiveInt = (value: unknown, fallback: number) => {
  const num = Number(readQuery(value));
  return Number.isFinite(num) && num >= 1 ? Math.floor(num) : fallback;
};

const filters = computed(() => ({
  categoria: toStringOrNull(route.query.categoria),
  subcategoria: toStringOrNull(route.query.subcategoria),
  nuevoLanzamiento: toBool(route.query.nuevoLanzamiento),
  q: toStringOrNull(route.query.q) ?? "",
  precioMin: toNumberOrNull(route.query.precioMin),
  precioMax: toNumberOrNull(route.query.precioMax),
  sort: toStringOrNull(route.query.sort) ?? "",
  page: toPositiveInt(route.query.page, 1),
  limit: toPositiveInt(route.query.limit, 24),
}));

/* Navegar reescribe la query completa: así ningún parámetro viejo
   sobrevive a un cambio de filtro. */
function applyFilters(patch: Record<string, any>, keepPage = false) {
  const next = { ...filters.value, ...patch };
  if (!keepPage) next.page = 1;

  const query: Record<string, string> = {};
  if (next.categoria) query.categoria = String(next.categoria);
  if (next.subcategoria) query.subcategoria = String(next.subcategoria);
  if (next.nuevoLanzamiento) query.nuevoLanzamiento = "1";
  if (next.q) query.q = String(next.q);
  if (next.precioMin != null) query.precioMin = String(next.precioMin);
  if (next.precioMax != null) query.precioMax = String(next.precioMax);
  if (next.sort) query.sort = String(next.sort);
  query.page = String(next.page);
  query.limit = String(next.limit);

  asideOpen.value = false;
  return navigateTo({ path: "/productos", query });
}

/* ── Datos ── */
const { data: categoriesData } = await useFetch<{ data: Category[] }>("/api/categories", {
  query: { active: true },
  key: "catalogo-categorias",
  default: () => ({ data: [] }),
  lazy: true,
});

const categories = computed(() =>
  (categoriesData.value?.data ?? []).filter((c) => (c.productCount ?? 0) > 0),
);

const productQuery = computed(() => {
  const f = filters.value;
  const q: Record<string, string> = {
    page: String(f.page),
    limit: String(f.limit),
  };
  if (f.categoria) q.categoria = f.categoria;
  if (f.subcategoria) q.subcategoria = f.subcategoria;
  if (f.nuevoLanzamiento) q.nuevoLanzamiento = "1";
  if (f.q) q.q = f.q;
  if (f.precioMin != null) q.precioMin = String(f.precioMin);
  if (f.precioMax != null) q.precioMax = String(f.precioMax);
  if (f.sort) q.sort = f.sort;
  return q;
});

const { data, pending, error, refresh } = await useFetch<{
  data: DisplayProduct[];
  page: number;
  limit: number;
  total: number;
}>("/api/products", {
  query: productQuery,
  watch: [productQuery],
});

const products = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / filters.value.limit)));

/* ── Etiquetas ── */
const activeCategory = computed(() =>
  categories.value.find((c) => c.slug === filters.value.categoria) ?? null,
);

const activeSubcategory = computed(
  () =>
    activeCategory.value?.subcategories?.find(
      (s) => s.slug === filters.value.subcategoria,
    ) ?? null,
);

const pageTitle = computed(() => {
  if (filters.value.q) return `Resultados para “${filters.value.q}”`;
  if (activeSubcategory.value) return activeSubcategory.value.name;
  if (activeCategory.value) return activeCategory.value.name;
  if (filters.value.nuevoLanzamiento) return "Novedades";
  return "Repuestos y accesorios";
});

const formatPrice = useFormatPrice();

/* Chips de lo que está aplicado, cada uno con su propio "quitar".
   Sin esto el usuario no sabe por qué ve 3 resultados. */
const activeFilters = computed(() => {
  const f = filters.value;
  const pills: Array<{ key: string; label: string; clear: () => void }> = [];

  if (f.q) {
    pills.push({ key: "q", label: `“${f.q}”`, clear: () => applyFilters({ q: "" }) });
  }
  if (f.nuevoLanzamiento) {
    pills.push({
      key: "nuevo",
      label: "Novedades",
      clear: () => applyFilters({ nuevoLanzamiento: false }),
    });
  }
  if (activeCategory.value) {
    pills.push({
      key: "cat",
      label: activeCategory.value.name,
      clear: () => applyFilters({ categoria: null, subcategoria: null }),
    });
  }
  if (activeSubcategory.value) {
    pills.push({
      key: "sub",
      label: activeSubcategory.value.name,
      clear: () => applyFilters({ subcategoria: null }),
    });
  }
  if (f.precioMin != null || f.precioMax != null) {
    const from = f.precioMin != null ? formatPrice.format(f.precioMin) : "S/ 0.00";
    const to = f.precioMax != null ? formatPrice.format(f.precioMax) : "sin tope";
    pills.push({
      key: "precio",
      label: `${from} — ${to}`,
      clear: () => applyFilters({ precioMin: null, precioMax: null }),
    });
  }

  return pills;
});

/* ── Acciones ── */
function selectCategory(slug: string | null) {
  applyFilters({ categoria: slug, subcategoria: null, nuevoLanzamiento: false });
}

function selectSubcategory(slug: string) {
  /* Volver a tocar la subcategoría abierta la deselecciona: es lo que
     espera quien la usa como interruptor. */
  const next = filters.value.subcategoria === slug ? null : slug;
  applyFilters({ subcategoria: next, nuevoLanzamiento: false });
}

function toggleNovedades() {
  applyFilters({
    nuevoLanzamiento: !filters.value.nuevoLanzamiento,
    categoria: null,
    subcategoria: null,
  });
}

const priceDraft = reactive({
  min: filters.value.precioMin as number | null,
  max: filters.value.precioMax as number | null,
});

watch(filters, (f) => {
  priceDraft.min = f.precioMin;
  priceDraft.max = f.precioMax;
});

function applyPrice() {
  let min = Number.isFinite(Number(priceDraft.min)) ? Number(priceDraft.min) : null;
  let max = Number.isFinite(Number(priceDraft.max)) ? Number(priceDraft.max) : null;
  if (min !== null && min < 0) min = null;
  if (max !== null && max < 0) max = null;
  /* Invertidos no devuelven nada: se ordenan en lugar de mostrar cero
     resultados sin explicación. */
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  applyFilters({ precioMin: min, precioMax: max });
}

function resetFilters() {
  navigateTo({ path: "/productos", query: { page: "1", limit: String(filters.value.limit) } });
  asideOpen.value = false;
}

const sortModel = computed({
  get: () => filters.value.sort,
  set: (value: string) => applyFilters({ sort: value }),
});

function goToPage(page: number) {
  const target = Math.min(Math.max(1, page), totalPages.value);
  if (target === filters.value.page) return;
  applyFilters({ page: target }, true);
  if (import.meta.client) window.scrollTo({ top: 0, behavior: "smooth" });
}

/* Ventana de páginas con elipsis: con 40 páginas no caben todas. */
const pageList = computed<Array<number | "…">>(() => {
  const current = filters.value.page;
  const last = totalPages.value;
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current]);
  for (const offset of [-1, 1]) {
    const page = current + offset;
    if (page > 1 && page < last) pages.add(page);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) out.push("…");
    out.push(page);
    prev = page;
  }
  return out;
});

/* El cajón de filtros bloquea el fondo mientras está abierto. */
watch(asideOpen, (open) => {
  if (import.meta.client) document.body.style.overflow = open ? "hidden" : "";
});

onUnmounted(() => {
  if (import.meta.client) document.body.style.overflow = "";
});

/* ── SEO ──
   Las páginas filtradas o paginadas generan combinaciones infinitas;
   solo la portada del catálogo se indexa. */
useSeoMeta({
  title: () => `${pageTitle.value} — ByteMarket`,
  description:
    "Catálogo de repuestos y accesorios para celulares: pantallas, baterías, flex, conectores y accesorios con garantía y envíos a todo el Perú.",
  robots: () =>
    activeFilters.value.length || filters.value.page > 1
      ? "noindex, follow"
      : "index, follow",
});
</script>

<style scoped>
.cat {
  padding-block: var(--sp-6) var(--section-y);
}

/* ── Cabecera ── */
.cat__crumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-4);
}

.cat__crumb a:hover {
  color: var(--accent-strong);
}

.cat__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.cat__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
  padding-bottom: var(--sp-5);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-6);
}

.cat__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.cat__count {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
}

.cat__count strong {
  color: var(--ink-strong);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
}

/* ── Disposición ── */
.cat__layout {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: var(--sp-8);
  align-items: start;
}

/* ── Panel de filtros ── */
.cat__aside {
  position: sticky;
  top: calc(var(--header-total) + var(--sp-4));
  max-height: calc(100vh - var(--header-total) - var(--sp-8));
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  overflow: hidden;
}

.cat__aside-head {
  display: none;
}

.cat__aside-body {
  padding: var(--sp-4);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.cat__block-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: var(--sp-3);
}

.cat__cat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  width: 100%;
  min-height: 36px;
  padding: 0 var(--sp-3);
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--ink-body);
  font-family: inherit;
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
  text-align: left;
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.cat__cat small {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.cat__cat:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.cat__cat.is-active {
  background: var(--accent-quiet);
  color: var(--accent-strong);
  font-weight: var(--fw-bold);
}

.cat__cat.is-active small {
  color: var(--accent-strong);
}

.cat__subs {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 2px 0 var(--sp-2) var(--sp-3);
  padding-left: var(--sp-2);
  border-left: 1px solid var(--line-soft);
}

.cat__sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  width: 100%;
  min-height: 32px;
  padding: 0 var(--sp-2);
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--ink-muted);
  font-family: inherit;
  font-size: var(--fs-2xs);
  text-align: left;
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.cat__sub small {
  font-weight: var(--fw-bold);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
}

.cat__sub:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.cat__sub.is-active {
  color: var(--accent-strong);
  font-weight: var(--fw-bold);
}

/* ── Precio ── */
.cat__price {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--ink-faint);
  font-size: var(--fs-2xs);
}

.cat__price-input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
}

.cat__price-apply {
  width: 100%;
  margin-top: var(--sp-2);
}

.cat__clear {
  width: 100%;
  border: 1px solid var(--line-soft);
}

/* ── Barra de herramientas ── */
.cat__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-bottom: var(--sp-4);
  margin-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
}

.cat__filter-btn {
  display: none;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
}

.cat__filter-btn svg {
  width: 15px;
  height: 15px;
}

.cat__filter-pip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 17px;
  height: 17px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  background: var(--cp-navy-900);
  color: #fff;
  font-size: 0.625rem;
  font-weight: var(--fw-black);
}

.cat__sort {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-left: auto;
}

.cat__sort label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  white-space: nowrap;
}

.cat__sort-select {
  height: 38px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}

/* ── Chips de filtro activo ── */
.cat__pills {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin: 0 0 var(--sp-5);
  padding: 0;
  list-style: none;
}

.cat__pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 30px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-pill);
  background: var(--accent-quiet);
  color: var(--accent-strong);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  max-width: 260px;
}

.cat__pill svg {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

.cat__pill:hover {
  background: var(--accent-soft);
}

/* ── Esqueleto ── */
.cat__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: var(--sp-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface-raised);
}

.cat__skeleton-media {
  aspect-ratio: 1 / 1;
  border-radius: 0;
  margin-bottom: var(--sp-2);
}

.cat__skeleton-line {
  height: 11px;
  margin-inline: var(--sp-4);
}

/* ── Estados ── */
.cat__state {
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

.cat__state-title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.cat__state-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 48ch;
  margin-bottom: var(--sp-2);
}

/* ── Paginación ── */
.cat__pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-top: var(--sp-10);
  padding-top: var(--sp-6);
  border-top: 1px solid var(--line-soft);
}

.cat__pager-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 var(--sp-4);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.cat__pager-btn svg {
  width: 14px;
  height: 14px;
}

.cat__pager-btn:hover:not(:disabled) {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.cat__pager-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.cat__pager-list {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cat__pager-num {
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--ink-body);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  font-variant-numeric: tabular-nums;
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.cat__pager-num:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.cat__pager-num.is-active {
  background: var(--cp-navy-900);
  border-color: var(--cp-navy-900);
  color: #fff;
}

.cat__pager-gap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 34px;
  color: var(--ink-faint);
  font-size: var(--fs-xs);
}

/* ── Cajón móvil ── */
.cat__scrim {
  display: none;
}

.cat-fade-enter-active,
.cat-fade-leave-active {
  transition: opacity var(--t-base) var(--ease-smooth);
}
.cat-fade-enter-from,
.cat-fade-leave-to {
  opacity: 0;
}

/* ═══ Responsive ═══ */
@media (max-width: 1024px) {
  .cat__layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 0;
  }

  .cat__filter-btn {
    display: inline-flex;
  }

  /* El panel pasa a cajón lateral: en tablet una columna fija de 250px
     se come el ancho que necesita la rejilla. */
  .cat__aside {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 120;
    width: min(330px, 88vw);
    max-height: none;
    border: 0;
    border-right: 1px solid var(--line-soft);
    border-radius: 0;
    box-shadow: var(--shadow-lg);
    transform: translateX(-100%);
    transition: transform var(--t-base) var(--ease-smooth);
  }

  .cat__aside.is-open {
    transform: translateX(0);
  }

  .cat__aside-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 60px;
    padding-inline: var(--sp-4);
    border-bottom: 1px solid var(--line-soft);
    font-size: var(--fs-sm);
    font-weight: var(--fw-black);
    color: var(--ink-strong);
    flex-shrink: 0;
  }

  .cat__aside-close {
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

  .cat__aside-close svg {
    width: 16px;
    height: 16px;
  }

  .cat__scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 110;
    background: var(--overlay);
  }
}

@media (max-width: 640px) {
  .cat__head {
    padding-bottom: var(--sp-4);
    margin-bottom: var(--sp-4);
  }

  .cat__sort label {
    display: none;
  }

  .cat__pager {
    flex-wrap: wrap;
    justify-content: center;
  }

  .cat__pager-list {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: var(--sp-2);
  }

  .cat__pager-btn {
    flex: 1;
    justify-content: center;
  }
}
</style>

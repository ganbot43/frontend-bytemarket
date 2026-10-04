<template>
  <section v-if="loading || items.length || showEmpty" class="fp" :id="sectionId">
    <div class="cp-container">
      <header class="cp-head">
        <div class="cp-head__text">
          <p v-if="eyebrow" class="cp-eyebrow">{{ eyebrow }}</p>
          <h2 class="cp-head__title">{{ title }}</h2>
          <p v-if="subtitle" class="cp-head__sub">{{ subtitle }}</p>
        </div>

        <div class="fp__tools">
          <!-- Las flechas solo aparecen cuando hay algo fuera de vista.
               Un control desactivado permanente es ruido. -->
          <div v-if="layout === 'rail' && canScroll" class="fp__arrows">
            <button
              type="button"
              class="cp-rail-btn"
              :disabled="atStart"
              aria-label="Anterior"
              @click="scrollBy(-1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              class="cp-rail-btn"
              :disabled="atEnd"
              aria-label="Siguiente"
              @click="scrollBy(1)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </div>

          <NuxtLink v-if="href" :to="href" class="cp-head__link">
            {{ linkLabel }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>
        </div>
      </header>

      <!-- ── Carga ── -->
      <div v-if="loading" :class="layout === 'rail' ? 'cp-rail fp__rail' : 'cp-grid'">
        <div v-for="i in skeletonCount" :key="`sk-${i}`" class="fp__skeleton">
          <div class="cp-skeleton fp__skeleton-media" />
          <div class="cp-skeleton fp__skeleton-line" style="width: 40%" />
          <div class="cp-skeleton fp__skeleton-line" style="width: 85%" />
          <div class="cp-skeleton fp__skeleton-line" style="width: 55%; height: 18px" />
        </div>
      </div>

      <!-- ── Productos ── -->
      <div
        v-else-if="items.length"
        ref="railRef"
        :class="layout === 'rail' ? 'cp-rail fp__rail' : 'cp-grid'"
        @scroll.passive="syncEdges"
      >
        <EcommerceTarjetaProducto
          v-for="product in items"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- ── Vacío ── -->
      <div v-else class="fp__empty">
        <p class="fp__empty-title">{{ emptyTitle }}</p>
        <p class="fp__empty-text">{{ emptyText }}</p>
        <NuxtLink to="/productos" class="btn btn-outline btn-sm">Ver el catálogo</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DisplayProduct } from "~/composables/useProductDisplay";

const props = withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    subtitle?: string;
    products?: DisplayProduct[] | null;
    loading?: boolean;
    href?: string;
    linkLabel?: string;
    /** 'rail' desliza en horizontal; 'grid' apila en rejilla. */
    layout?: "rail" | "grid";
    limit?: number;
    sectionId?: string;
    showEmpty?: boolean;
    emptyTitle?: string;
    emptyText?: string;
  }>(),
  {
    linkLabel: "Ver todo",
    layout: "rail",
    limit: 10,
    showEmpty: false,
    emptyTitle: "Todavía no hay productos aquí",
    emptyText: "Estamos cargando piezas nuevas. Mientras tanto, el catálogo completo sigue disponible.",
  },
);

const items = computed(() => (props.products ?? []).slice(0, props.limit));

const skeletonCount = computed(() => (props.layout === "rail" ? 6 : 8));

/* ── Desplazamiento del rail ──
   Avanza por anchos visibles, no por una cantidad fija de píxeles: en
   móvil una "página" son dos tarjetas y en escritorio cinco. */
const railRef = ref<HTMLElement | null>(null);
const atStart = ref(true);
const atEnd = ref(true);
const canScroll = ref(false);

function syncEdges() {
  const el = railRef.value;
  if (!el) return;
  const max = el.scrollWidth - el.clientWidth;
  canScroll.value = max > 8;
  atStart.value = el.scrollLeft <= 4;
  atEnd.value = el.scrollLeft >= max - 4;
}

function scrollBy(direction: 1 | -1) {
  const el = railRef.value;
  if (!el) return;
  el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
}

let observer: ResizeObserver | null = null;

/* El rail se mide cuando los productos llegan, no al montar: en ese
   momento todavía está el esqueleto y scrollWidth es otro. */
watch(
  () => [items.value.length, props.loading, props.layout],
  async () => {
    await nextTick();
    syncEdges();
  },
);

onMounted(() => {
  syncEdges();
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(syncEdges);
    if (railRef.value) observer.observe(railRef.value);
  }
});

onUnmounted(() => observer?.disconnect());
</script>

<style scoped>
.fp {
  padding-block: var(--section-y-sm);
}

.fp__tools {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-shrink: 0;
}

.fp__arrows {
  display: flex;
  gap: 6px;
}

.fp__rail {
  grid-auto-columns: minmax(216px, 1fr);
}

/* ── Esqueleto — misma silueta que la tarjeta real, para que el
      contenido no salte cuando llega ── */
.fp__skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 0 var(--sp-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface-raised);
}

.fp__skeleton-media {
  aspect-ratio: 1 / 1;
  border-radius: 0;
  margin-bottom: var(--sp-2);
}

.fp__skeleton-line {
  height: 11px;
  margin-inline: var(--sp-4);
}

/* ── Vacío ── */
.fp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-12) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface-sunken);
}

.fp__empty-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.fp__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 44ch;
  margin-bottom: var(--sp-2);
}

@media (max-width: 640px) {
  .fp__rail {
    grid-auto-columns: minmax(158px, 1fr);
  }

  .fp__arrows {
    display: none;
  }
}
</style>

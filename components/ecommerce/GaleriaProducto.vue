<template>
  <div class="gal">
    <!-- ── Imagen principal ──
         contain, no cover: en un repuesto el recorte esconde justo el
         conector o el marco que el comprador vino a verificar. -->
    <div class="gal__stage">
      <SharedImagen
        :key="current ?? 'sin-imagen'"
        :src="current"
        :alt="producto?.name ?? 'Producto'"
        fit="contain"
        eager
        label="Sin imagen"
        class="gal__img"
      />

      <div class="gal__tags">
        <span v-if="hasDiscount" class="gal__tag gal__tag--sale">-{{ discountPct }}%</span>
        <span v-if="producto?.nuevoLanzamiento" class="gal__tag gal__tag--new">Nuevo</span>
        <span v-else-if="producto?.isFeatured" class="gal__tag gal__tag--quiet">Destacado</span>
      </div>

      <!-- Flechas solo cuando hay más de una foto -->
      <template v-if="images.length > 1">
        <button type="button" class="gal__nav gal__nav--prev" aria-label="Imagen anterior" @click="step(-1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <button type="button" class="gal__nav gal__nav--next" aria-label="Imagen siguiente" @click="step(1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>

        <span class="gal__counter">{{ index + 1 }} / {{ images.length }}</span>
      </template>
    </div>

    <!-- ── Miniaturas ── -->
    <div v-if="images.length > 1" class="gal__thumbs">
      <button
        v-for="(img, i) in images"
        :key="img.url"
        type="button"
        class="gal__thumb"
        :class="{ 'is-active': i === index }"
        :aria-label="`Ver imagen ${i + 1}`"
        :aria-current="i === index"
        @click="index = i"
      >
        <SharedImagen :src="img.url" :alt="`${producto?.name ?? 'Producto'} — imagen ${i + 1}`" fit="contain" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProductDisplay } from "~/composables/useProductDisplay";

const props = defineProps<{ producto: any }>();

const { gallery, hasDiscount, discountPct } = useProductDisplay(() => props.producto);

const images = computed(() => gallery.value);
const index = ref(0);

const current = computed(() => images.value[index.value]?.url ?? null);

/* Al cambiar de producto se vuelve a la principal; si no, la ficha
   nueva abría en la tercera foto de la anterior. */
watch(
  () => props.producto?.id,
  () => {
    index.value = 0;
  },
);

function step(delta: number) {
  const total = images.value.length;
  if (total < 2) return;
  index.value = (index.value + delta + total) % total;
}
</script>

<style scoped>
.gal {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

/* ── Escenario ── */
.gal__stage {
  position: relative;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-8);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-media);
  overflow: hidden;
}

.gal__img {
  width: 100%;
  height: 100%;
  animation: gal-in var(--t-base) var(--ease-smooth);
}

@keyframes gal-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ── Etiquetas ── */
.gal__tags {
  position: absolute;
  top: var(--sp-4);
  left: var(--sp-4);
  display: flex;
  gap: 6px;
}

.gal__tag {
  padding: 4px 9px;
  border-radius: var(--radius-xs);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: 1.5;
}

.gal__tag--sale {
  background: var(--cp-navy-900);
  color: #fff;
}

.gal__tag--new {
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
}

.gal__tag--quiet {
  background: var(--surface-raised);
  color: var(--ink-muted);
  border: 1px solid var(--line-soft);
}

/* ── Navegación ── */
.gal__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: var(--surface-raised);
  color: var(--ink-strong);
  opacity: 0;
  transition:
    opacity var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth);
}

.gal__nav svg {
  width: 16px;
  height: 16px;
}

.gal__nav--prev {
  left: var(--sp-3);
}
.gal__nav--next {
  right: var(--sp-3);
}

.gal__stage:hover .gal__nav,
.gal__stage:focus-within .gal__nav {
  opacity: 1;
}

.gal__nav:hover {
  border-color: var(--accent-line);
  color: var(--accent-strong);
}

@media (hover: none) {
  .gal__nav {
    opacity: 1;
  }
}

.gal__counter {
  position: absolute;
  right: var(--sp-4);
  bottom: var(--sp-4);
  padding: 3px 9px;
  border-radius: var(--radius-pill);
  background: rgba(7, 30, 82, 0.55);
  color: #fff;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

/* ── Miniaturas ── */
.gal__thumbs {
  display: flex;
  gap: var(--sp-2);
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.gal__thumbs::-webkit-scrollbar {
  display: none;
}

.gal__thumb {
  flex-shrink: 0;
  width: 70px;
  height: 70px;
  padding: 5px;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-sm);
  background: var(--surface-media);
  overflow: hidden;
  transition:
    border-color var(--t-fast) var(--ease-smooth),
    background var(--t-fast) var(--ease-smooth);
}

.gal__thumb :deep(img) {
  width: 100%;
  height: 100%;
}

.gal__thumb:hover {
  border-color: var(--line-strong);
}

.gal__thumb.is-active {
  border-color: var(--accent);
  background: var(--accent-quiet);
}

@media (max-width: 480px) {
  .gal__stage {
    padding: var(--sp-5);
    border-radius: var(--radius);
  }

  .gal__thumb {
    width: 58px;
    height: 58px;
  }
}
</style>

<template>
  <!-- Los controles se pintan siempre, aunque haya una sola página: que la
       barra cambie de forma entre módulos hacía que no parecieran la misma
       tabla. Con una página, el 1 queda activo y las flechas desactivadas. -->
  <div v-if="total > 0" class="pg">
    <p class="pg__meta">
      Página {{ pagina + 1 }} — {{ total }}
      {{ total === 1 ? "registro" : "registros" }}
    </p>

    <nav class="pg__nav" aria-label="Paginación">
      <button
        type="button"
        class="pg__btn pg__btn--flecha"
        :disabled="pagina === 0"
        aria-label="Página anterior"
        @click="ir(pagina - 1)"
      >
        <ChevronLeft :size="15" stroke-width="2.2" />
      </button>

      <template v-for="(p, i) in ventana" :key="`${p}-${i}`">
        <span v-if="p === '…'" class="pg__puntos" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          class="pg__btn"
          :class="{ 'pg__btn--activa': p - 1 === pagina }"
          :aria-current="p - 1 === pagina ? 'page' : undefined"
          :aria-label="`Página ${p}`"
          @click="ir(Number(p) - 1)"
        >
          {{ p }}
        </button>
      </template>

      <button
        type="button"
        class="pg__btn pg__btn--flecha"
        :disabled="pagina >= totalPaginas - 1"
        aria-label="Página siguiente"
        @click="ir(pagina + 1)"
      >
        <ChevronRight :size="15" stroke-width="2.2" />
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    /** Índice de página empezando en 0, como lo espera el backend. */
    pagina: number;
    total: number;
    limite?: number;
  }>(),
  { limite: 20 },
);

const emit = defineEmits<{ (e: "update:pagina", v: number): void }>();

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(props.total / Math.max(1, props.limite))),
);

/* Con muchas páginas, pintarlas todas desborda la barra: se muestran la
   primera, la última y las vecinas a la actual, con puntos en los saltos. */
const ventana = computed<(number | "…")[]>(() => {
  const n = totalPaginas.value;
  const actual = props.pagina + 1;
  if (n <= 7) return Array.from({ length: n }, (_, i) => i + 1);

  const vecinas = new Set<number>([1, n, actual, actual - 1, actual + 1]);
  if (actual <= 3) [2, 3, 4].forEach((x) => vecinas.add(x));
  if (actual >= n - 2) [n - 1, n - 2, n - 3].forEach((x) => vecinas.add(x));

  const paginas = [...vecinas].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b);

  const salida: (number | "…")[] = [];
  let previa = 0;
  for (const p of paginas) {
    if (previa && p - previa > 1) salida.push("…");
    salida.push(p);
    previa = p;
  }
  return salida;
});

function ir(destino: number) {
  const limitado = Math.min(Math.max(0, destino), totalPaginas.value - 1);
  if (limitado !== props.pagina) emit("update:pagina", limitado);
}
</script>

<style scoped>
.pg {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 1rem;
  border: 1px solid var(--sp-border);
  border-top: none;
  border-radius: 0 0 var(--sp-radius-lg) var(--sp-radius-lg);
  background: var(--sp-surface);
}

.pg__meta {
  margin: 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

.pg__nav {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.pg__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.45rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface);
  color: var(--sp-text);
  font-family: var(--sp-font);
  font-size: var(--sp-text-sm);
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background var(--sp-t) var(--sp-ease),
    border-color var(--sp-t) var(--sp-ease),
    color var(--sp-t) var(--sp-ease);
}

.pg__btn:hover:not(:disabled):not(.pg__btn--activa) {
  background: var(--sp-surface-muted);
  border-color: var(--sp-border-strong);
}

.pg__btn--activa {
  background: var(--sp-primary);
  border-color: var(--sp-primary);
  color: var(--sp-text-inverse, #fff);
  font-weight: 600;
  cursor: default;
}

.pg__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pg__btn--flecha {
  min-width: 1.9rem;
  padding: 0;
}

.pg__puntos {
  padding: 0 0.15rem;
  color: var(--sp-text-muted);
  font-size: var(--sp-text-sm);
  user-select: none;
}

@media (max-width: 560px) {
  .pg {
    justify-content: center;
  }
}
</style>

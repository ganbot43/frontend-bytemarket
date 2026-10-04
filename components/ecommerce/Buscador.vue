<template>
  <div ref="rootRef" class="sb" :class="{ 'sb--open': showPanel }">
    <form class="sb__form" role="search" @submit.prevent="submit">
      <span class="sb__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2" />
        </svg>
      </span>

      <input
        ref="inputRef"
        v-model="term"
        type="search"
        class="sb__input"
        :placeholder="placeholder"
        autocomplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-controls="sb-results"
        :aria-expanded="showPanel"
        @focus="focused = true"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc="close"
        @keydown.enter="onEnter"
      />

      <button
        v-if="term"
        type="button"
        class="sb__clear"
        aria-label="Limpiar búsqueda"
        @click="reset"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      <button type="submit" class="sb__go">Buscar</button>
    </form>

    <!-- ── Sugerencias ──
         Seis como máximo: un desplegable más largo tapa la página y
         obliga a leer en vez de elegir. -->
    <Transition name="sb-drop">
      <div
        v-if="showPanel"
        id="sb-results"
        class="sb__panel"
        role="listbox"
      >
        <p v-if="pending" class="sb__state">Buscando…</p>

        <template v-else-if="results.length">
          <NuxtLink
            v-for="(item, i) in results"
            :key="item.id"
            :to="`/productos/${item.slug}`"
            class="sb__item"
            :class="{ 'is-active': i === cursor }"
            role="option"
            :aria-selected="i === cursor"
            @mouseenter="cursor = i"
            @click="close"
          >
            <span class="sb__thumb">
              <SharedImagen :src="thumb(item)" :alt="item.name" fit="contain" />
            </span>
            <span class="sb__meta">
              <span class="sb__name">{{ item.name }}</span>
              <span v-if="item.subcategory?.name || item.category?.name" class="sb__cat">
                {{ item.subcategory?.name ?? item.category?.name }}
              </span>
            </span>
            <span class="sb__price">{{ formatPrice.format(item.price) }}</span>
          </NuxtLink>

          <button type="button" class="sb__all" @click="submit">
            Ver todos los resultados de “{{ term }}”
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </template>

        <p v-else class="sb__state">
          Sin resultados para “{{ term }}”.
          <NuxtLink to="/productos" class="sb__state-link" @click="close">Ver el catálogo completo</NuxtLink>
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useFormatPrice } from "~/composables/useFormatPrice";

withDefaults(
  defineProps<{ placeholder?: string }>(),
  { placeholder: "Buscar pantalla, batería, modelo…" },
);

const emit = defineEmits<{ submitted: [] }>();

type Hit = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category?: { name: string } | null;
  subcategory?: { name: string } | null;
  images?: Array<{ url: string; isPrimary?: boolean }>;
};

const route = useRoute();
const formatPrice = useFormatPrice();

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const term = ref((route.query.q as string) ?? "");
const focused = ref(false);
const cursor = ref(-1);
const results = ref<Hit[]>([]);
const pending = ref(false);

/* Dos caracteres no acotan nada en un catálogo de repuestos: "a4"
   devolvería media tienda. Se busca desde el tercero. */
const MIN_CHARS = 3;
const eligible = computed(() => term.value.trim().length >= MIN_CHARS);
const showPanel = computed(() => focused.value && eligible.value);

const thumb = (item: Hit) =>
  item.images?.find((i) => i.isPrimary)?.url ?? item.images?.[0]?.url ?? null;

/* Debounce: teclear "pantalla" son ocho peticiones si no se espera. */
let timer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

watch(term, (value) => {
  cursor.value = -1;
  if (timer) clearTimeout(timer);

  if (value.trim().length < MIN_CHARS) {
    results.value = [];
    pending.value = false;
    return;
  }

  pending.value = true;
  timer = setTimeout(async () => {
    const mine = ++requestId;
    try {
      const res = await $fetch<{ data: Hit[] }>("/api/products", {
        query: { q: value.trim(), limit: 6, page: 1 },
      });
      /* Descartar respuestas viejas: sin esto una petición lenta puede
         pisar los resultados de una consulta más reciente. */
      if (mine !== requestId) return;
      results.value = res.data ?? [];
    } catch {
      if (mine === requestId) results.value = [];
    } finally {
      if (mine === requestId) pending.value = false;
    }
  }, 260);
});

function move(delta: number) {
  if (!results.value.length) return;
  const next = cursor.value + delta;
  cursor.value = next < 0 ? results.value.length - 1 : next % results.value.length;
}

function onEnter(event: KeyboardEvent) {
  const hit = results.value[cursor.value];
  if (hit) {
    event.preventDefault();
    close();
    navigateTo(`/productos/${hit.slug}`);
  }
  /* Sin selección el submit del formulario hace su trabajo. */
}

function submit() {
  const value = term.value.trim();
  if (!value) return;
  close();
  inputRef.value?.blur();
  emit("submitted");
  navigateTo({ path: "/productos", query: { q: value, page: "1", limit: "24" } });
}

function reset() {
  term.value = "";
  results.value = [];
  cursor.value = -1;
  inputRef.value?.focus();
}

function close() {
  focused.value = false;
  cursor.value = -1;
}

function onOutside(event: MouseEvent) {
  if (rootRef.value && !rootRef.value.contains(event.target as Node)) close();
}

onMounted(() => document.addEventListener("click", onOutside));
onUnmounted(() => {
  document.removeEventListener("click", onOutside);
  if (timer) clearTimeout(timer);
});

/* Al navegar, el término refleja la URL: volver atrás desde una
   búsqueda no debe dejar el campo con texto de otra consulta. */
watch(
  () => route.query.q,
  (q) => {
    term.value = (q as string) ?? "";
  },
);
</script>

<style scoped>
.sb {
  position: relative;
  width: 100%;
}

/* ── Campo ── */
.sb__form {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  height: 44px;
  padding-left: var(--sp-4);
  padding-right: 4px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.sb:focus-within .sb__form {
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

.sb--open .sb__form {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.sb__icon {
  display: flex;
  color: var(--ink-faint);
  flex-shrink: 0;
}

.sb__icon svg {
  width: 17px;
  height: 17px;
}

.sb__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: 0;
  background: transparent;
  color: var(--ink-strong);
  font-size: var(--fs-sm);
  padding: 0;
}

.sb__input:focus {
  outline: none;
  box-shadow: none;
}

.sb__input::-webkit-search-cancel-button {
  display: none;
}

.sb__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: var(--surface-inset);
  color: var(--ink-muted);
  flex-shrink: 0;
}

.sb__clear svg {
  width: 13px;
  height: 13px;
}

.sb__clear:hover {
  color: var(--ink-strong);
}

.sb__go {
  height: 36px;
  padding: 0 var(--sp-5);
  border: 0;
  border-radius: var(--radius-xs);
  background: var(--action-bg);
  color: var(--action-ink);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  flex-shrink: 0;
  transition: background var(--t-base) var(--ease-smooth);
}

.sb__go:hover {
  background: var(--action-bg-hover);
}

/* ── Desplegable ── */
.sb__panel {
  position: absolute;
  top: calc(100% - 1px);
  left: 0;
  right: 0;
  z-index: 60;
  background: var(--surface-raised);
  border: 1px solid var(--accent-line);
  border-top-color: var(--line-soft);
  border-radius: 0 0 var(--radius-sm) var(--radius-sm);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  max-height: min(70vh, 460px);
  overflow-y: auto;
}

.sb__state {
  padding: var(--sp-5) var(--sp-4);
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  text-align: center;
}

.sb__state-link {
  color: var(--accent-strong);
  font-weight: var(--fw-semibold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.sb__item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-bottom: 1px solid var(--line-soft);
  color: var(--ink-body);
  transition: background var(--t-fast) var(--ease-smooth);
}

.sb__item.is-active,
.sb__item:hover {
  background: var(--accent-quiet);
}

.sb__thumb {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-xs);
  background: var(--surface-media);
  overflow: hidden;
}

.sb__thumb :deep(img) {
  padding: 3px;
}

.sb__meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.sb__name {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.sb__cat {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.sb__price {
  font-size: var(--fs-xs);
  font-weight: var(--fw-black);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.sb__all {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: var(--sp-3);
  border: 0;
  background: var(--surface-sunken);
  color: var(--accent-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
}

.sb__all svg {
  width: 14px;
  height: 14px;
}

.sb__all:hover {
  background: var(--accent-soft);
}

/* ── Animación ── */
.sb-drop-enter-active,
.sb-drop-leave-active {
  transition:
    opacity var(--t-fast) var(--ease-smooth),
    transform var(--t-fast) var(--ease-smooth);
}

.sb-drop-enter-from,
.sb-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .sb__go {
    display: none;
  }
}
</style>

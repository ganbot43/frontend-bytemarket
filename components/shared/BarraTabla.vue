<template>
  <div class="bt">
    <div class="bt__buscar">
      <Search class="bt__lupa" :size="15" stroke-width="2" aria-hidden="true" />
      <input
        :value="modelValue"
        class="bt__input"
        type="search"
        :placeholder="placeholder"
        :aria-label="placeholder"
        @input="alEscribir"
      />
      <button
        v-if="modelValue"
        type="button"
        class="bt__limpiar"
        aria-label="Limpiar búsqueda"
        @click="limpiar"
      >
        <X :size="14" stroke-width="2.5" />
      </button>
    </div>

    <!-- Filtros propios de cada módulo (selects, pestañas…). -->
    <div v-if="$slots.filtros" class="bt__filtros">
      <slot name="filtros" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, X } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    placeholder?: string;
    /* Sin espera, cada tecla dispara una petición al servidor. */
    espera?: number;
  }>(),
  { placeholder: "Buscar…", espera: 300 },
);

const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();

let temporizador: ReturnType<typeof setTimeout> | undefined;

function alEscribir(e: Event) {
  const valor = (e.target as HTMLInputElement).value;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => emit("update:modelValue", valor), props.espera);
}

function limpiar() {
  clearTimeout(temporizador);
  emit("update:modelValue", "");
}

onUnmounted(() => clearTimeout(temporizador));
</script>

<style scoped>
.bt {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.bt__buscar {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1 1 16rem;
  min-width: 0;
  max-width: 24rem;
}

.bt__lupa {
  position: absolute;
  left: 0.7rem;
  color: var(--sp-text-muted);
  pointer-events: none;
}

.bt__input {
  width: 100%;
  padding: 0.55rem 2rem 0.55rem 2.1rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  background: var(--sp-surface);
  font-family: var(--sp-font);
  font-size: var(--sp-text-sm);
  color: var(--sp-text);
  transition:
    border-color var(--sp-t) var(--sp-ease),
    box-shadow var(--sp-t) var(--sp-ease);
}

.bt__input::placeholder {
  color: var(--sp-text-faint, var(--sp-text-muted));
}

.bt__input:focus {
  outline: none;
  border-color: var(--sp-primary);
  box-shadow: 0 0 0 3px var(--sp-primary-soft);
}

/* El aspa nativa de type=search cambia según el navegador. */
.bt__input::-webkit-search-cancel-button {
  appearance: none;
}

.bt__limpiar {
  position: absolute;
  right: 0.45rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border: none;
  border-radius: 50%;
  background: var(--sp-surface-muted);
  color: var(--sp-text-muted);
  cursor: pointer;
}

.bt__limpiar:hover {
  background: var(--sp-border);
  color: var(--sp-text);
}

.bt__filtros {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
</style>

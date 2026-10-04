<template>
  <!-- Si no hay src, o si la carga falla, se pinta el marcador en lugar
       del icono roto del navegador con el texto alternativo al lado.
       Una URL caída no debe verse como una página rota. -->
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :loading="eager ? 'eager' : 'lazy'"
    :fetchpriority="eager ? 'high' : undefined"
    decoding="async"
    :class="['img', `img--${fit}`]"
    @error="failed = true"
  />

  <span v-else class="img__fallback" role="img" :aria-label="alt || 'Sin imagen'">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
    <small v-if="label">{{ label }}</small>
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    src?: string | null;
    alt?: string;
    /** contain para producto (no recorta la pieza), cover para arte. */
    fit?: "contain" | "cover";
    eager?: boolean;
    /** Texto bajo el icono cuando no hay imagen. */
    label?: string;
  }>(),
  { alt: "", fit: "contain", eager: false },
);

const failed = ref(false);

/* Cambiar de producto con la misma instancia del componente dejaba el
   marcador pegado aunque la nueva imagen sí existiera. */
watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
</script>

<style scoped>
.img {
  width: 100%;
  height: 100%;
  display: block;
}

.img--contain {
  object-fit: contain;
}

.img--cover {
  object-fit: cover;
}

.img__fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--ink-faint);
  background: var(--surface-media);
}

.img__fallback svg {
  width: 30%;
  max-width: 44px;
  min-width: 20px;
  height: auto;
  aspect-ratio: 1;
}

.img__fallback small {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  letter-spacing: var(--tracking-wide);
  text-align: center;
  padding-inline: var(--sp-2);
}
</style>

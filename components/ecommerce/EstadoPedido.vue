<template>
  <span class="ep" :class="[`ep--${tono(status)}`, size === 'sm' && 'ep--sm']">
    <span class="ep__dot" aria-hidden="true" />
    {{ etiqueta(status) }}
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{ status: string; size?: "sm" | "md" }>(),
  { size: "md" },
);

const { etiqueta, tono } = useEstadoPedido();
</script>

<style scoped>
.ep {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid;
  border-radius: var(--radius-pill);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-wide);
  line-height: 1.5;
  white-space: nowrap;
}

.ep--sm {
  padding: 2px 8px;
  font-size: 0.625rem;
}

.ep__dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

/* Cuatro tonos, no seis: el cliente necesita distinguir "falta algo",
   "va en camino", "listo" y "se canceló". Un color por estado sería
   un semáforo de seis luces. */
.ep--espera {
  background: var(--cp-warning-bg);
  border-color: var(--cp-warning-border);
  color: var(--cp-warning-text);
}

.ep--progreso {
  background: var(--accent-quiet);
  border-color: var(--accent-line);
  color: var(--accent-strong);
}

.ep--ok {
  background: var(--cp-success-bg);
  border-color: var(--cp-success-border);
  color: var(--cp-success-text);
}

.ep--cancelado {
  background: var(--surface-inset);
  border-color: var(--line);
  color: var(--ink-muted);
}
</style>

<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'outline' | 'wa' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  href?: string
  target?: string
}>()
</script>

<template>
  <component
    :is="href ? 'a' : 'button'"
    :href="href"
    :target="target"
    :rel="target === '_blank' ? 'noopener noreferrer' : undefined"
    class="btn"
    :class="[`btn-${variant ?? 'primary'}`, size ? `btn-${size}` : '']"
  >
    <slot />
  </component>
</template>

<style scoped>
/* Alineado con los botones del sistema (assets/css/main.css §6):
   acción primaria en navy, sin halos de color ni levitación. El cyan
   sólido con texto blanco daba 2.5:1 de contraste —ilegible— y el
   resplandor lo hacía parecer fluorescente sobre fondo claro. */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-body);
  font-weight: var(--fw-semibold);
  font-size: var(--fs-sm);
  letter-spacing: var(--tracking-tight);
  border-radius: var(--radius-sm);
  padding: 0 var(--sp-6);
  height: 44px;
  cursor: pointer;
  border: 1px solid transparent;
  white-space: nowrap;
  text-decoration: none;
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.btn-primary {
  background: var(--action-bg);
  color: var(--action-ink);
}

.btn-primary:hover {
  background: var(--action-bg-hover);
  color: var(--action-ink);
}

.btn-outline {
  background: var(--surface-raised);
  color: var(--ink-strong);
  border-color: var(--line);
}

.btn-outline:hover {
  background: var(--surface-inset);
  border-color: var(--line-strong);
  color: var(--ink-strong);
}

.btn-wa {
  background: #25d366;
  color: #fff;
}

.btn-wa:hover {
  background: #1fb855;
  color: #fff;
}

/* Sobre banda oscura: el blanco es lo que destaca */
.btn-accent {
  background: #ffffff;
  color: var(--cp-navy-900);
  font-weight: var(--fw-bold);
}

.btn-accent:hover {
  background: var(--cp-cyan-50);
  color: var(--cp-navy-900);
}

.btn-sm {
  height: 36px;
  padding: 0 var(--sp-4);
  font-size: var(--fs-xs);
}

.btn-lg {
  height: 52px;
  padding: 0 var(--sp-8);
  font-size: var(--fs-body);
}
</style>

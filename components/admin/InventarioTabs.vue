<template>
  <nav class="sp-tabs inv-tabs" aria-label="Inventario">
    <NuxtLink v-for="t in tabs" :key="t.to" :to="t.to" class="sp-tab"
              :class="{ 'sp-tab--active': route.path === t.to }"
              :aria-current="route.path === t.to ? 'page' : undefined">
      {{ t.label }}
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
/**
 * Las dos caras del inventario.
 *
 * "Stock" responde qué hay y qué falta reponer; "Movimientos" responde qué
 * pasó. Antes solo existía la segunda, así que para saber qué comprar había
 * que ir a Productos y mirar uno por uno.
 */
const route = useRoute()
const tabs = [
  { to: "/admin/inventario", label: "Stock" },
  { to: "/admin/inventario/movimientos", label: "Movimientos" },
]
</script>

<style scoped>
.inv-tabs { margin-bottom: 0.9rem; }
.inv-tabs .sp-tab { display: inline-flex; align-items: center; text-decoration: none; }
</style>

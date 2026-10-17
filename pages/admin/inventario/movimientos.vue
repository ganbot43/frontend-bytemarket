<script setup lang="ts">
/**
 * El kardex dejó de ser una página: ahora es una pestaña de Inventario.
 *
 * Esta ruta se queda como redirección y no se borra porque sigue viva en
 * sitios que no controlamos —marcadores del encargado, el historial del
 * navegador, capturas del informe—, y un 404 ahí no explicaría nada.
 * Arrastra el ?producto= si venía filtrada.
 */
definePageMeta({ middleware: "auth", layout: "admin" });

const route = useRoute();
const producto = Number(route.query.producto) || null;

await navigateTo(
  {
    path: "/admin/inventario",
    query: { vista: "movimientos", ...(producto ? { producto } : {}) },
  },
  { replace: true },
);
</script>

<template>
  <div />
</template>

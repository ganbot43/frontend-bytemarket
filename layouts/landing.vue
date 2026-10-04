<template>
  <div class="cp-shell">
    <LandingEncabezado />

    <main class="cp-shell__main">
      <slot />
    </main>

    <LandingPie />

    <ClientOnly>
      <EcommerceCarritoDrawer />
      <LandingWaFloat />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
/* Portada y páginas de contenido. Comparte shell con la zona de compra:
   cruzar de / a /productos no debe sentirse como entrar a otra web.
   La diferencia con `default` es solo de intención semántica. */
import "~/assets/css/main.css";
</script>

<style scoped>
.cp-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--surface-page);
}

.cp-shell__main {
  flex: 1;
}
</style>

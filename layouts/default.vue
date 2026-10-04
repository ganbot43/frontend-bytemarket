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
/* Shell de la zona de compra (catálogo, ficha, favoritos, carrito,
   checkout, cuenta). Mismo header y footer que la portada. */
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

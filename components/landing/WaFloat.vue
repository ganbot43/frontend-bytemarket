<script setup lang="ts">
const { waLink } = useWhatsapp();
const cartStore = useCartStore();

/* El botón se aparta cuando el carrito está abierto: en móvil el cajón
   ocupa la pantalla entera y el flotante queda encima del checkout. */
const hidden = computed(() => cartStore.isOpen);
</script>

<template>
  <a
    v-show="!hidden"
    :href="waLink('Hola ByteMarket, vi su web y quisiera consultar por un repuesto')"
    class="waf"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Escribir por WhatsApp"
  >
    <LandingWaIcon :size="22" />
    <span class="waf__text">Escríbenos</span>
  </a>
</template>

<style scoped>
/* Píldora discreta, sin pulso ni rebote: el botón debe estar
   disponible, no reclamar atención cada dos segundos. */
.waf {
  position: fixed;
  bottom: 22px;
  right: 22px;
  z-index: 90;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 48px;
  padding: 0 var(--sp-5);
  border-radius: var(--radius-pill);
  background: #25d366;
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  box-shadow: 0 6px 20px rgba(37, 211, 102, 0.28);
  transition:
    background var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.waf:hover {
  background: #1fb855;
  color: #fff;
  box-shadow: 0 8px 26px rgba(37, 211, 102, 0.34);
}

@media (max-width: 640px) {
  .waf {
    bottom: 16px;
    right: 16px;
    width: 50px;
    height: 50px;
    padding: 0;
    justify-content: center;
  }

  .waf__text {
    display: none;
  }
}
</style>

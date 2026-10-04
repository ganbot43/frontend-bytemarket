<template>
  <div class="smart-panel-admin sp-auth">
    <!-- ── Costado de marca ──
         Misma superficie navy que la barra lateral del panel: quien
         inicia sesión ya está viendo la herramienta a la que entra. -->
    <aside class="sp-auth__aside">
      <NuxtLink to="/" class="sp-auth__brand">
        <img :src="logo" :alt="companyName" />
        <!-- El logo ya lleva el nombre; al lado solo la bajada. -->
        <span class="sp-auth__brand-role">Repuestos y accesorios</span>
      </NuxtLink>

      <div class="sp-auth__pitch">
        <p class="sp-auth__pitch-title">
          Tu cuenta de {{ companyName }}
        </p>
        <p class="sp-auth__pitch-text">
          Revisa el estado de tus pedidos, guarda las piezas que te interesan
          y repite una compra sin volver a escribir tus datos.
        </p>
      </div>

      <div class="sp-auth__foot">
        <span>© {{ currentYear }} {{ companyName }}</span>
        <NuxtLink to="/">Volver a la tienda</NuxtLink>
      </div>
    </aside>

    <!-- ── Formulario ── -->
    <main class="sp-auth__main">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
/* Shell compartido por login y registro. Las clases .sp-auth-* viven en
   admin-panel.css (§14) para que ambas páginas no dupliquen su CSS. */
import "~/assets/css/admin-panel.css";

const { logo, nombre: companyName } = useLogo();
const currentYear = new Date().getFullYear();
</script>

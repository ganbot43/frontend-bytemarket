<template>
  <div class="home">
    <!-- 1 · Portada — carrusel de banners + dos accesos fijos -->
    <LandingHeroCarousel />

    <!-- 2 · Promesas de servicio, en banda fina -->
    <LandingBarraConfianza />

    <!-- 3 · Categorías: la entrada real al catálogo -->
    <LandingCategoriasDestacadas />

    <!-- 4 · Destacados en rejilla -->
    <LandingFilaProductos
      section-id="destacados"
      eyebrow="Selección de la tienda"
      title="Lo más pedido"
      subtitle="Las piezas que más salen del almacén, con stock confirmado."
      layout="grid"
      :limit="8"
      :products="destacados"
      :loading="pendingDestacados"
      href="/productos"
      link-label="Ver catálogo"
      show-empty
    />

    <!-- 5 · Corte visual: dos mensajes -->
    <LandingBannerPromo variant="split" />

    <!-- 6 · Novedades en carril -->
    <LandingFilaProductos
      section-id="nuevos-lanzamientos"
      eyebrow="Recién llegado"
      title="Últimos ingresos"
      subtitle="Lo que entró esta semana al almacén."
      layout="rail"
      :limit="12"
      :products="novedades"
      :loading="pendingNovedades"
      href="/productos?nuevoLanzamiento=1"
      link-label="Ver novedades"
    />

    <!-- 7 · Banda de marca a todo el ancho -->
    <LandingBannerPromo variant="wide" />

    <!-- 8 · Quiénes somos -->
    <LandingAboutSection />

    <!-- 9 · Contacto -->
    <LandingContactSection />
  </div>
</template>

<script setup lang="ts">
import type { DisplayProduct } from "~/composables/useProductDisplay";

definePageMeta({ layout: "landing" });

/* =========================================
   DATOS
   Las dos filas se piden en paralelo y en diferido: la portada pinta
   el carrusel y las categorías sin esperar al catálogo.
========================================= */

const { data: destacadosData, pending: pendingDestacados } = await useFetch<{
  data: DisplayProduct[];
}>("/api/landing/featured-products", {
  query: { type: "bestsellers", limit: 8 },
  key: "home-destacados",
  default: () => ({ data: [] }),
  lazy: true,
});

const { data: novedadesData, pending: pendingNovedades } = await useFetch<{
  data: DisplayProduct[];
}>("/api/landing/nuevos-lanzamientos", {
  query: { limit: 12 },
  key: "home-novedades",
  default: () => ({ data: [] }),
  lazy: true,
});

const destacados = computed(() => destacadosData.value?.data ?? []);
const novedades = computed(() => novedadesData.value?.data ?? []);

/* =========================================
   SEO
========================================= */

const runtimeConfig = useRuntimeConfig();
const siteUrl = String(runtimeConfig.public.siteUrl || "https://bytemarket.pe").replace(/\/$/, "");
const siteName = String(runtimeConfig.public.siteName || "ByteMarket SAC");
const logoUrl = `${siteUrl}/images/logo.png`;

const title = "ByteMarket | Repuestos y Accesorios para Celulares en Perú";
const description =
  "Repuestos y accesorios de alta calidad para celulares en Perú: pantallas, baterías, flex, conectores y accesorios con garantía y envíos a todo el país.";

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: "website",
  ogUrl: `${siteUrl}/`,
  ogImage: logoUrl,
  twitterCard: "summary_large_image",
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: logoUrl,
});

/* =========================================
   DATOS ESTRUCTURADOS
   Apuntaban a otra marca (kite.pe) heredada de una plantilla previa.
========================================= */

useHead({
  script: [
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Store",
        name: siteName,
        url: `${siteUrl}/`,
        logo: logoUrl,
        image: logoUrl,
        description,
        areaServed: "PE",
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer service",
          telephone: "+51 923 821 520",
          areaServed: "PE",
          availableLanguage: ["es"],
        },
      }),
    },
    {
      type: "application/ld+json",
      innerHTML: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteName,
        url: `${siteUrl}/`,
        inLanguage: "es-PE",
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/productos?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      }),
    },
  ],
});
</script>

<style scoped>
.home {
  background: var(--surface-page);
  color: var(--ink-body);
}
</style>

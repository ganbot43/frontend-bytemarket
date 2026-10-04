<template>
  <div class="sn">
    <div class="cp-container">
      <nav class="sn__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="sn__crumb-now">Sobre nosotros</span>
      </nav>

      <header class="sn__head">
        <p class="cp-eyebrow">ByteMarket SAC</p>
        <h1 class="sn__title">Repuestos que sí encajan</h1>
        <p class="sn__lead">
          Vendemos repuestos y accesorios para celulares en el Perú. Preferimos
          un catálogo más corto y bien descrito antes que uno enorme donde nadie
          sabe qué está comprando.
        </p>
      </header>

      <!-- Cifras de la propia tienda, no inventadas: salen del catálogo
           publicado, así que siempre dicen la verdad. -->
      <ul class="sn__figures">
        <li>
          <span class="sn__fig-num">{{ pending ? "—" : piezas }}</span>
          <span class="sn__fig-label">Piezas en catálogo</span>
        </li>
        <li>
          <span class="sn__fig-num">{{ pending ? "—" : categorias }}</span>
          <span class="sn__fig-label">Categorías</span>
        </li>
        <li>
          <span class="sn__fig-num">24</span>
          <span class="sn__fig-label">Regiones con envío</span>
        </li>
      </ul>
    </div>

    <LandingAboutSection />

    <LandingBannerPromo
      variant="wide"
      tag="Hablemos"
      title="¿Buscas una pieza que no está en el catálogo?"
      text="Trabajamos con proveedores para modelos puntuales. Dinos qué necesitas y te decimos si podemos conseguirlo y en cuánto tiempo."
      cta="Ver catálogo"
      href="/productos"
      wa-message="Hola ByteMarket, busco una pieza que no encuentro en el catálogo"
    />

    <LandingContactSection />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "landing" });

const runtimeConfig = useRuntimeConfig();
const siteUrl = String(runtimeConfig.public.siteUrl || "https://bytemarket.pe").replace(/\/$/, "");

const { data, pending } = await useFetch<{ data: Array<{ productCount: number }> }>(
  "/api/categories",
  { query: { active: true }, key: "sobre-categorias", default: () => ({ data: [] }), lazy: true },
);

const conStock = computed(() => (data.value?.data ?? []).filter((c) => (c.productCount ?? 0) > 0));
const categorias = computed(() => conStock.value.length);
const piezas = computed(() =>
  conStock.value.reduce((acc, c) => acc + (c.productCount ?? 0), 0),
);

const description =
  "Conoce ByteMarket: repuestos y accesorios para celulares en Perú, con compatibilidad declarada, garantía y envíos a todo el país.";

useSeoMeta({
  title: "Sobre nosotros — ByteMarket",
  description,
  ogTitle: "Sobre nosotros — ByteMarket",
  ogDescription: description,
  ogType: "website",
  ogUrl: `${siteUrl}/sobre-nosotros`,
  ogImage: `${siteUrl}/images/logo.png`,
  twitterCard: "summary_large_image",
});
</script>

<style scoped>
.sn {
  background: var(--surface-page);
}

.sn__crumb {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  padding-top: var(--sp-6);
  margin-bottom: var(--sp-5);
}

.sn__crumb a:hover {
  color: var(--accent-strong);
}

.sn__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.sn__head {
  max-width: 58ch;
  margin-bottom: var(--sp-8);
}

.sn__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
  margin-top: var(--sp-2);
}

.sn__lead {
  font-size: var(--fs-body-lg);
  line-height: var(--leading-relaxed);
  color: var(--ink-muted);
  margin-top: var(--sp-3);
}

/* ── Cifras ── */
.sn__figures {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 0 var(--section-y-sm);
  padding: 0;
  list-style: none;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  overflow: hidden;
}

.sn__figures li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-5);
}

.sn__figures li + li {
  border-left: 1px solid var(--line-soft);
}

.sn__fig-num {
  font-size: 1.75rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.sn__fig-label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

@media (max-width: 560px) {
  .sn__figures {
    grid-template-columns: minmax(0, 1fr);
  }

  .sn__figures li {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    padding: var(--sp-3) var(--sp-4);
  }

  .sn__figures li + li {
    border-left: 0;
    border-top: 1px solid var(--line-soft);
  }

  .sn__fig-num {
    font-size: 1.25rem;
  }
}
</style>

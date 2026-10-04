<template>
  <div class="pd">
    <div class="cp-container">
      <!-- ═══ Migas ═══ -->
      <nav class="pd__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <NuxtLink to="/productos">Catálogo</NuxtLink>
        <template v-if="producto?.category">
          <span aria-hidden="true">/</span>
          <NuxtLink :to="`/productos?categoria=${producto.category.slug}`">
            {{ producto.category.name }}
          </NuxtLink>
        </template>
        <span aria-hidden="true">/</span>
        <span class="pd__crumb-now">{{ producto?.name ?? "Cargando…" }}</span>
      </nav>

      <!-- ═══ Error ═══ -->
      <div v-if="loadError && !producto" class="pd__state">
        <h1 class="pd__state-title">No pudimos cargar este producto</h1>
        <p class="pd__state-text">{{ errorMessage }}</p>
        <div class="pd__state-actions">
          <button type="button" class="btn btn-primary btn-sm" @click="() => refreshProduct()">
            Reintentar
          </button>
          <NuxtLink to="/productos" class="btn btn-outline btn-sm">Volver al catálogo</NuxtLink>
        </div>
      </div>

      <!-- ═══ Carga ═══ -->
      <div v-else-if="!producto" class="pd__grid">
        <div class="cp-skeleton pd__sk-media" />
        <div class="pd__sk-info">
          <div class="cp-skeleton pd__sk-line" style="width: 30%" />
          <div class="cp-skeleton pd__sk-line" style="width: 78%; height: 30px" />
          <div class="cp-skeleton pd__sk-line" style="width: 42%; height: 38px" />
          <div class="cp-skeleton pd__sk-line" style="width: 100%; height: 48px" />
          <div class="cp-skeleton pd__sk-line" style="width: 92%" />
          <div class="cp-skeleton pd__sk-line" style="width: 70%" />
        </div>
      </div>

      <!-- ═══ Ficha ═══ -->
      <div v-else class="pd__grid">
        <EcommerceGaleriaProducto :producto="producto" />

        <EcommerceInfoProducto
          :producto="producto"
          :estoy-agregando="estoyAgregando"
          @agregar-al-carrito="manejarAgregarAlCarrito"
        />
      </div>
    </div>

    <!-- ═══ Relacionados ═══
         Misma fila que la portada: el usuario ya sabe cómo se lee. -->
    <LandingFilaProductos
      v-if="similares.length"
      class="pd__similar"
      eyebrow="Del mismo tipo"
      title="También te puede interesar"
      layout="rail"
      :limit="12"
      :products="similares"
      href="/productos"
      link-label="Ver catálogo"
    />
  </div>
</template>

<script setup lang="ts">
import type { DisplayProduct } from "~/composables/useProductDisplay";

definePageMeta({ layout: "default" });

const route = useRoute();
const cartStore = useCartStore();
const toast = useAppToast();

const estoyAgregando = ref(false);

async function fetchWithTimeout<T>(
  url: string,
  options: Record<string, any> = {},
  timeoutMs = 12000,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return (await $fetch<T>(url, { ...options, signal: controller.signal })) as T;
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new Error(`La solicitud superó los ${Math.round(timeoutMs / 1000)}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

const slug = computed(() => String(route.params.slug));

const {
  data: productData,
  error: loadError,
  refresh: refreshProduct,
} = await useAsyncData<any>(
  () => `producto-${slug.value}`,
  () => fetchWithTimeout<any>(`/api/products/${slug.value}`, {}, 12000),
  { lazy: true, watch: [slug] },
);

const producto = computed<any>(() => productData.value ?? null);

const errorMessage = computed(
  () => loadError.value?.message ?? "No pudimos cargar el producto.",
);

const { data: similaresData } = await useAsyncData<{ data: DisplayProduct[] }>(
  () => `similares-${slug.value}`,
  async () => {
    if (!producto.value?.id) return { data: [] };
    return await fetchWithTimeout<{ data: DisplayProduct[] }>(
      `/api/products/similar?productId=${producto.value.id}`,
      {},
      12000,
    );
  },
  { server: false, lazy: true, watch: [() => producto.value?.id] },
);

const similares = computed(() => similaresData.value?.data ?? []);

/* ── SEO ──
   Cada ficha necesita su propio título y descripción: antes todas
   compartían "Producto — ByteMarket", compitiendo entre sí. */
const runtimeConfig = useRuntimeConfig();
const siteUrl = String(runtimeConfig.public.siteUrl || "https://bytemarket.pe").replace(/\/$/, "");

const seoDescription = computed(
  () =>
    producto.value?.description?.slice(0, 160) ||
    "Repuestos y accesorios para celulares con garantía en Perú.",
);

const seoImage = computed(() => {
  const imgs = producto.value?.images ?? [];
  return imgs.find((i: any) => i.isPrimary)?.url ?? imgs[0]?.url ?? `${siteUrl}/images/logo.png`;
});

useSeoMeta({
  title: () => (producto.value?.name ? `${producto.value.name} — ByteMarket` : "Producto — ByteMarket"),
  description: seoDescription,
  ogTitle: () => (producto.value?.name ? `${producto.value.name} — ByteMarket` : "Producto — ByteMarket"),
  ogDescription: seoDescription,
  ogType: "website",
  ogImage: seoImage,
  twitterCard: "summary_large_image",
  twitterImage: seoImage,
});

/* Datos estructurados de producto: es lo que permite que el precio y
   la disponibilidad aparezcan en el resultado de búsqueda. */
useHead(() => ({
  script: producto.value
    ? [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: producto.value.name,
            description: seoDescription.value,
            image: seoImage.value,
            sku: producto.value.slug,
            category: producto.value.category?.name,
            offers: {
              "@type": "Offer",
              url: `${siteUrl}/productos/${producto.value.slug}`,
              priceCurrency: "PEN",
              price: Number(producto.value.price ?? 0).toFixed(2),
              availability:
                producto.value.trackStock === false || (producto.value.stock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
      ]
    : [],
}));

async function manejarAgregarAlCarrito(cantidad: number) {
  if (!producto.value) return;
  estoyAgregando.value = true;

  const images = producto.value.images ?? [];
  const image = images.find((i: any) => i.isPrimary)?.url ?? images[0]?.url ?? undefined;

  cartStore.add({
    id: producto.value.id,
    name: producto.value.name,
    price: producto.value.price,
    originalPrice:
      Number(producto.value.comparePrice ?? 0) > Number(producto.value.price)
        ? Number(producto.value.comparePrice)
        : undefined,
    quantity: cantidad,
    image,
    stock: producto.value.trackStock === false ? undefined : producto.value.stock,
  });

  toast.add({
    title: "Agregado al carrito",
    description: `${producto.value.name}${cantidad > 1 ? ` · ${cantidad} unidades` : ""}`,
    color: "success",
  });

  await new Promise((r) => setTimeout(r, 420));
  estoyAgregando.value = false;
}
</script>

<style scoped>
.pd {
  padding-block: var(--sp-6) 0;
}

/* ── Migas ── */
.pd__crumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-6);
}

.pd__crumb a:hover {
  color: var(--accent-strong);
}

.pd__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
  max-width: 38ch;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Ficha ──
   Dos columnas con la galería algo más ancha: la foto es lo que se
   inspecciona, el panel es lo que se lee. */
.pd__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: clamp(1.5rem, 1rem + 2.6vw, 3.5rem);
  align-items: start;
  padding-bottom: var(--section-y-sm);
}

/* ── Esqueleto ── */
.pd__sk-media {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-lg);
}

.pd__sk-info {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.pd__sk-line {
  height: 14px;
}

/* ── Estados ── */
.pd__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-16) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  margin-bottom: var(--section-y-sm);
}

.pd__state-title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.pd__state-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 48ch;
}

.pd__state-actions {
  display: flex;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
}

/* ── Relacionados ── */
.pd__similar {
  border-top: 1px solid var(--line-soft);
  background: var(--surface-sunken);
}

@media (max-width: 900px) {
  .pd__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>

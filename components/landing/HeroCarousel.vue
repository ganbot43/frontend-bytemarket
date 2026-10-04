<template>
  <section class="hc" id="inicio" aria-label="Promociones destacadas">
    <div class="hc__container">
      <!-- ═══ Carrusel ═══ -->
      <div
        class="hc__stage"
        role="region"
        aria-roledescription="carrusel"
        :aria-label="`${slides.length} promociones`"
        tabindex="0"
        @mouseenter="hovering = true"
        @mouseleave="hovering = false"
        @focusin="hovering = true"
        @focusout="hovering = false"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @pointercancel="dragX = null"
        @keydown.left.prevent="go(index - 1)"
        @keydown.right.prevent="go(index + 1)"
      >
        <div class="hc__viewport">
          <div class="hc__track" :style="{ transform: `translate3d(${-index * 100}%, 0, 0)` }">
            <component
              v-for="(slide, i) in slides"
              :is="slide.href ? resolveTag(slide.href) : 'div'"
              :key="slide.key"
              v-bind="slideAttrs(slide)"
              class="hc__slide"
              :aria-hidden="i !== index"
              :inert="i !== index ? true : undefined"
            >
              <!-- Fondo: imagen del panel, o la superficie de marca
                   cuando el banner es solo texto. -->
              <span class="hc__bg" :class="{ 'hc__bg--brand': !slide.image }">
                <SharedImagen
                  v-if="slide.image"
                  :src="slide.image"
                  :alt="slide.title || slide.alt"
                  fit="cover"
                  :eager="i === 0"
                />
              </span>

              <!-- Velo de legibilidad: solo si hay texto encima. Un banner
                   que ya trae el mensaje dibujado se muestra limpio. -->
              <span v-if="slide.hasText" class="hc__scrim" :class="`hc__scrim--${slide.align}`" aria-hidden="true" />

              <span v-if="slide.hasText" class="hc__body" :class="`hc__body--${slide.align}`">
                <span v-if="slide.eyebrow" class="hc__eyebrow">{{ slide.eyebrow }}</span>
                <span v-if="slide.title" class="hc__title">{{ slide.title }}</span>
                <span v-if="slide.subtitle" class="hc__lead">{{ slide.subtitle }}</span>
                <span v-if="slide.ctaLabel" class="hc__cta">
                  {{ slide.ctaLabel }}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </span>
            </component>
          </div>
        </div>

        <!-- Flechas — solo si hay más de una lámina -->
        <template v-if="slides.length > 1">
          <button type="button" class="hc__arrow hc__arrow--prev" aria-label="Promoción anterior" @click.prevent="go(index - 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>

          <button type="button" class="hc__arrow hc__arrow--next" aria-label="Promoción siguiente" @click.prevent="go(index + 1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>

          <!-- Indicadores: barras, no puntos. Una barra puede mostrar
               el avance del autoplay; un punto no. -->
          <div class="hc__dots" role="tablist" aria-label="Elegir promoción">
            <button
              v-for="(slide, i) in slides"
              :key="`dot-${slide.key}`"
              type="button"
              role="tab"
              class="hc__dot"
              :class="{ 'is-active': i === index }"
              :aria-selected="i === index"
              :aria-label="slide.title || `Promoción ${i + 1}`"
              @click="go(i)"
            >
              <span class="hc__dot-fill" :class="{ 'is-running': i === index && autoplayRunning }" />
            </button>
          </div>
        </template>
      </div>

      <!-- ═══ Dos accesos fijos ═══
           No rotan a propósito: son las dos cosas que la tienda quiere
           que estén siempre a un clic, pase lo que pase en el carrusel. -->
      <aside class="hc__side">
        <NuxtLink to="/productos?nuevoLanzamiento=1" class="hc__tile">
          <span class="hc__tile-tag">Recién llegado</span>
          <span class="hc__tile-title">Últimos ingresos al almacén</span>
          <span class="hc__tile-note">Pantallas, baterías y flex de los modelos más pedidos.</span>
          <span class="hc__tile-go">
            Ver novedades
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </NuxtLink>

        <a
          :href="waLink('Hola ByteMarket, necesito ayuda para identificar un repuesto para mi equipo')"
          target="_blank"
          rel="noopener noreferrer"
          class="hc__tile hc__tile--wa cp-dark"
        >
          <span class="hc__tile-tag">¿No sabes cuál es?</span>
          <span class="hc__tile-title">Te decimos qué pieza lleva tu modelo</span>
          <span class="hc__tile-note">Escríbenos el modelo y te confirmamos compatibilidad.</span>
          <span class="hc__tile-go">
            <LandingWaIcon :size="15" />
            Consultar por WhatsApp
          </span>
        </a>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { resolveComponent } from "vue";

type Banner = {
  id: number;
  imageUrl: string;
  linkUrl: string | null;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  align: "left" | "center" | "right";
};

type Slide = {
  key: string | number;
  image: string | null;
  alt: string;
  href: string | null;
  eyebrow: string | null;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  align: "left" | "center" | "right";
  hasText: boolean;
};

const { waLink } = useWhatsapp();

/* Los banners los administra la tienda desde /admin/banners: imagen,
   titular, bajada y llamada a la acción. Si no hay ninguno activo la
   portada no puede quedarse en blanco: se cae a un juego propio de
   láminas con el mismo lenguaje visual. */
const { data: bannerData } = await useFetch<{ data: Banner[] }>("/api/banners", {
  query: { active: true },
  key: "hero-banners",
  default: () => ({ data: [] }),
});

const fallbackSlides: Slide[] = [
  {
    key: "fb-1",
    image: null,
    alt: "",
    href: "/productos",
    eyebrow: "Repuestos con garantía",
    title: "La pieza correcta, a la primera",
    subtitle:
      "Catálogo ordenado por modelo, con el tipo de repuesto declarado y el stock tal como está.",
    ctaLabel: "Ver catálogo",
    align: "left",
    hasText: true,
  },
  {
    key: "fb-2",
    image: null,
    alt: "",
    href: "/productos?nuevoLanzamiento=1",
    eyebrow: "Novedades",
    title: "Lo último que entró al almacén",
    subtitle:
      "Pantallas, baterías y accesorios de los equipos que más se reparan este mes.",
    ctaLabel: "Ver novedades",
    align: "left",
    hasText: true,
  },
  {
    key: "fb-3",
    image: null,
    alt: "",
    href: "/sobre-nosotros",
    eyebrow: "ByteMarket SAC",
    title: "Vendemos repuestos, no sorpresas",
    subtitle:
      "El precio que ves es el que pagas. Envíos a todo el Perú y asesoría por modelo.",
    ctaLabel: "Conocer más",
    align: "left",
    hasText: true,
  },
];

const slides = computed<Slide[]>(() => {
  const banners = bannerData.value?.data ?? [];
  if (!banners.length) return fallbackSlides;

  return banners.map((b, i) => ({
    key: b.id,
    image: b.imageUrl || null,
    alt: b.title || `Promoción ${i + 1} de ByteMarket`,
    href: b.linkUrl || null,
    eyebrow: b.eyebrow,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.ctaLabel,
    align: b.align || "left",
    /* Sin ningún campo de texto el banner se muestra limpio: el velo y
       el bloque sobran cuando el arte ya trae el mensaje dibujado. */
    hasText: Boolean(b.eyebrow || b.title || b.subtitle || b.ctaLabel),
  }));
});

/* ── Navegación ── */
const index = ref(0);
const hovering = ref(false);

/* Si el administrador borra banners mientras la página está abierta el
   índice puede quedar fuera de rango. */
watch(slides, (list) => {
  if (index.value > list.length - 1) index.value = 0;
});

function go(next: number) {
  const total = slides.value.length;
  if (total <= 1) return;
  index.value = (next + total) % total;
  restart();
}

/* ── Autoplay ──
   Seis segundos: tiempo de leer un banner sin que la página se sienta
   inquieta. Se detiene con el cursor encima, con el foco dentro y
   cuando la pestaña no está visible. */
const AUTOPLAY_MS = 6000;
let timer: ReturnType<typeof setInterval> | null = null;
const reduceMotion = ref(false);
const pageVisible = ref(true);

const autoplayRunning = computed(
  () =>
    slides.value.length > 1 && !hovering.value && !reduceMotion.value && pageVisible.value,
);

function restart() {
  stop();
  if (!autoplayRunning.value) return;
  timer = setInterval(() => {
    index.value = (index.value + 1) % slides.value.length;
  }, AUTOPLAY_MS);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

watch(autoplayRunning, (running) => (running ? restart() : stop()));

/* ── Arrastre táctil ── */
const dragX = ref<number | null>(null);

function onPointerDown(event: PointerEvent) {
  if (event.pointerType === "mouse") return;
  dragX.value = event.clientX;
}

function onPointerUp(event: PointerEvent) {
  if (dragX.value === null) return;
  const delta = event.clientX - dragX.value;
  dragX.value = null;
  /* 45px de umbral: por debajo es un toque, no un gesto. */
  if (Math.abs(delta) < 45) return;
  go(index.value + (delta < 0 ? 1 : -1));
}

/* ── Enlaces ──
   Los banners pueden apuntar fuera del sitio; los internos deben usar
   NuxtLink para no recargar la aplicación entera. */
const NuxtLinkComponent = resolveComponent("NuxtLink");

const isExternal = (href: string) => /^https?:\/\//i.test(href);

function resolveTag(href: string) {
  return isExternal(href) ? "a" : NuxtLinkComponent;
}

function slideAttrs(slide: Slide) {
  if (!slide.href) return {};
  return isExternal(slide.href)
    ? { href: slide.href, target: "_blank", rel: "noopener noreferrer" }
    : { to: slide.href };
}

function onVisibility() {
  pageVisible.value = document.visibilityState === "visible";
}

onMounted(() => {
  reduceMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("visibilitychange", onVisibility);
  restart();
});

onUnmounted(() => {
  stop();
  document.removeEventListener("visibilitychange", onVisibility);
});
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   CARRUSEL DE PORTADA

   Un carrusel ancho + dos accesos fijos al costado. La
   proporción es la de un banner de tienda (21:9), no la
   de un hero de landing: aquí se vende, no se presenta.

   Imagen y texto vienen del panel; el componente solo
   decide cómo componerlos para que siempre se lean.
═══════════════════════════════════════════════════════ */

.hc {
  /* Simétrico: el mismo aire por arriba y por abajo. */
  padding-block: var(--sp-5);
  background: var(--surface-page);
}

.hc__container {
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--container-pad);
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: var(--sp-4);
  align-items: stretch;
}

/* ── Escenario ── */
.hc__stage {
  position: relative;
  display: flex;
  flex-direction: column;
  /* width y min-width fijan el ancho a la columna. Sin ellos, al
     estirarse en altura el aspect-ratio recalculaba el ANCHO
     (alto × 21/9) y el carrusel se salía sobre la columna de accesos.
     Con el ancho anclado, la proporción solo puede afectar al alto. */
  width: 100%;
  min-width: 0;
  aspect-ratio: 21 / 9;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-sunken);
  border: 1px solid var(--line-soft);
}

.hc__stage:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* flex:1 + min-height:0 — el carril ocupa todo el alto disponible del
   escenario, se estire lo que se estire la fila. */
.hc__viewport {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.hc__track {
  display: flex;
  height: 100%;
  transition: transform var(--t-slower) var(--ease-smooth);
  will-change: transform;
}

.hc__slide {
  position: relative;
  flex: 0 0 100%;
  height: 100%;
  display: block;
  overflow: hidden;
}

/* ── Fondo ── */
.hc__bg {
  position: absolute;
  inset: 0;
  display: block;
  background: var(--surface-sunken);
}

/* Sin imagen: superficie de marca con retícula técnica tenue, que da
   textura sin introducir un color nuevo. */
.hc__bg--brand {
  background: var(--grad-brand);
}

.hc__bg--brand::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: linear-gradient(100deg, transparent 38%, #000 100%);
}

/* ── Velo de legibilidad ──
   Degradado desde el lado donde se ancla el texto: el titular queda
   sobre zona oscura y la foto se ve limpia del otro lado. */
.hc__scrim {
  position: absolute;
  inset: 0;
}

.hc__scrim--left {
  background: linear-gradient(
    90deg,
    rgba(7, 30, 82, 0.88) 0%,
    rgba(7, 30, 82, 0.66) 38%,
    rgba(7, 30, 82, 0.12) 72%,
    transparent 100%
  );
}

.hc__scrim--right {
  background: linear-gradient(
    270deg,
    rgba(7, 30, 82, 0.88) 0%,
    rgba(7, 30, 82, 0.66) 38%,
    rgba(7, 30, 82, 0.12) 72%,
    transparent 100%
  );
}

.hc__scrim--center {
  background: linear-gradient(
    180deg,
    rgba(7, 30, 82, 0.5) 0%,
    rgba(7, 30, 82, 0.72) 100%
  );
}

/* ── Texto ── */
.hc__body {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--sp-3);
  padding: clamp(1.5rem, 1rem + 3vw, 3.5rem);
}

.hc__body--left {
  align-items: flex-start;
  text-align: left;
  padding-right: 38%;
}

.hc__body--right {
  align-items: flex-end;
  text-align: right;
  padding-left: 38%;
}

.hc__body--center {
  align-items: center;
  text-align: center;
}

.hc__eyebrow {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--cp-cyan-300);
}

.hc__title {
  font-size: clamp(1.5rem, 1rem + 2.4vw, 2.75rem);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  line-height: 1.08;
  color: #fff;
  max-width: 20ch;
  text-wrap: balance;
}

.hc__body--center .hc__title {
  max-width: 26ch;
}

.hc__lead {
  font-size: var(--fs-sm);
  line-height: var(--leading-normal);
  color: rgba(232, 246, 255, 0.85);
  max-width: 44ch;
}

.hc__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  margin-top: var(--sp-2);
  padding: 0 var(--sp-6);
  border-radius: var(--radius-sm);
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  transition: background var(--t-base) var(--ease-smooth);
}

.hc__cta svg {
  width: 15px;
  height: 15px;
}

.hc__slide:hover .hc__cta {
  background: var(--cp-cyan-300);
}

/* ── Flechas ── */
.hc__arrow {
  position: absolute;
  top: 50%;
  z-index: 2;
  transform: translateY(-50%);
  width: 38px;
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line-soft);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--cp-navy-900);
  opacity: 0;
  transition:
    opacity var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.hc__arrow svg {
  width: 17px;
  height: 17px;
}

.hc__arrow:hover {
  background: #fff;
}

.hc__arrow--prev {
  left: var(--sp-4);
}
.hc__arrow--next {
  right: var(--sp-4);
}

/* Aparecen al acercarse: un banner limpio se lee mejor sin controles
   permanentes encima. En táctil siempre están (no hay hover). */
.hc__stage:hover .hc__arrow,
.hc__stage:focus-within .hc__arrow {
  opacity: 1;
}

@media (hover: none) {
  .hc__arrow {
    opacity: 1;
  }
}

/* ── Indicadores ── */
.hc__dots {
  position: absolute;
  left: var(--sp-5);
  bottom: var(--sp-4);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-pill);
  background: rgba(7, 30, 82, 0.4);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.hc__dot {
  width: 26px;
  height: 4px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.35);
  overflow: hidden;
  transition: width var(--t-base) var(--ease-smooth);
}

.hc__dot.is-active {
  width: 40px;
  background: rgba(255, 255, 255, 0.3);
}

.hc__dot-fill {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: #fff;
  transform-origin: left center;
  transform: scaleX(0);
}

.hc__dot.is-active .hc__dot-fill {
  transform: scaleX(1);
}

/* La barra activa se llena al ritmo del autoplay: el usuario ve cuánto
   falta para el cambio en vez de que la lámina salte sin aviso. */
.hc__dot.is-active .hc__dot-fill.is-running {
  animation: hc-fill 6000ms linear forwards;
}

@keyframes hc-fill {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

/* ── Accesos laterales ── */
.hc__side {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: var(--sp-4);
  min-width: 0;
}

.hc__tile {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  color: var(--ink-body);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.hc__tile:hover {
  border-color: var(--line);
  box-shadow: var(--shadow-sm);
}

.hc__tile--wa {
  background: var(--cp-navy-900);
  border-color: transparent;
}

.hc__tile--wa:hover {
  border-color: var(--accent-line);
}

.hc__tile-tag {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.hc__tile-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-snug);
  color: var(--ink-strong);
}

.hc__tile-note {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
}

.hc__tile-go {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  padding-top: var(--sp-3);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--accent-strong);
}

.hc__tile-go svg {
  width: 14px;
  height: 14px;
  transition: transform var(--t-base) var(--ease-smooth);
}

.hc__tile:hover .hc__tile-go svg {
  transform: translateX(3px);
}

/* ═══ Responsive ═══ */

/* Los accesos pasan debajo y se ponen en fila. */
@media (max-width: 1100px) {
  .hc__container {
    grid-template-columns: minmax(0, 1fr);
  }

  .hc__side {
    grid-template-rows: none;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hc__stage {
    aspect-ratio: 16 / 7;
  }
}

@media (max-width: 720px) {
  .hc {
    padding-block: var(--sp-3);
  }

  .hc__container {
    gap: var(--sp-3);
  }

  .hc__side {
    grid-template-columns: minmax(0, 1fr);
  }

  /* Más alto en móvil: un 21:9 en 390px de ancho es una franja. */
  .hc__stage {
    aspect-ratio: 5 / 4;
  }

  .hc__stage,
  .hc__tile {
    border-radius: var(--radius);
  }

  /* El texto se ancla abajo y ocupa todo el ancho: en vertical no hay
     sitio para reservar el 38% al arte. */
  .hc__body,
  .hc__body--left,
  .hc__body--right,
  .hc__body--center {
    justify-content: flex-end;
    align-items: flex-start;
    text-align: left;
    padding: var(--sp-5);
    padding-bottom: var(--sp-10);
  }

  .hc__scrim--left,
  .hc__scrim--right,
  .hc__scrim--center {
    background: linear-gradient(
      180deg,
      rgba(7, 30, 82, 0.15) 0%,
      rgba(7, 30, 82, 0.82) 72%,
      rgba(7, 30, 82, 0.92) 100%
    );
  }

  .hc__arrow {
    width: 32px;
    height: 32px;
  }

  .hc__arrow--prev {
    left: var(--sp-2);
  }
  .hc__arrow--next {
    right: var(--sp-2);
  }

  .hc__dots {
    left: 50%;
    transform: translateX(-50%);
    bottom: var(--sp-3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hc__track {
    transition: none;
  }

  .hc__dot-fill {
    animation: none !important;
  }
}
</style>

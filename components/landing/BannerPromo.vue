<template>
  <!-- Banda promocional para cortar el ritmo entre filas de producto.
       Dos variantes:
         · split — dos mensajes lado a lado, superficie clara
         · wide  — una sola banda oscura, a todo el ancho
       Alternarlas es lo que evita que la portada se sienta repetida. -->
  <section class="bp" :class="`bp--${variant}`">
    <div class="cp-container">
      <!-- ═══ Dos mensajes ═══ -->
      <div v-if="variant === 'split'" class="bp__split">
        <NuxtLink
          v-for="card in cards"
          :key="card.title"
          :to="card.href"
          class="bp__card"
        >
          <span class="bp__tag">{{ card.tag }}</span>
          <span class="bp__title">{{ card.title }}</span>
          <span class="bp__text">{{ card.text }}</span>
          <span class="bp__go">
            {{ card.cta }}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </NuxtLink>
      </div>

      <!-- ═══ Banda única ═══ -->
      <div v-else class="bp__wide cp-dark">
        <div class="bp__wide-body">
          <p class="bp__tag">{{ tag }}</p>
          <h2 class="bp__wide-title">{{ title }}</h2>
          <p class="bp__wide-text">{{ text }}</p>
        </div>

        <div class="bp__wide-actions">
          <NuxtLink :to="href" class="bp__btn bp__btn--solid">{{ cta }}</NuxtLink>
          <a
            :href="waLink(waMessage)"
            target="_blank"
            rel="noopener noreferrer"
            class="bp__btn bp__btn--quiet"
          >
            <LandingWaIcon :size="15" />
            Consultar
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: "split" | "wide";
    tag?: string;
    title?: string;
    text?: string;
    cta?: string;
    href?: string;
    waMessage?: string;
  }>(),
  {
    variant: "wide",
    tag: "Asesoría técnica",
    title: "¿No estás seguro de qué pieza lleva tu equipo?",
    text: "Dinos marca y modelo y te confirmamos la compatibilidad antes de que compres. Cambiar un repuesto equivocado cuesta más que preguntar.",
    cta: "Ver catálogo",
    href: "/productos",
    waMessage: "Hola ByteMarket, necesito ayuda para identificar un repuesto",
  },
);

const { waLink } = useWhatsapp();

const cards = [
  {
    tag: "Novedades",
    title: "Lo último que entró al almacén",
    text: "Las piezas de los modelos que más se están reparando este mes.",
    cta: "Ver novedades",
    href: "/productos?nuevoLanzamiento=1",
  },
  {
    tag: "Catálogo completo",
    title: "Filtra por categoría, modelo y precio",
    text: "Pantallas, baterías, flex, conectores y accesorios, todo en un solo lugar.",
    cta: "Explorar catálogo",
    href: "/productos",
  },
];
</script>

<style scoped>
/* Mismo ritmo que el resto de secciones: con 16px el banner quedaba
   pegado a las filas de producto y rompía la cadencia de la página. */
.bp {
  padding-block: var(--section-y-sm);
}

/* ═══ Variante split ═══ */
.bp__split {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
}

.bp__card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--sp-6);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
  background: var(--surface-sunken);
  color: var(--ink-body);
  overflow: hidden;
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

/* Filete cyan que se enciende al acercarse: la firma de la marca en su
   dosis mínima, sin gradientes de relleno. */
.bp__card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--edge-lit);
  opacity: 0;
  transition: opacity var(--t-base) var(--ease-smooth);
}

.bp__card:hover {
  border-color: var(--line);
  background: var(--surface-raised);
}

.bp__card:hover::before {
  opacity: 1;
}

.bp__tag {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.bp__title {
  font-size: var(--fs-h3);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  line-height: var(--leading-snug);
  color: var(--ink-strong);
  max-width: 22ch;
}

.bp__text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
  max-width: 44ch;
}

.bp__go {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: var(--sp-3);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  color: var(--accent-strong);
}

.bp__go svg {
  width: 14px;
  height: 14px;
  transition: transform var(--t-base) var(--ease-smooth);
}

.bp__card:hover .bp__go svg {
  transform: translateX(3px);
}

/* ═══ Variante wide ═══ */
.bp__wide {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-8);
  padding: clamp(1.75rem, 1.2rem + 2.4vw, 3.25rem);
  border-radius: var(--radius-lg);
  background: var(--grad-brand);
  overflow: hidden;
}

.bp__wide::after {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(100deg, transparent 45%, #000 100%);
  pointer-events: none;
}

.bp__wide-body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.bp__wide-title {
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  line-height: 1.12;
  color: #fff;
  max-width: 24ch;
}

.bp__wide-text {
  font-size: var(--fs-sm);
  line-height: var(--leading-normal);
  color: rgba(232, 246, 255, 0.8);
  max-width: 52ch;
}

.bp__wide-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-shrink: 0;
}

.bp__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 var(--sp-6);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  white-space: nowrap;
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth);
}

.bp__btn--solid {
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
}

.bp__btn--solid:hover {
  background: var(--cp-cyan-300);
  color: var(--cp-navy-900);
}

.bp__btn--quiet {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.28);
  color: #fff;
}

.bp__btn--quiet:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.45);
  color: #fff;
}

/* ═══ Responsive ═══ */
@media (max-width: 860px) {
  .bp__split {
    grid-template-columns: minmax(0, 1fr);
  }

  .bp__wide {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-5);
  }

  .bp__wide-actions {
    width: 100%;
  }

  .bp__btn {
    flex: 1;
  }
}

@media (max-width: 520px) {
  .bp__card {
    padding: var(--sp-5);
  }

  .bp__wide,
  .bp__card {
    border-radius: var(--radius);
  }
}
</style>

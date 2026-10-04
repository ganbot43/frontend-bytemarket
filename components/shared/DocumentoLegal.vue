<template>
  <article class="dl">
    <div class="cp-container">
      <nav class="dl__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="dl__crumb-now">{{ titulo }}</span>
      </nav>

      <header class="dl__head">
        <h1 class="dl__title">{{ titulo }}</h1>
        <p v-if="entrada" class="dl__lead">{{ entrada }}</p>
        <p v-if="actualizado" class="dl__meta">Última actualización: {{ actualizado }}</p>
      </header>

      <div class="dl__grid">
        <!-- Índice lateral: estos documentos se consultan buscando un
             punto concreto, no se leen de principio a fin. -->
        <nav v-if="secciones.length > 2" class="dl__toc" aria-label="Contenido">
          <p class="dl__toc-title">En esta página</p>
          <ol>
            <li v-for="(s, i) in secciones" :key="s.titulo">
              <a :href="`#${idDe(s.titulo, i)}`">{{ s.titulo }}</a>
            </li>
          </ol>
        </nav>

        <div class="dl__body">
          <section
            v-for="(s, i) in secciones"
            :id="idDe(s.titulo, i)"
            :key="s.titulo"
            class="dl__section"
          >
            <h2 class="dl__section-title">
              <span class="dl__num">{{ i + 1 }}</span>
              {{ s.titulo }}
            </h2>
            <p v-for="(p, j) in s.parrafos" :key="j" class="dl__p">{{ p }}</p>
          </section>

          <slot />

          <footer class="dl__foot">
            <p>
              ¿Tienes dudas sobre este documento?
              <a :href="waLink(`Hola, tengo una consulta sobre ${titulo.toLowerCase()}`)" target="_blank" rel="noopener noreferrer">
                Escríbenos por WhatsApp
              </a>
              o visita el
              <NuxtLink to="/libro-de-reclamaciones">libro de reclamaciones</NuxtLink>.
            </p>
          </footer>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
export type SeccionLegal = { titulo: string; parrafos: string[] };

withDefaults(
  defineProps<{
    titulo: string;
    entrada?: string;
    actualizado?: string;
    secciones?: SeccionLegal[];
  }>(),
  { secciones: () => [] },
);

const { waLink } = useWhatsapp();

/* Ancla estable a partir del título: permite enlazar a un punto
   concreto ("…/terminos#garantia") desde una conversación. */
const idDe = (titulo: string, i: number) =>
  titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `seccion-${i + 1}`;
</script>

<style scoped>
.dl {
  padding-block: var(--sp-6) var(--section-y);
}

.dl__crumb {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-5);
}

.dl__crumb a:hover {
  color: var(--accent-strong);
}

.dl__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.dl__head {
  padding-bottom: var(--sp-6);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-8);
}

.dl__title {
  font-size: var(--fs-h1);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.dl__lead {
  font-size: var(--fs-body-lg);
  line-height: var(--leading-relaxed);
  color: var(--ink-muted);
  max-width: 70ch;
  margin-top: var(--sp-3);
}

.dl__meta {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-top: var(--sp-4);
}

/* ── Disposición ── */
.dl__grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: var(--sp-10);
  align-items: start;
}

.dl__toc {
  position: sticky;
  top: calc(var(--header-total) + var(--sp-4));
  padding: var(--sp-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-sunken);
}

.dl__toc-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: var(--sp-3);
}

.dl__toc ol {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: toc;
}

.dl__toc li {
  counter-increment: toc;
}

.dl__toc a {
  display: flex;
  gap: 8px;
  font-size: var(--fs-xs);
  line-height: var(--leading-snug);
  color: var(--ink-muted);
  transition: color var(--t-fast) var(--ease-smooth);
}

.dl__toc a::before {
  content: counter(toc) ".";
  font-weight: var(--fw-bold);
  color: var(--ink-faint);
  flex-shrink: 0;
}

.dl__toc a:hover {
  color: var(--accent-strong);
}

/* ── Cuerpo ── */
.dl__body {
  /* Medida de lectura: una línea de 120 caracteres cansa y se pierde
     el renglón al volver. */
  max-width: 72ch;
}

.dl__section + .dl__section {
  margin-top: var(--sp-8);
}

/* Compensa la cabecera fija al saltar desde el índice. */
.dl__section {
  scroll-margin-top: calc(var(--header-total) + var(--sp-4));
}

.dl__section-title {
  display: flex;
  align-items: baseline;
  gap: var(--sp-3);
  font-size: var(--fs-h3);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  margin-bottom: var(--sp-3);
}

.dl__num {
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  color: var(--accent-strong);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.dl__p {
  font-size: var(--fs-body);
  line-height: var(--leading-relaxed);
  color: var(--ink-body);
}

.dl__p + .dl__p {
  margin-top: var(--sp-3);
}

.dl__foot {
  margin-top: var(--sp-10);
  padding-top: var(--sp-5);
  border-top: 1px solid var(--line-soft);
  font-size: var(--fs-sm);
  color: var(--ink-muted);
}

.dl__foot a {
  color: var(--accent-strong);
  font-weight: var(--fw-semibold);
  text-decoration: underline;
  text-underline-offset: 2px;
}

@media (max-width: 900px) {
  .dl__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-6);
  }

  /* El índice deja de acompañar el scroll y pasa arriba, plegado en
     una caja compacta. */
  .dl__toc {
    position: static;
  }
}
</style>

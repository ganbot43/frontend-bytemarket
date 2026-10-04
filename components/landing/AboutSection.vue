<template>
  <section class="about" id="nosotros">
    <div class="about__container">
      <!-- ── Declaración ── -->
      <div class="about__statement">
        <p class="about__label">Sobre ByteMarket</p>

        <p class="about__lead">
          Vendemos repuestos y accesorios para celulares en el Perú:
          pantallas, baterías, conectores, flex y accesorios para las
          marcas que la gente realmente usa.
        </p>

        <p class="about__body">
          Nuestro criterio de compra es simple: preferimos un catálogo más
          corto y bien descrito antes que uno enorme donde nadie sabe qué
          está comprando. Cada pieza indica su tipo y el modelo al que
          corresponde, y el precio es el que ves —sin sorpresas al final.
        </p>

        <div class="about__cta">
          <NuxtLink to="/productos" class="about__btn about__btn--solid">
            Ver catálogo
          </NuxtLink>
          <NuxtLink to="/sobre-nosotros" class="about__btn about__btn--quiet">
            Conocer más
          </NuxtLink>
        </div>
      </div>

      <!-- ── Pilares ──
           Fila de términos separados por filete vertical: se leen
           como una franja de datos, no como tarjetas con palomita. -->
      <ul class="about__pillars">
        <li v-for="p in pillars" :key="p.label" class="about__pillar">
          <span class="about__pillar-label">{{ p.label }}</span>
          <span class="about__pillar-note">{{ p.note }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const pillars = [
  {
    label: "Repuestos de calidad",
    note: "Originales y equivalentes de fábrica, identificados como tales.",
  },
  {
    label: "Compatibilidad declarada",
    note: "Cada ficha indica marca y modelo antes de que compres.",
  },
  {
    label: "Atención personalizada",
    note: "Te ayudamos a identificar la pieza si no la reconoces.",
  },
  {
    label: "Precio directo",
    note: "El precio publicado es el final, sin recargos ocultos.",
  },
];
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   SOBRE BYTEMARKET

   Sin blobs, sin ornamentos unicode, sin palomitas.
   El bloque vale por lo que dice y por cómo está
   compuesto: una declaración ancha y una franja de
   datos separada por filetes.
═══════════════════════════════════════════════════ */

.about {
  background: var(--bg-alt);
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  padding-block: var(--section-y-sm);
}

.about__container {
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 var(--container-pad);
}

/* ── Declaración ── */
.about__statement {
  max-width: 68ch;
}

.about__label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--cp-electric);
  margin-bottom: var(--space-5);
}

/* La entrada lleva el peso: tamaño de titular, tono de párrafo.
   Es lo primero que se lee de la marca. */
.about__lead {
  font-size: var(--fs-h3);
  font-weight: var(--fw-semibold);
  line-height: 1.35;
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: var(--space-5);
  text-wrap: balance;
}

.about__body {
  font-size: var(--fs-body-lg);
  line-height: var(--leading-relaxed);
  color: var(--text-muted);
  margin-bottom: var(--space-8);
}

.about__cta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.about__btn {
  display: inline-flex;
  align-items: center;
  height: 44px;
  padding: 0 var(--space-5);
  border-radius: var(--r-sm);
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  text-decoration: none;
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.about__btn--solid {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  border: 1px solid var(--btn-primary-bg);
}

.about__btn--solid:hover {
  background: var(--btn-primary-hover);
  border-color: var(--btn-primary-hover);
  color: var(--btn-primary-text);
}

.about__btn--quiet {
  background: transparent;
  color: var(--text-body);
  border: 1px solid var(--border-mid);
}

.about__btn--quiet:hover {
  border-color: var(--cp-navy);
  color: var(--cp-navy);
}

/* ── Pilares ── */
.about__pillars {
  list-style: none;
  margin: var(--space-16) 0 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--border-mid);
}

.about__pillar {
  padding: var(--space-6) var(--space-5) 0 0;
  border-right: 1px solid var(--border-light);
}

.about__pillar:last-child {
  border-right: none;
  padding-right: 0;
}

.about__pillar-label {
  display: block;
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.about__pillar-note {
  display: block;
  font-size: var(--fs-xs);
  line-height: var(--leading-normal);
  color: var(--text-muted);
}

/* ── Responsive ── */
@media (max-width: 860px) {
  .about__pillars {
    grid-template-columns: repeat(2, 1fr);
  }

  .about__pillar:nth-child(2n) {
    border-right: none;
    padding-right: 0;
  }

  .about__pillar:nth-child(n + 3) {
    border-top: 1px solid var(--border-light);
    margin-top: var(--space-6);
  }
}

@media (max-width: 520px) {
  .about__pillars {
    grid-template-columns: 1fr;
  }

  .about__pillar {
    border-right: none;
    padding-right: 0;
  }

  .about__pillar + .about__pillar {
    border-top: 1px solid var(--border-light);
    margin-top: 0;
  }
}
</style>

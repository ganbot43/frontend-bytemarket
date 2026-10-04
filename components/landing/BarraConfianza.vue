<template>
  <!-- Banda fina de servicio.
       No son tarjetas: cuatro recuadros con icono en la portada de una
       tienda es el cliché que hace que todo parezca la misma plantilla.
       Aquí es una franja de datos separada por filetes. -->
  <section class="bc" aria-label="Por qué comprar en ByteMarket">
    <div class="cp-container">
      <ul class="bc__list">
        <li v-for="item in items" :key="item.title" class="bc__item">
          <span class="bc__icon" aria-hidden="true" v-html="item.icon" />
          <span class="bc__text">
            <strong>{{ item.title }}</strong>
            <small>{{ item.note }}</small>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
const items = [
  {
    title: "Envíos a todo el Perú",
    note: "Lima y provincias, con seguimiento",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 7h11v10H2zM13 10h4l4 4v3h-8z"/><circle cx="6" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`,
  },
  {
    title: "Garantía comprobada",
    note: "Cambio si la pieza sale fallada",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5 4 6v6c0 4.6 3.2 8.5 8 9.5 4.8-1 8-4.9 8-9.5V6z"/><path d="m9 12 2 2 4-4"/></svg>`,
  },
  {
    title: "Compatibilidad verificada",
    note: "Te confirmamos el modelo antes de enviar",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg>`,
  },
  {
    title: "Precio sin sorpresas",
    note: "El que ves es el que pagas",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2.2 2.6 5 3.2 5 1.4 5 3.3-2.2 3.5-5 3.5-5-1.1-5-3"/></svg>`,
  },
];
</script>

<style scoped>
.bc {
  border-block: 1px solid var(--line-soft);
  background: var(--surface-sunken);
}

.bc__list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
}

.bc__item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-5);
  min-width: 0;
}

/* Los extremos pierden su sangría lateral para que el primer icono y el
   último texto queden a plomo con el resto de la página; con padding a
   los cuatro lados la banda aparecía 20px más adentro que el carrusel. */
.bc__item:first-child {
  padding-left: 0;
}

.bc__item:last-child {
  padding-right: 0;
}

/* Filete entre columnas, no alrededor: la banda se lee como una sola
   pieza en vez de cuatro cajas. */
.bc__item + .bc__item {
  border-left: 1px solid var(--line-soft);
}

.bc__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  color: var(--accent-strong);
}

.bc__icon :deep(svg) {
  width: 22px;
  height: 22px;
}

.bc__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.bc__text strong {
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.bc__text small {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  line-height: 1.4;
}

@media (max-width: 900px) {
  .bc__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .bc__item {
    padding: var(--sp-4);
  }

  /* Con dos columnas el filete izquierdo solo corresponde a la
     segunda de cada fila; las de arriba llevan filete inferior. */
  .bc__item + .bc__item {
    border-left: 0;
  }

  /* Impares pegados al margen izquierdo, pares al derecho. */
  .bc__item:nth-child(odd) {
    padding-left: 0;
    padding-right: var(--sp-4);
  }

  .bc__item:nth-child(even) {
    padding-right: 0;
    padding-left: var(--sp-4);
  }

  .bc__item:nth-child(even) {
    border-left: 1px solid var(--line-soft);
  }

  .bc__item:nth-child(-n + 2) {
    border-bottom: 1px solid var(--line-soft);
  }
}

@media (max-width: 480px) {
  .bc__text small {
    display: none;
  }

  .bc__item,
  .bc__item:nth-child(odd),
  .bc__item:nth-child(even) {
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-2);
  }

  .bc__item:nth-child(odd) {
    padding-left: 0;
  }

  .bc__item:nth-child(even) {
    padding-right: 0;
  }

  .bc__icon {
    width: 26px;
    height: 26px;
  }

  .bc__icon :deep(svg) {
    width: 18px;
    height: 18px;
  }
}
</style>

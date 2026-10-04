<template>
  <section class="cd" id="categorias">
    <div class="cp-container">
      <header class="cp-head">
        <div class="cp-head__text">
          <p class="cp-eyebrow">Compra por tipo de pieza</p>
          <h2 class="cp-head__title">Categorías</h2>
          <p class="cp-head__sub">
            Todo está ordenado por el tipo de repuesto. Elige el que buscas y
            filtra por modelo dentro.
          </p>
        </div>

        <NuxtLink to="/productos" class="cp-head__link">
          Ver todo el catálogo
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </NuxtLink>
      </header>

      <!-- Carga -->
      <div v-if="pending" class="cd__grid">
        <div v-for="i in 6" :key="`sk-${i}`" class="cp-skeleton cd__skeleton" />
      </div>

      <!-- Categorías -->
      <ul v-else-if="visible.length" class="cd__grid">
        <li v-for="cat in visible" :key="cat.id">
          <NuxtLink :to="`/productos?categoria=${cat.slug}`" class="cd__item">
            <span class="cd__media">
              <SharedImagen v-if="cat.image" :src="cat.image" :alt="cat.name" fit="cover" />

              <!-- Sin banner cargado, un icono según el tipo de pieza.
                   Las iniciales tomaban la letra de la conjunción:
                   "Pantallas y Displays" salía como "PY". -->
              <svg
                v-else
                class="cd__glyph"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path v-for="(d, i) in iconoDe(cat.name).paths" :key="i" :d="d" />
              </svg>
            </span>

            <span class="cd__body">
              <span class="cd__name">{{ cat.name }}</span>
              <span class="cd__count">
                {{ cat.productCount }} {{ cat.productCount === 1 ? "pieza" : "piezas" }}
              </span>
            </span>

            <svg class="cd__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </NuxtLink>
        </li>
      </ul>

      <p v-else class="cd__empty">
        Todavía no hay categorías publicadas.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
type Cat = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
};

const { iconoDe } = useIconoCategoria();

const { data, pending } = await useFetch<{ data: Cat[] }>("/api/categories", {
  query: { active: true },
  key: "landing-categorias",
  default: () => ({ data: [] }),
  lazy: true,
});

/* Una categoría sin piezas es una promesa rota: el usuario entra y
   encuentra la rejilla vacía. Se ocultan y se muestran las que más
   mercancía tienen primero. */
const visible = computed(() =>
  [...(data.value?.data ?? [])]
    .filter((c) => (c.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0))
    .slice(0, 8),
);

</script>

<style scoped>
.cd {
  padding-block: var(--section-y-sm);
}

.cd__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--sp-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.cd__skeleton {
  height: 92px;
  border-radius: var(--radius);
}

/* Tarjeta horizontal, no cuadrada: cabe el nombre completo de la
   categoría y el conteo sin recortar nada. */
.cd__item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  height: 100%;
  padding: var(--sp-3);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  color: var(--ink-body);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.cd__item:hover {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
}

.cd__media {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  background: var(--surface-media);
  overflow: hidden;
}

.cd__media :deep(img) {
  transition: transform var(--t-slow) var(--ease-smooth);
}

.cd__item:hover .cd__media :deep(img) {
  transform: scale(1.06);
}

.cd__glyph {
  width: 26px;
  height: 26px;
  color: var(--accent-strong);
  transition: transform var(--t-base) var(--ease-smooth);
}

.cd__item:hover .cd__glyph {
  transform: scale(1.08);
}

.cd__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.cd__name {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  line-height: 1.3;
}

.cd__count {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.cd__arrow {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  color: var(--ink-faint);
  transition:
    color var(--t-base) var(--ease-smooth),
    transform var(--t-base) var(--ease-smooth);
}

.cd__item:hover .cd__arrow {
  color: var(--accent-strong);
  transform: translateX(2px);
}

.cd__empty {
  padding: var(--sp-10);
  text-align: center;
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  border: 1px dashed var(--line);
  border-radius: var(--radius);
}

@media (max-width: 1000px) {
  .cd__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .cd__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .cd__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .cd__media {
    width: 52px;
    height: 52px;
  }
}
</style>

<template>
  <div class="hp">
    <header class="hp__head">
      <div>
        <h1 class="hp__title">Mis pedidos</h1>
        <p class="hp__sub">
          <template v-if="pending">Cargando…</template>
          <template v-else-if="lista.length">
            {{ lista.length }} {{ lista.length === 1 ? "pedido" : "pedidos" }} en total
          </template>
          <template v-else>Aquí aparecerán tus compras.</template>
        </p>
      </div>

      <!-- Filtro por estado: con veinte pedidos, encontrar el que
           todavía no llega es lo primero que se intenta. -->
      <div v-if="lista.length > 3" class="hp__filter">
        <label for="hp-estado">Estado</label>
        <select id="hp-estado" v-model="filtro" class="hp__select">
          <option value="">Todos</option>
          <option v-for="opt in estadosPresentes" :key="opt" :value="opt">
            {{ etiqueta(opt) }}
          </option>
        </select>
      </div>
    </header>

    <!-- ── Carga ── -->
    <div v-if="pending" class="hp__list">
      <div v-for="i in 3" :key="`sk-${i}`" class="cp-skeleton hp__skeleton" />
    </div>

    <!-- ── Sin pedidos ── -->
    <div v-else-if="!lista.length" class="hp__empty">
      <span class="hp__empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4.5 7.5h15l-1 12.5h-13z" />
          <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
        </svg>
      </span>
      <h2 class="hp__empty-title">Todavía no has hecho ningún pedido</h2>
      <p class="hp__empty-text">
        Cuando compres, aquí podrás seguir el estado de cada envío.
      </p>
      <NuxtLink to="/productos" class="btn btn-primary">Ver catálogo</NuxtLink>
    </div>

    <!-- ── Sin coincidencias del filtro ── -->
    <div v-else-if="!filtrados.length" class="hp__empty">
      <p class="hp__empty-text">
        Ningún pedido está en estado «{{ etiqueta(filtro) }}».
      </p>
      <button type="button" class="btn btn-outline btn-sm" @click="filtro = ''">
        Ver todos
      </button>
    </div>

    <!-- ── Lista ──
         Tarjetas, no tabla: cinco columnas en 390px de ancho obligaban a
         desplazar en horizontal para leer el total. -->
    <ul v-else class="hp__list">
      <li v-for="order in filtrados" :key="order.id">
        <NuxtLink :to="`/mi-cuenta/pedidos/${order.orderCode}`" class="hp__item">
          <div class="hp__item-top">
            <span class="hp__code">{{ order.orderCode }}</span>
            <EcommerceEstadoPedido :status="order.status" size="sm" />
          </div>

          <dl class="hp__meta">
            <div>
              <dt>Fecha</dt>
              <dd>{{ formatearFecha(order.createdAt) }}</dd>
            </div>
            <div>
              <dt>Artículos</dt>
              <dd>{{ contarArticulos(order.items) }}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd class="hp__total">{{ formatPrice.format(order.total) }}</dd>
            </div>
          </dl>

          <span class="hp__go" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const formatPrice = useFormatPrice();
const { etiqueta } = useEstadoPedido();

useSeoMeta({
  title: "Mis pedidos — ByteMarket",
  robots: "noindex, nofollow",
});

const { data: orders, pending } = await useFetch<any[]>("/api/my-orders", {
  default: () => [],
});

const filtro = ref("");

const lista = computed(() =>
  [...(orders.value ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  ),
);

/* Solo se ofrecen los estados que el usuario realmente tiene: un menú
   con seis opciones de las que cinco no dan resultados es ruido. */
const estadosPresentes = computed(() => [
  ...new Set(lista.value.map((o) => o.status)),
]);

const filtrados = computed(() =>
  filtro.value ? lista.value.filter((o) => o.status === filtro.value) : lista.value,
);

const contarArticulos = (items: any[] = []) =>
  items.reduce((acc, i) => acc + Number(i.quantity ?? 0), 0);

const formatearFecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
</script>

<style scoped>
.hp {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.hp__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--sp-4);
  flex-wrap: wrap;
}

.hp__title {
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.hp__sub {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  margin-top: 4px;
}

.hp__filter {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}

.hp__filter label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.hp__select {
  height: 36px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-medium);
}

/* ── Lista ── */
.hp__list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.hp__skeleton {
  height: 104px;
  border-radius: var(--radius);
}

.hp__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  gap: var(--sp-3) var(--sp-4);
  align-items: center;
  padding: var(--sp-4);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.hp__item:hover {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
}

.hp__item-top {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  flex-wrap: wrap;
}

.hp__code {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.hp__meta {
  grid-column: 1;
  display: flex;
  gap: var(--sp-6);
  margin: 0;
  flex-wrap: wrap;
}

.hp__meta > div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.hp__meta dt {
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.hp__meta dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-body);
  font-variant-numeric: tabular-nums;
}

.hp__total {
  font-weight: var(--fw-black) !important;
  color: var(--ink-strong) !important;
}

.hp__go {
  grid-column: 2;
  grid-row: 1 / -1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-faint);
  transition:
    color var(--t-base) var(--ease-smooth),
    transform var(--t-base) var(--ease-smooth);
}

.hp__go svg {
  width: 16px;
  height: 16px;
}

.hp__item:hover .hp__go {
  color: var(--accent-strong);
  transform: translateX(2px);
}

/* ── Vacío ── */
.hp__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-12) var(--sp-5);
  text-align: center;
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  background: var(--surface-sunken);
}

.hp__empty-icon {
  color: var(--ink-faint);
}

.hp__empty-icon svg {
  width: 40px;
  height: 40px;
}

.hp__empty-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.hp__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  max-width: 40ch;
}

@media (max-width: 560px) {
  .hp__head {
    align-items: flex-start;
  }

  .hp__meta {
    gap: var(--sp-4);
  }
}
</style>

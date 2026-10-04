<template>
  <div class="rs">
    <header class="rs__head">
      <h1 class="rs__title">Hola, {{ primerNombre }}</h1>
      <p class="rs__sub">Aquí tienes el estado de tus pedidos y los datos de tu cuenta.</p>
    </header>

    <!-- ── Métricas ──
         Tres cifras, no una rejilla de tarjetas con icono. Lo que
         importa es el número; el recuadro decorado lo estorbaba. -->
    <ul class="rs__stats">
      <li>
        <span class="rs__stat-num">{{ pending ? "—" : total }}</span>
        <span class="rs__stat-label">Pedidos en total</span>
      </li>
      <li>
        <span class="rs__stat-num">{{ pending ? "—" : enProceso }}</span>
        <span class="rs__stat-label">En proceso</span>
      </li>
      <li>
        <span class="rs__stat-num">{{ pending ? "—" : entregados }}</span>
        <span class="rs__stat-label">Entregados</span>
      </li>
    </ul>

    <div class="rs__grid">
      <!-- ── Último pedido ── -->
      <section class="rs__card">
        <div class="rs__card-head">
          <h2 class="rs__card-title">Último pedido</h2>
          <NuxtLink v-if="ultimo" to="/mi-cuenta/pedidos" class="rs__card-link">
            Ver todos
          </NuxtLink>
        </div>

        <div v-if="pending" class="rs__loading">
          <div class="cp-skeleton" style="height: 18px; width: 45%" />
          <div class="cp-skeleton" style="height: 14px; width: 70%" />
          <div class="cp-skeleton" style="height: 14px; width: 30%" />
        </div>

        <div v-else-if="!ultimo" class="rs__empty">
          <p class="rs__empty-text">Todavía no has hecho ningún pedido.</p>
          <NuxtLink to="/productos" class="btn btn-primary btn-sm">Ver catálogo</NuxtLink>
        </div>

        <div v-else class="rs__order">
          <div class="rs__order-top">
            <span class="rs__order-code">{{ ultimo.orderCode }}</span>
            <EcommerceEstadoPedido :status="ultimo.status" />
          </div>

          <dl class="rs__order-meta">
            <div>
              <dt>Fecha</dt>
              <dd>{{ formatearFecha(ultimo.createdAt) }}</dd>
            </div>
            <div>
              <dt>Artículos</dt>
              <dd>{{ contarArticulos(ultimo.items) }}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd class="rs__order-total">{{ formatPrice.format(ultimo.total) }}</dd>
            </div>
          </dl>

          <!-- Qué toca hacer ahora: un badge solo nombra el estado, no
               dice si la pelota está en el tejado del cliente. -->
          <p v-if="ayuda(ultimo.status)" class="rs__order-help">
            {{ ayuda(ultimo.status) }}
          </p>

          <NuxtLink :to="`/mi-cuenta/pedidos/${ultimo.orderCode}`" class="rs__order-cta">
            Ver detalle
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </NuxtLink>
        </div>
      </section>

      <!-- ── Datos de la cuenta (editables) ── -->
      <EcommerceFormularioPerfil />
    </div>
  </div>
</template>

<script setup lang="ts">
const { user } = useUserSession();
const formatPrice = useFormatPrice();
const { ayuda } = useEstadoPedido();

useSeoMeta({
  title: "Mi cuenta — ByteMarket",
  robots: "noindex, nofollow",
});

const { data: orders, pending } = await useFetch<any[]>("/api/my-orders", {
  default: () => [],
});

const lista = computed(() => orders.value ?? []);
const total = computed(() => lista.value.length);
const entregados = computed(
  () => lista.value.filter((o) => o.status === "delivered").length,
);
const enProceso = computed(
  () => lista.value.filter((o) => !["delivered", "cancelled"].includes(o.status)).length,
);

/* La API ya devuelve los pedidos del más reciente al más antiguo, pero
   no conviene depender de ello para elegir "el último". */
const ultimo = computed(() => {
  const ordenados = [...lista.value].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return ordenados[0] ?? null;
});

const primerNombre = computed(() => {
  const nombre = String(user.value?.name ?? "").trim();
  return nombre ? nombre.split(/\s+/)[0] : "bienvenido";
});

const contarArticulos = (items: any[] = []) =>
  items.reduce((acc, i) => acc + Number(i.quantity ?? 0), 0);

const formatearFecha = (valor: string) =>
  new Date(valor).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
</script>

<style scoped>
.rs {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.rs__title {
  font-size: var(--fs-h2);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
}

.rs__sub {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
  margin-top: 4px;
}

/* ── Métricas ── */
.rs__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  list-style: none;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  overflow: hidden;
}

.rs__stats li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-5);
}

.rs__stats li + li {
  border-left: 1px solid var(--line-soft);
}

.rs__stat-num {
  font-size: 1.75rem;
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-display);
  color: var(--ink-strong);
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rs__stat-label {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

/* ── Tarjetas ── */
.rs__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sp-4);
  align-items: start;
}

.rs__card {
  display: flex;
  flex-direction: column;
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.rs__card-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-4);
}

.rs__card-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.rs__card-link {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--accent-strong);
}

.rs__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.rs__empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-3);
}

.rs__empty-text {
  font-size: var(--fs-sm);
  color: var(--ink-muted);
}

/* ── Último pedido ── */
.rs__order {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.rs__order-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  flex-wrap: wrap;
}

.rs__order-code {
  font-family: var(--font-mono);
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  color: var(--ink-strong);
}

.rs__order-meta {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
}

.rs__order-meta > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-3);
}

.rs__order-meta dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
}

.rs__order-meta dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
}

.rs__order-total {
  font-size: var(--fs-sm) !important;
  font-weight: var(--fw-black) !important;
  font-variant-numeric: tabular-nums;
}

.rs__order-help {
  padding: var(--sp-3);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-sm);
  background: var(--accent-quiet);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--accent-strong);
}

.rs__order-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 40px;
  margin-top: auto;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.rs__order-cta svg {
  width: 14px;
  height: 14px;
  transition: transform var(--t-base) var(--ease-smooth);
}

.rs__order-cta:hover {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.rs__order-cta:hover svg {
  transform: translateX(2px);
}

/* ═══ Responsive ═══ */
@media (max-width: 820px) {
  .rs__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 560px) {
  .rs__stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .rs__stats li {
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    padding: var(--sp-3) var(--sp-4);
  }

  .rs__stats li + li {
    border-left: 0;
    border-top: 1px solid var(--line-soft);
  }

  .rs__stat-num {
    font-size: 1.25rem;
  }
}
</style>

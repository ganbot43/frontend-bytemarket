<template>
  <div class="sp-page rep-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Reportes de ventas</h1>
        <p class="sp-page-toolbar__sub">
          {{ rango }} · comparado con {{ rangoPrevio }}
        </p>
      </div>
      <NuxtLink to="/admin/caja" class="sp-page-btn">Ir a Caja</NuxtLink>
    </div>

    <!-- Período -->
    <div class="rep-periodo">
      <!-- El mismo segmentado que el gráfico del dashboard. Eran píldoras
           sueltas: cuatro botones separados no dicen que solo uno puede
           estar activo. -->
      <div class="sp-segmented" role="group" aria-label="Período del reporte">
        <button v-for="p in presets" :key="p.label" type="button" class="sp-segmented__btn"
                :class="{ 'is-active': presetActivo === p.label }"
                :aria-pressed="presetActivo === p.label"
                @click="aplicarPreset(p)">
          {{ p.label }}
        </button>
      </div>
      <div class="rep-periodo__fechas">
        <input v-model="desde" type="date" :max="hasta" class="sp-drawer-input" aria-label="Desde" />
        <span aria-hidden="true">→</span>
        <input v-model="hasta" type="date" :min="desde" :max="hoy" class="sp-drawer-input" aria-label="Hasta" />
      </div>
    </div>

    <p v-if="error" class="rep-error">{{ error }}</p>
    <p v-else-if="pending" class="rep-hint">Calculando…</p>

    <template v-else-if="rep">
      <!-- Indicadores con variación -->
      <div class="rep-kpis">
        <div v-for="k in kpis" :key="k.label" class="sp-card rep-kpi">
          <span class="rep-kpi__label">{{ k.label }}</span>
          <p class="rep-kpi__value">{{ k.value }}</p>
          <p class="rep-kpi__delta" :class="claseDelta(k.delta)">
            <template v-if="k.delta === null">sin datos antes</template>
            <template v-else-if="k.delta === 0">igual que antes</template>
            <template v-else>
              {{ k.delta > 0 ? "▲" : "▼" }} {{ Math.abs(k.delta).toFixed(1) }}%
              <span class="rep-kpi__prev">({{ k.prev }})</span>
            </template>
          </p>
        </div>
      </div>

      <!-- Por cobrar: no es del período, es deuda viva -->
      <NuxtLink v-if="rep.receivable.orders" to="/admin/pedidos?status=pending" class="rep-cobrar">
        <strong>{{ money(rep.receivable.amount) }}</strong>
        por cobrar en {{ rep.receivable.orders }}
        pedido{{ rep.receivable.orders === 1 ? "" : "s" }} sin pagar
        <span class="rep-cobrar__go">Ver →</span>
      </NuxtLink>

      <!-- Serie diaria -->
      <section class="sp-card">
        <div class="sp-card__head">
          <h2>Ventas por día</h2>
          <span class="sp-card__note">máximo {{ money(maxSerie) }}</span>
        </div>
        <div v-if="maxSerie > 0" class="rep-barras">
          <div v-for="d in rep.series" :key="d.day" class="rep-barra"
               :title="`${d.day}: ${money(d.amount)} · ${d.orders} pedido(s)`">
            <div class="rep-barra__fill" :style="{ height: `${(d.amount / maxSerie) * 100}%` }" />
          </div>
        </div>
        <p v-else class="rep-hint">No hay ventas cobradas en este período.</p>
        <div v-if="maxSerie > 0" class="rep-barras__eje">
          <span>{{ rep.series[0]?.day }}</span>
          <span>{{ rep.series[rep.series.length - 1]?.day }}</span>
        </div>
      </section>

      <!-- Desgloses -->
      <div class="rep-grid">
        <section class="sp-card">
          <div class="sp-card__head"><h2>Por canal</h2></div>
          <AdminRepLista :filas="rep.byChannel" :total="rep.current.revenue" :money="money" sufijo="pedidos" />
        </section>

        <section class="sp-card">
          <div class="sp-card__head"><h2>Por forma de pago</h2></div>
          <AdminRepLista :filas="rep.byPayment" :total="rep.current.revenue" :money="money" sufijo="pedidos" />
        </section>

        <section class="sp-card">
          <div class="sp-card__head"><h2>Más vendidos</h2></div>
          <AdminRepLista :filas="rep.topProducts" :total="rep.current.revenue" :money="money" sufijo="unidades" campo="units" />
        </section>

        <section class="sp-card">
          <div class="sp-card__head"><h2>Cupones usados</h2></div>
          <AdminRepLista :filas="rep.coupons" :total="descuentoTotal" :money="money" sufijo="usos" />
        </section>
      </div>

      <!-- El cuadre de caja va en Reportes y no en la pantalla de caja:
           ahí se cobra, aquí se revisa lo que ya pasó. Lo ven el jefe de
           ventas, el encargado y el gerente; el cajero no entra a esta
           pantalla. -->
      <section class="sp-card">
        <div class="sp-card__head">
          <h2>Auditoría de caja</h2>
          <span class="sp-card__note">
            Turnos cuadrados: quién firmó, los arqueos y lo que pasó
          </span>
        </div>
        <AdminCajaHistorial />
      </section>

      <section class="sp-card">
        <div class="sp-card__head"><h2>Exportar</h2></div>
        <AdminReportsExportPanel />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Reporte de ventas de un período, comparado con el anterior.
 *
 * La comparación es el punto. Una cifra sola no dice si el negocio va bien:
 * 4.200 soles solo significa algo al lado de los 3.100 del mes pasado. El
 * backend devuelve los dos períodos ya calculados y del mismo largo.
 *
 * Todo cuenta solo lo COBRADO, igual que los indicadores de la portada: un
 * pedido pendiente de pago no es una venta todavía, y mezclarlos haría que
 * el reporte y el dashboard dieran cifras distintas.
 */
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Reportes de ventas · Admin" });

const formatPrice = useFormatPrice();
const money = (n: number) => formatPrice.format(Number.isFinite(n) ? n : 0);

const hoy = new Date().toISOString().slice(0, 10);
const diasAtras = (n: number) =>
  new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

const presets = [
  { label: "Hoy", desde: hoy, hasta: hoy },
  { label: "7 días", desde: diasAtras(6), hasta: hoy },
  { label: "30 días", desde: diasAtras(29), hasta: hoy },
  { label: "90 días", desde: diasAtras(89), hasta: hoy },
];

const desde = ref(presets[2]!.desde);
const hasta = ref(presets[2]!.hasta);
const presetActivo = computed(() =>
  presets.find((p) => p.desde === desde.value && p.hasta === hasta.value)?.label ?? "",
);
function aplicarPreset(p: { desde: string; hasta: string }) {
  desde.value = p.desde;
  hasta.value = p.hasta;
}

const { data: rep, pending, error: fetchError } = await useFetch<any>("/api/admin/reports/sales", {
  query: computed(() => ({ desde: desde.value, hasta: hasta.value })),
  watch: [desde, hasta],
});
const error = computed(() => (fetchError.value as any)?.data?.message ?? null);

const fmt = (d: string) =>
  new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short" }).format(
    new Date(`${d}T12:00:00`),
  );
const rango = computed(() =>
  rep.value ? `${fmt(rep.value.from)} – ${fmt(rep.value.to)}` : "–",
);
const rangoPrevio = computed(() =>
  rep.value ? `${fmt(rep.value.previousFrom)} – ${fmt(rep.value.previousTo)}` : "–",
);

/** Variación porcentual; null cuando antes no había nada con lo que comparar. */
function delta(actual: number, previo: number): number | null {
  if (!previo) return actual ? null : 0;
  return ((actual - previo) / previo) * 100;
}

const kpis = computed(() => {
  const c = rep.value?.current ?? {};
  const p = rep.value?.previous ?? {};
  return [
    {
      label: "Ingresos cobrados",
      value: money(c.revenue ?? 0),
      delta: delta(c.revenue ?? 0, p.revenue ?? 0),
      prev: money(p.revenue ?? 0),
    },
    {
      label: "Pedidos",
      value: c.orders ?? 0,
      delta: delta(c.orders ?? 0, p.orders ?? 0),
      prev: `${p.orders ?? 0}`,
    },
    {
      label: "Unidades",
      value: c.units ?? 0,
      delta: delta(c.units ?? 0, p.units ?? 0),
      prev: `${p.units ?? 0}`,
    },
    {
      // Dice si se vende más porque vienen más clientes o porque cada uno
      // compra más, que son dos problemas distintos.
      label: "Ticket medio",
      value: money(c.averageTicket ?? 0),
      delta: delta(c.averageTicket ?? 0, p.averageTicket ?? 0),
      prev: money(p.averageTicket ?? 0),
    },
  ];
});

const claseDelta = (d: number | null) =>
  d === null || d === 0 ? "rep-kpi__delta--flat" : d > 0 ? "rep-kpi__delta--up" : "rep-kpi__delta--down";

const maxSerie = computed(() =>
  Math.max(0, ...((rep.value?.series ?? []).map((d: any) => d.amount))),
);
const descuentoTotal = computed(() =>
  (rep.value?.coupons ?? []).reduce((a: number, c: any) => a + c.amount, 0),
);
</script>

<style scoped>

/* ── Período ── */
.rep-periodo { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; }
/* Los botones del período y los inputs de fecha ya no tienen estilos
   propios: usan .sp-segmented y .sp-drawer-input. Aquí solo queda la
   colocación. */
.rep-periodo__fechas {
  display: inline-flex; align-items: center; gap: 0.35rem; margin-left: auto;
  font-size: var(--sp-text-xs); color: var(--sp-text-soft);
}
.rep-periodo__fechas input { width: auto; }

.rep-hint { font-size: var(--sp-text-sm); color: var(--sp-text-muted); margin: 0.8rem 0; }
.rep-error {
  padding: 0.6rem 0.8rem; border-radius: var(--sp-radius-sm);
  background: var(--sp-danger-soft); color: #b91c1c; font-size: var(--sp-text-sm);
}

/* ── Indicadores ──
   La caja la pone .sp-card; aquí solo la tipografía del indicador. */
.rep-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 0.9rem; }
.rep-kpi__label {
  font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
  color: var(--sp-text-soft); font-weight: 700;
}
.rep-kpi__value {
  margin: 0.35rem 0 0.2rem; font-size: 1.5rem; font-weight: 800;
  letter-spacing: -0.02em; color: var(--sp-text-strong);
}
.rep-kpi__delta { margin: 0; font-size: var(--sp-text-xs); font-weight: 600; }
.rep-kpi__delta--up { color: #15803d; }
.rep-kpi__delta--down { color: #b91c1c; }
.rep-kpi__delta--flat { color: var(--sp-text-muted); }
.rep-kpi__prev { color: var(--sp-text-soft); font-weight: 500; }

/* ── Por cobrar ── */
.rep-cobrar {
  display: flex; align-items: center; gap: 0.4rem;
  padding: 0.7rem 0.95rem; border: 1px solid #f59e0b55;
  border-radius: var(--sp-radius-lg);
  background: var(--sp-warning-soft); color: #92400e;
  font-size: var(--sp-text-sm); text-decoration: none;
}
.rep-cobrar__go { margin-left: auto; font-weight: 700; }

/* ── Tarjetas ── */
/* La tarjeta la pone .sp-card. El margin-bottom que tenía cada una se
   sumaba al gap de .sp-page y dejaba 2,25rem entre bloques. */
.rep-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 1rem; }

/* ── Barras ── */
.rep-barras { display: flex; align-items: flex-end; gap: 2px; height: 150px; }
.rep-barra { flex: 1; min-width: 3px; height: 100%; display: flex; align-items: flex-end; }
.rep-barra__fill {
  width: 100%; min-height: 2px; border-radius: 2px 2px 0 0;
  background: var(--sp-primary); opacity: 0.85; transition: opacity var(--sp-t-fast) var(--sp-ease);
}
.rep-barra:hover .rep-barra__fill { opacity: 1; }
.rep-barras__eje { display: flex; justify-content: space-between; margin-top: 0.4rem; font-size: 0.68rem; color: var(--sp-text-soft); }

/* ── Móvil ──
   Los KPI y los desgloses ya reflúen solos con auto-fit. Lo que no reflúe
   es la fila de período: los botones de preajuste y el par de fechas
   compiten por el ancho porque las fechas van empujadas con margin-left. */
@media (max-width: 768px) {
  .rep-page {
    padding: 1rem 0.75rem;
  }

  .rep-periodo__fechas {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .rep-periodo__fechas input {
    flex: 1 1 auto;
    min-width: 0;
  }

  /* En un teléfono el segmentado ocupa la línea entera y reparte el
     ancho: si no, los cuatro presets se amontonan a la izquierda. */
  .rep-periodo .sp-segmented {
    display: flex;
    width: 100%;
  }

  .rep-periodo .sp-segmented__btn {
    flex: 1 1 auto;
    text-align: center;
  }

  /* Barras más altas: en un teléfono 150px de alto con 90 días hace barras
     de 2px que no se distinguen entre sí. */
  .rep-barras {
    height: 110px;
  }
}
</style>

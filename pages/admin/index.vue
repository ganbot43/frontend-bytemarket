<template>
  <div class="sp-page dash-page">
    <!-- Toolbar -->
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Dashboard</h1>
        <p class="sp-page-toolbar__sub">
          Resumen general del negocio · {{ today }}
        </p>
      </div>
      <!-- Antes decía "En vivo" con un punto latiendo, y era mentira: no
           hay ni sondeo ni websocket, los datos se cargan al entrar y al
           pulsar actualizar. Ahora dice la hora real de la última carga,
           que es el dato que el encargado necesita para saber si lo que ve
           sigue valiendo. -->
      <div class="dash-live-dot" :title="`Datos cargados a las ${horaDeCarga}`">
        <span class="dash-live-mark" />
        Actualizado {{ horaDeCarga }}
      </div>
    </div>

    <!-- ── Stat cards ── -->
    <div class="dash-stats">
      <!-- Cada tarjeta es un enlace a la lista que resuelve ese número: el
           panel se usa para hacer cosas, no para mirar estadísticas. -->
      <NuxtLink v-for="(stat, i) in stats" :key="stat.label" :to="stat.to"
        class="dash-stat-card dash-stat-card--link admin-lift"
        :style="{ animationDelay: `${i * 55}ms` }">
        <div class="dash-stat-top">
          <span class="dash-stat-label">{{ stat.label }}</span>
          <div class="dash-stat-icon" :class="`dash-stat-icon--${stat.color}`">
            <span v-html="stat.icon" />
          </div>
        </div>
        <p class="dash-stat-value">{{ stat.value }}</p>
        <p class="dash-stat-hint">{{ stat.hint }}</p>
      </NuxtLink>
    </div>

    <!-- ── Ventas por día ── -->
    <!-- Acompaña a la tarjeta de "Ventas del mes": el número dice cuánto se
         cobró, la línea dice si está subiendo o cayendo, que es lo que
         decide si hay que hacer algo. Detrás va la misma consulta que la
         tarjeta, así que las dos cifras cuadran. -->
    <section class="sp-table-wrap dash-chart admin-fade-in" style="animation-delay: 150ms">
      <div class="dash-table-header">
        <div>
          <h2 class="dash-table-title">Ventas cobradas por día</h2>
          <p class="dash-table-sub">
            Últimos {{ diasGrafico }} días · solo pedidos cobrados
          </p>
        </div>
        <div class="dash-chart__actions">
          <div class="sp-segmented" role="group" aria-label="Período del gráfico">
            <button v-for="opcion in OPCIONES_DIAS" :key="opcion" type="button" class="sp-segmented__btn"
              :class="{ 'is-active': diasGrafico === opcion }" :aria-pressed="diasGrafico === opcion"
              @click="diasGrafico = opcion">
              {{ opcion }} días
            </button>
          </div>
          <NuxtLink to="/admin/reportes" class="dash-view-all">
            Ver reportes
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                stroke-linejoin="round" />
            </svg>
          </NuxtLink>
        </div>
      </div>
      <div class="dash-chart__body">
        <AdminChartsVentasChart :days="diasGrafico" />
      </div>
    </section>

    <!-- ── Automatización ── -->
    <div class="dash-automation admin-fade-in" style="animation-delay: 180ms">
      <div class="dash-automation__header">
        <div>
          <h2 class="dash-table-title">Automatización operativa</h2>
          <p class="dash-table-sub">
            Reportes, alertas y carga masiva desde un solo lugar
          </p>
        </div>
        <div class="dash-automation__actions">
          <button class="dash-action-btn" :disabled="automationLoading" @click="refreshAutomation">
            {{ automationLoading ? "Actualizando…" : "Actualizar todo" }}
          </button>
          <button class="dash-action-btn dash-action-btn--accent" :disabled="automationLoading"
            @click="sendStockAlerts">
            Enviar alerta de stock
          </button>
          <button class="dash-action-btn" :disabled="automationLoading" @click="refreshFollowUpsList">
            Ver seguimientos
          </button>
        </div>
      </div>

      <div class="dash-automation__grid">
        <article class="dash-automation-card">
          <span class="dash-automation-kicker">Reporte general</span>
          <strong>{{ automationTotals.todaySalesLabel }}</strong>
          <p>{{ automationTotals.todayOrders }} pedidos hoy · {{ automationTotals.weekOrders }} esta semana</p>
        </article>
        <article class="dash-automation-card">
          <span class="dash-automation-kicker">Stock crítico</span>
          <strong>{{ lowStockItems.length }}</strong>
          <p>Productos con stock bajo el umbral</p>
        </article>
        <article class="dash-automation-card">
          <span class="dash-automation-kicker">Seguimientos</span>
          <strong>{{ followUpItems.length }}</strong>
          <p>Pedidos pendientes de revisión</p>
        </article>
        <article class="dash-automation-card">
          <span class="dash-automation-kicker">Top productos</span>
          <strong>{{ topProducts[0]?.name ?? "Sin datos" }}</strong>
          <p>{{ topProducts[0] ? `${topProducts[0].quantity} unidades vendidas` : "Aún no hay ventas" }}</p>
        </article>
      </div>

      <div class="dash-automation__panels">
        <div class="dash-automation-panel">
          <div class="dash-automation-panel__head">
            <h3>Productos con stock bajo</h3>
            <span v-if="umbralStock !== null" class="dash-automation-pill">Umbral {{ umbralStock }}</span>
          </div>
          <div v-if="!lowStockItems.length" class="dash-automation-empty">
            No hay productos en alerta.
          </div>
          <ul v-else class="dash-automation-list">
            <li v-for="item in lowStockItems.slice(0, 6)" :key="item.id">
              <div>
                <strong>{{ item.name }}</strong>
                <span>{{ item.categoryName }}</span>
              </div>
              <span class="dash-automation-stock">{{ item.stock }}</span>
            </li>
          </ul>
        </div>

        <div class="dash-automation-panel">
          <div class="dash-automation-panel__head">
            <h3>Pedidos para seguimiento</h3>
            <span class="dash-automation-pill">{{ followUpItems.length }} abiertos</span>
          </div>
          <div v-if="!followUpItems.length" class="dash-automation-empty">
            No hay pedidos pendientes fuera del plazo.
          </div>
          <ul v-else class="dash-automation-list">
            <li v-for="item in followUpItems.slice(0, 6)" :key="item.id">
              <div>
                <strong>{{ item.orderCode }}</strong>
                <span>{{ item.customerName }} · {{ item.hoursOpen }}h</span>
              </div>
              <AdminEtiquetaEstadoPedido :status="item.status" />
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ── Últimos pedidos ── -->
    <div class="sp-table-wrap admin-fade-in" style="animation-delay: 240ms">
      <!-- Cabecera de sección -->
      <div class="dash-table-header">
        <div>
          <h2 class="dash-table-title">Últimos pedidos</h2>
          <p class="dash-table-sub">Los 5 pedidos más recientes</p>
        </div>
        <NuxtLink to="/admin/pedidos" class="dash-view-all">
          Ver todos
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </NuxtLink>
      </div>

      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Código</th>
              <th class="sp-th">Cliente</th>
              <th class="sp-th sp-th--right">Total</th>
              <th class="sp-th sp-th--center">Estado</th>
              <th class="sp-th sp-th--right">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty -->
            <tr v-if="!recentOrders.length">
              <td colspan="5">
                <div class="sp-table-empty">
                  <div class="sp-table-empty__inner">
                    <div class="sp-table-empty__icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                      </svg>
                    </div>
                    <p class="sp-table-empty__msg">No hay pedidos aún</p>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Rows -->
            <tr v-for="order in recentOrders" :key="order.id" class="sp-tr" @click="openOrder(order.id)"
              style="cursor: pointer">
              <!-- Código -->
              <td class="sp-td">
                <button class="dash-order-code" style="
                    background: none;
                    border: none;
                    color: inherit;
                    cursor: pointer;
                    padding: 0;
                    font: inherit;
                  ">
                  {{ order.orderCode }}
                </button>
              </td>

              <!-- Cliente -->
              <td class="sp-td">
                <div class="dash-customer">
                  <div class="dash-avatar">
                    {{ initials(order.customerName) }}
                  </div>
                  <span>{{ order.customerName }}</span>
                </div>
              </td>

              <!-- Total -->
              <td class="sp-td sp-td--right">
                <span class="sp-table-amount">{{
                  formatPrice.format(order.total)
                  }}</span>
              </td>

              <!-- Estado -->
              <td class="sp-td sp-td--center">
                <AdminEtiquetaEstadoPedido :status="order.status" />
              </td>

              <!-- Fecha -->
              <td class="sp-td sp-td--right sp-td--muted sp-td--mono" style="font-size: var(--sp-text-xs)">
                {{ formatDateTime(order.createdAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modalOpen" class="modal-backdrop" @click.self="modalOpen = false">
          <div class="modal-box">
            <PedidoModal v-if="selectedOrderId" :order-id="selectedOrderId" @close="modalOpen = false"
              @updated="onOrderUpdated" />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import PedidoModal from "./pedidos/pedidoModal.vue";

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Dashboard · Admin" });

const { data: ordersData, refresh: refreshOrders } =
  await useFetch("/api/admin/orders");
const { data: reportsData, refresh: refreshReports } = await useFetch("/api/admin/automation/reports");
// Resumen de dinero y trabajo pendiente. Va aparte de /automation/reports
// porque eso son las automatizaciones (avisos de stock, seguimientos) y esto
// son los indicadores de la portada.
const { data: dashData, refresh: refreshDash } = await useFetch<any>("/api/admin/reports/dashboard");

/** Hora de la última carga de datos. Se sella al montar y en cada refresco. */
const horaDeCarga = ref("--:--");
const sellarHora = () => {
  horaDeCarga.value = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima", hour: "2-digit", minute: "2-digit",
  }).format(new Date());
};
onMounted(sellarHora);
const { data: stockAlertsData, refresh: refreshStockAlerts } = await useFetch("/api/admin/automation/stock-alerts");
const { data: followUpsData, refresh: refreshFollowUpsQuery } = await useFetch("/api/admin/automation/follow-ups");
const formatPrice = useFormatPrice();
const { formatDateTime } = useFormatDateTime();

const recentOrders = computed(() => (ordersData.value?.data ?? []).slice(0, 5));
const selectedOrderId = ref<number | null>(null);
const modalOpen = ref(false);
const automationLoading = ref(false);
/* El umbral de stock bajo ya no se guarda aquí: lo fija catalog-service,
   que es quien tiene los productos, y lo devuelve en cada respuesta. Antes
   el panel tenía su propio 10 y la pantalla de Inventario otro, así que los
   dos sitios podían contar "stock bajo" de forma distinta. */
const umbralStock = computed<number | null>(() => {
  const n = stockAlertsData.value?.threshold ?? dashData.value?.lowStockThreshold;
  return typeof n === "number" ? n : null;
});

/* Siete días para ver la semana en curso, treinta para ver la tendencia.
   Más opciones no caben en la cabecera y el reporte de ventas ya permite
   elegir fechas exactas. */
const OPCIONES_DIAS = [7, 30] as const;
const diasGrafico = ref<number>(30);

function openOrder(orderId: number) {
  selectedOrderId.value = orderId;
  modalOpen.value = true;
}

function onOrderUpdated() {
  modalOpen.value = false;
  refreshOrders();
  refreshDash();
}

const automationTotals = computed(() => {
  const totals = (reportsData.value?.totals ?? {}) as {
    todaySales?: number;
    todayOrders?: number;
    weekOrders?: number;
  };
  return {
    todaySalesLabel: formatPrice.format(Number(totals.todaySales ?? 0)),
    todayOrders: Number(totals.todayOrders ?? 0),
    weekOrders: Number(totals.weekOrders ?? 0),
  };
});

const lowStockItems = computed(() =>
  (stockAlertsData.value?.data ?? reportsData.value?.lowStock ?? []).map(
    (item: any) => ({
      id: item.id,
      name: item.name,
      stock: Number(item.stock ?? 0),
      categoryName: item.category?.name ?? "Sin categoría",
    }),
  ),
);
const followUpItems = computed(() => followUpsData.value?.data ?? []);
const topProducts = computed(() => reportsData.value?.topProducts ?? []);

async function refreshAutomation() {
  automationLoading.value = true;
  try {
    await Promise.all([
      refreshReports(),
      refreshStockAlerts(),
      refreshDash(),
      refreshFollowUpsQuery(),
    ]);
  } finally {
    automationLoading.value = false;
  }
}

async function sendStockAlerts() {
  automationLoading.value = true;
  try {
    await $fetch("/api/admin/automation/stock-alerts", {
      query: { notify: 1 },
    });
    await Promise.all([refreshReports(), refreshStockAlerts(), refreshDash()]);
    sellarHora();
  } catch (error) {
    console.error(error);
  } finally {
    automationLoading.value = false;
  }
}

async function refreshFollowUpsList() {
  automationLoading.value = true;
  try {
    await refreshFollowUpsQuery();
  } finally {
    automationLoading.value = false;
  }
}

const today = new Intl.DateTimeFormat("es-PE", {
  timeZone: "America/Lima",
  weekday: "long",
  day: "numeric",
  month: "long",
}).format(new Date());

function initials(name: string) {
  return (
    name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() ?? "?"
  );
}

const svgClipboard = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const svgClock = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const svgCheck = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const svgCube = `<svg width="16" height="16" viewBox="0 0 20 20" fill="none"><path d="M10 2.5L17 6v8l-7 3.5L3 14V6l7-3.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 2.5v13M3 6l7 3.5L17 6" stroke="currentColor" stroke-width="1.5"/></svg>`;

const stats = computed(() => {
  /* Las tarjetas muestran DINERO y TRABAJO PENDIENTE, no conteos.
     Antes decían "Pedidos totales / Pendientes / Entregados / Productos
     activos": cifras que se leen y no llevan a ninguna parte. 147 pedidos
     desde el inicio no dice si hoy hay algo que hacer.
     Ahora cada una responde a una pregunta con acción detrás, y enlaza a la
     lista que la resuelve. */
  const d = dashData.value ?? {};
  const porValidar = d.paymentsToValidate ?? 0;
  const porAtender = d.ordersToAttend ?? 0;
  const bajo = d.lowStockCount ?? 0;

  return [
    {
      label: "Ventas del mes",
      value: formatPrice.format(d.salesMonth ?? 0),
      hint: `${d.paidOrdersMonth ?? 0} pedido${(d.paidOrdersMonth ?? 0) === 1 ? "" : "s"} cobrado${(d.paidOrdersMonth ?? 0) === 1 ? "" : "s"}`
        + ((d.salesToday ?? 0) > 0 ? ` · hoy ${formatPrice.format(d.salesToday)}` : ""),
      color: "blue",
      icon: svgClipboard,
      to: "/admin/reportes",
    },
    {
      label: "Pagos por validar",
      value: porValidar,
      // Es la tarea más urgente del panel: el cliente ya pagó y espera.
      hint: porValidar ? "Comprobantes sin revisar" : "Todo al día",
      color: "amber",
      icon: svgClock,
      to: "/admin/pedidos?status=voucher_sent",
    },
    {
      label: "Pedidos por atender",
      value: porAtender,
      hint: porAtender
        ? `${d.receivableOrders ?? 0} sin cobrar · ${formatPrice.format(d.receivableAmount ?? 0)}`
        : "Nada pendiente",
      color: "green",
      icon: svgCheck,
      to: "/admin/pedidos?status=pending",
    },
    {
      label: "Stock bajo",
      value: bajo,
      hint: bajo
        ? (typeof d.lowStockThreshold === "number"
          ? `Con ${d.lowStockThreshold} unidades o menos`
          : "Productos por reponer")
        : "Ningún producto por reponer",
      color: "primary",
      icon: svgCube,
      to: "/admin/inventario?bajo=1",
    },
  ];
});

</script>

<style scoped>
/* El padding lo pone .admin-shell__main y aquí se sumaba: el dashboard
   empezaba al doble de distancia del borde que Productos. La separación
   entre bloques la da ahora el gap de .sp-page, así que los
   margin-bottom de las secciones también sobran. */

/* ── Live indicator ── */
.dash-live-dot {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-text-soft);
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  padding: 0.3rem 0.7rem;
  font-family: var(--sp-font);
}

/* Marca estática. Antes era un punto con un halo latiendo en bucle: el
   latido es vocabulario de "algo está pasando ahora mismo", y aquí no pasa
   nada, solo se indica cuándo se cargaron los datos. */
.dash-live-mark {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--sp-text-soft);
  flex-shrink: 0;
}

/* ── Stats grid ── */
.dash-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

/* La tarjeta ahora es un <NuxtLink>: hereda color y pierde el subrayado,
   y el cursor deja claro que lleva a algún sitio. */
.dash-stat-card--link {
  display: block;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}
.dash-stat-card--link:focus-visible {
  outline: 2px solid var(--sp-primary, #071e52);
  outline-offset: 2px;
}

.dash-stat-card {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  box-shadow: var(--sp-shadow-sm);
  padding: 1.25rem 1.4rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition:
    box-shadow var(--sp-t) var(--sp-ease),
    transform var(--sp-t) var(--sp-ease);
}

.dash-stat-card:hover {
  box-shadow: var(--sp-shadow-md);
  transform: translateY(-2px);
}

.dash-stat-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.dash-stat-label {
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-text-soft);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--sp-font);
}

.dash-stat-icon {
  width: 2.2rem;
  height: 2.2rem;
  border-radius: var(--sp-radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dash-stat-icon span {
  display: flex;
  align-items: center;
}

.dash-stat-icon--blue {
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
}

.dash-stat-icon--amber {
  background: var(--sp-warning-soft);
  color: var(--sp-warning);
}

.dash-stat-icon--green {
  background: var(--sp-success-soft);
  color: var(--sp-success);
}

.dash-stat-icon--primary {
  background: var(--sp-primary-soft);
  color: var(--sp-primary-ink);
}

.dash-stat-value {
  font-size: var(--sp-text-3xl);
  font-weight: 800;
  color: var(--sp-text-strong);
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0;
  font-family: var(--sp-font-display);
  font-variant-numeric: tabular-nums;
}

.dash-stat-hint {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  margin: 0;
  font-family: var(--sp-font);
}

/* ── Automation panel ── */
.dash-automation {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  box-shadow: var(--sp-shadow-sm);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dash-automation__header,
.dash-automation-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.dash-automation__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.dash-action-btn {
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  color: var(--sp-text);
  border-radius: var(--sp-radius-pill);
  padding: 0.55rem 0.9rem;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  cursor: pointer;
  transition:
    background var(--sp-t-fast) var(--sp-ease),
    transform var(--sp-t-fast) var(--sp-ease),
    opacity var(--sp-t-fast) var(--sp-ease);
}

.dash-action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--sp-surface-solid);
}

.dash-action-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.dash-action-btn--accent {
  background: var(--sp-primary-soft);
  border-color: rgba(0, 174, 239, 0.18);
  color: var(--sp-primary-ink);
}

.dash-automation__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.85rem;
}

.dash-automation-card,
.dash-automation-panel,
.dash-automation__importer {
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  background: var(--sp-surface-subtle);
  padding: 1rem;
}

.dash-automation-card strong {
  display: block;
  margin-top: 0.35rem;
  font-size: var(--sp-text-lg);
  color: var(--sp-text-strong);
  font-family: var(--sp-font-display);
}

.dash-automation-card p,
.dash-automation-panel p,
.dash-automation-note {
  margin: 0.35rem 0 0;
  color: var(--sp-text-soft);
  font-size: var(--sp-text-xs);
  font-family: var(--sp-font);
}

.dash-automation-kicker {
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--sp-primary);
  font-weight: 800;
}

.dash-automation__panels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.dash-automation-panel__head--stack {
  align-items: flex-start;
}

.dash-automation-panel h3 {
  margin: 0;
  font-size: var(--sp-text-md);
  color: var(--sp-text-strong);
  font-family: var(--sp-font);
}

.dash-automation-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-primary-soft);
  color: var(--sp-primary-ink);
  font-size: var(--sp-text-xs);
  font-weight: 700;
  padding: 0.28rem 0.65rem;
  white-space: nowrap;
}

.dash-automation-empty {
  padding: 1rem 0 0.35rem;
  color: var(--sp-text-soft);
  font-size: var(--sp-text-xs);
  font-family: var(--sp-font);
}

.dash-automation-list {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.dash-automation-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  padding: 0.8rem 0.85rem;
}

.dash-automation-list strong {
  display: block;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-strong);
  font-family: var(--sp-font);
}

.dash-automation-list span {
  display: block;
  margin-top: 0.12rem;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  font-family: var(--sp-font);
}

.dash-automation-stock {
  min-width: 2rem;
  text-align: center;
  border-radius: var(--sp-radius-pill);
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  padding: 0.25rem 0.55rem;
  font-weight: 800;
}

/* ── Table section header ── */
.dash-chart__body {
  padding: 1.1rem 1.4rem 1.4rem;
}

.dash-chart__actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* El selector de período usa .sp-segmented, el mismo que Reportes. */

@media (max-width: 640px) {
  .dash-chart .dash-table-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.75rem;
  }

  .dash-chart__body {
    padding: 0.9rem 0.9rem 1.1rem;
  }
}

.dash-table-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.4rem;
  border-bottom: 1px solid var(--sp-border);
  background: linear-gradient(180deg,
      var(--sp-slate-50) 0%,
      var(--sp-surface-solid) 100%);
}

.dash-table-title {
  font-size: var(--sp-text-md);
  font-weight: 800;
  color: var(--sp-text-strong);
  letter-spacing: -0.025em;
  margin: 0;
  font-family: var(--sp-font);
}

.dash-table-sub {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  margin: 0.15rem 0 0;
  font-family: var(--sp-font);
}

.dash-view-all {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-primary);
  background: var(--sp-primary-soft);
  border: 1px solid rgba(0, 174, 239, 0.15);
  border-radius: var(--sp-radius-pill);
  padding: 0.35rem 0.75rem;
  transition: background var(--sp-t-fast) var(--sp-ease);
  text-decoration: none;
  font-family: var(--sp-font);
}

.dash-view-all:hover {
  background: rgba(0, 174, 239, 0.15);
  color: var(--sp-primary-hover);
}

/* ── Order code link ── */
.dash-order-code {
  background: var(--sp-primary-soft);
  border: 1px solid rgba(0, 174, 239, 0.14);
  border-radius: var(--sp-radius-xs);
  padding: 0.2rem 0.5rem;
  text-decoration: none;
  transition: background var(--sp-t-fast) var(--sp-ease);
  white-space: nowrap;
  font-family: "Courier New", Courier, monospace !important;
  font-size: var(--sp-text-sm) !important;
  font-weight: 700 !important;
  color: var(--sp-primary) !important;
  letter-spacing: 0.02em !important;
}

.dash-order-code:hover {
  background: rgba(0, 174, 239, 0.15);
}

/* ── Customer cell ── */
.dash-customer {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.dash-avatar {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  background: var(--sp-action);
  color: #fff;
  font-size: 0.62rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
  font-family: var(--sp-font);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .dash-page {
    padding: 1rem;
  }

  .dash-stats {
    grid-template-columns: 1fr 1fr;
  }

  .dash-automation__grid,
  .dash-automation__panels {
    grid-template-columns: 1fr;
  }

  .dash-stat-value {
    font-size: var(--sp-text-2xl);
  }

  .dash-automation__header,
  .dash-automation-panel__head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 400px) {
  .dash-stats {
    grid-template-columns: 1fr;
  }
}
</style>

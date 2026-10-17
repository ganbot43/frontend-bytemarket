<template>
  <div class="sp-chart-container">
    <div v-if="pending" class="sp-chart-loading">
      <Loader2 class="sp-spin w-8 h-8 text-primary" stroke-width="2" />
      <span>Cargando datos...</span>
    </div>
    <div v-else-if="error" class="sp-chart-error">
      <span>No se pudo cargar el gráfico de ventas.</span>
      <button type="button" class="sp-chart-retry" @click="refresh()">
        Reintentar
      </button>
    </div>
    <!-- Sin ninguna venta cobrada en el rango la línea sería una recta en
         cero: no es un gráfico, es un espacio ocupado. -->
    <div v-else-if="!hayVentas" class="sp-chart-loading">
      <span>Todavía no hay ventas cobradas en este período.</span>
    </div>
    <div v-else class="sp-chart-wrapper">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = withDefaults(defineProps<{ days?: number }>(), { days: 30 });

type Punto = { date: string; totalSales: number | string; orders?: number | string };

const { data, pending, error, refresh } = await useFetch<Punto[]>(
  '/api/admin/reports/sales-chart',
  { query: computed(() => ({ days: props.days })) },
);

/* El backend solo devuelve los días que tuvieron venta (es un GROUP BY),
   así que la serie llega con huecos. Dibujarla tal cual deja el salto de
   diez días del mismo ancho que el de dos, y la pendiente deja de
   significar nada. Aquí se rellena día a día con cero.

   Las claves son las fechas "aaaa-mm-dd" que arma el DATE() de MySQL sobre
   timestamps UTC, y se comparan y se formatean en UTC a propósito: leerlas
   en America/Lima las correría un día hacia atrás. Es el mismo motivo por
   el que useFormatDateTime deja intactas las fechas de solo día. */
const DIA_MS = 86_400_000;

const serie = computed(() => {
  const porFecha = new Map<string, { monto: number; pedidos: number }>();
  for (const p of data.value ?? []) {
    porFecha.set(String(p.date).slice(0, 10), {
      monto: Number(p.totalSales ?? 0),
      pedidos: Number(p.orders ?? 0),
    });
  }

  /* El último punto es hoy en UTC, que es el día con el que agrupa el
     backend; el primero, `days - 1` días antes. */
  const hoy = new Date();
  const finUtc = Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  const total = Math.max(1, Math.min(365, Math.trunc(props.days) || 30));

  const puntos = [];
  for (let i = total - 1; i >= 0; i--) {
    const fecha = new Date(finUtc - i * DIA_MS);
    const clave = fecha.toISOString().slice(0, 10);
    const dato = porFecha.get(clave);
    puntos.push({
      clave,
      fecha,
      monto: dato?.monto ?? 0,
      pedidos: dato?.pedidos ?? 0,
    });
  }
  return puntos;
});

const hayVentas = computed(() => serie.value.some((p) => p.monto > 0));

const etiquetaCorta = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC', day: '2-digit', month: 'short',
});
const etiquetaLarga = new Intl.DateTimeFormat('es-PE', {
  timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long',
});

const chartData = computed(() => ({
  labels: serie.value.map((p) => etiquetaCorta.format(p.fecha)),
  datasets: [
    {
      label: 'Ventas (S/)',
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 350);
        gradient.addColorStop(0, 'rgba(0, 174, 239, 0.45)');
        gradient.addColorStop(1, 'rgba(0, 174, 239, 0.0)');
        return gradient;
      },
      borderColor: '#00aeef',
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#00aeef',
      pointHoverBackgroundColor: '#00aeef',
      pointHoverBorderColor: '#ffffff',
      /* Con 30 puntos los círculos se tocan y la línea se vuelve una
         cadena. Solo se marcan los días con venta. */
      pointRadius: (ctx: any) => (serie.value[ctx.dataIndex]?.monto ? 3.5 : 0),
      pointHoverRadius: 6,
      borderWidth: 2.5,
      tension: 0.4,
      fill: true,
      data: serie.value.map((p) => p.monto),
    },
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#f8fafc',
      bodyColor: '#e2e8f0',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
      cornerRadius: 8,
      titleFont: { size: 14, weight: 'bold' as const },
      bodyFont: { size: 13 },
      callbacks: {
        title: (items: any[]) => {
          const p = serie.value[items[0]?.dataIndex ?? 0];
          return p ? etiquetaLarga.format(p.fecha) : '';
        },
        label: (context: any) => {
          const p = serie.value[context.dataIndex];
          const monto = `Cobrado: S/ ${context.parsed.y.toFixed(2)}`;
          if (!p?.pedidos) return monto;
          return [monto, `${p.pedidos} pedido${p.pedidos === 1 ? '' : 's'}`];
        },
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        color: '#64748b',
        font: { size: 12, family: 'Inter, sans-serif' },
        /* Con un mes de datos no caben 30 fechas: se muestran unas ocho y
           el resto se lee en el tooltip. */
        autoSkip: true,
        maxTicksLimit: 8,
        maxRotation: 0,
      }
    },
    y: {
      beginAtZero: true,
      border: { display: false, dash: [4, 4] },
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
        drawTicks: false,
      },
      ticks: {
        color: '#64748b',
        padding: 10,
        font: { size: 12, family: 'Inter, sans-serif' },
        callback: (value: string | number) => `S/ ${value}`
      }
    }
  }
}));
</script>

<style scoped>
.sp-chart-container {
  height: 350px;
  width: 100%;
  position: relative;
}
.sp-chart-loading, .sp-chart-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--sp-text-soft);
  font-size: var(--sp-text-sm);
  font-weight: 500;
}
.sp-chart-retry {
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  color: var(--sp-text);
  cursor: pointer;
  font-family: var(--sp-font);
  font-size: var(--sp-text-xs);
  font-weight: 700;
  padding: 0.35rem 0.85rem;
}
.sp-chart-retry:hover {
  background: var(--sp-primary-soft);
  border-color: #00aeef33;
  color: var(--sp-primary);
}
.sp-spin {
  animation: sp-spin 1s linear infinite;
  color: var(--sp-primary);
}
@keyframes sp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.sp-chart-wrapper {
  height: 100%;
  width: 100%;
}
</style>

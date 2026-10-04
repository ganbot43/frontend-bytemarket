<template>
  <div class="sp-chart-container">
    <div v-if="pending" class="sp-chart-loading">
      <Loader2 class="sp-spin w-8 h-8 text-primary" stroke-width="2" />
      <span>Cargando datos...</span>
    </div>
    <div v-else-if="error" class="sp-chart-error">
      <span>Error al cargar el gráfico</span>
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

const { data, pending, error } = await useFetch<any[]>('/api/admin/reports/sales-chart');

const chartData = computed(() => {
  const rawData = data.value ?? [];
  const labels = rawData.map(d => d.date);
  const sales = rawData.map(d => Number(d.totalSales));

  return {
    labels,
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
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        data: sales,
      }
    ]
  };
});

const chartOptions = {
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
        label: (context: any) => `Ventas: S/ ${context.parsed.y.toFixed(2)}`
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
        color: '#94a3b8',
        font: { size: 12, family: 'Inter, sans-serif' }
      }
    },
    y: {
      border: { display: false, dash: [4, 4] },
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
        drawTicks: false,
      },
      ticks: {
        color: '#94a3b8',
        padding: 10,
        font: { size: 12, family: 'Inter, sans-serif' },
        callback: (value: string | number) => `S/ ${value}`
      }
    }
  }
};
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

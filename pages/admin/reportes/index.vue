<template>
  <div class="sp-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Reportes y Analíticas</h1>
        <p class="sp-page-toolbar__sub">Rendimiento del negocio y exportación de datos</p>
      </div>
    </div>

    <div class="sp-reportes-grid">
      <!-- Panel de Gráfico -->
      <section class="sp-reportes-section admin-lift" style="animation-delay: 50ms;">
        <div class="sp-section-header">
          <h2>Ventas de los últimos 30 días</h2>
          <span class="sp-badge">Ingresos</span>
        </div>
        <div class="sp-chart-box">
          <AdminChartsVentasChart />
        </div>
      </section>

      <!-- Panel de Exportación -->
      <section class="sp-reportes-section admin-lift" style="animation-delay: 150ms;">
        <div class="sp-section-header">
          <h2>Generación de Reportes</h2>
          <p class="sp-section-desc">Descarga los datos completos en Excel o reportes listos para imprimir en PDF.</p>
        </div>
        <AdminReportsExportPanel />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
});
useSeoMeta({ title: 'Reportes — Admin' });
</script>

<style scoped>
.sp-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.sp-reportes-grid {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-top: 1.5rem;
}

.sp-reportes-section {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-2xl);
  padding: 1.5rem;
  box-shadow: var(--sp-shadow-sm);
}

.sp-section-header {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.sp-section-header h2 {
  font-size: var(--sp-text-xl);
  font-weight: 800;
  color: var(--sp-text-strong);
  margin: 0;
  letter-spacing: -0.02em;
}

.sp-section-desc {
  margin: 0.5rem 0 0;
  color: var(--sp-text-soft);
  font-size: var(--sp-text-sm);
  width: 100%;
}

.sp-badge {
  background: var(--sp-primary-soft);
  color: var(--sp-primary-ink);
  padding: 0.25rem 0.75rem;
  border-radius: var(--sp-radius-pill);
  font-size: var(--sp-text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.sp-chart-box {
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border-soft);
  border-radius: var(--sp-radius-lg);
  padding: 1rem;
}
</style>

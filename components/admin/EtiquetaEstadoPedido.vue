<template>
  <span class="status-badge" :class="`status-badge--${status}`">
    <span class="status-badge-dot" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
const props = defineProps<{ status: string }>();

const statusMap: Record<string, string> = {
  pending: "Pendiente",
  voucher_sent: "Comprobante enviado",
  payment_validated: "Pago validado",
  in_preparation: "En preparación",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

const label = computed(() => statusMap[props.status] ?? props.status);
</script>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.7rem;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  white-space: nowrap;
  border: 1px solid transparent;
}

.status-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Pendiente ── */
.status-badge--pending {
  background: #fefce8;
  color: #854d0e;
  border-color: #fde68a;
}
/* El punto marca un estado real, así que se queda. Lo que se quitó es el
   latido en bucle: en una tabla con 20 pedidos pendientes había 20 puntos
   latiendo a la vez, compitiendo por la atención sin señalar nada nuevo. */
.status-badge--pending .status-badge-dot {
  background: #eab308;
}

/* ── Comprobante enviado ── */
.status-badge--voucher_sent {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}
.status-badge--voucher_sent .status-badge-dot {
  background: #3b82f6;
}

/* ── Pago validado ── */
.status-badge--payment_validated {
  background: #f0fdf4;
  color: #166534;
  border-color: #bbf7d0;
}
.status-badge--payment_validated .status-badge-dot {
  background: #22c55e;
}

/* ── En preparación ── */
.status-badge--in_preparation {
  background: #fff7ed;
  color: #9a3412;
  border-color: #fed7aa;
}
.status-badge--in_preparation .status-badge-dot {
  background: #f97316;
}

/* ── Entregado ── */
.status-badge--delivered {
  background: #f0fdf4;
  color: #14532d;
  border-color: #86efac;
}
.status-badge--delivered .status-badge-dot {
  background: #16a34a;
}

/* ── Cancelado ── */
.status-badge--cancelled {
  background: #fef2f2;
  color: #991b1b;
  border-color: #fecaca;
}
.status-badge--cancelled .status-badge-dot {
  background: #ef4444;
}

</style>

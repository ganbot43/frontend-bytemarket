<template>
  <p v-if="!filas.length" class="rl-vacio">Sin datos en este período.</p>
  <ul v-else class="rl">
    <li v-for="f in filas" :key="f.label" class="rl-fila">
      <div class="rl-fila__top">
        <span class="rl-fila__label">{{ f.label }}</span>
        <span class="rl-fila__amount">{{ money(f.amount) }}</span>
      </div>
      <div class="rl-fila__bar">
        <div class="rl-fila__fill" :style="{ width: `${porcentaje(f.amount)}%` }" />
      </div>
      <span class="rl-fila__meta">
        {{ f[campo] ?? f.orders ?? 0 }} {{ sufijo }}
        <template v-if="total > 0"> · {{ porcentaje(f.amount).toFixed(0) }}%</template>
      </span>
    </li>
  </ul>
</template>

<script setup lang="ts">
/**
 * Una lista con barra de proporción, compartida por los cuatro desgloses
 * del reporte (canal, forma de pago, más vendidos, cupones).
 *
 * La barra existe porque la cifra sola no se compara de un vistazo: ver que
 * la caja es un tercio de lo que entra por la web se lee en la barra, no
 * dividiendo dos números mentalmente.
 */
interface Fila {
  label: string;
  amount: number;
  orders?: number;
  units?: number;
  [k: string]: any;
}

const props = withDefaults(
  defineProps<{
    filas: Fila[];
    /** Base del 100% de las barras. Si es 0, no se pintan proporciones. */
    total: number;
    money: (n: number) => string;
    sufijo?: string;
    /** Qué contar junto al importe: unidades en productos, pedidos en el resto. */
    campo?: string;
  }>(),
  { sufijo: "pedidos", campo: "orders" },
);

const porcentaje = (n: number) =>
  props.total > 0 ? Math.min(100, (n / props.total) * 100) : 0;
</script>

<style scoped>
.rl { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.7rem; }
.rl-vacio { margin: 0; font-size: 0.8rem; color: #64748b; }
.rl-fila__top { display: flex; justify-content: space-between; gap: 0.6rem; font-size: 0.82rem; }
.rl-fila__label { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rl-fila__amount { font-weight: 700; white-space: nowrap; }
.rl-fila__bar { margin: 0.25rem 0 0.15rem; height: 5px; border-radius: 3px; background: #f1f5f9; overflow: hidden; }
.rl-fila__fill { height: 100%; border-radius: 3px; background: var(--sp-primary, #b01883); opacity: 0.8; }
.rl-fila__meta { font-size: 0.7rem; color: #64748b; }
</style>

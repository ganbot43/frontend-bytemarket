<template>
  <!-- Dos capas: las grises de fondo y las doradas recortadas al porcentaje
       exacto. Así un 4.3 se ve como 4.3 y no redondeado a 4 o a 4.5. -->
  <span
    class="es"
    :class="`es--${tamano}`"
    role="img"
    :aria-label="`${redondeado} de 5 estrellas`"
  >
    <span class="es__capa" aria-hidden="true">
      <Star
        v-for="n in 5"
        :key="`g${n}`"
        :size="px"
        stroke-width="1.5"
        class="es__gris"
      />
    </span>
    <span class="es__capa es__capa--oro" :style="{ width: `${ancho}%` }" aria-hidden="true">
      <Star
        v-for="n in 5"
        :key="`o${n}`"
        :size="px"
        stroke-width="1.5"
        class="es__oro"
      />
    </span>
  </span>
</template>

<script setup lang="ts">
import { Star } from "lucide-vue-next";

const props = withDefaults(
  defineProps<{ valor: number; tamano?: "sm" | "md" }>(),
  { tamano: "sm" },
);

const px = computed(() => (props.tamano === "md" ? 18 : 14));
const acotado = computed(() => Math.min(5, Math.max(0, Number(props.valor) || 0)));
const ancho = computed(() => (acotado.value / 5) * 100);
const redondeado = computed(() => Math.round(acotado.value * 10) / 10);
</script>

<style scoped>
.es {
  position: relative;
  display: inline-block;
  line-height: 0;
  flex-shrink: 0;
}

.es__capa {
  display: flex;
  gap: 1px;
  line-height: 0;
}

/* La capa dorada se superpone y se recorta por la izquierda. */
.es__capa--oro {
  position: absolute;
  inset: 0 auto 0 0;
  overflow: hidden;
}

.es__gris {
  color: var(--cp-slate-300, #cbd5e1);
  flex-shrink: 0;
}

.es__oro {
  color: #f59e0b;
  fill: #f59e0b;
  flex-shrink: 0;
}
</style>

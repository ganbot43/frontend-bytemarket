<template>
  <div class="sp-table-wrap">
    <div class="sp-table-scroll">
      <table class="sp-table">
        <thead>
          <tr>
            <th class="sp-th">Cajero</th>
            <th class="sp-th">Cerrada</th>
            <th class="sp-th sp-th--right">Fondo</th>
            <th class="sp-th sp-th--right">Efectivo</th>
            <th class="sp-th sp-th--right">Esperado</th>
            <th class="sp-th sp-th--right">Contado</th>
            <th class="sp-th">Cuadre</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in turnos" :key="t.id" class="sp-tr">
            <td class="sp-td">
              <p class="sp-table-title">{{ t.openedByName || "—" }}</p>
              <p class="sp-table-sub">{{ formatDateTimeCompact(t.openedAt) }}</p>
            </td>
            <td class="sp-td sp-td--muted">
              <span class="sp-table-date">{{ formatDateTimeCompact(t.closedAt) }}</span>
            </td>
            <td class="sp-td sp-td--right"><span class="sp-table-num">{{ money(t.openingFloat) }}</span></td>
            <td class="sp-td sp-td--right"><span class="sp-table-num">{{ money(t.cashSales) }}</span></td>
            <td class="sp-td sp-td--right"><span class="sp-table-num">{{ money(t.expectedCash) }}</span></td>
            <td class="sp-td sp-td--right"><span class="sp-table-amount">{{ money(t.countedCash) }}</span></td>
            <td class="sp-td">
              <span class="sp-badge" :class="badge(t.difference)">
                <span class="sp-badge__dot" />
                {{ etiqueta(t.difference) }}
              </span>
              <p v-if="t.closingNotes" class="sp-table-sub">{{ t.closingNotes }}</p>
            </td>
          </tr>

          <tr v-if="!turnos.length">
            <td colspan="7" class="sp-table-empty">
              <div class="sp-table-empty__inner">
                <div class="sp-table-empty__icon">
                  <Wallet class="w-8 h-8 text-current" stroke-width="1.5" />
                </div>
                <p class="sp-table-empty__msg">Todavía no se ha cerrado ninguna caja</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SharedPaginacion v-model:pagina="pagina" :total="total" :limite="LIMITE" />
  </div>
</template>

<script setup lang="ts">
/**
 * Los turnos de caja ya cuadrados.
 *
 * Las cifras se leen tal cual se guardaron al cerrar, no se recalculan:
 * un arqueo es una foto de ese momento, y recalcularlo daría otro número
 * en cuanto se anule una venta de ese turno.
 */
import { Wallet } from "lucide-vue-next";

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const money = (n: any) => formatPrice.format(Number(n ?? 0));

const LIMITE = 10;
const pagina = ref(0);
const turnos = ref<any[]>([]);
const total = ref(0);

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/caja/sesiones", {
      query: { limit: LIMITE, offset: pagina.value * LIMITE },
    });
    turnos.value = res?.data ?? [];
    total.value = res?.total ?? turnos.value.length;
  } catch {
    turnos.value = [];
    total.value = 0;
  }
}

/* Un descuadre de céntimos no es un problema; uno de billetes sí. El
   umbral evita que el redondeo pinte en rojo una caja que está bien. */
function badge(d: any) {
  const v = Math.abs(Number(d ?? 0));
  if (v < 0.005) return "sp-badge--success";
  return v < 1 ? "sp-badge--warning" : "sp-badge--danger";
}

function etiqueta(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "Cuadra";
  return v > 0 ? `Sobran ${money(v)}` : `Faltan ${money(Math.abs(v))}`;
}

watch(pagina, cargar);
onMounted(cargar);
</script>

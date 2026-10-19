<template>
  <div class="sp-table-wrap">
    <div class="sp-table-scroll">
      <table class="sp-table">
        <thead>
          <tr>
            <th class="sp-th">Cajero</th>
            <th class="sp-th">Cuadrada</th>
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
              <p class="sp-table-title">{{ t.cashierName || "—" }}</p>
              <p class="sp-table-sub">
                {{ formatDateTimeCompact(t.openedAt) }}
                <template v-if="t.assignedByName"> · fondo de {{ t.assignedByName }}</template>
              </p>
            </td>
            <td class="sp-td sp-td--muted">
              <span class="sp-table-date">{{ formatDateTimeCompact(t.settledAt) }}</span>
              <p v-if="t.settledByName" class="sp-table-sub">por {{ t.settledByName }}</p>
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
              <!-- El badge es del efectivo. Un turno con el cajón perfecto y
                   50 soles de Yape sin abonar saldría en verde, así que las
                   demás formas que no cuadraron se dicen aparte. -->
              <p v-for="c in descuadres(t)" :key="c.type" class="sp-table-sub">
                {{ c.label }}: {{ etiqueta(c.difference) }}
              </p>
              <p v-for="c in sinPapeles(t)" :key="'v' + c.type" class="sp-table-sub">
                {{ c.label }}: {{ c.vouchersCounted }} voucher(s) de {{ c.sales }} venta(s)
              </p>
              <p v-if="(t.audits || []).length" class="sp-table-sub">
                {{ t.audits.length }} arqueo(s) sorpresivo(s) durante el turno
              </p>
              <p v-if="t.closingNotes" class="sp-table-sub">{{ t.closingNotes }}</p>
            </td>
          </tr>

          <tr v-if="!turnos.length">
            <td colspan="7" class="sp-table-empty">
              <div class="sp-table-empty__inner">
                <div class="sp-table-empty__icon">
                  <Wallet class="w-8 h-8 text-current" stroke-width="1.5" />
                </div>
                <p class="sp-table-empty__msg">Todavía no se ha cuadrado ninguna caja</p>
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
 * Las cifras se leen tal cual se guardaron al cuadrar, no se recalculan: un
 * cuadre es una foto de ese momento, y recalcularlo daría otro número en
 * cuanto se anule una venta de ese turno.
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

/* Las formas de pago distintas del efectivo que no cuadraron. El efectivo
   ya tiene su propia columna y su badge: repetirlo aquí sería decirlo dos
   veces. */
function descuadres(t: any) {
  return (t.counts || []).filter(
    (c: any) => c.type !== "efectivo" && Math.abs(Number(c.difference ?? 0)) >= 0.005
  );
}

/* Y las que cuadraron de dinero pero no de papeles: quince ventas con
   tarjeta tienen que ser quince vouchers. */
function sinPapeles(t: any) {
  return (t.counts || []).filter(
    (c: any) =>
      c.type !== "efectivo" &&
      c.vouchersCounted !== null &&
      c.vouchersCounted !== undefined &&
      Number(c.vouchersCounted) !== Number(c.sales)
  );
}

function etiqueta(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "Cuadra";
  return v > 0 ? `Sobran ${money(v)}` : `Faltan ${money(Math.abs(v))}`;
}

watch(pagina, cargar);
onMounted(cargar);
</script>

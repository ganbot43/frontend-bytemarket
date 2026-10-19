<template>
  <!-- Fuera de la pantalla y visible solo al imprimir: la regla vive en
       admin-panel.css, con los otros papeles de caja. -->
  <Teleport to="body">
    <div v-if="turno" class="sp-papel">
      <header class="sp-papel__head">
        <p class="sp-papel__store">{{ negocio.name || nombre }}</p>
        <p v-if="negocio.ruc" class="sp-papel__meta">RUC {{ negocio.ruc }}</p>
        <p v-if="negocio.address" class="sp-papel__meta">{{ negocio.address }}</p>
      </header>

      <p class="sp-papel__kind">Papel de caja Nº {{ turno.id }}</p>

      <dl class="sp-papel__info">
        <div><dt>Cajero</dt><dd>{{ turno.cashierName || "—" }}</dd></div>
        <div v-if="turno.cashierDni"><dt>DNI</dt><dd>{{ turno.cashierDni }}</dd></div>
        <div><dt>Fondo entregado por</dt><dd>{{ turno.assignedByName || "—" }}</dd></div>
        <div><dt>Cuadró</dt><dd>{{ turno.settledByName || "—" }}</dd></div>
        <div><dt>Apertura</dt><dd>{{ formatDateTimeCompact(turno.openedAt) }}</dd></div>
        <div><dt>Cierre</dt><dd>{{ formatDateTimeCompact(turno.closedAt) }}</dd></div>
      </dl>

      <table class="sp-papel__tabla">
        <thead>
          <tr><th>Forma</th><th>Esperado</th><th>Contado</th><th>Dif.</th><th>Vouch.</th></tr>
        </thead>
        <tbody>
          <tr v-for="c in (turno.counts || [])" :key="c.type">
            <td>{{ c.label }}</td>
            <td>{{ money(c.expected) }}</td>
            <td>{{ money(c.counted) }}</td>
            <td>{{ conSigno(c.difference) }}</td>
            <td>{{ c.vouchersCounted ?? "—" }}/{{ c.sales }}</td>
          </tr>
        </tbody>
      </table>

      <ul class="sp-papel__lista">
        <li><span>Fondo inicial</span><strong>{{ money(turno.openingFloat) }}</strong></li>
        <li><span>Entradas y salidas</span><strong>{{ conSigno(turno.movementsTotal) }}</strong></li>
        <li v-for="m in (turno.movements || [])" :key="m.id" class="sp-papel__chico">
          <span>{{ etiquetaMov(m.type) }} · {{ m.reason }}</span>
          <strong>{{ conSigno(m.delta) }}</strong>
        </li>
        <li v-for="a in (turno.audits || [])" :key="'a' + a.id" class="sp-papel__chico">
          <span>Arqueo {{ formatDateTimeCompact(a.createdAt) }} · {{ a.performedByName }}</span>
          <strong>{{ conSigno(a.difference) }}</strong>
        </li>
      </ul>

      <p class="sp-papel__destacado">{{ textoDif(turno.difference) }}</p>
      <p v-if="turno.closingNotes" class="sp-papel__nota">
        Observación: {{ turno.closingNotes }}
      </p>

      <!-- Las dos firmas son el motivo de que esto se imprima: el cajero
           reconoce con qué efectivo y qué vouchers entregó la caja, y el
           encargado que los contó él. -->
      <div class="sp-papel__firmas">
        <div><span>Firma del cajero</span><p>{{ turno.cashierName || "" }}</p></div>
        <div><span>Firma del encargado</span><p>{{ turno.settledByName || "" }}</p></div>
      </div>

      <p class="sp-papel__pie">
        Conforme con el cuadre arriba detallado. Documento interno de control
        de caja; no es un comprobante de pago.
      </p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * El papel de caja: el documento que firman el cajero y el encargado al
 * cuadrar el turno.
 *
 * Vive en su propio componente porque se imprime desde dos sitios: al
 * cuadrar, en /admin/cajas, y al reimprimirlo desde el historial de
 * Reportes. Con una copia en cada pantalla, el día que cambie una línea
 * saldrían dos papeles distintos para el mismo turno —y es un documento
 * firmado, así que eso no es un detalle de mantenimiento—.
 *
 * Solo pinta cuando recibe un turno: montarlo vacío dejaría un papel en
 * blanco pegado al body que la regla de impresión sacaría por la
 * impresora.
 */
defineProps<{ turno: any | null }>();

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const { nombre } = useLogo();
const negocio = computed<any>(() => useBusinessConfig().value ?? {});

const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const MOVIMIENTOS: Record<string, string> = {
  in: "Entra dinero",
  out: "Retiro",
  expense: "Gasto",
};
const etiquetaMov = (t: string) => MOVIMIENTOS[t] ?? t;

function textoDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "El efectivo cuadra exactamente.";
  return v > 0 ? `Sobran ${money(v)} en el cajón.` : `Faltan ${money(Math.abs(v))} en el cajón.`;
}
</script>

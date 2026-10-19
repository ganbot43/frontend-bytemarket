<template>
  <div class="sp-table-wrap">
    <div class="sp-table-scroll">
      <table class="sp-table">
        <thead>
          <tr>
            <th class="sp-th">Cajero</th>
            <th class="sp-th">Firmado por</th>
            <th class="sp-th sp-th--right">Esperado</th>
            <th class="sp-th sp-th--right">Contado</th>
            <th class="sp-th">Cuadre</th>
            <th class="sp-th">Arqueos</th>
            <th class="sp-th sp-th--center" style="width: 110px">Auditar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in turnos" :key="t.id" class="sp-tr sp-tr--clickable" @click="abrir(t)">
            <td class="sp-td">
              <p class="sp-table-title">{{ t.cashierName || "—" }}</p>
              <p class="sp-table-sub">
                <template v-if="t.cashierDni">DNI {{ t.cashierDni }} · </template>
                turno Nº {{ t.id }} · {{ formatDateTimeCompact(t.openedAt) }}
              </p>
            </td>
            <!-- La pregunta de una auditoría es quién puso la firma, así
                 que va en la lista y no escondida en el detalle. -->
            <td class="sp-td">
              <p class="sp-table-title">{{ t.settledByName || "—" }}</p>
              <p class="sp-table-sub sp-table-date">{{ formatDateTimeCompact(t.settledAt) }}</p>
            </td>
            <td class="sp-td sp-td--right"><span class="sp-table-num">{{ money(t.expectedCash) }}</span></td>
            <td class="sp-td sp-td--right"><span class="sp-table-amount">{{ money(t.countedCash) }}</span></td>
            <td class="sp-td">
              <span class="sp-badge" :class="badge(t.difference)">
                <span class="sp-badge__dot" />
                {{ etiqueta(t.difference) }}
              </span>
              <!-- El badge es del efectivo. Un turno con el cajón perfecto y
                   50 soles de Yape sin abonar saldría en verde. -->
              <p v-for="c in descuadres(t)" :key="c.type" class="sp-table-sub">
                {{ c.label }}: {{ etiqueta(c.difference) }}
              </p>
              <p v-for="c in sinPapeles(t)" :key="'v' + c.type" class="sp-table-sub">
                {{ c.label }}: {{ c.vouchersCounted }} voucher(s) de {{ c.sales }} venta(s)
              </p>
            </td>
            <td class="sp-td">
              <span class="sp-table-num">{{ (t.audits || []).length }}</span>
              <p v-if="(t.audits || []).length" class="sp-table-sub">
                {{ conDiferencia(t) }} con diferencia
              </p>
            </td>
            <td class="sp-td">
              <div class="sp-table-actions">
                <button class="sp-table-btn sp-table-btn--view" title="Ver el turno entero"
                        @click.stop="abrir(t)">
                  <FileSearch class="w-3.5 h-3.5" stroke-width="1.5" />
                </button>
              </div>
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

    <!-- ── El turno entero, para auditarlo ────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="abierto" class="sp-drawer-overlay" @click.self="abierto = null" />
      </Transition>
    </Teleport>
    <Teleport to="body">
      <Transition name="sp-drawer-panel">
        <aside v-if="abierto" class="sp-drawer-panel" role="dialog" aria-modal="true">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">Turno Nº {{ abierto.id }}</p>
              <h2 class="sp-drawer-header__title">{{ abierto.cashierName || "—" }}</h2>
            </div>
            <button class="sp-drawer-close" aria-label="Cerrar" @click="abierto = null">✕</button>
          </div>

          <div class="sp-drawer-body">
            <!-- Las firmas primero: es a lo que se viene. -->
            <section class="hist-bloque">
              <h3>Quién firmó</h3>
              <dl class="hist-datos">
                <div><dt>Cajero</dt><dd>{{ abierto.cashierName || "—" }}<small v-if="abierto.cashierDni"> · DNI {{ abierto.cashierDni }}</small></dd></div>
                <div><dt>Entregó el fondo</dt><dd>{{ abierto.assignedByName || "—" }}</dd></div>
                <div><dt>Cuadró y firmó</dt><dd>{{ abierto.settledByName || "—" }}</dd></div>
                <div><dt>Apertura</dt><dd>{{ formatDateTimeCompact(abierto.openedAt) }}</dd></div>
                <div><dt>Cierre del cajero</dt><dd>{{ formatDateTimeCompact(abierto.closedAt) }}</dd></div>
                <div><dt>Cuadre</dt><dd>{{ formatDateTimeCompact(abierto.settledAt) }}</dd></div>
              </dl>
            </section>

            <section class="hist-bloque">
              <h3>El cuadre</h3>
              <table class="hist-tabla">
                <thead>
                  <tr><th>Forma</th><th>Esperado</th><th>Contado</th><th>Dif.</th><th>Vouchers</th></tr>
                </thead>
                <tbody>
                  <tr v-for="c in (abierto.counts || [])" :key="c.type">
                    <td>{{ c.label }}</td>
                    <td>{{ money(c.expected) }}</td>
                    <td>{{ money(c.counted) }}</td>
                    <td :class="clase(c.difference)">{{ conSigno(c.difference) }}</td>
                    <td>{{ c.vouchersCounted ?? "—" }} / {{ c.sales }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="abierto.closingNotes" class="hist-nota">
                <strong>Observación:</strong> {{ abierto.closingNotes }}
              </p>
            </section>

            <!-- Los arqueos sorpresivos: quién entró a contar, cuándo y qué
                 encontró. Es la mitad de la auditoría: un turno que cuadra
                 al final pero descuadró a media mañana cuenta otra historia. -->
            <section v-if="(abierto.audits || []).length" class="hist-bloque">
              <h3>Arqueos sorpresivos</h3>
              <ul class="hist-arqueos">
                <li v-for="a in abierto.audits" :key="a.id">
                  <div>
                    <strong>{{ a.performedByName || "—" }}</strong>
                    <span>{{ formatDateTimeCompact(a.createdAt) }}</span>
                  </div>
                  <p>
                    Esperaba {{ money(a.expectedCash) }}, contó {{ money(a.countedCash) }}
                    <em :class="clase(a.difference)">{{ conSigno(a.difference) }}</em>
                  </p>
                  <p v-if="a.observation" class="hist-nota">{{ a.observation }}</p>
                </li>
              </ul>
            </section>

            <section v-if="(abierto.movements || []).length" class="hist-bloque">
              <h3>Movimientos de efectivo</h3>
              <ul class="hist-movs">
                <li v-for="m in abierto.movements" :key="m.id">
                  <span>{{ formatDateTimeCompact(m.createdAt) }} · {{ m.reason }}</span>
                  <strong :class="clase(m.delta)">{{ conSigno(m.delta) }}</strong>
                </li>
              </ul>
            </section>

            <section v-if="(abierto.historial || []).length" class="hist-bloque">
              <h3>Todo lo que pasó</h3>
              <ol class="hist-linea">
                <li v-for="h in abierto.historial" :key="h.id">
                  <span class="hist-linea__hora">{{ formatHoraCorta(h.createdAt) }}</span>
                  <span class="hist-linea__que">{{ ACCION[h.action] || h.action }}</span>
                  <span class="hist-linea__quien">{{ h.userName || "—" }}</span>
                  <span class="hist-linea__detalle">{{ h.detail }}</span>
                </li>
              </ol>
            </section>
          </div>

          <div class="sp-drawer-footer">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="abierto = null">Cerrar</button>
            <button class="sp-drawer-btn sp-drawer-btn--primary" @click="reimprimir">
              Reimprimir el papel
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>

    <AdminCajaPapel :turno="papel" />
  </div>
</template>

<script setup lang="ts">
/**
 * Los turnos ya cuadrados, para auditarlos.
 *
 * La pregunta que trae a alguien aquí es siempre la misma: quién firmó
 * este cuadre y qué pasó durante el turno. Por eso "Firmado por" va en la
 * lista —no escondido en el detalle— y abriendo una fila está todo: las
 * tres personas que intervinieron, el cuadre por forma de pago, los
 * arqueos sorpresivos con lo que encontró cada uno, los movimientos y la
 * línea de tiempo completa.
 *
 * Las cifras se leen tal cual se guardaron al cuadrar, no se recalculan:
 * un cuadre es una foto de ese momento, y recalcularlo daría otro número
 * en cuanto se anule una venta de ese turno.
 */
import { Wallet, FileSearch } from "lucide-vue-next";

const { formatDateTimeCompact, formatHoraCorta } = useFormatDateTime();
const formatPrice = useFormatPrice();
const { imprimirPapel } = useImpresion();

const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const ACCION: Record<string, string> = {
  assigned: "Fondo asignado",
  enabled: "Habilitado",
  opened: "Caja abierta",
  sale: "Venta",
  movement: "Movimiento",
  audit: "Arqueo",
  closed: "Caja cerrada",
  settled: "Cuadrada",
};

const LIMITE = 10;
const pagina = ref(0);
const turnos = ref<any[]>([]);
const total = ref(0);
const abierto = ref<any>(null);
const papel = ref<any>(null);

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

const abrir = (t: any) => { abierto.value = t; };

/* El papel se monta, se imprime y se desmonta; en el finally para que no
   se quede puesto si la impresión falla. */
async function reimprimir() {
  papel.value = abierto.value;
  try {
    await imprimirPapel(`Papel de caja ${abierto.value?.id ?? ""}`.trim());
  } finally {
    papel.value = null;
  }
}

/* Un descuadre de céntimos no es un problema; uno de billetes sí. El
   umbral evita que el redondeo pinte en rojo una caja que está bien. */
function badge(d: any) {
  const v = Math.abs(Number(d ?? 0));
  if (v < 0.005) return "sp-badge--success";
  return v < 1 ? "sp-badge--warning" : "sp-badge--danger";
}

function clase(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "hist-ok";
  return v > 0 ? "hist-sobra" : "hist-falta";
}

function descuadres(t: any) {
  return (t.counts || []).filter(
    (c: any) => c.type !== "efectivo" && Math.abs(Number(c.difference ?? 0)) >= 0.005
  );
}

function sinPapeles(t: any) {
  return (t.counts || []).filter(
    (c: any) =>
      c.type !== "efectivo" &&
      c.vouchersCounted !== null &&
      c.vouchersCounted !== undefined &&
      Number(c.vouchersCounted) !== Number(c.sales)
  );
}

const conDiferencia = (t: any) =>
  (t.audits || []).filter((a: any) => Math.abs(Number(a.difference ?? 0)) >= 0.005).length;

function etiqueta(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "Cuadra";
  return v > 0 ? `Sobran ${money(v)}` : `Faltan ${money(Math.abs(v))}`;
}

watch(pagina, cargar);
onMounted(cargar);
</script>

<style scoped>
.hist-bloque { margin-bottom: 1.5rem; }
.hist-bloque h3 {
  margin: 0 0 0.6rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  color: var(--sp-text-soft);
}

.hist-datos { margin: 0; display: grid; gap: 0.35rem; }
.hist-datos > div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-sm);
}
.hist-datos dt { margin: 0; color: var(--sp-text-soft); }
.hist-datos dd { margin: 0; text-align: right; font-weight: 600; }
.hist-datos small { font-weight: 500; color: var(--sp-text-soft); }

.hist-tabla { width: 100%; border-collapse: collapse; font-size: var(--sp-text-sm); }
.hist-tabla th {
  text-align: right;
  padding: 0.3rem 0.4rem;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sp-text-soft);
  border-bottom: 1px solid var(--sp-border);
}
.hist-tabla th:first-child, .hist-tabla td:first-child { text-align: left; }
.hist-tabla td {
  text-align: right;
  padding: 0.35rem 0.4rem;
  border-bottom: 1px solid var(--sp-border);
  font-variant-numeric: tabular-nums;
}

.hist-ok { color: #0a7a56; font-weight: 700; }
.hist-sobra { color: #92600a; font-weight: 700; }
.hist-falta { color: #b91c1c; font-weight: 700; }

.hist-nota {
  margin: 0.5rem 0 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.5;
}

.hist-arqueos { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.7rem; }
.hist-arqueos li {
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-subtle);
}
.hist-arqueos li > div { display: flex; justify-content: space-between; gap: 0.6rem; }
.hist-arqueos strong { font-size: var(--sp-text-sm); }
.hist-arqueos span { font-size: var(--sp-text-xs); color: var(--sp-text-soft); }
.hist-arqueos p { margin: 0.25rem 0 0; font-size: var(--sp-text-xs); color: var(--sp-text-soft); }
.hist-arqueos em { font-style: normal; margin-left: 0.3rem; }

.hist-movs { list-style: none; margin: 0; padding: 0; }
.hist-movs li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-xs);
}
.hist-movs span { color: var(--sp-text-soft); }

.hist-linea { list-style: none; margin: 0; padding: 0; }
.hist-linea li {
  display: grid;
  grid-template-columns: 4.8rem 7rem 1fr;
  gap: 0.4rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-xs);
}
.hist-linea__hora { font-variant-numeric: tabular-nums; color: var(--sp-text-soft); }
.hist-linea__que { font-weight: 700; color: var(--sp-text-strong); }
.hist-linea__quien { grid-column: 2; color: var(--sp-text-soft); }
.hist-linea__detalle { grid-column: 3; grid-row: 1 / span 2; color: var(--sp-text-soft); }
</style>

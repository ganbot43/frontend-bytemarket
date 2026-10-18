<template>
  <div class="sp-page cajas-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Cajas</h1>
        <p class="sp-page-toolbar__sub">
          {{ abiertas.length }} caja(s) abierta(s) · aperturas, fondos y arqueo
        </p>
      </div>
      <button class="sp-page-btn" @click="abrirApertura">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Aperturar caja
      </button>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Cajero</th>
              <th class="sp-th">Aperturada</th>
              <th class="sp-th sp-th--right">Fondo entregado</th>
              <th class="sp-th">Ventas del turno</th>
              <th class="sp-th">Movimientos</th>
              <th class="sp-th sp-th--center" style="width: 110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in abiertas" :key="t.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ t.cashierName || "—" }}</p>
                <p class="sp-table-sub">La aperturó {{ t.openedByName || "—" }}</p>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{ formatDateTimeCompact(t.openedAt) }}</span>
              </td>
              <td class="sp-td sp-td--right">
                <span class="sp-table-amount">{{ money(t.openingFloat) }}</span>
              </td>
              <td class="sp-td">
                <!-- Cuántas y de qué formas, nunca cuánto: quien va a contar
                     no puede tener la respuesta delante. -->
                <span class="sp-table-num">{{ t.salesCount ?? 0 }}</span>
                <p class="sp-table-sub">{{ formasDe(t) }}</p>
              </td>
              <td class="sp-td">
                <span class="sp-table-num">{{ t.movementsCount ?? 0 }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--edit" title="Movimiento de efectivo"
                          @click="abrirMovimiento(t)">
                    <ArrowLeftRight class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button class="sp-table-btn sp-table-btn--warn" title="Arquear y cerrar"
                          @click="abrirArqueo(t)">
                    <ClipboardCheck class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!abiertas.length">
              <td colspan="6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Wallet class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">No hay ninguna caja abierta</p>
                  <button class="sp-table-empty__cta" @click="abrirApertura">
                    Aperturar la primera
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="cajas-pie">
      Los turnos ya cuadrados se consultan en
      <NuxtLink to="/admin/reportes">Reportes</NuxtLink>.
    </p>

    <!-- ── Aperturar ──────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'abrir'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Aperturar caja</h3>
                <p class="sp-modal-header__meta">
                  Entrega el fondo y queda registrado que lo entregaste tú.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
            </div>

            <div class="sp-modal-body">
              <div class="cajas-campo">
                <label class="sp-drawer-label" for="cajero">Cajero</label>
                <select id="cajero" v-model="apertura.cashierId"
                        class="sp-drawer-input sp-drawer-select">
                  <option :value="null" disabled>Elige a quién le entregas la caja</option>
                  <option v-for="c in cajeros" :key="c.id" :value="c.id">
                    {{ c.name }} ({{ c.email }})
                  </option>
                  <!-- El encargado que también atiende: su caja es la suya,
                       pero sigue constando quién la aperturó. -->
                  <option v-if="yo?.id" :value="yo.id">Yo mismo ({{ yo.email }})</option>
                </select>
                <p v-if="!cajeros.length" class="cajas-nota">
                  No hay cajeros activos. Da de alta uno en
                  <NuxtLink to="/admin/usuarios">Usuarios</NuxtLink> y vuelve.
                </p>
              </div>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="fondo">Fondo inicial</label>
                <div class="cajas-money">
                  <span>S/</span>
                  <input id="fondo" ref="fondoRef" v-model.number="apertura.openingFloat"
                         type="number" min="0" step="0.10" class="sp-drawer-input"
                         placeholder="0.00" @keydown.enter.prevent="aperturar" />
                </div>
                <p class="cajas-nota">
                  Cuenta el sencillo antes de entregarlo. Es la cifra contra la
                  que se cuadrará al cerrar, así que vale la pena contarlo bien.
                </p>
              </div>

              <p v-if="error" class="cajas-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="cargando" @click="aperturar">
                {{ cargando ? "Aperturando…" : "Aperturar y entregar fondo" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Movimiento de efectivo ─────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'movimiento'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Movimiento de efectivo</h3>
                <p class="sp-modal-header__meta">
                  Caja de {{ turno?.cashierName || "—" }} · dinero que entra o sale
                  del cajón sin ser una venta.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
            </div>

            <div class="sp-modal-body">
              <div class="cajas-tipos">
                <button v-for="t in TIPOS" :key="t.value" type="button" class="cajas-tipo"
                        :class="{ 'cajas-tipo--on': mov.type === t.value }" @click="mov.type = t.value">
                  <strong>{{ t.label }}</strong>
                  <span>{{ t.hint }}</span>
                </button>
              </div>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="mov-importe">Importe</label>
                <input id="mov-importe" v-model.number="mov.amount" type="number" min="0.1"
                       step="0.10" class="sp-drawer-input" placeholder="0.00" />
              </div>
              <div class="cajas-campo">
                <label class="sp-drawer-label" for="mov-motivo">Motivo</label>
                <input id="mov-motivo" v-model="mov.reason" type="text" class="sp-drawer-input"
                       placeholder="Ej: retiro a caja fuerte"
                       @keydown.enter.prevent="guardarMovimiento" />
                <p class="cajas-nota">
                  Un retiro de 200 soles sin explicar es indistinguible de un
                  faltante cuando alguien revise el turno dentro de un mes.
                </p>
              </div>

              <p v-if="error" class="cajas-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary"
                      :disabled="cargando || !mov.amount || !mov.reason.trim()"
                      @click="guardarMovimiento">
                {{ cargando ? "Guardando…" : "Registrar" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Arqueo y cierre ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'arqueo'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <!-- Paso 1: contar -->
            <template v-if="!cuadre">
              <div class="sp-modal-header">
                <div class="sp-modal-header__content">
                  <h3 class="sp-modal-header__title">Arqueo de caja</h3>
                  <p class="sp-modal-header__meta">
                    Caja de {{ turno?.cashierName || "—" }} ·
                    aperturada {{ formatDateTimeCompact(turno?.openedAt) }}
                  </p>
                </div>
                <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
              </div>

              <div class="sp-modal-body">
                <p class="cajas-aviso">
                  <strong>No te enseñamos ninguna cifra hasta que cuentes.</strong>
                  Si vieras los totales antes, el arqueo no detectaría nada: es
                  para lo único que existe.
                </p>

                <div v-for="f in (turno?.toCount || [])" :key="f.type" class="cajas-campo">
                  <label class="sp-drawer-label" :for="`cnt-${f.type}`">
                    {{ f.label }}
                    <span class="cajas-contra">{{ CONTRA[f.type] || "contra su comprobante" }}</span>
                  </label>
                  <div class="cajas-money">
                    <span>S/</span>
                    <input :id="`cnt-${f.type}`" v-model.number="contado[f.type]" type="number"
                           min="0" step="0.10" class="sp-drawer-input" placeholder="0.00" />
                  </div>
                  <p class="cajas-nota">{{ f.sales }} venta(s) por esta forma en el turno</p>
                </div>

                <div class="cajas-campo">
                  <label class="sp-drawer-label" for="notas">
                    Notas <span class="cajas-opt">(opcional)</span>
                  </label>
                  <input id="notas" v-model="notas" type="text" class="sp-drawer-input"
                         placeholder="Ej: faltó un billete de 10" />
                </div>

                <p v-if="error" class="cajas-error">{{ error }}</p>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
                <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="cargando || !todoContado"
                        @click="cerrarCaja">
                  {{ cargando ? "Cerrando…" : "Arquear y cerrar" }}
                </button>
              </div>
            </template>

            <!-- Paso 2: el cuadre -->
            <template v-else>
              <div class="sp-modal-header">
                <div class="sp-modal-header__content">
                  <h3 class="sp-modal-header__title">Caja cerrada</h3>
                  <p class="sp-modal-header__meta">{{ formatDateTimeCompact(cuadre.closedAt) }}</p>
                </div>
              </div>

              <div class="sp-modal-body">
                <ul class="cajas-cuadre">
                  <li><span>Fondo inicial</span><strong>{{ money(cuadre.openingFloat) }}</strong></li>
                  <li><span>Cobrado en efectivo</span><strong>{{ money(cuadre.cashSales) }}</strong></li>
                  <li><span>Entradas y salidas</span><strong>{{ conSigno(cuadre.movementsTotal) }}</strong></li>
                  <li class="cajas-cuadre__total">
                    <span>Debería haber en el cajón</span>
                    <strong>{{ money(cuadre.expectedCash) }}</strong>
                  </li>
                  <li><span>Contaste</span><strong>{{ money(cuadre.countedCash) }}</strong></li>
                </ul>

                <p class="cajas-dif" :class="claseDif(cuadre.difference)">
                  {{ textoDif(cuadre.difference) }}
                </p>

                <div v-if="(cuadre.counts || []).length" class="cajas-arqueo">
                  <p class="cajas-arqueo__label">Arqueo por forma de pago</p>
                  <table class="cajas-arqueo__tabla">
                    <thead>
                      <tr>
                        <th>Forma</th>
                        <th>Esperado</th>
                        <th>Contado</th>
                        <th>Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="c in cuadre.counts" :key="c.type">
                        <td>{{ c.label }}</td>
                        <td>{{ money(c.expected) }}</td>
                        <td>{{ money(c.counted) }}</td>
                        <td :class="claseDif(c.difference)">{{ conSigno(c.difference) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cerrar</button>
                <button class="sp-drawer-btn sp-drawer-btn--primary" @click="imprimirCierre">
                  Imprimir para firmar
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── El papel que firma el cajero ───────────────────────── -->
    <!-- Fuera de la pantalla siempre y visible solo al imprimir. Va aquí,
         pegado al body, porque la regla de impresión apaga los hermanos del
         body: dentro del modal se imprimiría el modal entero. -->
    <Teleport to="body">
      <div v-if="cuadre" id="sp-print-slip" class="slip">
        <header class="slip__head">
          <p class="slip__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="slip__meta">RUC {{ negocio.ruc }}</p>
          <p v-if="negocio.address" class="slip__meta">{{ negocio.address }}</p>
        </header>

        <p class="slip__kind">Cierre de caja Nº {{ cuadre.id }}</p>

        <dl class="slip__info">
          <div><dt>Cajero</dt><dd>{{ cuadre.cashierName || "—" }}</dd></div>
          <div><dt>Aperturó</dt><dd>{{ cuadre.openedByName || "—" }}</dd></div>
          <div><dt>Apertura</dt><dd>{{ formatDateTimeCompact(cuadre.openedAt) }}</dd></div>
          <div><dt>Cierre</dt><dd>{{ formatDateTimeCompact(cuadre.closedAt) }}</dd></div>
        </dl>

        <table class="slip__tabla">
          <thead>
            <tr><th>Forma</th><th>Ventas</th><th>Esperado</th><th>Contado</th><th>Dif.</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in (cuadre.counts || [])" :key="c.type">
              <td>{{ c.label }}</td>
              <td class="slip__n">{{ c.sales }}</td>
              <td class="slip__n">{{ money(c.expected) }}</td>
              <td class="slip__n">{{ money(c.counted) }}</td>
              <td class="slip__n">{{ conSigno(c.difference) }}</td>
            </tr>
          </tbody>
        </table>

        <ul class="slip__detalle">
          <li><span>Fondo inicial</span><strong>{{ money(cuadre.openingFloat) }}</strong></li>
          <li><span>Entradas y salidas</span><strong>{{ conSigno(cuadre.movementsTotal) }}</strong></li>
          <li v-for="m in (cuadre.movements || [])" :key="m.id" class="slip__mov">
            <span>{{ etiquetaMov(m.type) }} · {{ m.reason }}</span>
            <strong>{{ conSigno(m.delta) }}</strong>
          </li>
        </ul>

        <p class="slip__dif">{{ textoDif(cuadre.difference) }}</p>
        <p v-if="cuadre.closingNotes" class="slip__notas">Notas: {{ cuadre.closingNotes }}</p>

        <!-- Las dos firmas son el motivo de que esto se imprima: el cajero
             reconoce con qué efectivo y qué vouchers entregó la caja, y el
             encargado que los contó él. -->
        <div class="slip__firmas">
          <div><span>Firma del cajero</span><p>{{ cuadre.cashierName || "" }}</p></div>
          <div><span>Firma del encargado</span><p>{{ cuadre.openedByName || "" }}</p></div>
        </div>

        <p class="slip__pie">
          Conforme con el arqueo arriba detallado. Documento interno de control
          de caja; no es un comprobante de pago.
        </p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Aperturas y arqueo: la pantalla del jefe de ventas y del encargado.
 *
 * Aquí viven las tres cosas que el cajero no hace: entregarle el fondo,
 * mover el efectivo del cajón y cuadrarlo al final. Están separadas de la
 * pantalla de venta a propósito —no es una pestaña más—, porque son de otra
 * persona.
 *
 * La decisión que gobierna el arqueo: mientras la caja está abierta esta
 * pantalla no recibe ni un importe del servidor. Ni ventas, ni efectivo
 * esperado, ni desglose. Solo cuántas ventas hubo y de qué formas, para
 * saber qué comprobantes juntar. Quien ve la cifra objetivo deja de contar y
 * la copia.
 */
import { Plus, Wallet, ArrowLeftRight, ClipboardCheck } from "lucide-vue-next";

definePageMeta({ layout: "admin", middleware: "auth" });
useSeoMeta({ title: "Cajas · Admin" });

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const { nombre } = useLogo();
const negocio = computed<any>(() => useBusinessConfig().value ?? {});
const { user } = useUserSession();
const yo = computed<any>(() => user.value ?? null);

/* Contra qué se cuenta cada forma. Es la mitad del arqueo: sin decirlo, el
   encargado no sabe de dónde sacar la cifra de Yape y acaba copiando la del
   sistema —que es justo lo que el arqueo intenta comprobar—. */
const CONTRA: Record<string, string> = {
  efectivo: "cuenta el dinero del cajón",
  tarjeta: "cierre de lote del POS (Niubiz)",
  yape: "abonos recibidos en el Yape del negocio",
  plin: "abonos recibidos en el Plin del negocio",
  bank_transfer: "abonos en la cuenta del banco",
};

const TIPOS = [
  { value: "in", label: "Entra dinero", hint: "Sencillo, reposición de fondo" },
  { value: "out", label: "Retiro", hint: "A la caja fuerte o al banco" },
  { value: "expense", label: "Gasto", hint: "Pagado con el efectivo del cajón" },
];
const etiquetaMov = (t: string) => TIPOS.find((x) => x.value === t)?.label ?? t;

const abiertas = ref<any[]>([]);
const cajeros = ref<any[]>([]);
const cargando = ref(false);
const error = ref("");

const modal = ref<"" | "abrir" | "movimiento" | "arqueo">("");
const turno = ref<any>(null);
const fondoRef = ref<HTMLInputElement>();

const apertura = reactive<{ cashierId: number | null; openingFloat: number | null }>({
  cashierId: null,
  openingFloat: null,
});
const mov = reactive({ type: "out", amount: null as number | null, reason: "" });
const contado = ref<Record<string, number | null>>({});
const notas = ref("");
const cuadre = ref<any>(null);

/** Ninguna forma puede quedar en blanco: un arqueo a medias parece completo. */
const todoContado = computed(() =>
  (turno.value?.toCount || []).every((f: any) => {
    const v = contado.value[f.type];
    return v !== null && v !== undefined && (v as any) !== "" && Number(v) >= 0;
  })
);

const formasDe = (t: any) =>
  (t.toCount || []).map((f: any) => f.label).join(" · ") || "sin ventas aún";

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/caja/sesiones/abiertas");
    abiertas.value = res?.data ?? [];
  } catch {
    abiertas.value = [];
  }
}

async function cargarCajeros() {
  try {
    const res: any = await $fetch("/api/admin/users", { query: { role: "cajero", limit: 100 } });
    // Un cajero desactivado no puede entrar: aperturarle una caja deja un
    // turno abierto que nadie va a usar y que alguien tendrá que cuadrar.
    cajeros.value = (res?.data ?? []).filter((u: any) => u.isActive);
  } catch {
    cajeros.value = [];
  }
}

function mensaje(e: any, porDefecto: string) {
  return e?.data?.message ?? porDefecto;
}

function cerrarModal() {
  modal.value = "";
  error.value = "";
  if (cuadre.value) {
    cuadre.value = null;
    cargar();
  }
}

function abrirApertura() {
  error.value = "";
  apertura.cashierId = null;
  apertura.openingFloat = null;
  modal.value = "abrir";
  cargarCajeros();
  nextTick(() => fondoRef.value?.focus());
}

async function aperturar() {
  error.value = "";
  if (!apertura.cashierId) {
    error.value = "Elige a qué cajero le entregas la caja.";
    return;
  }
  /* Vacío no es cero. Una caja puede aperturarse sin fondo —se escribe 0—
     pero dejarlo en blanco suele ser un despiste, y abrir con 0 por
     accidente hace que el arqueo salga mal sin que nadie sepa por qué. */
  if (apertura.openingFloat === null || (apertura.openingFloat as any) === "") {
    error.value = "Escribe el fondo inicial. Si empieza sin sencillo, pon 0.";
    fondoRef.value?.focus();
    return;
  }
  if (apertura.openingFloat < 0) {
    error.value = "El fondo no puede ser negativo.";
    fondoRef.value?.focus();
    return;
  }

  const elegido =
    cajeros.value.find((c: any) => c.id === apertura.cashierId) ??
    (apertura.cashierId === yo.value?.id ? yo.value : null);

  cargando.value = true;
  try {
    await $fetch("/api/admin/caja/abrir", {
      method: "POST",
      body: {
        cashierId: apertura.cashierId,
        cashierName: elegido?.name || elegido?.email || null,
        openingFloat: apertura.openingFloat,
      },
    });
    modal.value = "";
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo aperturar la caja");
  } finally {
    cargando.value = false;
  }
}

function abrirMovimiento(t: any) {
  error.value = "";
  turno.value = t;
  mov.type = "out";
  mov.amount = null;
  mov.reason = "";
  modal.value = "movimiento";
}

async function guardarMovimiento() {
  error.value = "";
  cargando.value = true;
  try {
    await $fetch("/api/admin/caja/movimientos", {
      method: "POST",
      body: { sessionId: turno.value?.id, type: mov.type, amount: mov.amount, reason: mov.reason },
    });
    modal.value = "";
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo registrar el movimiento");
  } finally {
    cargando.value = false;
  }
}

function abrirArqueo(t: any) {
  error.value = "";
  turno.value = t;
  cuadre.value = null;
  notas.value = "";
  contado.value = {};
  for (const f of t.toCount || []) contado.value[f.type] = null;
  modal.value = "arqueo";
}

async function cerrarCaja() {
  error.value = "";
  cargando.value = true;
  try {
    const cifras: Record<string, number> = {};
    for (const [k, v] of Object.entries(contado.value)) cifras[k] = Number(v ?? 0);
    cuadre.value = await $fetch("/api/admin/caja/cerrar", {
      method: "POST",
      body: { sessionId: turno.value?.id, counted: cifras, notes: notas.value },
    });
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo cerrar la caja");
  } finally {
    cargando.value = false;
  }
}

/* La clase en el body es lo que decide qué se imprime, y se quita después:
   si se quedara puesta, la siguiente impresión de cualquier pantalla saldría
   en blanco. */
function imprimirCierre() {
  document.body.classList.add("sp-imprimiendo-cierre");
  window.print();
  document.body.classList.remove("sp-imprimiendo-cierre");
}

function claseDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "cajas-dif--ok";
  return v > 0 ? "cajas-dif--sobra" : "cajas-dif--falta";
}

function textoDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "El efectivo cuadra exactamente.";
  return v > 0
    ? `Sobran ${money(v)} en el cajón. Queda anotado en el turno.`
    : `Faltan ${money(Math.abs(v))} en el cajón. Queda anotado en el turno.`;
}

onMounted(() => {
  cargar();
  cargarCajeros();
});
</script>

<style scoped>
.cajas-pie {
  margin: 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
}
.cajas-pie a { color: var(--sp-primary); font-weight: 600; }

.cajas-modal { max-width: 560px; }

.cajas-campo { margin-bottom: 1rem; }
.cajas-campo input,
.cajas-campo select { width: 100%; }
.cajas-money { display: flex; align-items: center; gap: 0.4rem; }
.cajas-money > span { font-weight: 700; color: var(--sp-text-soft); }

.cajas-contra {
  display: block;
  margin-top: 0.1rem;
  font-size: var(--sp-text-xs);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: var(--sp-text-soft);
}
.cajas-opt { font-weight: 500; color: var(--sp-text-soft); }

.cajas-nota {
  margin: 0.35rem 0 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.45;
}
.cajas-nota a { color: var(--sp-primary); font-weight: 600; }

.cajas-aviso {
  margin: 0 0 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.5;
}
.cajas-aviso strong { color: var(--sp-text-strong); }

.cajas-error {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-danger-soft);
  color: #b91c1c;
  font-size: var(--sp-text-xs);
  font-weight: 600;
}

/* Los tres tipos de movimiento: una rejilla, no una lista. */
.cajas-tipos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.cajas-tipo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0.7rem;
  text-align: left;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-solid);
  cursor: pointer;
  font-family: var(--sp-font);
  transition: border-color var(--sp-t-fast) var(--sp-ease),
    background var(--sp-t-fast) var(--sp-ease);
}
.cajas-tipo strong { font-size: var(--sp-text-sm); color: var(--sp-text-strong); }
.cajas-tipo span { font-size: var(--sp-text-xs); color: var(--sp-text-soft); line-height: 1.3; }
.cajas-tipo:hover { border-color: var(--sp-border-strong); }
.cajas-tipo--on { border-color: var(--sp-primary); background: var(--sp-primary-soft); }

/* ── El cuadre ── */
.cajas-cuadre { list-style: none; margin: 0 0 1rem; padding: 0; }
.cajas-cuadre li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-sm);
}
.cajas-cuadre li span { color: var(--sp-text-soft); }
.cajas-cuadre li strong { font-variant-numeric: tabular-nums; }
.cajas-cuadre__total {
  background: var(--sp-surface-subtle);
  margin: 0.3rem -0.5rem;
  padding: 0.55rem 0.5rem;
  border-radius: var(--sp-radius-sm);
  border-bottom: none;
}
.cajas-cuadre__total span, .cajas-cuadre__total strong { font-weight: 800; }

.cajas-dif {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--sp-radius-sm);
  font-size: var(--sp-text-sm);
  font-weight: 700;
}
.cajas-dif--ok { background: var(--sp-success-soft); color: #0a7a56; }
.cajas-dif--sobra { background: var(--sp-warning-soft); color: #92600a; }
.cajas-dif--falta { background: var(--sp-danger-soft); color: #b91c1c; }

/* En la tabla del arqueo la diferencia es una celda, no un bloque: hereda
   el color pero no el fondo ni el relleno. */
.cajas-arqueo__tabla td.cajas-dif--ok,
.cajas-arqueo__tabla td.cajas-dif--sobra,
.cajas-arqueo__tabla td.cajas-dif--falta {
  background: none;
  padding: 0.35rem 0.5rem;
  font-weight: 700;
}
.cajas-arqueo__tabla td.cajas-dif--ok { color: #0a7a56; }
.cajas-arqueo__tabla td.cajas-dif--sobra { color: #92600a; }
.cajas-arqueo__tabla td.cajas-dif--falta { color: #b91c1c; }

.cajas-arqueo__label {
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--sp-text-soft);
}
.cajas-arqueo__tabla { width: 100%; border-collapse: collapse; font-size: var(--sp-text-sm); }
.cajas-arqueo__tabla th {
  text-align: right;
  padding: 0.35rem 0.5rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sp-text-soft);
  border-bottom: 1px solid var(--sp-border);
}
.cajas-arqueo__tabla th:first-child,
.cajas-arqueo__tabla td:first-child { text-align: left; }
.cajas-arqueo__tabla td {
  text-align: right;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--sp-border);
  font-variant-numeric: tabular-nums;
}

/* ── El papel ──
   Fuera de la pantalla, no display:none: un elemento con display:none no se
   imprime nunca, por mucho que la regla de impresión lo pida. */
.slip {
  position: absolute;
  left: -10000px;
  top: 0;
  width: 80mm;
  padding: 4mm;
  background: #fff;
  color: #000;
  font-family: var(--sp-font, system-ui), sans-serif;
  font-size: 10px;
  line-height: 1.4;
}
.slip__head { text-align: center; margin-bottom: 2mm; }
.slip__store { margin: 0; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.slip__meta { margin: 0; font-size: 9px; }
.slip__kind {
  margin: 2mm 0;
  padding: 1mm 0;
  border-top: 1px dashed #000;
  border-bottom: 1px dashed #000;
  text-align: center;
  font-weight: 800;
  text-transform: uppercase;
}
.slip__info { margin: 0 0 2mm; display: grid; gap: 0.5mm; }
.slip__info > div { display: flex; justify-content: space-between; gap: 2mm; }
.slip__info dt { margin: 0; font-weight: 700; }
.slip__info dd { margin: 0; text-align: right; }

.slip__tabla { width: 100%; border-collapse: collapse; margin-bottom: 2mm; }
.slip__tabla th {
  text-align: right;
  border-bottom: 1px solid #000;
  padding: 0.5mm 0;
  font-size: 9px;
}
.slip__tabla th:first-child, .slip__tabla td:first-child { text-align: left; }
.slip__tabla td { padding: 0.5mm 0; }
.slip__n { text-align: right; font-variant-numeric: tabular-nums; }

.slip__detalle { list-style: none; margin: 0 0 2mm; padding: 2mm 0 0; border-top: 1px dashed #000; }
.slip__detalle li { display: flex; justify-content: space-between; gap: 2mm; }
.slip__mov { font-size: 9px; }
.slip__dif {
  margin: 0 0 2mm;
  padding: 1mm 0;
  border-top: 1px dashed #000;
  border-bottom: 1px dashed #000;
  font-weight: 800;
  text-align: center;
}
.slip__notas { margin: 0 0 3mm; font-size: 9px; }

.slip__firmas { display: flex; gap: 4mm; margin: 8mm 0 2mm; }
.slip__firmas > div { flex: 1; border-top: 1px solid #000; padding-top: 1mm; text-align: center; }
.slip__firmas span { display: block; font-size: 9px; font-weight: 700; }
.slip__firmas p { margin: 0; font-size: 9px; }

.slip__pie { margin: 0; font-size: 8px; text-align: center; }
</style>

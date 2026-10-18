<template>
  <div class="turno">
    <!-- ── Sin caja abierta: lo primero es el fondo ───────────── -->
    <section v-if="!resumen.abierta" class="sp-card turno-abrir">
      <div class="turno-abrir__texto">
        <h2 class="sp-card__title">Abre tu caja para empezar</h2>
        <p class="turno-nota">
          Cuenta el sencillo con el que empiezas y escríbelo. Es la cifra
          contra la que se cuadrará al cerrar, así que vale la pena contarlo
          bien.
        </p>
      </div>
      <div class="turno-abrir__form">
        <div class="turno-campo">
          <label class="pmo-label" for="fondo">Fondo inicial</label>
          <div class="turno-money">
            <span>S/</span>
            <input id="fondo" ref="fondoRef" v-model.number="fondo" type="number" min="0" step="0.10"
                   class="sp-drawer-input" placeholder="0.00" @keydown.enter="abrir" />
          </div>
        </div>
        <!-- Sin deshabilitar cuando falta el fondo: un botón que no
             responde al clic se lee como roto, y el usuario no tiene forma
             de saber que le falta rellenar algo. Pulsar siempre hace algo;
             si falta el dato, lo dice y lleva el foco al campo. -->
        <button class="sp-page-btn" :disabled="cargando" @click="abrir">
          {{ cargando ? "Abriendo…" : "Abrir caja" }}
        </button>
      </div>
      <p v-if="error" class="turno-error">{{ error }}</p>
    </section>

    <!-- ── Caja abierta: la barra del turno ───────────────────── -->
    <section v-else class="sp-card turno-barra">
      <div class="turno-dato">
        <span class="turno-dato__label">Caja abierta</span>
        <strong class="turno-dato__valor">{{ formatDateTimeCompact(resumen.openedAt) }}</strong>
        <span class="turno-dato__pie">{{ resumen.openedByName || "—" }}</span>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Fondo</span>
        <strong class="turno-dato__valor">{{ money(resumen.openingFloat) }}</strong>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Cobrado en efectivo</span>
        <strong class="turno-dato__valor">{{ money(resumen.cashSales) }}</strong>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Entradas y salidas</span>
        <strong class="turno-dato__valor" :class="{ 'turno-neg': (resumen.movementsTotal ?? 0) < 0 }">
          {{ conSigno(resumen.movementsTotal) }}
        </strong>
        <span class="turno-dato__pie">{{ (resumen.movements || []).length }} movimiento(s)</span>
      </div>

      <!-- No se enseña el esperado: ver el porqué en el arqueo. -->
      <!-- sp-drawer-btn y no dash-action-btn: esa última vive en el
           <style scoped> del dashboard, así que fuera de esa página
           existe en el HTML pero no la pinta nadie, y los botones salían
           como texto plano. -->
      <div class="turno-acciones">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="abrirMovimiento">
          Movimiento
        </button>
        <button class="sp-drawer-btn sp-drawer-btn--primary" @click="abrirCierre">
          Cerrar caja
        </button>
      </div>
    </section>

    <!-- ── Movimiento de efectivo ─────────────────────────────── -->
    <!-- sp-modal-* y no inv-modal-*: esas viven en el <style scoped> de
         la pantalla de Inventario, así que aquí el diálogo salía sin caja,
         sin centrar y pegado al borde. Las globales son estas. -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modalMov" class="sp-modal-backdrop" @click.self="modalMov = false">
          <div class="sp-modal-box turno-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Movimiento de efectivo</h3>
                <p class="sp-modal-header__meta">
                  Dinero que entra o sale del cajón sin ser una venta.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="modalMov = false">✕</button>
            </div>

            <div class="sp-modal-body">
              <div class="turno-tipos">
                <button v-for="t in TIPOS" :key="t.value" type="button" class="turno-tipo"
                        :class="{ 'turno-tipo--on': mov.type === t.value }" @click="mov.type = t.value">
                  <strong>{{ t.label }}</strong>
                  <span>{{ t.hint }}</span>
                </button>
              </div>

              <div class="turno-campo turno-campo--ancho">
                <label class="pmo-label" for="mov-importe">Importe</label>
                <input id="mov-importe" v-model.number="mov.amount" type="number" min="0.1" step="0.10"
                       class="sp-drawer-input" placeholder="0.00" />
              </div>
              <div class="turno-campo turno-campo--ancho">
                <label class="pmo-label" for="mov-motivo">Motivo</label>
                <input id="mov-motivo" v-model="mov.reason" type="text" class="sp-drawer-input"
                       placeholder="Ej: retiro a caja fuerte" @keydown.enter.prevent="guardarMovimiento" />
              </div>

              <p v-if="error" class="turno-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="modalMov = false">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary"
                      :disabled="cargando || !mov.amount || !mov.reason.trim()" @click="guardarMovimiento">
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
        <div v-if="modalCierre" class="sp-modal-backdrop" @click.self="cerrarDialogoCierre">
          <div class="sp-modal-box turno-modal" role="dialog" aria-modal="true">
            <!-- Paso 1: contar -->
            <template v-if="!cuadre">
              <div class="sp-modal-header">
                <div class="sp-modal-header__content">
                  <h3 class="sp-modal-header__title">Arqueo de caja</h3>
                  <p class="sp-modal-header__meta">
                    Cuenta el efectivo del cajón y escribe el total.
                  </p>
                </div>
                <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarDialogoCierre">✕</button>
              </div>

              <div class="sp-modal-body">
                <p class="turno-nota turno-nota--destacada">
                  <strong>No te enseñamos cuánto debería haber hasta que cuentes.</strong>
                  Si lo vieras antes, el arqueo no detectaría nada.
                </p>

                <div class="turno-campo turno-campo--ancho">
                  <label class="pmo-label" for="contado">Efectivo contado</label>
                  <input id="contado" ref="contadoRef" v-model.number="contado" type="number"
                         min="0" step="0.10" class="sp-drawer-input" placeholder="0.00"
                         @keydown.enter.prevent="cerrar" />
                </div>
                <div class="turno-campo turno-campo--ancho">
                  <label class="pmo-label" for="notas">Notas <span class="pmo-label--opt">(opcional)</span></label>
                  <input id="notas" v-model="notas" type="text" class="sp-drawer-input"
                         placeholder="Ej: faltó un billete de 10" />
                </div>

                <p v-if="error" class="turno-error">{{ error }}</p>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarDialogoCierre">Cancelar</button>
                <button class="sp-drawer-btn sp-drawer-btn--primary"
                        :disabled="cargando || contado === null || contado < 0" @click="cerrar">
                  {{ cargando ? "Cerrando…" : "Cerrar caja" }}
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
                <ul class="turno-cuadre">
                  <li><span>Fondo inicial</span><strong>{{ money(cuadre.openingFloat) }}</strong></li>
                  <li><span>Cobrado en efectivo</span><strong>{{ money(cuadre.cashSales) }}</strong></li>
                  <li><span>Entradas y salidas</span><strong>{{ conSigno(cuadre.movementsTotal) }}</strong></li>
                  <li class="turno-cuadre__total">
                    <span>Debería haber</span><strong>{{ money(cuadre.expectedCash) }}</strong>
                  </li>
                  <li><span>Contaste</span><strong>{{ money(cuadre.countedCash) }}</strong></li>
                </ul>

                <p class="turno-dif" :class="claseDif(cuadre.difference)">
                  {{ textoDif(cuadre.difference) }}
                </p>

                <div v-if="(cuadre.byPaymentType || []).length" class="turno-formas">
                  <p class="turno-formas__label">Total del turno por forma de pago</p>
                  <ul>
                    <li v-for="f in cuadre.byPaymentType" :key="f.type">
                      <span>{{ f.label }}</span>
                      <strong>{{ money(f.amount) }}</strong>
                      <em>{{ f.sales }} venta(s)</em>
                    </li>
                  </ul>
                  <p class="turno-nota">
                    Solo el efectivo entra en el cuadre: lo demás no pasó por el cajón.
                  </p>
                </div>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--primary" @click="cerrarDialogoCierre">
                  Entendido
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
/**
 * El turno de caja: abrirlo con su fondo, moverlo y cuadrarlo.
 *
 * La decisión de diseño que más importa está en el arqueo: el esperado NO
 * se enseña hasta que la persona escribe lo que contó. Quien ve la cifra
 * objetivo deja de contar y la copia, y entonces el arqueo no detecta
 * nada —que es justo para lo que existe—.
 */
const abierta = defineModel<boolean>("abierta", { default: false });

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const TIPOS = [
  { value: "in", label: "Entra dinero", hint: "Sencillo, reposición de fondo" },
  { value: "out", label: "Retiro", hint: "A la caja fuerte o al banco" },
  { value: "expense", label: "Gasto", hint: "Pagado con el efectivo del cajón" },
];

const resumen = ref<any>({ abierta: false });
const cargando = ref(false);
const error = ref("");

const fondo = ref<number | null>(null);
const fondoRef = ref<HTMLInputElement>();
const modalMov = ref(false);
const mov = reactive({ type: "out", amount: null as number | null, reason: "" });

const modalCierre = ref(false);
const contado = ref<number | null>(null);
const notas = ref("");
const cuadre = ref<any>(null);
const contadoRef = ref<HTMLInputElement>();

async function cargar() {
  try {
    resumen.value = await $fetch("/api/admin/caja/sesion");
  } catch {
    resumen.value = { abierta: false };
  }
  abierta.value = Boolean(resumen.value?.abierta);
}

/** Las respuestas de error de la caja traen el motivo en `message`. */
function mensaje(e: any, porDefecto: string) {
  return e?.data?.message ?? porDefecto;
}

async function abrir() {
  error.value = "";

  /* Vacío no es cero. Una caja puede abrirse sin fondo —se escribe 0— pero
     dejarlo en blanco suele ser un despiste, y abrir con 0 por accidente
     hace que el arqueo del final salga mal sin que nadie sepa por qué. */
  if (fondo.value === null || fondo.value === undefined || (fondo.value as any) === "") {
    error.value = "Escribe el fondo inicial. Si empiezas sin sencillo, pon 0.";
    fondoRef.value?.focus();
    return;
  }
  if (fondo.value < 0) {
    error.value = "El fondo no puede ser negativo.";
    fondoRef.value?.focus();
    return;
  }

  cargando.value = true;
  try {
    resumen.value = await $fetch("/api/admin/caja/abrir", {
      method: "POST",
      body: { openingFloat: fondo.value ?? 0 },
    });
    abierta.value = true;
    fondo.value = null;
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo abrir la caja");
  } finally {
    cargando.value = false;
  }
}

function abrirMovimiento() {
  error.value = "";
  mov.type = "out";
  mov.amount = null;
  mov.reason = "";
  modalMov.value = true;
}

async function guardarMovimiento() {
  error.value = "";
  cargando.value = true;
  try {
    resumen.value = await $fetch("/api/admin/caja/movimientos", {
      method: "POST",
      body: { type: mov.type, amount: mov.amount, reason: mov.reason },
    });
    modalMov.value = false;
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo registrar el movimiento");
  } finally {
    cargando.value = false;
  }
}

function abrirCierre() {
  error.value = "";
  contado.value = null;
  notas.value = "";
  cuadre.value = null;
  modalCierre.value = true;
  nextTick(() => contadoRef.value?.focus());
}

async function cerrar() {
  error.value = "";
  cargando.value = true;
  try {
    cuadre.value = await $fetch("/api/admin/caja/cerrar", {
      method: "POST",
      body: { countedCash: contado.value ?? 0, notes: notas.value },
    });
    abierta.value = false;
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo cerrar la caja");
  } finally {
    cargando.value = false;
  }
}

function cerrarDialogoCierre() {
  modalCierre.value = false;
  if (cuadre.value) {
    cuadre.value = null;
    cargar();
  }
}

function claseDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "turno-dif--ok";
  return v > 0 ? "turno-dif--sobra" : "turno-dif--falta";
}

function textoDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "La caja cuadra exactamente.";
  return v > 0
    ? `Sobran ${money(v)}. Queda anotado en el turno.`
    : `Faltan ${money(Math.abs(v))}. Queda anotado en el turno.`;
}

onMounted(cargar);
</script>

<style scoped>
.turno { margin-bottom: 1.25rem; }

/* ── Abrir ── */
.turno-abrir {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
}
/* El texto no se estira hasta el borde: una línea de 90 caracteres no se
   lee, y al lado del formulario parecía que los dos competían. */
.turno-abrir__texto { flex: 1 1 22rem; max-width: 46ch; }
.turno-abrir__form { display: flex; align-items: flex-end; gap: 0.75rem; }
/* La etiqueta encima del campo, no al lado: en fila se leía como si
   "Fondo inicial" y "S/" fueran dos cosas distintas. */
.turno-campo { display: flex; flex-direction: column; gap: 0.3rem; }
.turno-money { display: flex; align-items: center; gap: 0.35rem; }
.turno-money span { font-weight: 700; color: var(--sp-text-soft); }
.turno-money input { width: 9rem; }

.turno-nota {
  margin: 0.3rem 0 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.45;
}

.turno-error {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-danger-soft);
  color: #b91c1c;
  font-size: var(--sp-text-xs);
  font-weight: 600;
}

/* ── Barra del turno ── */
.turno-barra {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;
}
.turno-dato { display: flex; flex-direction: column; gap: 0.1rem; }
.turno-dato__label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--sp-text-soft);
}
.turno-dato__valor {
  font-size: 1.1rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--sp-text-strong);
}
.turno-dato__pie { font-size: var(--sp-text-xs); color: var(--sp-text-soft); }
.turno-neg { color: #b91c1c; }
.turno-acciones { margin-left: auto; display: flex; gap: 0.5rem; }

/* ── Cuadre ── */
.turno-modal { max-width: 520px; }

.turno-campo--ancho { margin-bottom: 0.9rem; }
.turno-campo--ancho input { width: 100%; }

.turno-nota--destacada {
  margin: 0 0 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
}

/* Las tres opciones de movimiento: una rejilla, no una lista. */
.turno-tipos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.turno-tipo {
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
.turno-tipo strong { font-size: var(--sp-text-sm); color: var(--sp-text-strong); }
.turno-tipo span { font-size: var(--sp-text-xs); color: var(--sp-text-soft); line-height: 1.3; }
.turno-tipo:hover { border-color: var(--sp-border-strong); }
.turno-tipo--on {
  border-color: var(--sp-primary);
  background: var(--sp-primary-soft);
}

.turno-cuadre { list-style: none; margin: 0 0 1rem; padding: 0; }
.turno-cuadre li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-sm);
}
.turno-cuadre li span { color: var(--sp-text-soft); }
.turno-cuadre li strong { font-variant-numeric: tabular-nums; }
.turno-cuadre__total {
  background: var(--sp-surface-subtle);
  margin: 0.3rem -0.5rem;
  padding: 0.55rem 0.5rem;
  border-radius: var(--sp-radius-sm);
  border-bottom: none;
}
.turno-cuadre__total span, .turno-cuadre__total strong { font-weight: 800; }

.turno-dif {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--sp-radius-sm);
  font-size: var(--sp-text-sm);
  font-weight: 700;
}
.turno-dif--ok { background: var(--sp-success-soft); color: #0a7a56; }
.turno-dif--sobra { background: var(--sp-warning-soft); color: #92600a; }
.turno-dif--falta { background: var(--sp-danger-soft); color: #b91c1c; }

.turno-formas { margin-bottom: 1rem; }
.turno-formas__label {
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--sp-text-soft);
}
.turno-formas ul { list-style: none; margin: 0 0 0.5rem; padding: 0; }
.turno-formas li {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  padding: 0.25rem 0;
  font-size: var(--sp-text-sm);
}
.turno-formas li strong { margin-left: auto; font-variant-numeric: tabular-nums; }
.turno-formas li em { font-style: normal; font-size: var(--sp-text-xs); color: var(--sp-text-soft); }

@media (max-width: 760px) {
  .turno-barra { gap: 1rem; }
  .turno-acciones { margin-left: 0; width: 100%; }
  .turno-acciones button { flex: 1 1 auto; }
}
</style>

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
        <label class="pmo-label" for="fondo">Fondo inicial</label>
        <div class="turno-money">
          <span>S/</span>
          <input id="fondo" v-model.number="fondo" type="number" min="0" step="0.10"
                 class="sp-drawer-input" placeholder="0.00" @keydown.enter="abrir" />
        </div>
        <button class="sp-page-btn" :disabled="cargando || fondo === null || fondo < 0" @click="abrir">
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
      <div class="turno-acciones">
        <button class="dash-action-btn" @click="abrirMovimiento">Movimiento</button>
        <button class="dash-action-btn dash-action-btn--accent" @click="abrirCierre">Cerrar caja</button>
      </div>
    </section>

    <!-- ── Movimiento de efectivo ─────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="modalMov" class="sp-drawer-overlay" @click.self="modalMov = false" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="modalMov" class="inv-modal" role="dialog" aria-modal="true">
          <h3 class="inv-modal__title">Movimiento de efectivo</h3>
          <p class="turno-nota">
            Dinero que entra o sale del cajón sin ser una venta.
          </p>

          <div class="inv-opciones">
            <button v-for="t in TIPOS" :key="t.value" class="inv-opcion"
                    :class="{ 'inv-opcion--on': mov.type === t.value }" @click="mov.type = t.value">
              <strong>{{ t.label }}</strong>
              <span>{{ t.hint }}</span>
            </button>
          </div>

          <label class="inv-modal__field">
            <span>Importe</span>
            <input v-model.number="mov.amount" type="number" min="0.1" step="0.10"
                   class="sp-drawer-input inv-modal__input" placeholder="0.00" />
          </label>
          <label class="inv-modal__field">
            <span>Motivo</span>
            <input v-model="mov.reason" type="text" class="sp-drawer-input"
                   placeholder="Ej: retiro a caja fuerte" @keydown.enter.prevent="guardarMovimiento" />
          </label>

          <p v-if="error" class="turno-error">{{ error }}</p>

          <div class="inv-modal__actions">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="modalMov = false">Cancelar</button>
            <button class="sp-drawer-btn" :disabled="cargando || !mov.amount || !mov.reason.trim()"
                    @click="guardarMovimiento">
              {{ cargando ? "Guardando…" : "Registrar" }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Arqueo y cierre ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="modalCierre" class="sp-drawer-overlay" @click.self="cerrarDialogoCierre" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="modalCierre" class="inv-modal inv-modal--ancho" role="dialog" aria-modal="true">
          <!-- Paso 1: contar -->
          <template v-if="!cuadre">
            <h3 class="inv-modal__title">Arqueo de caja</h3>
            <p class="turno-nota">
              Cuenta el efectivo que hay ahora en el cajón y escribe el total.
              <strong>No te enseñamos cuánto debería haber hasta que lo hagas</strong>:
              si lo vieras antes, el arqueo no detectaría nada.
            </p>

            <label class="inv-modal__field">
              <span>Efectivo contado</span>
              <input ref="contadoRef" v-model.number="contado" type="number" min="0" step="0.10"
                     class="sp-drawer-input inv-modal__input" placeholder="0.00"
                     @keydown.enter.prevent="cerrar" />
            </label>
            <label class="inv-modal__field">
              <span>Notas <span class="pmo-label--opt">(opcional)</span></span>
              <input v-model="notas" type="text" class="sp-drawer-input"
                     placeholder="Ej: faltó un billete de 10" />
            </label>

            <p v-if="error" class="turno-error">{{ error }}</p>

            <div class="inv-modal__actions">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarDialogoCierre">Cancelar</button>
              <button class="sp-drawer-btn" :disabled="cargando || contado === null || contado < 0"
                      @click="cerrar">
                {{ cargando ? "Cerrando…" : "Cerrar caja" }}
              </button>
            </div>
          </template>

          <!-- Paso 2: el cuadre -->
          <template v-else>
            <h3 class="inv-modal__title">Caja cerrada</h3>

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

            <!-- Las formas que no pasaron por el cajón, como referencia. -->
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

            <div class="inv-modal__actions">
              <button class="sp-drawer-btn" @click="cerrarDialogoCierre">Entendido</button>
            </div>
          </template>
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
.turno-abrir__texto { flex: 1 1 18rem; }
.turno-abrir__form { display: flex; align-items: flex-end; gap: 0.6rem; }
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

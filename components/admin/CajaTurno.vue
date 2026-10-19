<template>
  <div class="turno">
    <!-- ── Sin fondo asignado ─────────────────────────────────── -->
    <section v-if="!turno.estado" class="sp-card turno-aviso">
      <h2 class="sp-card__title">Todavía no tienes fondo asignado</h2>
      <p class="turno-nota">
        {{ esCajero
          ? "Tu jefe de ventas tiene que registrarte el fondo y habilitarte. Cuando lo haga, pulsa aquí."
          : "Para cobrar en el mostrador necesitas un turno a tu nombre. Puedes asignártelo tú desde Cajas." }}
      </p>
      <div class="turno-acciones turno-acciones--inicio">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" :disabled="cargando" @click="cargar">
          {{ cargando ? "Comprobando…" : "Comprobar de nuevo" }}
        </button>
        <NuxtLink v-if="!esCajero" to="/admin/cajas" class="sp-drawer-btn sp-drawer-btn--primary">
          Ir a Cajas
        </NuxtLink>
      </div>
    </section>

    <!-- ── Fondo asignado pero sin habilitar ──────────────────── -->
    <section v-else-if="turno.estado === 'fund_assigned'" class="sp-card turno-aviso">
      <h2 class="sp-card__title">Tu fondo está registrado</h2>
      <p class="turno-nota">
        {{ turno.assignedByName || "Tu jefe" }} registró {{ money(turno.openingFloat) }},
        pero todavía no te ha habilitado para abrir.
      </p>
      <button class="sp-drawer-btn sp-drawer-btn--ghost" :disabled="cargando" @click="cargar">
        {{ cargando ? "Comprobando…" : "Comprobar de nuevo" }}
      </button>
    </section>

    <!-- ── Habilitada: el cajero confirma y firma ─────────────── -->
    <section v-else-if="turno.estado === 'enabled'" class="sp-card turno-abrir">
      <div class="turno-abrir__texto">
        <h2 class="sp-card__title">Tu caja está lista para abrir</h2>
        <p class="turno-nota">
          <strong>{{ turno.assignedByName || "Tu jefe" }}</strong> te asignó un fondo de
          <strong>{{ money(turno.openingFloat) }}</strong>. Cuéntalo antes de abrir: al
          confirmar, ese dinero pasa a ser tu responsabilidad y se imprime el
          ticket que firmas.
        </p>
        <p class="turno-nota">
          Si lo que tienes en la mano no coincide, no abras: díselo a tu jefe.
        </p>
      </div>
      <div class="turno-abrir__form">
        <div class="turno-fondo">
          <span class="turno-fondo__label">Fondo recibido</span>
          <strong class="turno-fondo__valor">{{ money(turno.openingFloat) }}</strong>
        </div>
        <button class="sp-page-btn" :disabled="cargando" @click="abrir">
          {{ cargando ? "Abriendo…" : "Abrir caja" }}
        </button>
      </div>
      <p v-if="error" class="turno-error">{{ error }}</p>
    </section>

    <!-- ── Abierta: la barra del turno ────────────────────────── -->
    <section v-else-if="turno.estado === 'open'" class="sp-card turno-barra">
      <div class="turno-dato">
        <span class="turno-dato__label">Caja abierta</span>
        <strong class="turno-dato__valor">{{ formatDateTimeCompact(turno.openedAt) }}</strong>
        <span class="turno-dato__pie">
          {{ turno.cashierName || "—" }}
          <template v-if="turno.assignedByName"> · fondo de {{ turno.assignedByName }}</template>
        </span>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Fondo recibido</span>
        <strong class="turno-dato__valor">{{ money(turno.openingFloat) }}</strong>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Cobrado en efectivo</span>
        <strong class="turno-dato__valor">{{ money(turno.cashSales) }}</strong>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Entradas y salidas</span>
        <strong class="turno-dato__valor" :class="{ 'turno-neg': (turno.movementsTotal ?? 0) < 0 }">
          {{ conSigno(turno.movementsTotal) }}
        </strong>
        <span class="turno-dato__pie">{{ (turno.movements || []).length }} movimiento(s)</span>
      </div>
      <div v-if="(turno.audits || []).length" class="turno-dato">
        <span class="turno-dato__label">Arqueos del turno</span>
        <strong class="turno-dato__valor">{{ turno.audits.length }}</strong>
        <span class="turno-dato__pie">el último, {{ formatDateTimeCompact(ultimoArqueo) }}</span>
      </div>

      <div class="turno-acciones">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="imprimir('apertura')">
          Reimprimir apertura
        </button>
        <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="cargando" @click="confirmarCierre = true">
          Cerrar caja
        </button>
      </div>
      <p v-if="error" class="turno-error turno-error--ancho">{{ error }}</p>
    </section>

    <!-- ── Cerrada, esperando al encargado ────────────────────── -->
    <section v-else-if="turno.estado === 'closed'" class="sp-card turno-aviso">
      <h2 class="sp-card__title">Cerraste tu caja</h2>
      <p class="turno-nota">
        {{ formatDateTimeCompact(turno.closedAt) }}. Lleva el efectivo y los
        vouchers a tu jefe de ventas: él los cuenta, cuadra el turno y te da
        el papel de caja para firmar. Hasta entonces no puedes volver a vender.
      </p>
      <div class="turno-acciones turno-acciones--inicio">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="imprimir('cierre')">
          Reimprimir mi cierre
        </button>
        <button class="sp-drawer-btn sp-drawer-btn--ghost" :disabled="cargando" @click="cargar">
          {{ cargando ? "Comprobando…" : "Comprobar de nuevo" }}
        </button>
      </div>
    </section>

    <!-- ── Confirmar el cierre ────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="confirmarCierre" class="sp-modal-backdrop" @click.self="confirmarCierre = false">
          <div class="sp-modal-box turno-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">¿Cerrar tu caja?</h3>
                <p class="sp-modal-header__meta">No podrás cobrar más hasta que la cuadren.</p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="confirmarCierre = false">✕</button>
            </div>
            <div class="sp-modal-body">
              <p class="turno-nota">
                Se imprime tu boleta de cierre con las ventas por tarjeta y QR,
                que es la que llevas con los vouchers. El efectivo no va en ese
                papel: eso lo cuenta tu jefe delante de ti.
              </p>
              <p v-if="error" class="turno-error">{{ error }}</p>
            </div>
            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="confirmarCierre = false">
                Todavía no
              </button>
              <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="cargando" @click="cerrar">
                {{ cargando ? "Cerrando…" : "Sí, cerrar" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Ticket de apertura ─────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="papel === 'apertura'" class="sp-papel">
        <header class="sp-papel__head">
          <p class="sp-papel__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="sp-papel__meta">RUC {{ negocio.ruc }}</p>
          <p v-if="negocio.address" class="sp-papel__meta">{{ negocio.address }}</p>
        </header>

        <p class="sp-papel__kind">Apertura de caja Nº {{ turno.id }}</p>

        <dl class="sp-papel__info">
          <div><dt>Cajero</dt><dd>{{ turno.cashierName || "—" }}</dd></div>
          <div v-if="turno.cashierDni"><dt>DNI</dt><dd>{{ turno.cashierDni }}</dd></div>
          <div><dt>Fondo entregado por</dt><dd>{{ turno.assignedByName || "—" }}</dd></div>
          <div><dt>Fecha y hora</dt><dd>{{ formatDateTimeCompact(turno.openedAt) }}</dd></div>
        </dl>

        <p class="sp-papel__destacado">Fondo inicial: {{ money(turno.openingFloat) }}</p>

        <p class="sp-papel__nota">
          Recibo el fondo arriba indicado y quedo responsable de él hasta el
          cuadre de este turno.
        </p>

        <div class="sp-papel__firmas">
          <div><span>Firma del cajero</span><p>{{ turno.cashierName || "" }}</p></div>
        </div>

        <p class="sp-papel__pie">
          Documento interno de control de caja; no es un comprobante de pago.
        </p>
      </div>
    </Teleport>

    <!-- ── Boleta de cierre: solo lo que lleva voucher ────────── -->
    <Teleport to="body">
      <div v-if="papel === 'cierre'" class="sp-papel">
        <header class="sp-papel__head">
          <p class="sp-papel__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="sp-papel__meta">RUC {{ negocio.ruc }}</p>
        </header>

        <p class="sp-papel__kind">Cierre de cajero Nº {{ turno.id }}</p>

        <dl class="sp-papel__info">
          <div><dt>Cajero</dt><dd>{{ turno.cashierName || "—" }}</dd></div>
          <div v-if="turno.cashierDni"><dt>DNI</dt><dd>{{ turno.cashierDni }}</dd></div>
          <div><dt>Apertura</dt><dd>{{ formatDateTimeCompact(turno.openedAt) }}</dd></div>
          <div><dt>Cierre</dt><dd>{{ formatDateTimeCompact(turno.closedAt) }}</dd></div>
        </dl>

        <!-- Sin efectivo a propósito: este papel acompaña a los vouchers, y
             el conteo del cajón lo hace el encargado delante del cajero. Si
             el papel trajera la cifra del efectivo, contar sería copiarla. -->
        <table class="sp-papel__tabla">
          <thead>
            <tr><th>Forma</th><th>Ventas</th><th>Vouchers</th><th>Importe</th></tr>
          </thead>
          <tbody>
            <tr v-for="f in conVoucher" :key="f.type">
              <td>{{ f.label }}</td>
              <td>{{ f.sales }}</td>
              <td>{{ f.vouchers }}</td>
              <td>{{ money(f.amount) }}</td>
            </tr>
            <tr v-if="!conVoucher.length">
              <td colspan="4">Sin ventas con voucher en este turno</td>
            </tr>
          </tbody>
        </table>

        <!-- Una por una, no solo el total. El cajero llega con un fajo de
             vouchers y este papel dice cuáles deberían ser: con el
             agregado, un voucher de menos se sabe que falta pero no cuál. -->
        <template v-if="(turno.voucherSales || []).length">
          <p class="sp-papel__kind">Detalle</p>
          <table class="sp-papel__tabla">
            <thead>
              <tr><th>Hora</th><th>Comprobante</th><th>Nº oper.</th><th>Importe</th></tr>
            </thead>
            <tbody>
              <tr v-for="v in turno.voucherSales" :key="v.orderCode">
                <td>{{ soloHora(v.at) }}</td>
                <td>{{ v.boleta || v.orderCode }}</td>
                <td>{{ v.voucher || "—" }}</td>
                <td>{{ money(v.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </template>

        <p class="sp-papel__destacado">Total con voucher: {{ money(totalConVoucher) }}</p>
        <p class="sp-papel__nota">
          El efectivo no figura en este papel: lo cuenta el encargado en el
          cuadre.
        </p>

        <div class="sp-papel__firmas">
          <div><span>Firma del cajero</span><p>{{ turno.cashierName || "" }}</p></div>
        </div>

        <p class="sp-papel__pie">
          Documento interno de control de caja; no es un comprobante de pago.
        </p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * El turno de caja en la pantalla de venta, desde el lado del cajero.
 *
 * Hace dos cosas y ninguna más: abrir su caja y cerrarla. El fondo se lo
 * asigna el jefe y no se puede tocar; el conteo del final lo hace el
 * encargado en /admin/cajas. Quien vende no cuenta su propio cajón, porque
 * un papel firmado por la persona a la que vigila no vigila nada.
 *
 * Abrir sí es suyo, y es importante que lo sea: esa confirmación es la que
 * firma en el ticket de apertura, y es lo que convierte el dinero del cajón
 * en responsabilidad suya. Si se la abriera el jefe, podría encontrarse un
 * turno empezado con un fondo que nunca contó.
 */
const abierta = defineModel<boolean>("abierta", { default: false });

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const { imprimirPapel } = useImpresion();
const { nombre } = useLogo();
const negocio = computed<any>(() => useBusinessConfig().value ?? {});

const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const { user } = useUserSession();
const esCajero = computed(() => (user.value as any)?.role === "cajero");

const turno = ref<any>({ estado: null });
const cargando = ref(false);
const error = ref("");
const confirmarCierre = ref(false);
const papel = ref<"" | "apertura" | "cierre">("");

/* Solo las formas que dejan un papel en la mano. El efectivo no: su
   comprobante es el propio dinero, y va en el cuadre, no aquí. */
const conVoucher = computed(() =>
  (turno.value.byPaymentType || []).filter((f: any) => f.type !== "efectivo")
);
const totalConVoucher = computed(() =>
  conVoucher.value.reduce((a: number, f: any) => a + Number(f.amount || 0), 0)
);
/* En el papel solo cabe la hora: la fecha ya está arriba, en la apertura
   y el cierre del turno. */
const soloHora = (v: any) =>
  v ? new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", timeStyle: "short" })
        .format(new Date(v)) : "";

const ultimoArqueo = computed(() => {
  const a = turno.value.audits || [];
  return a.length ? a[a.length - 1].createdAt : null;
});

async function cargar() {
  cargando.value = true;
  try {
    turno.value = await $fetch("/api/admin/caja/sesion");
  } catch {
    turno.value = { estado: null };
  } finally {
    cargando.value = false;
  }
  abierta.value = Boolean(turno.value?.abierta);
}

function mensaje(e: any, porDefecto: string) {
  return e?.data?.message ?? porDefecto;
}

async function abrir() {
  error.value = "";
  cargando.value = true;
  try {
    turno.value = await $fetch("/api/admin/caja/abrir", { method: "POST" });
    abierta.value = true;
    await imprimir("apertura");
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo abrir la caja");
  } finally {
    cargando.value = false;
  }
}

async function cerrar() {
  error.value = "";
  cargando.value = true;
  try {
    turno.value = await $fetch("/api/admin/caja/cerrar", { method: "POST", body: {} });
    abierta.value = false;
    confirmarCierre.value = false;
    await imprimir("cierre");
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo cerrar la caja");
  } finally {
    cargando.value = false;
  }
}

/* El papel se monta, se imprime y se desmonta. Dejarlo montado no estorba
   —vive fuera de la pantalla— pero entonces habría dos a la vez en el body
   y la regla de impresión sacaría los dos en la misma hoja.
   Un único camino, llamado desde abrir(), cerrar() y los dos botones de
   reimprimir: con un watcher sobre `papel` había que distinguir quién lo
   había puesto para no imprimir dos veces, y eso se rompe al primer
   cambio que alguien haga aquí. */
async function imprimir(cual: "apertura" | "cierre") {
  papel.value = cual;
  await imprimirPapel();
  papel.value = "";
}

onMounted(cargar);
</script>

<style scoped>
.turno { margin-bottom: 1.25rem; }

.turno-aviso {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.turno-abrir {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
}
/* El texto no se estira hasta el borde: una línea de 90 caracteres no se
   lee, y al lado del formulario parecía que los dos competían. */
.turno-abrir__texto { flex: 1 1 22rem; max-width: 52ch; }
.turno-abrir__form { display: flex; align-items: flex-end; gap: 1rem; }

.turno-fondo { display: flex; flex-direction: column; gap: 0.15rem; }
.turno-fondo__label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--sp-text-soft);
}
/* El fondo es un dato, no un campo: lo asignó el jefe y el cajero no lo
   cambia. Un input aquí invitaría a corregirlo por su cuenta. */
.turno-fondo__valor {
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--sp-text-strong);
}

.turno-nota {
  margin: 0.3rem 0 0;
  max-width: 62ch;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.5;
}
.turno-nota strong { color: var(--sp-text-strong); }

.turno-error {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-danger-soft);
  color: #b91c1c;
  font-size: var(--sp-text-xs);
  font-weight: 600;
}
.turno-error--ancho { flex: 1 1 100%; }

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
.turno-acciones--inicio { margin-left: 0; }

.turno-modal { max-width: 460px; }

@media (max-width: 760px) {
  .turno-barra { gap: 1rem; }
  .turno-acciones { margin-left: 0; width: 100%; }
  .turno-acciones button,
  .turno-acciones a { flex: 1 1 auto; }
}
</style>

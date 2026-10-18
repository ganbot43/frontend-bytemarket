<template>
  <div class="turno">
    <!-- ── Sin caja: no hay nada que pulsar aquí ──────────────── -->
    <!-- El cajero no se apertura su propia caja y tampoco la cuadra. Antes
         esta tarjeta tenía el formulario del fondo, y eso era justo lo que
         rompía el control: quien vende decidía con cuánto empieza y
         declaraba él solo lo que había al final. -->
    <section v-if="!resumen.abierta" class="sp-card turno-espera">
      <h2 class="sp-card__title">Tu caja todavía no está abierta</h2>
      <p class="turno-nota" v-if="esCajero">
        Tu jefe de ventas tiene que aperturarla y entregarte el fondo.
        Cuando lo haga, pulsa aquí y podrás cobrar.
      </p>
      <p class="turno-nota" v-else>
        Para cobrar en el mostrador necesitas una caja aperturada a tu
        nombre. Puedes aperturarla tú desde Cajas.
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

    <!-- ── Caja abierta: la barra del turno ───────────────────── -->
    <section v-else class="sp-card turno-barra">
      <div class="turno-dato">
        <span class="turno-dato__label">Caja abierta</span>
        <strong class="turno-dato__valor">{{ formatDateTimeCompact(resumen.openedAt) }}</strong>
        <span class="turno-dato__pie">
          {{ resumen.cashierName || "—" }}
          <template v-if="resumen.openedByName"> · la aperturó {{ resumen.openedByName }}</template>
        </span>
      </div>
      <div class="turno-dato">
        <span class="turno-dato__label">Fondo recibido</span>
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

      <!-- Ni "cerrar caja" ni "movimiento": las dos son del encargado, y un
           botón que siempre devuelve 403 solo sirve para que el cajero crea
           que algo está roto. Lo que ve es a quién le toca. -->
      <p class="turno-cierre">
        El cierre lo hace {{ esCajero ? "tu jefe de ventas" : "el encargado" }}:
        cuenta el efectivo y los vouchers, arquea y te da el papel para firmar.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * La barra del turno en la pantalla de venta.
 *
 * Es solo para mirar. Aperturar, mover efectivo y arquear se hacen en
 * /admin/cajas y son del jefe de ventas o del encargado: quien vende no
 * cuadra su propio cajón, porque un arqueo firmado por la persona a la que
 * vigila no vigila nada.
 *
 * Lo que sí se le enseña al cajero es cuánto ha cobrado en efectivo —lo
 * necesita para dar vuelto y para saber si va a hacer falta un retiro—. No
 * rompe el arqueo porque él no es quien cuenta: a quien va a contar,
 * /admin/cajas no le enseña ningún importe hasta que escribe el suyo.
 */
const abierta = defineModel<boolean>("abierta", { default: false });

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

const { user } = useUserSession();
const esCajero = computed(() => (user.value as any)?.role === "cajero");

const resumen = ref<any>({ abierta: false });
const cargando = ref(false);

async function cargar() {
  cargando.value = true;
  try {
    resumen.value = await $fetch("/api/admin/caja/sesion");
  } catch {
    resumen.value = { abierta: false };
  } finally {
    cargando.value = false;
  }
  abierta.value = Boolean(resumen.value?.abierta);
}

onMounted(cargar);
</script>

<style scoped>
.turno { margin-bottom: 1.25rem; }

.turno-espera {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.turno-nota {
  margin: 0.3rem 0 0;
  max-width: 60ch;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.45;
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
.turno-acciones--inicio { margin-left: 0; }

/* La nota del cierre ocupa el hueco donde estaban los botones: así la
   barra no queda con un vacío raro a la derecha. */
.turno-cierre {
  margin: 0 0 0 auto;
  max-width: 32ch;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.45;
  text-align: right;
}

@media (max-width: 760px) {
  .turno-barra { gap: 1rem; }
  .turno-cierre { margin-left: 0; text-align: left; max-width: none; }
  .turno-acciones { width: 100%; }
  .turno-acciones button, .turno-acciones a { flex: 1 1 auto; }
}
</style>

<template>
  <div class="sp-page inv-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Inventario</h1>
        <p class="sp-page-toolbar__sub">
          {{ vista === "existencias"
            ? `${resumen.trackedCount} productos con control de stock · stock bajo con ${resumen.threshold} unidades o menos`
            : "Historial de entradas, salidas y ajustes" }}
        </p>
      </div>
    </div>

    <!-- Pestañas locales, no enlaces. Eran dos rutas y cada cambio
         recargaba la página entera y perdía el filtro; "qué tengo" y "qué
         pasó" son la misma pregunta vista de dos maneras. -->
    <nav class="sp-tabs inv-tabs" aria-label="Inventario">
      <button v-for="t in VISTAS" :key="t.id" type="button" class="sp-tab"
              :class="{ 'sp-tab--active': vista === t.id }"
              :aria-current="vista === t.id ? 'page' : undefined"
              @click="cambiarVista(t.id)">
        {{ t.label }}
      </button>
    </nav>

    <AdminInventarioMovimientos v-if="vista === 'movimientos'" :producto="productoFiltrado" />

    <template v-else>
    <!-- Resumen: los dos números que deciden si hay que comprar hoy -->
    <div class="inv-resumen">
      <button class="inv-chip" :class="{ 'inv-chip--on': !soloBajos }" @click="soloBajos = false">
        Todos <strong>{{ resumen.trackedCount }}</strong>
      </button>
      <button class="inv-chip inv-chip--low" :class="{ 'inv-chip--on': soloBajos }" @click="soloBajos = true">
        Stock bajo <strong>{{ resumen.lowCount }}</strong>
      </button>
      <span v-if="resumen.outCount" class="inv-chip inv-chip--out">
        Agotados <strong>{{ resumen.outCount }}</strong>
      </span>
      <!-- El umbral era un campo que cada quien podía mover, y la tarjeta
           "Stock bajo" del dashboard contaba con otro distinto. Ahora es
           una sola regla, de catalog-service, y aquí solo se enseña. -->
      <span class="inv-umbral">Alerta con {{ resumen.threshold }} unidades o menos</span>
    </div>

    <SharedBarraTabla v-model="busqueda" placeholder="Buscar producto…" />

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Producto</th>
              <th class="sp-th">Categoría</th>
              <th class="sp-th sp-th--center">Stock</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th sp-th--center" style="width: 110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productos" :key="p.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ p.name }}</p>
                <span v-if="!p.isActive" class="inv-inactivo">Desactivado en la tienda</span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="inv-cat">{{ p.category || "–" }}</span>
              </td>
              <td class="sp-td sp-td--center">
                <span class="sp-table-num" :class="{ 'sp-table-num--low': p.estado !== 'ok' }">{{ p.stock }}</span>
              </td>
              <td class="sp-td">
                <!-- Las mismas etiquetas que Productos: punto + texto, y los
                     colores del sistema. Tenía las suyas, con otros verdes
                     y otro radio, al lado de una tabla que ya las traía. -->
                <span class="sp-badge" :class="BADGE[p.estado] ?? 'sp-badge--neutral'">
                  <span class="sp-badge__dot" />
                  {{ etiquetas[p.estado] }}
                </span>
              </td>
              <td class="sp-td sp-td--center">
                <!-- Ajustar y ver qué pasó, en la misma fila. Antes el
                     historial solo existía en la pantalla de Movimientos,
                     que lista el kardex entero: para saber por qué a un
                     producto le faltaban tres unidades había que salir,
                     buscarlo en un desplegable y volver. -->
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--edit" title="Ajustar stock"
                          aria-label="Ajustar stock" @click="abrirReponer(p)">
                    <PackagePlus class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button class="sp-table-btn sp-table-btn--view" title="Ver historial"
                          aria-label="Ver historial" @click="abrirHistorial(p)">
                    <History class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!productos.length">
              <td colspan="5" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Boxes class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">
                    {{ soloBajos
                      ? "Ningún producto está por debajo del umbral"
                      : busqueda
                        ? "Ningún producto coincide"
                        : "No hay productos con control de stock" }}
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedPaginacion v-model:pagina="pagina" :total="total" :limite="limite" />
    </div>
    </template>

    <!-- ── Historial del producto ────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="historial" class="sp-drawer-overlay" @click.self="historial = null" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="historial" class="inv-modal inv-modal--ancho" role="dialog" aria-modal="true">
          <h3 class="inv-modal__title">{{ historial.name }}</h3>
          <p class="inv-modal__stock">
            Ahora hay <strong>{{ historial.stock }}</strong> unidades
          </p>

          <p v-if="cargandoHistorial" class="inv-hist__estado">Cargando movimientos…</p>
          <p v-else-if="!movimientos.length" class="inv-hist__estado">
            Este producto todavía no tiene movimientos registrados.
          </p>
          <ul v-else class="inv-hist">
            <li v-for="m in movimientos" :key="m.id" class="inv-hist__item">
              <span class="inv-hist__tipo" :class="`inv-hist__tipo--${m.movementType}`">
                {{ TIPOS[m.movementType] ?? m.movementType }}
              </span>
              <div class="inv-hist__texto">
                <!-- El motivo primero: es lo que explica el movimiento. Un
                     "-3" sin motivo obliga a abrir el pedido para entenderlo. -->
                <strong>{{ m.reason || (m.relatedOrderId ? `Venta del pedido #${m.relatedOrderId}` : "Sin motivo") }}</strong>
                <span>{{ formatDateTimeCompact(m.createdAt) }}</span>
              </div>
              <span class="inv-hist__delta" :class="{
                'inv-hist__delta--sube': (m.delta ?? 0) > 0,
                'inv-hist__delta--baja': (m.delta ?? 0) < 0,
              }">{{ conSigno(m.delta) }}</span>
            </li>
          </ul>

          <!-- Diez movimientos sin decir que hay más se leen como "esto es
               todo lo que pasó", y con eso se dan por buenos faltantes que
               están explicados tres líneas más abajo. -->
          <p v-if="totalMovimientos > movimientos.length" class="inv-hist__mas">
            Los {{ movimientos.length }} más recientes de {{ totalMovimientos }}
          </p>

          <div class="inv-modal__actions">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="verKardex(historial.id)">
              Ver kardex completo
            </button>
            <button class="sp-drawer-btn" @click="historial = null">Cerrar</button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Reponer ───────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="reponiendo" class="sp-drawer-overlay" @click.self="reponiendo = null" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="reponiendo" class="inv-modal" role="dialog" aria-modal="true">
          <h3 class="inv-modal__title">{{ reponiendo.name }}</h3>
          <p class="inv-modal__stock">
            Ahora hay <strong>{{ reponiendo.stock }}</strong> unidades
          </p>

          <!-- Se pregunta qué PASÓ, no qué operación hacer: el encargado
               sabe si llegó mercadería o si acaba de contar el almacén; no
               tiene por qué saber la diferencia entre "entrada" y "ajuste". -->
          <p class="inv-modal__label">¿Qué pasó?</p>
          <div class="inv-opciones">
            <button class="inv-opcion" :class="{ 'inv-opcion--on': modo === 'entry' }"
                    @click="modo = 'entry'">
              <strong>Llegó mercadería</strong>
              <span>Suma unidades a lo que ya había</span>
            </button>
            <button class="inv-opcion" :class="{ 'inv-opcion--on': modo === 'adjustment' }"
                    @click="modo = 'adjustment'">
              <strong>Conté el almacén</strong>
              <span>Reemplaza la cifra por la que contaste</span>
            </button>
          </div>

          <label class="inv-modal__field">
            <span>{{ modo === "entry" ? "¿Cuántas llegaron?" : "¿Cuántas hay en total?" }}</span>
            <input ref="cantidadRef" v-model.number="cantidad" type="number"
                   :min="modo === 'entry' ? 1 : 0" max="99999"
                   class="sp-drawer-input inv-modal__input" placeholder="0"
                   @keydown.enter.prevent="confirmarReponer" />
          </label>

          <!-- El resultado, antes de confirmar: es lo que evita equivocarse
               de opción y descubrirlo después en el kardex. -->
          <p v-if="resultado !== null" class="inv-modal__preview">
            El stock quedará en <strong>{{ resultado }}</strong>
            <span v-if="modo === 'adjustment' && resultado < reponiendo.stock" class="inv-modal__merma">
              · se descuentan {{ reponiendo.stock - resultado }}
            </span>
          </p>

          <div class="inv-modal__actions">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="reponiendo = null">Cancelar</button>
            <button class="sp-drawer-btn" :disabled="resultado === null || guardando !== null"
                    @click="confirmarReponer">
              {{ guardando !== null ? "Guardando…" : "Confirmar" }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Existencias actuales.
 *
 * El inventario solo tenía el kardex: decía qué había pasado, pero no qué
 * hay ahora ni qué falta reponer. Para decidir una compra había que entrar
 * a Productos y revisar uno por uno.
 *
 * Por eso la lista viene ordenada de menor stock a mayor: el primer
 * producto de la tabla es el que más urge, sin filtrar ni ordenar nada.
 */
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Inventario · Admin" });

const route = useRoute();
const toast = useAppToast();

import { Boxes, History, PackagePlus } from "lucide-vue-next";

const BADGE: Record<string, string> = {
  agotado: "sp-badge--danger",
  bajo: "sp-badge--warning",
  ok: "sp-badge--success",
};

const etiquetas: Record<string, string> = {
  agotado: "Agotado",
  bajo: "Stock bajo",
  ok: "Disponible",
};

/* Las dos caras del inventario en una sola página. Van en la URL para que
   un enlace o un recargado caigan donde toca —el dashboard y la pantalla
   de movimientos antigua apuntan aquí—, pero cambiar de pestaña no navega:
   `replace` no añade entradas al historial, así que el botón Atrás del
   navegador sigue saliendo del inventario y no paseando entre pestañas. */
const VISTAS = [
  { id: "existencias", label: "Existencias" },
  { id: "movimientos", label: "Movimientos" },
] as const;
type Vista = (typeof VISTAS)[number]["id"];

const router = useRouter();
const vista = ref<Vista>(route.query.vista === "movimientos" ? "movimientos" : "existencias");
const productoFiltrado = ref<number | null>(Number(route.query.producto) || null);

function cambiarVista(id: Vista) {
  vista.value = id;
  if (id === "existencias") productoFiltrado.value = null;
  router.replace({
    query: {
      ...route.query,
      vista: id === "existencias" ? undefined : id,
      producto: id === "movimientos" && productoFiltrado.value ? productoFiltrado.value : undefined,
    },
  });
}

/** Del historial de un producto al kardex filtrado por ese producto. */
function verKardex(id: number) {
  productoFiltrado.value = id;
  historial.value = null;
  cambiarVista("movimientos");
}

// La tarjeta "Stock bajo" del dashboard enlaza con ?bajo=1
const soloBajos = ref(route.query.bajo === "1");
const busqueda = ref("");
const pagina = ref(0);
const limite = 10;

const productos = ref<any[]>([]);
const total = ref(0);
const resumen = reactive({ trackedCount: 0, lowCount: 0, outCount: 0, threshold: 5 });

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/inventory/stock", {
      query: {
        limit: limite,
        offset: pagina.value * limite,
        q: busqueda.value.trim() || undefined,
        // Sin threshold: lo fija catalog y lo devuelve en la respuesta.
        low: soloBajos.value ? 1 : 0,
      },
    });
    productos.value = res?.data ?? [];
    total.value = res?.total ?? 0;
    Object.assign(resumen, {
      trackedCount: res?.trackedCount ?? 0,
      lowCount: res?.lowCount ?? 0,
      outCount: res?.outCount ?? 0,
      threshold: res?.threshold ?? 5,
    });
  } catch {
    toast.add({ title: "No se pudo cargar el stock", color: "error" });
  }
}

watch([soloBajos, busqueda], () => {
  pagina.value = 0;
  cargar();
});
watch(pagina, cargar);
onMounted(cargar);

// ── Historial del producto ──────────────────────────────────
/**
 * El kardex de un solo producto, sin salir de la lista.
 *
 * El endpoint ya aceptaba productId; lo que faltaba era pedírselo desde
 * aquí. Se traen los últimos 20 movimientos, que es lo que cabe sin
 * paginar: para auditar más está el kardex completo, enlazado al pie.
 */
const TIPOS: Record<string, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};

/* Diez, como todos los listados del panel. Cuando hay más, el pie lo dice
   y el botón de al lado lleva al kardex, que sí pagina. */
const LIMITE_HISTORIAL = 10;

const historial = ref<any>(null);
const movimientos = ref<any[]>([]);
const totalMovimientos = ref(0);
const cargandoHistorial = ref(false);
const { formatDateTimeCompact } = useFormatDateTime();

const conSigno = (n: number | null | undefined) =>
  n === null || n === undefined ? "" : n > 0 ? `+${n}` : String(n);

async function abrirHistorial(p: any) {
  historial.value = p;
  movimientos.value = [];
  totalMovimientos.value = 0;
  cargandoHistorial.value = true;
  try {
    const res: any = await $fetch("/api/admin/inventory/movements", {
      query: { productId: p.id, limit: LIMITE_HISTORIAL, offset: 0 },
    });
    movimientos.value = res?.data ?? [];
    totalMovimientos.value = res?.total ?? movimientos.value.length;
  } catch {
    toast.add({ title: "No se pudo cargar el historial", color: "error" });
    historial.value = null;
  } finally {
    cargandoHistorial.value = false;
  }
}

// ── Reponer ─────────────────────────────────────────────────
const reponiendo = ref<any>(null);
const modo = ref<"entry" | "adjustment">("entry");
const cantidad = ref<number | null>(null);
const cantidadRef = ref<HTMLInputElement>();
const guardando = ref<number | null>(null);

function abrirReponer(p: any) {
  reponiendo.value = p;
  modo.value = "entry";
  cantidad.value = null;
  nextTick(() => cantidadRef.value?.focus());
}

/** Cómo queda el stock si se confirma. null si falta la cantidad. */
const resultado = computed(() => {
  if (!reponiendo.value) return null;
  const n = Number(cantidad.value);
  if (!Number.isFinite(n) || n < 0) return null;
  if (modo.value === "entry") return n > 0 ? reponiendo.value.stock + n : null;
  return n;
});

/**
 * Las dos opciones son dos movimientos distintos de kardex, y la diferencia
 * no es cosmética:
 *
 *  · "Llegó mercadería" es una ENTRADA: suma lo que trajo el proveedor.
 *  · "Conté el almacén" es un AJUSTE: reemplaza la cifra por la real. Si se
 *    registrara como entrada, un recuento que descubre faltantes quedaría
 *    escrito como si hubieran llegado unidades, y el histórico mentiría.
 *
 * En pantalla se pregunta qué pasó, no qué movimiento hacer: quien repone
 * no tiene por qué conocer el vocabulario del kardex.
 */
async function confirmarReponer() {
  if (!reponiendo.value || resultado.value === null) return;
  const p = reponiendo.value;
  const n = Number(cantidad.value);

  // El stock que va a quedar, leído antes de cerrar el diálogo: `resultado`
  // se calcula a partir de `reponiendo`, y al cerrarlo vale null.
  const nuevoStock = resultado.value;

  guardando.value = p.id;
  try {
    await $fetch("/api/admin/inventory/movements", {
      method: "POST",
      body: {
        productId: p.id,
        movementType: modo.value,
        quantity: n,
        reason: modo.value === "entry" ? "Reposición de mercadería" : "Ajuste por recuento",
      },
    });
    toast.add({
      title: `${p.name}: ${p.stock} → ${nuevoStock}`,
      color: "success",
    });
    reponiendo.value = null;
    await cargar();
    // Si el historial de ese producto estaba abierto detrás, se recarga:
    // el movimiento que se acaba de registrar tiene que salir en él.
    if (historial.value?.id === p.id) {
      const fresco = productos.value.find((x: any) => x.id === p.id);
      await abrirHistorial(fresco ?? { ...p, stock: nuevoStock });
    }
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? "No se pudo registrar", color: "error" });
  } finally {
    guardando.value = null;
  }
}

</script>

<style scoped>


/* ── Resumen ── */
.inv-resumen { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
.inv-chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.85rem; border: 1px solid var(--sp-border, #e2e8f0); border-radius: 999px;
  background: #fff; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer;
}
.inv-chip strong { font-weight: 800; }
.inv-chip--on { background: var(--sp-primary, #071e52); border-color: var(--sp-primary, #071e52); color: #fff; }
.inv-chip--low:not(.inv-chip--on) strong { color: #b45309; }
.inv-chip--out { cursor: default; background: #fef2f2; border-color: #fecaca; color: #b91c1c; }

.inv-umbral { margin-left: auto; font-size: 0.78rem; color: #64748b; }

/* ── Tabla ── */
.inv-cat { font-size: 0.78rem; }
.inv-inactivo { display: block; margin-top: 0.15rem; font-size: 0.68rem; color: #b45309; }

/* Las etiquetas de estado, el número de stock y los botones de la fila
   usaban clases propias —otros verdes, otro radio, otro tamaño— al lado de
   una tabla que ya traía sp-badge, sp-table-num y sp-table-btn. Se fueron:
   ahora Inventario se pinta con lo mismo que Productos.

   De paso desaparece un `var(--sp-primary, #071e52)` cuyo respaldo era
   magenta, de otra paleta. */

/* ── Reponer ── */

/* El historial necesita más ancho que el diálogo de ajuste: cada línea
   lleva tipo, motivo, fecha y cantidad. */
.inv-modal--ancho {
  width: min(560px, calc(100vw - 2rem));
}

.inv-hist {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  max-height: 22rem;
  overflow-y: auto;
}

.inv-hist__item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--sp-border, #e2e8f0);
}

.inv-hist__item:last-child {
  border-bottom: none;
}

.inv-hist__tipo {
  flex-shrink: 0;
  min-width: 4.6rem;
  text-align: center;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 800;
  background: #f1f5f9;
  color: #475569;
}

.inv-hist__tipo--entry { background: #dcfce7; color: #166534; }
.inv-hist__tipo--exit { background: #fee2e2; color: #b91c1c; }
.inv-hist__tipo--adjustment { background: #fef3c7; color: #92400e; }

.inv-hist__texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.inv-hist__texto strong {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inv-hist__texto span {
  font-size: 0.72rem;
  color: #94a3b8;
}

.inv-hist__delta {
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #64748b;
}

.inv-hist__delta--sube { color: #15803d; }
.inv-hist__delta--baja { color: #b91c1c; }

.inv-hist__mas {
  margin: -0.4rem 0 0.9rem;
  font-size: 0.75rem;
  color: #64748b;
}

.inv-hist__estado {
  margin: 0 0 1rem;
  padding: 1.5rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: #64748b;
}

.inv-modal {
  position: fixed;
  z-index: 60;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(440px, calc(100vw - 2rem));
  padding: 1.4rem;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 50px rgb(0 0 0 / 0.22);
}

.inv-modal__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.3;
}

.inv-modal__stock {
  margin: 0.25rem 0 1rem;
  font-size: 0.85rem;
  color: #64748b;
}

.inv-modal__label {
  margin: 0 0 0.45rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

/* Dos opciones grandes en vez de dos botones diminutos: cada una dice qué
   hace, y la elegida se ve de un vistazo. */
.inv-opciones {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.inv-opcion {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.7rem 0.85rem;
  border: 1.5px solid var(--sp-border, #e2e8f0);
  border-radius: 10px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}

.inv-opcion strong {
  font-size: 0.87rem;
  font-weight: 700;
}

.inv-opcion span {
  font-size: 0.74rem;
  color: #64748b;
}

.inv-opcion:hover {
  border-color: #cbd5e1;
}

.inv-opcion--on {
  border-color: var(--sp-primary, #071e52);
  background: #fdf4fa;
}

.inv-modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.inv-modal__field span {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.inv-modal__input {
  font-size: 1.15rem !important;
  font-weight: 700;
  text-align: center;
}

.inv-modal__preview {
  margin: 0.8rem 0 0;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  background: #f0f9ff;
  color: #075985;
  font-size: 0.85rem;
}

.inv-modal__merma {
  color: #b45309;
  font-weight: 600;
}

.inv-modal__actions {
  margin-top: 1.1rem;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Las flechitas nativas del campo numérico cortaban el texto del
   marcador de posición; aquí sobran porque se escribe una cifra. */
.inv-page input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.inv-page input[type="number"]::-webkit-outer-spin-button,
.inv-page input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

/* ── Móvil ──
   Las filas de filtros usan margin-left:auto para empujar el umbral a la
   derecha. En un teléfono eso deja dos bloques peleándose por el ancho, así
   que ahí se apilan y el umbral ocupa la línea entera. */
@media (max-width: 768px) {
  .inv-page {
    padding: 1rem 0.75rem;
  }

  .inv-resumen {
    gap: 0.4rem;
  }

  .inv-umbral {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }

  .inv-chip {
    flex: 1 1 auto;
    justify-content: center;
  }

  /* El diálogo deja de estar centrado y sube: con el teclado abierto, un
     modal centrado queda medio tapado. */
  .inv-modal {
    top: 1rem;
    transform: translate(-50%, 0);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }
}
</style>

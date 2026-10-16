<template>
  <div class="sp-page inv-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Inventario</h1>
        <p class="sp-page-toolbar__sub">
          {{ resumen.trackedCount }} productos con control de stock ·
          stock bajo con {{ resumen.threshold }} unidades o menos
        </p>
      </div>
      <NuxtLink to="/admin/inventario/movimientos" class="sp-page-btn">
        Ver movimientos
      </NuxtLink>
    </div>

    <AdminInventarioTabs />

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
      <label class="inv-umbral">
        Umbral
        <input v-model.number="umbral" type="number" min="0" max="999" class="sp-drawer-input" />
      </label>
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
              <th class="sp-th sp-th--center" style="width: 120px">Acciones</th>
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
                <span class="inv-stock" :class="`inv-stock--${p.estado}`">{{ p.stock }}</span>
              </td>
              <td class="sp-td">
                <span class="inv-badge" :class="`inv-badge--${p.estado}`">
                  {{ etiquetas[p.estado] }}
                </span>
              </td>
              <td class="sp-td sp-td--center">
                <!-- Un solo botón. Antes había aquí un campo de cantidad y
                     dos botones ("+ Entrada" y "Fijar") apretados en la
                     celda: el número salía cortado y los botones no decían
                     qué hacía cada uno. La decisión se toma en el diálogo,
                     con sitio para explicarla. -->
                <button class="inv-btn" @click="abrirReponer(p)">Reponer</button>
              </td>
            </tr>

            <tr v-if="!productos.length">
              <td colspan="5" class="sp-table-empty">
                <div class="sp-table-empty__inner">
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

const etiquetas: Record<string, string> = {
  agotado: "Agotado",
  bajo: "Stock bajo",
  ok: "Disponible",
};

// La tarjeta "Stock bajo" del dashboard enlaza con ?bajo=1
const soloBajos = ref(route.query.bajo === "1");
const umbral = ref(10);
const busqueda = ref("");
const pagina = ref(0);
const limite = 15;

const productos = ref<any[]>([]);
const total = ref(0);
const resumen = reactive({ trackedCount: 0, lowCount: 0, outCount: 0, threshold: 10 });

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/inventory/stock", {
      query: {
        limit: limite,
        offset: pagina.value * limite,
        q: busqueda.value.trim() || undefined,
        threshold: umbral.value ?? 10,
        low: soloBajos.value ? 1 : 0,
      },
    });
    productos.value = res?.data ?? [];
    total.value = res?.total ?? 0;
    Object.assign(resumen, {
      trackedCount: res?.trackedCount ?? 0,
      lowCount: res?.lowCount ?? 0,
      outCount: res?.outCount ?? 0,
      threshold: res?.threshold ?? 10,
    });
  } catch {
    toast.add({ title: "No se pudo cargar el stock", color: "error" });
  }
}

watch([soloBajos, busqueda, umbral], () => {
  pagina.value = 0;
  cargar();
});
watch(pagina, cargar);
onMounted(cargar);

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
      title: `${p.name}: ${p.stock} → ${resultado.value}`,
      color: "success",
    });
    reponiendo.value = null;
    await cargar();
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? "No se pudo registrar", color: "error" });
  } finally {
    guardando.value = null;
  }
}

</script>

<style scoped>
.inv-page { padding: 1.5rem; }

/* ── Resumen ── */
.inv-resumen { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-bottom: 0.9rem; }
.inv-chip {
  display: inline-flex; align-items: center; gap: 0.4rem;
  padding: 0.4rem 0.85rem; border: 1px solid var(--sp-border, #e2e8f0); border-radius: 999px;
  background: #fff; font-size: 0.8rem; font-weight: 600; color: #475569; cursor: pointer;
}
.inv-chip strong { font-weight: 800; }
.inv-chip--on { background: var(--sp-primary, #b01883); border-color: var(--sp-primary, #b01883); color: #fff; }
.inv-chip--low:not(.inv-chip--on) strong { color: #b45309; }
.inv-chip--out { cursor: default; background: #fef2f2; border-color: #fecaca; color: #b91c1c; }

.inv-umbral { margin-left: auto; display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.78rem; color: #64748b; }
.inv-umbral input { width: 72px; text-align: center; }

/* ── Tabla ── */
.inv-cat { font-size: 0.78rem; }
.inv-inactivo { display: block; margin-top: 0.15rem; font-size: 0.68rem; color: #b45309; }

.inv-stock { font-size: 1rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.inv-stock--agotado { color: #b91c1c; }
.inv-stock--bajo { color: #b45309; }
.inv-stock--ok { color: #0f172a; }

.inv-badge {
  display: inline-block; padding: 0.12rem 0.55rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700;
}
.inv-badge--agotado { background: #fef2f2; color: #b91c1c; }
.inv-badge--bajo { background: #fffbeb; color: #b45309; }
.inv-badge--ok { background: #f0fdf4; color: #15803d; }

/* ── Reponer ── */
.inv-btn {
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 8px;
  background: #fff;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s;
}

.inv-btn:hover {
  border-color: var(--sp-primary, #b01883);
  color: var(--sp-primary, #b01883);
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
  border-color: var(--sp-primary, #b01883);
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

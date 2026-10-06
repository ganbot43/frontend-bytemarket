<template>
  <div class="cp-page">
    <!-- ══ TOOLBAR ══ -->
    <div class="sp-page-toolbar" style="margin-bottom: 1.25rem">
      <div>
        <h1 class="sp-page-toolbar__title">Cupones</h1>
        <p class="sp-page-toolbar__sub">
          {{ total }} {{ total === 1 ? "cupón" : "cupones" }}
          <template v-if="activos"> · {{ activos }} en uso</template>
        </p>
      </div>
      <button class="sp-page-btn" @click="abrirForm()">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Nuevo cupón
      </button>
    </div>

    <SharedBarraTabla v-model="busqueda" placeholder="Buscar por código…" />

    <!-- ══ TABLA ══ -->
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Código</th>
              <th class="sp-th sp-th--center" style="width: 130px">Descuento</th>
              <th class="sp-th" style="width: 130px">Vence</th>
              <th class="sp-th sp-th--center" style="width: 110px">Usos</th>
              <th class="sp-th sp-th--center" style="width: 130px">Estado</th>
              <th class="sp-th sp-th--center" style="width: 110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Vacío -->
            <tr v-if="!items.length">
              <td colspan="6">
                <div class="sp-table-empty">
                  <div class="sp-table-empty__inner">
                    <div class="sp-table-empty__icon">
                      <Ticket class="w-8 h-8 text-current" stroke-width="1.5" />
                    </div>
                    <p class="sp-table-empty__msg">Sin cupones creados</p>
                    <button class="sp-table-empty__cta" @click="abrirForm()">
                      Crear el primero
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Filas -->
            <tr
              v-for="c in items"
              :key="c.id"
              class="sp-tr"
              :class="{ 'cp-row--off': !utilizable(c) }"
            >
              <!-- Código -->
              <td class="sp-td">
                <span class="cp-code">{{ c.code }}</span>
              </td>

              <!-- Descuento -->
              <td class="sp-td sp-td--center">
                <span class="cp-discount">
                  <component
                    :is="c.discountType === 'PERCENT' ? Percent : BadgePercent"
                    class="w-3.5 h-3.5"
                    stroke-width="2"
                  />
                  {{ descuentoLegible(c) }}
                </span>
              </td>

              <!-- Vence -->
              <td class="sp-td" :class="c.expired ? 'cp-td--danger' : 'sp-td--muted'">
                {{ c.expirationDate ? formatFecha(c.expirationDate) : "Sin caducidad" }}
              </td>

              <!-- Usos -->
              <td class="sp-td sp-td--center">
                <span class="cp-uses">
                  {{ c.timesUsed ?? 0 }}<template v-if="c.usageLimit">/{{ c.usageLimit }}</template>
                </span>
                <span v-if="!c.usageLimit" class="cp-uses__hint">sin límite</span>
              </td>

              <!-- Estado: clic para activar/desactivar -->
              <td class="sp-td sp-td--center">
                <button
                  class="sp-badge cp-status-btn"
                  :class="claseEstado(c)"
                  :title="
                    c.isActive ? 'Click para desactivar' : 'Click para activar'
                  "
                  :disabled="alternandoId === c.id"
                  @click="alternarEstado(c)"
                >
                  <span class="sp-badge__dot" />
                  {{ etiquetaEstado(c) }}
                </button>
              </td>

              <!-- Acciones -->
              <td class="sp-td sp-td--center">
                <div class="sp-table-actions">
                  <button
                    class="sp-table-btn sp-table-btn--edit"
                    title="Editar"
                    @click="abrirForm(c)"
                  >
                    <Pencil class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <!-- Un cupón ya canjeado no se borra: el backend lo
                       rechaza con un 409 para no romper el historial de los
                       pedidos que lo aplicaron. Se desactiva en su lugar. -->
                  <button
                    class="sp-table-btn sp-table-btn--del"
                    :disabled="(c.timesUsed ?? 0) > 0"
                    :title="
                      (c.timesUsed ?? 0) > 0
                        ? 'Ya se canjeó: desactívalo para conservar el historial'
                        : 'Eliminar'
                    "
                    @click="objetivoBorrado = c"
                  >
                    <Trash2 class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedPaginacion v-model:pagina="pagina" :total="total" :limite="LIMITE" />
    </div>


    <!-- ══ DRAWER crear / editar ══ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="drawerAbierto"
          class="sp-drawer-overlay"
          @click.self="drawerAbierto = false"
        />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="drawerAbierto" class="sp-drawer-panel">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">
                {{ editando ? "Editar" : "Nuevo" }}
              </p>
              <h2 class="sp-drawer-header__title">Cupón de descuento</h2>
            </div>
            <button class="sp-drawer-close" @click="drawerAbierto = false">
              <X class="w-4 h-4" stroke-width="1.5" />
            </button>
          </div>

          <div class="sp-drawer-body">
            <!-- Código -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Código <span v-if="!editando" class="sp-drawer-req">*</span>
              </label>
              <p class="sp-drawer-hint">
                {{
                  editando
                    ? "El código no se puede cambiar: los pedidos antiguos lo guardan como texto."
                    : "Lo que el cliente escribe en el checkout. Se guarda en mayúsculas."
                }}
              </p>
              <input
                v-if="!editando"
                v-model="form.code"
                class="sp-drawer-input cp-input--code"
                placeholder="Ej: BIENVENIDA10"
                maxlength="40"
                @input="form.code = form.code.toUpperCase()"
                @keyup.enter="guardar"
              />
              <div v-else class="cp-code-readonly">{{ form.code }}</div>
            </div>

            <!-- Tipo -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Tipo de descuento <span class="sp-drawer-req">*</span>
              </label>
              <div class="cp-type-grid">
                <button
                  v-for="opt in tipos"
                  :key="opt.value"
                  class="cp-type-opt"
                  :class="{ 'cp-type-opt--sel': form.discountType === opt.value }"
                  @click="form.discountType = opt.value"
                >
                  <component :is="opt.icon" class="w-4 h-4" stroke-width="2" />
                  <span>{{ opt.label }}</span>
                </button>
              </div>
            </div>

            <!-- Valor -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Valor <span class="sp-drawer-req">*</span>
              </label>
              <p class="sp-drawer-hint">
                {{
                  form.discountType === "PERCENT"
                    ? "Porcentaje sobre el subtotal, de 1 a 100."
                    : "Monto fijo en soles que se resta del subtotal."
                }}
              </p>
              <div class="cp-input-group">
                <span v-if="form.discountType === 'FIXED'" class="cp-affix">S/</span>
                <input
                  v-model.number="form.discountValue"
                  type="number"
                  min="1"
                  :max="form.discountType === 'PERCENT' ? 100 : undefined"
                  step="0.01"
                  class="sp-drawer-input"
                  placeholder="0"
                  @keyup.enter="guardar"
                />
                <span v-if="form.discountType === 'PERCENT'" class="cp-affix">%</span>
              </div>
            </div>

            <!-- Vencimiento -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Vence el</label>
              <p class="sp-drawer-hint">Déjalo vacío para que no caduque.</p>
              <input
                v-model="form.expirationDate"
                type="date"
                class="sp-drawer-input"
              />
            </div>

            <!-- Límite de usos -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Límite de usos</label>
              <p class="sp-drawer-hint">
                Déjalo vacío para usos ilimitados.
                <template v-if="editando && (editando.timesUsed ?? 0) > 0">
                  Ya se canjeó {{ editando.timesUsed }}
                  {{ editando.timesUsed === 1 ? "vez" : "veces" }}.
                </template>
              </p>
              <input
                v-model="form.usageLimit"
                type="number"
                min="1"
                step="1"
                class="sp-drawer-input"
                placeholder="Ilimitado"
              />
            </div>

            <!-- Activo -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Estado</label>
              <div class="cp-toggle-row" @click="form.isActive = !form.isActive">
                <div>
                  <span class="cp-toggle__label">
                    {{ form.isActive ? "Activo" : "Inactivo" }}
                  </span>
                  <span class="cp-toggle__sub">
                    {{
                      form.isActive
                        ? "Los clientes pueden canjearlo en el checkout"
                        : "El código existe pero será rechazado al canjearlo"
                    }}
                  </span>
                </div>
                <div
                  class="cp-toggle__track"
                  :class="{ 'cp-toggle__track--on': form.isActive }"
                >
                  <div class="cp-toggle__knob" />
                </div>
              </div>
            </div>

            <p v-if="errorGuardar" class="sp-drawer-error">{{ errorGuardar }}</p>
          </div>

          <div class="sp-drawer-footer">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="drawerAbierto = false"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn sp-drawer-btn--primary"
              :disabled="guardando || !formValido"
              @click="guardar"
            >
              <template v-if="!guardando">
                {{ editando ? "Guardar cambios" : "Crear cupón" }}
              </template>
              <Loader2 v-else class="sp-drawer-spin w-4 h-4" stroke-width="2" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══ CONFIRMAR BORRADO ══ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="objetivoBorrado"
          class="sp-drawer-overlay"
          @click.self="objetivoBorrado = null"
        />
      </Transition>
      <Transition name="cp-popup">
        <div v-if="objetivoBorrado" class="cp-confirm">
          <div class="cp-confirm__icon">
            <AlertCircle class="w-6 h-6 text-current" stroke-width="1.5" />
          </div>
          <h3 class="cp-confirm__title">¿Eliminar el cupón?</h3>
          <p class="cp-confirm__sub">
            Se eliminará <strong>{{ objetivoBorrado.code }}</strong>. Nadie lo ha
            canjeado todavía, así que no se pierde historial.
          </p>
          <p v-if="errorBorrar" class="sp-drawer-error">{{ errorBorrar }}</p>
          <div class="cp-confirm__actions">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="objetivoBorrado = null"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn cp-btn-danger"
              :disabled="borrando"
              @click="borrar"
            >
              <Loader2 v-if="borrando" class="sp-drawer-spin w-4 h-4" stroke-width="2" />
              <template v-else>Sí, eliminar</template>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import {
  Plus, Ticket, Pencil, Trash2, X, Loader2, AlertCircle,
  Percent, BadgePercent, ChevronLeft, ChevronRight,
} from "lucide-vue-next";

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Cupones — Admin" });

const LIMITE = 20;
const pagina = ref(0);
const busqueda = ref("");

const { data, refresh } = await useFetch<{ data: any[]; total: number }>(
  "/api/admin/coupons",
  {
    query: computed(() => ({
      limit: LIMITE,
      offset: pagina.value * LIMITE,
      q: busqueda.value.trim() || undefined,
    })),
  },
);

/* Buscar desde la página 5 dejaría la tabla vacía si el resultado cabe en
   una sola página. */
watch(busqueda, () => { pagina.value = 0; });

const items = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const totalPaginas = computed(() => Math.ceil(total.value / LIMITE) || 1);
/* Canjeable de verdad = activo, no vencido y no agotado. */
const activos = computed(() => items.value.filter(utilizable).length);

/* La caducidad es un LocalDate ("2026-11-03"), sin hora. Pasarla por
   new Date() la lee como medianoche UTC y, al pintarla en la zona de Lima
   (UTC-5), retrocede un día: "2020-01-01" se veía como "31 dic. 2019". Se
   construye y se formatea en UTC para que no haya desplazamiento. */
const FORMATO_FECHA = new Intl.DateTimeFormat("es-PE", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "2-digit",
});

function formatFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return FORMATO_FECHA.format(new Date(Date.UTC(y, m - 1, d)));
}
const { format: formatPrice } = useFormatPrice();
const toast = useAppToast();

const tipos = [
  { label: "Porcentaje", value: "PERCENT", icon: Percent },
  { label: "Monto fijo", value: "FIXED", icon: BadgePercent },
];

const drawerAbierto = ref(false);
const editando = ref<any>(null);
const guardando = ref(false);
const errorGuardar = ref("");
const objetivoBorrado = ref<any>(null);
const borrando = ref(false);
const errorBorrar = ref("");
const alternandoId = ref<number | null>(null);

const formPorDefecto = () => ({
  code: "",
  discountType: "PERCENT",
  discountValue: null as number | null,
  expirationDate: "",
  usageLimit: "" as string | number,
  isActive: true,
});
const form = reactive(formPorDefecto());

const formValido = computed(() => {
  if (!editando.value && !form.code.trim()) return false;
  const v = Number(form.discountValue);
  if (!Number.isFinite(v) || v <= 0) return false;
  if (form.discountType === "PERCENT" && v > 100) return false;
  return true;
});

function utilizable(c: any) {
  return c.isActive && !c.expired && !c.exhausted;
}

function descuentoLegible(c: any) {
  return c.discountType === "PERCENT"
    ? `${c.discountValue}%`
    : formatPrice(Number(c.discountValue ?? 0));
}

/* Un cupón puede estar activo y aun así no servir: el backend ya calcula
   "expired" y "exhausted", así que el panel muestra el motivo real en vez
   de un "Activo" que engaña. */
function etiquetaEstado(c: any) {
  if (!c.isActive) return "Inactivo";
  if (c.expired) return "Vencido";
  if (c.exhausted) return "Agotado";
  return "Activo";
}

function claseEstado(c: any) {
  if (!c.isActive) return "sp-badge--neutral";
  if (c.expired) return "sp-badge--danger";
  if (c.exhausted) return "sp-badge--warning";
  return "sp-badge--success";
}

function abrirForm(c?: any) {
  editando.value = c ?? null;
  errorGuardar.value = "";
  Object.assign(
    form,
    c
      ? {
          code: c.code,
          discountType: c.discountType,
          discountValue: c.discountValue,
          expirationDate: c.expirationDate ?? "",
          usageLimit: c.usageLimit ?? "",
          isActive: c.isActive,
        }
      : formPorDefecto(),
  );
  drawerAbierto.value = true;
}

/* Vacío significa "sin límite" / "sin caducidad", y el backend lo
   interpreta solo si la clave viaja con null explícito. */
function cuerpo() {
  return {
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    expirationDate: form.expirationDate || null,
    usageLimit:
      form.usageLimit === "" || form.usageLimit === null
        ? null
        : Number(form.usageLimit),
    isActive: form.isActive,
  };
}

async function guardar() {
  if (!formValido.value) return;
  guardando.value = true;
  errorGuardar.value = "";
  try {
    if (editando.value) {
      await $fetch(`/api/admin/coupons/${editando.value.id}`, {
        method: "PUT",
        body: cuerpo(),
      });
    } else {
      await $fetch("/api/admin/coupons", {
        method: "POST",
        body: { code: form.code.trim().toUpperCase(), ...cuerpo() },
      });
    }
    await refresh();
    drawerAbierto.value = false;
    toast.add({
      title: editando.value ? "Cambios guardados" : "Cupón creado",
      color: "success",
    });
  } catch (e: any) {
    errorGuardar.value = e?.data?.message ?? "Ocurrió un error, intenta de nuevo.";
  } finally {
    guardando.value = false;
  }
}

async function alternarEstado(c: any) {
  alternandoId.value = c.id;
  try {
    /* Solo isActive: enviar el resto reabriría las validaciones de valor y
       fecha sin que el admin haya tocado nada. */
    await $fetch(`/api/admin/coupons/${c.id}`, {
      method: "PUT",
      body: { isActive: !c.isActive },
    });
    await refresh();
    toast.add({
      title: c.isActive ? "Cupón desactivado" : "Cupón activado",
      color: "success",
    });
  } catch (e: any) {
    toast.add({
      title: "No se pudo cambiar el estado",
      description: e?.data?.message ?? "Intenta de nuevo.",
      color: "error",
    });
  } finally {
    alternandoId.value = null;
  }
}

async function borrar() {
  if (!objetivoBorrado.value) return;
  borrando.value = true;
  errorBorrar.value = "";
  try {
    await $fetch(`/api/admin/coupons/${objetivoBorrado.value.id}`, {
      method: "DELETE",
    });
    await refresh();
    if (items.value.length === 0 && pagina.value > 0) pagina.value--;
    toast.add({ title: "Cupón eliminado", color: "success" });
    objetivoBorrado.value = null;
  } catch (e: any) {
    /* Carrera posible: alguien canjea el cupón entre que se abre el diálogo
       y se confirma. El 409 trae el motivo escrito; se muestra tal cual. */
    errorBorrar.value = e?.data?.message ?? "No se pudo eliminar.";
    await refresh();
  } finally {
    borrando.value = false;
  }
}
</script>

<style scoped>
.cp-page {
  animation: sp-fade-in 220ms var(--sp-ease) both;
}

/* ── Código ── */
.cp-code {
  display: inline-block;
  padding: 0.2rem 0.55rem;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius-xs);
  background: var(--sp-surface-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--sp-text-strong);
}

.cp-input--code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.cp-code-readonly {
  padding: 0.6rem 0.75rem;
  border: 1px dashed var(--sp-border-strong);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--sp-text-muted);
}

/* ── Descuento ── */
.cp-discount {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-primary-ink);
}

.cp-td--danger {
  color: var(--sp-danger);
  font-weight: 600;
}

/* ── Usos ── */
.cp-uses {
  display: block;
  font-size: var(--sp-text-sm);
  font-weight: 600;
  color: var(--sp-text);
  font-variant-numeric: tabular-nums;
}

.cp-uses__hint {
  display: block;
  font-size: 0.65rem;
  color: var(--sp-text-muted);
}

.cp-row--off {
  opacity: 0.62;
}

.cp-status-btn {
  cursor: pointer;
  border: none;
  font-family: var(--sp-font);
}

.cp-status-btn:disabled {
  opacity: 0.5;
  cursor: wait;
}

.sp-table-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* ── Selector de tipo ── */
.cp-type-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.cp-type-opt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.65rem 0.5rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  background: var(--sp-surface);
  color: var(--sp-text-muted);
  font-family: var(--sp-font);
  font-size: var(--sp-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    border-color var(--sp-t) var(--sp-ease),
    background var(--sp-t) var(--sp-ease),
    color var(--sp-t) var(--sp-ease);
}

.cp-type-opt:hover {
  border-color: var(--sp-border-strong);
  color: var(--sp-text);
}

.cp-type-opt--sel {
  border-color: var(--sp-primary-border);
  background: var(--sp-primary-soft);
  color: var(--sp-primary-ink);
}

/* ── Campo con prefijo/sufijo ── */
.cp-input-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cp-input-group .sp-drawer-input {
  flex: 1;
  min-width: 0;
}

.cp-affix {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-muted);
  flex-shrink: 0;
}

/* ── Toggle ── */
.cp-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  background: var(--sp-surface);
  cursor: pointer;
  transition: border-color var(--sp-t) var(--sp-ease);
}

.cp-toggle-row:hover {
  border-color: var(--sp-border-strong);
}

.cp-toggle__label {
  display: block;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-strong);
}

.cp-toggle__sub {
  display: block;
  margin-top: 2px;
  font-size: 0.7rem;
  color: var(--sp-text-muted);
  line-height: 1.4;
}

.cp-toggle__track {
  width: 2.5rem;
  height: 1.4rem;
  padding: 2px;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-slate-300);
  flex-shrink: 0;
  transition: background var(--sp-t) var(--sp-ease);
}

.cp-toggle__track--on {
  background: var(--sp-success);
}

.cp-toggle__knob {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--sp-shadow-xs);
  transition: transform var(--sp-t) var(--sp-ease);
}

.cp-toggle__track--on .cp-toggle__knob {
  transform: translateX(1.1rem);
}

/* ── Confirmación ── */
.cp-confirm {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  width: min(26rem, calc(100vw - 2rem));
  padding: 1.5rem;
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  box-shadow: var(--sp-shadow-lg);
  text-align: center;
  font-family: var(--sp-font);
}

.cp-confirm__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 0.85rem;
  border-radius: 50%;
  background: var(--sp-danger-soft);
  color: var(--sp-danger);
}

.cp-confirm__title {
  margin: 0 0 0.4rem;
  font-size: var(--sp-text-lg);
  font-weight: 700;
  color: var(--sp-text-strong);
}

.cp-confirm__sub {
  margin: 0 0 1.25rem;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  line-height: 1.5;
}

.cp-confirm__actions {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}

.cp-btn-danger {
  background: var(--sp-danger);
  color: #fff;
  border-color: var(--sp-danger);
}

.cp-btn-danger:hover:not(:disabled) {
  filter: brightness(0.94);
}

.cp-popup-enter-active,
.cp-popup-leave-active {
  transition:
    opacity var(--sp-t) var(--sp-ease),
    transform var(--sp-t) var(--sp-ease);
}

.cp-popup-enter-from,
.cp-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.96);
}
</style>

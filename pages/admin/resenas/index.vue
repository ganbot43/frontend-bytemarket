<template>
  <div class="rv-page">
    <!-- ══ TOOLBAR ══ -->
    <div class="sp-page-toolbar" style="margin-bottom: 1.25rem">
      <div>
        <h1 class="sp-page-toolbar__title">Reseñas</h1>
        <p class="sp-page-toolbar__sub">
          {{ total }} {{ total === 1 ? "reseña" : "reseñas" }}
          {{ filtro ? `en ${etiquetaFiltro(filtro).toLowerCase()}` : "en total" }}
        </p>
      </div>
      <button class="sp-page-btn" @click="recargar">
        <RefreshCcw class="w-3.5 h-3.5" stroke-width="2" />
        Actualizar
      </button>
    </div>

    <SharedBarraTabla v-model="busqueda" placeholder="Buscar por producto o comentario…" />

    <!-- ══ FILTROS ══
         Pendientes va primero y con contador: es la única pestaña que
         pide acción, y si no se revisa la reseña no se publica nunca. -->
    <div class="rv-tabs">
      <button
        v-for="t in pestanas"
        :key="t.value ?? 'todas'"
        class="rv-tab"
        :class="{ 'rv-tab--active': filtro === t.value }"
        @click="cambiarFiltro(t.value)"
      >
        {{ t.label }}
        <span
          v-if="t.value === 'pending' && pendientes > 0"
          class="rv-tab__count"
          >{{ pendientes }}</span
        >
      </button>
    </div>

    <!-- ══ TABLA ══ -->
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Producto</th>
              <th class="sp-th sp-th--center" style="width: 120px">Puntuación</th>
              <th class="sp-th">Comentario</th>
              <th class="sp-th sp-th--center" style="width: 120px">Estado</th>
              <th class="sp-th" style="width: 150px">Fecha</th>
              <th class="sp-th sp-th--center" style="width: 110px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in items"
              :key="r.id"
              class="sp-tr"
              :class="{ 'rv-row--rejected': r.status === 'rejected' }"
            >
              <!-- Producto -->
              <td class="sp-td">
                <p class="sp-table-title" style="margin: 0">
                  {{ r.productName ?? "Producto eliminado" }}
                </p>
                <p class="sp-table-sub">
                  {{ r.userId ? `Cliente #${r.userId}` : "Cliente anónimo" }}
                </p>
              </td>

              <!-- Estrellas -->
              <td class="sp-td sp-td--center">
                <span class="rv-stars" :title="`${r.rating} de 5`">
                  <Star
                    v-for="n in 5"
                    :key="n"
                    class="w-3.5 h-3.5"
                    :class="n <= r.rating ? 'rv-star--on' : 'rv-star--off'"
                    stroke-width="1.5"
                  />
                </span>
              </td>

              <!-- Comentario -->
              <td class="sp-td">
                <p v-if="r.comment" class="rv-comment">{{ r.comment }}</p>
                <span v-else class="sp-td--muted">Sin comentario</span>
              </td>

              <!-- Estado -->
              <td class="sp-td sp-td--center">
                <span class="sp-badge" :class="claseEstado(r.status)">
                  <span class="sp-badge__dot" />
                  {{ etiquetaEstado(r.status) }}
                </span>
              </td>

              <!-- Fecha -->
              <td class="sp-td sp-td--muted">
                {{ formatDateTimeCompact(r.createdAt) }}
              </td>

              <!-- Acciones -->
              <td class="sp-td sp-td--center">
                <div class="sp-table-actions">
                  <button
                    v-if="r.status !== 'approved'"
                    class="sp-table-btn rv-btn--ok"
                    title="Aprobar y publicar"
                    :disabled="moderandoId === r.id"
                    @click="moderar(r, 'approved')"
                  >
                    <Check class="w-3.5 h-3.5" stroke-width="2" />
                  </button>
                  <button
                    v-if="r.status !== 'rejected'"
                    class="sp-table-btn rv-btn--no"
                    title="Rechazar"
                    :disabled="moderandoId === r.id"
                    @click="moderar(r, 'rejected')"
                  >
                    <CircleSlash class="w-3.5 h-3.5" stroke-width="2" />
                  </button>
                  <button
                    class="sp-table-btn sp-table-btn--del"
                    title="Eliminar"
                    @click="objetivoBorrado = r"
                  >
                    <Trash2 class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Vacío -->
            <tr v-if="!items.length">
              <td colspan="6">
                <div class="sp-table-empty">
                  <div class="sp-table-empty__inner">
                    <div class="sp-table-empty__icon">
                      <MessageSquare class="w-8 h-8 text-current" stroke-width="1.5" />
                    </div>
                    <p class="sp-table-empty__msg">
                      {{
                        filtro
                          ? `No hay reseñas ${etiquetaFiltro(filtro).toLowerCase()}`
                          : "Todavía no hay reseñas"
                      }}
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedPaginacion v-model:pagina="pagina" :total="total" :limite="LIMITE" />
    </div>


    <!-- ══ CONFIRMAR BORRADO ══ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="objetivoBorrado"
          class="sp-drawer-overlay"
          @click.self="objetivoBorrado = null"
        />
      </Transition>
      <Transition name="rv-popup">
        <div v-if="objetivoBorrado" class="rv-confirm">
          <div class="rv-confirm__icon">
            <AlertCircle class="w-6 h-6 text-current" stroke-width="1.5" />
          </div>
          <h3 class="rv-confirm__title">¿Eliminar la reseña?</h3>
          <p class="rv-confirm__sub">
            Se borrará definitivamente. Si solo quieres que no se vea en la
            tienda, recházala en vez de eliminarla.
          </p>
          <div class="rv-confirm__actions">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="objetivoBorrado = null"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn rv-btn-danger"
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
  RefreshCcw, Star, Check, CircleSlash, Trash2, MessageSquare,
  ChevronLeft, ChevronRight, AlertCircle, Loader2,
} from "lucide-vue-next";

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Reseñas — Admin" });

const LIMITE = 20;

const pestanas = [
  { label: "Pendientes", value: "pending" },
  { label: "Aprobadas", value: "approved" },
  { label: "Rechazadas", value: "rejected" },
  { label: "Todas", value: null as string | null },
];

/* Arranca en "Pendientes": es la cola de trabajo real del panel. */
const filtro = ref<string | null>("pending");
const pagina = ref(0);
const busqueda = ref("");

const { data, refresh } = await useFetch<{ data: any[]; total: number }>(
  "/api/admin/reviews",
  {
    query: computed(() => ({
      limit: LIMITE,
      offset: pagina.value * LIMITE,
      status: filtro.value ?? undefined,
      q: busqueda.value.trim() || undefined,
    })),
  },
);

/* Contador aparte, con limit=1: solo interesa el "total" para el badge,
   no las filas. */
const { data: datosPendientes, refresh: refrescarPendientes } = await useFetch<{
  total: number;
}>("/api/admin/reviews", {
  key: "admin-reviews-pendientes",
  query: { limit: 1, offset: 0, status: "pending" },
});

const items = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const pendientes = computed(() => datosPendientes.value?.total ?? 0);
const totalPaginas = computed(() => Math.ceil(total.value / LIMITE) || 1);

const { formatDateTimeCompact } = useFormatDateTime();
const toast = useAppToast();

const moderandoId = ref<number | null>(null);
const objetivoBorrado = ref<any>(null);
const borrando = ref(false);

watch(busqueda, () => { pagina.value = 0; });

function cambiarFiltro(valor: string | null) {
  filtro.value = valor;
  pagina.value = 0;
}

async function recargar() {
  await Promise.all([refresh(), refrescarPendientes()]);
}

async function moderar(r: any, status: "approved" | "rejected") {
  moderandoId.value = r.id;
  try {
    await $fetch(`/api/admin/reviews/${r.id}`, { method: "PUT", body: { status } });
    await recargar();
    toast.add({
      title: status === "approved" ? "Reseña publicada" : "Reseña rechazada",
      description:
        status === "approved"
          ? "Ya se ve en la ficha del producto."
          : "No se mostrará en la tienda.",
      color: status === "approved" ? "success" : "warning",
    });
  } catch (e: any) {
    toast.add({
      title: "No se pudo moderar",
      description: e?.data?.message ?? "Intenta de nuevo.",
      color: "error",
    });
  } finally {
    moderandoId.value = null;
  }
}

async function borrar() {
  if (!objetivoBorrado.value) return;
  borrando.value = true;
  try {
    await $fetch(`/api/admin/reviews/${objetivoBorrado.value.id}`, {
      method: "DELETE",
    });
    await recargar();
    /* Si era la última fila de la página, retrocede: si no, queda una
       página vacía con el paginador apuntando más allá del final. */
    if (items.value.length === 0 && pagina.value > 0) pagina.value--;
    toast.add({ title: "Reseña eliminada", color: "success" });
    objetivoBorrado.value = null;
  } catch (e: any) {
    toast.add({
      title: "No se pudo eliminar",
      description: e?.data?.message ?? "Intenta de nuevo.",
      color: "error",
    });
  } finally {
    borrando.value = false;
  }
}

/* Singular: esta etiqueta va en el badge de una sola reseña. Las pestañas
   llevan su propio texto en plural. */
function etiquetaEstado(status: string) {
  const map: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobada",
    rejected: "Rechazada",
  };
  return map[status] ?? status;
}

function etiquetaFiltro(valor: string | null) {
  return pestanas.find((p) => p.value === valor)?.label ?? "";
}

function claseEstado(status: string) {
  switch (status) {
    case "approved":
      return "sp-badge--success";
    case "pending":
      return "sp-badge--warning";
    case "rejected":
      return "sp-badge--danger";
    default:
      return "sp-badge--neutral";
  }
}
</script>

<style scoped>
.rv-page {
  animation: sp-fade-in 220ms var(--sp-ease) both;
}

/* ── Pestañas de filtro ── */
.rv-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.rv-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-pill);
  background: var(--sp-surface);
  color: var(--sp-text-muted);
  font-family: var(--sp-font);
  font-size: var(--sp-text-sm);
  font-weight: 600;
  cursor: pointer;
  transition:
    color var(--sp-t) var(--sp-ease),
    background var(--sp-t) var(--sp-ease),
    border-color var(--sp-t) var(--sp-ease);
}

.rv-tab:hover {
  color: var(--sp-text);
  border-color: var(--sp-border-strong);
}

.rv-tab--active {
  background: var(--sp-primary-soft);
  border-color: var(--sp-primary-border);
  color: var(--sp-primary-ink);
}

.rv-tab__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-warning);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
}

/* ── Estrellas ── */
.rv-stars {
  display: inline-flex;
  gap: 1px;
}

.rv-star--on {
  color: var(--sp-amber-500);
  fill: var(--sp-amber-500);
}

.rv-star--off {
  color: var(--sp-slate-300);
}

/* ── Comentario ──
   Dos líneas como máximo: un comentario largo no debe estirar la fila y
   dejar la tabla ilegible. El texto completo sigue en el title. */
.rv-comment {
  margin: 0;
  font-size: var(--sp-text-sm);
  color: var(--sp-text);
  line-height: 1.45;
  max-width: 34rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.rv-row--rejected {
  opacity: 0.6;
}

/* ── Botones de moderación ── */
.rv-btn--ok:hover:not(:disabled) {
  background: var(--sp-success-soft);
  color: var(--sp-success);
  border-color: var(--sp-success);
}

.rv-btn--no:hover:not(:disabled) {
  background: var(--sp-warning-soft);
  color: var(--sp-warning);
  border-color: var(--sp-warning);
}

.sp-table-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ── Confirmación de borrado ── */
.rv-confirm {
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

.rv-confirm__icon {
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

.rv-confirm__title {
  margin: 0 0 0.4rem;
  font-size: var(--sp-text-lg);
  font-weight: 700;
  color: var(--sp-text-strong);
}

.rv-confirm__sub {
  margin: 0 0 1.25rem;
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  line-height: 1.5;
}

.rv-confirm__actions {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}

.rv-btn-danger {
  background: var(--sp-danger);
  color: #fff;
  border-color: var(--sp-danger);
}

.rv-btn-danger:hover:not(:disabled) {
  filter: brightness(0.94);
}

.rv-popup-enter-active,
.rv-popup-leave-active {
  transition:
    opacity var(--sp-t) var(--sp-ease),
    transform var(--sp-t) var(--sp-ease);
}

.rv-popup-enter-from,
.rv-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.96);
}

@media (max-width: 640px) {
  .rv-comment {
    max-width: 16rem;
  }
}
</style>

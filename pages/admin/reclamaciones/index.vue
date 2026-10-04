<template>
  <div class="reclamaciones-page">
    <!-- ══ TOOLBAR ══ -->
    <div class="sp-page-toolbar" style="margin-bottom: 1.25rem">
      <div>
        <h1 class="sp-page-toolbar__title">Libro de Reclamaciones</h1>
        <p class="sp-page-toolbar__sub">
          {{ items.length }}
          {{ items.length === 1 ? "reclamo" : "reclamos" }} registrado{{
            items.length !== 1 ? "s" : ""
          }}
        </p>
      </div>
      <button class="sp-page-btn" @click="refresh">
        <RefreshCcw class="w-3.5 h-3.5" stroke-width="2" />
        Actualizar
      </button>
    </div>

    <!-- ══ TABLE ══ -->
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Código</th>
              <th class="sp-th">Cliente</th>
              <th class="sp-th">Tipo</th>
              <th class="sp-th sp-th--center">Estado</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th" style="width: 80px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="r in items"
              :key="r.id"
              class="sp-tr sp-tr--clickable"
              @click="openModal(r.id)"
            >
              <td class="sp-td">
                <span class="sp-table-link">{{ r.codigo }}</span>
              </td>
              <td class="sp-td">
                <p class="sp-table-title">{{ r.nombre }}</p>
              </td>
              <td class="sp-td">
                <span class="sp-badge" :class="getBadgeClass(r.tipo)">{{
                  r.tipo
                }}</span>
              </td>
              <td class="sp-td sp-td--center">
                <span class="sp-badge" :class="getStatusBadgeClass(r.estado)">
                  <span class="sp-badge__dot" />
                  {{ formatEstado(r.estado) }}
                </span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{
                  formatDateTime(r.createdAt)
                }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button
                    class="sp-table-btn sp-table-btn--edit"
                    title="Ver detalle"
                    @click.stop="openModal(r.id)"
                  >
                    <Eye class="w-3.5 h-3.5" stroke-width="2" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty state -->
            <tr v-if="!items.length">
              <td colspan="6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Inbox class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">No hay reclamaciones aún</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ MODAL ══ -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div
          v-if="modalOpen"
          class="sp-modal-backdrop"
          @click.self="closeModal"
        >
          <div class="sp-modal-box">
            <ReclamacionesModal
              :reclamacion-id="selectedId"
              @close="closeModal"
              @updated="onUpdated"
            />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { RefreshCcw, Eye, Inbox } from "lucide-vue-next";
import ReclamacionesModal from './reclamacionesModal.vue';

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Libro de Reclamaciones — Admin" });

const { data, refresh } = await useFetch("/api/admin/reclamaciones");
const items = computed(() => data.value ?? []);
const { formatDateTime } = useFormatDateTime();

const modalOpen = ref(false);
const selectedId = ref(null);

function openModal(id) {
  selectedId.value = id;
  modalOpen.value = true;
}

function closeModal() {
  modalOpen.value = false;
  selectedId.value = null;
}

async function onUpdated() {
  await refresh();
}

// Cerrar con Escape
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});
function onKeydown(e) {
  if (e.key === "Escape" && modalOpen.value) closeModal();
}

function formatEstado(estado) {
  const map = {
    pendiente: "Pendiente",
    en_proceso: "En proceso",
    respondido: "Respondido",
    cerrado: "Cerrado",
  };
  return map[estado] || estado;
}

function getBadgeClass(tipo) {
  return tipo === "Queja" ? "sp-badge--warning" : "sp-badge--info";
}

function getStatusBadgeClass(estado) {
  switch (estado) {
    case "pendiente":
      return "sp-badge--warning";
    case "en_proceso":
      return "sp-badge--info";
    case "respondido":
      return "sp-badge--success";
    case "cerrado":
      return "sp-badge--neutral";
    default:
      return "sp-badge--neutral";
  }
}
</script>

<style scoped>
.reclamaciones-page {
  animation: sp-fade-in 220ms var(--sp-ease) both;
}

/* Fila clickeable */
.sp-tr--clickable {
  cursor: pointer;
}

.sp-table-link {
  color: var(--sp-primary);
  font-weight: 700;
  font-size: var(--sp-text-sm);
}

/* Badges */
.sp-badge--info {
  background: rgba(0, 174, 239, 0.1);
  color: #003f8a;
  border: 1px solid rgba(0, 174, 239, 0.18);
}
</style>

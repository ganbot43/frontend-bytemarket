<template>
  <div class="pm-page">
    <!-- Toolbar -->
    <div class="sp-page-toolbar" style="margin-bottom: 1.5rem">
      <div>
        <h1 class="sp-page-toolbar__title">Métodos de pago</h1>
        <p class="sp-page-toolbar__sub">
          {{ methods.length }} método{{
            methods.length !== 1 ? "s" : ""
          }}
          configurado{{ methods.length !== 1 ? "s" : "" }}
        </p>
      </div>
      <button class="sp-page-btn" @click="openForm()">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Nuevo método
      </button>
    </div>

    <!-- Table wrapper -->
    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Método</th>
              <th class="sp-th">Tipo</th>
              <th class="sp-th">Número de cuenta</th>
              <th class="sp-th">Titular</th>
              <th class="sp-th sp-th--center">Estado</th>
              <th class="sp-th sp-th--center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Empty state -->
            <tr v-if="!methods.length">
              <td colspan="6">
                <div class="sp-table-empty">
                  <div class="sp-table-empty__inner">
                    <div class="sp-table-empty__icon">
                      <CreditCard class="w-8 h-8 text-current" stroke-width="1.5" />
                    </div>
                    <p class="sp-table-empty__msg">
                      Sin métodos de pago configurados
                    </p>
                    <button class="sp-table-empty__cta" @click="openForm()">
                      Agregar el primero
                    </button>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Rows -->
            <tr
              v-for="pm in methods"
              :key="pm.id"
              class="sp-tr"
              :class="{ 'pm-row--inactive': !pm.isActive }"
            >
              <!-- Label -->
              <td class="sp-td">
                <div class="pm-label-cell">
                  <span
                    class="pm-type-dot"
                    :style="{ background: typeColor(pm.type) }"
                  />
                  <span class="sp-table-title" style="margin: 0">{{
                    pm.label
                  }}</span>
                </div>
              </td>

              <!-- Type -->
              <td class="sp-td">
                <span
                  class="pm-type-chip"
                  :style="{
                    background: typeColor(pm.type) + '18',
                    color: typeColor(pm.type),
                  }"
                >
                  <span class="pm-type-icon"><component :is="typeIcon(pm.type)" class="w-3.5 h-3.5" /></span>
                  {{ typeLabel(pm.type) }}
                </span>
              </td>

              <!-- Account number -->
              <td class="sp-td sp-td--mono">
                <span v-if="pm.accountNumber">{{ pm.accountNumber }}</span>
                <span v-else class="sp-td--muted">—</span>
              </td>

              <!-- Account name -->
              <td class="sp-td">
                <span v-if="pm.accountName">{{ pm.accountName }}</span>
                <span v-else class="sp-td--muted">—</span>
              </td>

              <!-- Status -->
              <td class="sp-td sp-td--center">
                <button
                  class="sp-badge pm-status-btn"
                  :class="
                    pm.isActive ? 'sp-badge--success' : 'sp-badge--danger'
                  "
                  @click="toggleStatus(pm)"
                  :title="
                    pm.isActive ? 'Click para desactivar' : 'Click para activar'
                  "
                >
                  <span class="sp-badge__dot" />
                  {{ pm.isActive ? "Activo" : "Inactivo" }}
                </button>
              </td>

              <!-- Actions -->
              <td class="sp-td sp-td--center">
                <div class="sp-table-actions" style="justify-content: center">
                  <button
                    class="sp-table-btn sp-table-btn--edit"
                    @click="openForm(pm)"
                    title="Editar"
                  >
                    <Pencil class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button
                    class="sp-table-btn sp-table-btn--del"
                    @click="confirmDelete(pm)"
                    title="Eliminar"
                  >
                    <Trash2 class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══════════════════════════════════════
         DRAWER — Crear / Editar
    ══════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="showDrawer"
          class="sp-drawer-overlay"
          @click.self="showDrawer = false"
        />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="showDrawer" class="sp-drawer-panel">
          <!-- Header -->
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">
                {{ editItem ? "Editar" : "Nuevo" }}
              </p>
              <h2 class="sp-drawer-header__title">Método de pago</h2>
            </div>
            <button class="sp-drawer-close" @click="showDrawer = false">
              <X class="w-4 h-4" stroke-width="1.5" />
            </button>
          </div>

          <!-- Body -->
          <div class="sp-drawer-body">
            <!-- Tipo (selector en creación / readonly en edición) -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Tipo de método</label>

              <!-- Selector -->
              <div v-if="!editItem" class="pm-type-grid">
                <button
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  class="pm-type-opt"
                  :class="{ 'pm-type-opt--selected': form.type === opt.value }"
                  :style="
                    form.type === opt.value
                      ? {
                          borderColor: typeColor(opt.value),
                          background: typeColor(opt.value) + '14',
                          color: typeColor(opt.value),
                        }
                      : {}
                  "
                  @click="form.type = opt.value"
                >
                  <span class="pm-type-icon"><component :is="typeIcon(opt.value)" class="w-4 h-4" /></span>
                  <span class="pm-type-opt-label">{{ opt.label }}</span>
                </button>
              </div>

              <!-- Read-only -->
              <div
                v-else
                class="pm-type-readonly"
                :style="{
                  background: typeColor(form.type) + '14',
                  color: typeColor(form.type),
                }"
              >
                <span class="pm-type-icon"><component :is="typeIcon(form.type)" class="w-4 h-4" /></span>
                {{ typeLabel(form.type) }}
              </div>
            </div>

            <!-- Etiqueta -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Etiqueta <span class="sp-drawer-req">*</span>
              </label>
              <p class="sp-drawer-hint">
                Nombre visible para los clientes al pagar
              </p>
              <input
                v-model="form.label"
                class="sp-drawer-input"
                placeholder="Ej: Yape — 999 999 999"
                @keyup.enter="save"
              />
            </div>

            <!-- Número de cuenta -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Número de cuenta</label>
              <input
                v-model="form.accountNumber"
                class="sp-drawer-input"
                placeholder="Número de cuenta o teléfono"
              />
            </div>

            <!-- Titular -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Titular</label>
              <input
                v-model="form.accountName"
                class="sp-drawer-input"
                placeholder="Nombre del titular"
              />
            </div>

            <!-- Estado -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Estado</label>
              <div
                class="pm-toggle-row"
                @click="form.isActive = !form.isActive"
              >
                <div>
                  <span class="pm-toggle-label">{{
                    form.isActive ? "Activo" : "Inactivo"
                  }}</span>
                  <span class="pm-toggle-sub">
                    {{
                      form.isActive
                        ? "Visible para los clientes al momento de pagar"
                        : "Oculto, los clientes no podrán seleccionarlo"
                    }}
                  </span>
                </div>
                <div
                  class="pm-toggle-track"
                  :class="{ 'pm-toggle-track--on': form.isActive }"
                >
                  <div class="pm-toggle-knob" />
                </div>
              </div>
            </div>

            <!-- Error -->
            <p v-if="saveError" class="sp-drawer-error">{{ saveError }}</p>
          </div>

          <!-- Footer -->
          <div class="sp-drawer-footer">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="showDrawer = false"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn sp-drawer-btn--primary"
              :disabled="saving || !form.label"
              @click="save"
            >
              <template v-if="!saving">
                {{ editItem ? "Guardar cambios" : "Crear método" }}
              </template>
              <Loader2 v-else class="sp-drawer-spin w-4 h-4" stroke-width="2" />
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ══════════════════════════════════════
         CONFIRM DELETE — popup centrado
    ══════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="deleteTarget"
          class="sp-drawer-overlay"
          @click.self="deleteTarget = null"
        />
      </Transition>
      <Transition name="pm-popup">
        <div v-if="deleteTarget" class="pm-confirm-popup">
          <div class="pm-confirm-icon">
            <AlertCircle class="w-6 h-6 text-current" stroke-width="1.5" />
          </div>
          <h3 class="pm-confirm-title">¿Eliminar método?</h3>
          <p class="pm-confirm-sub">
            Se eliminará <strong>{{ deleteTarget.label }}</strong
            >. Esta acción no se puede deshacer.
          </p>
          <div class="pm-confirm-actions">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="deleteTarget = null"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn pm-btn-danger"
              :disabled="deleting"
              @click="doDelete"
            >
              <Loader2 v-if="deleting" class="sp-drawer-spin w-4 h-4" stroke-width="2" />
              <template v-else>Sí, eliminar</template>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Plus, CreditCard, Pencil, Trash2, X, Loader2, AlertCircle, Smartphone, Landmark, MonitorSmartphone } from "lucide-vue-next";

definePageMeta({ middleware: ["auth", "superadmin"], layout: "admin" });
useSeoMeta({ title: "Métodos de Pago — Admin" });

const { data, refresh } = useFetch<{ data: any[] }>(
  "/api/admin/payment-methods",
);
const methods = computed(() => data.value?.data ?? []);

const showDrawer = ref(false);
const editItem = ref<any>(null);
const saving = ref(false);
const saveError = ref("");
const deleteTarget = ref<any>(null);
const deleting = ref(false);

const typeOptions = [
  { label: "Yape", value: "yape" },
  { label: "Plin", value: "plin" },
  { label: "Transferencia", value: "bank_transfer" },
  // { label: "Culqi", value: "culqi" },
  // { label: "Mercado Pago", value: "mercado_pago" },
];

function typeColor(type: string) {
  const map: Record<string, string> = {
    yape: "#6d28d9",
    plin: "#0891b2",
    bank_transfer: "#0f766e",
    culqi: "#d97706",
    mercado_pago: "#0284c7",
  };
  return map[type] ?? "#6366f1";
}

function typeLabel(type: string) {
  return typeOptions.find((o) => o.value === type)?.label ?? type;
}

function typeIcon(type: string) {
  const icons: Record<string, any> = {
    yape: Smartphone,
    plin: Smartphone,
    bank_transfer: Landmark,
    culqi: CreditCard,
    mercado_pago: MonitorSmartphone,
  };
  return icons[type] ?? icons.bank_transfer;
}

const defaultForm = () => ({
  type: "yape",
  label: "",
  accountNumber: "",
  accountName: "",
  isActive: true,
});
const form = reactive(defaultForm());

function openForm(item?: any) {
  editItem.value = item ?? null;
  saveError.value = "";
  Object.assign(form, item ? { ...item } : defaultForm());
  showDrawer.value = true;
}

async function toggleStatus(pm: any) {
  await $fetch(`/api/admin/payment-methods/${pm.id}`, {
    method: "PUT",
    body: { ...pm, isActive: !pm.isActive },
  });
  await refresh();
  useAppToast().add({
    title: pm.isActive ? "Método desactivado" : "Método activado",
    color: "success",
  });
}

async function save() {
  if (!form.label) return;
  saving.value = true;
  saveError.value = "";
  try {
    if (editItem.value) {
      await $fetch(`/api/admin/payment-methods/${editItem.value.id}`, {
        method: "PUT",
        body: { ...form },
      });
    } else {
      await $fetch("/api/admin/payment-methods", {
        method: "POST",
        body: { ...form },
      });
    }
    await refresh();
    showDrawer.value = false;
    useAppToast().add({
      title: editItem.value ? "Cambios guardados" : "Método creado",
      color: "success",
    });
  } catch (e: any) {
    saveError.value = e?.data?.message ?? "Ocurrió un error, intenta de nuevo.";
  } finally {
    saving.value = false;
  }
}

function confirmDelete(pm: any) {
  deleteTarget.value = pm;
}

async function doDelete() {
  if (!deleteTarget.value) return;
  deleting.value = true;
  try {
    await $fetch(`/api/admin/payment-methods/${deleteTarget.value.id}`, {
      method: "DELETE",
    });
    await refresh();
    useAppToast().add({ title: "Método eliminado", color: "success" });
    deleteTarget.value = null;
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
/* ── Page wrapper ── */
.pm-page {
  padding: 1.5rem;
}

/* ── Filas inactivas ── */
.pm-row--inactive {
  opacity: 0.55;
}

/* ── Celda label con dot de color ── */
.pm-label-cell {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pm-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Chip de tipo en tabla ── */
.pm-type-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  padding: 0.28rem 0.65rem;
  border-radius: var(--sp-radius-pill);
  white-space: nowrap;
  font-family: var(--sp-font);
  letter-spacing: 0.01em;
}

/* ── Icono SVG del tipo ── */
.pm-type-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.pm-type-icon :deep(svg) {
  width: 13px;
  height: 13px;
}

/* ── Badge de estado clickeable ── */
.pm-status-btn {
  cursor: pointer;
  border: none;
  transition:
    opacity var(--sp-t-fast) var(--sp-ease),
    transform var(--sp-t-fast) var(--sp-ease);
}

.pm-status-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* ══════════════════════════════════
   DRAWER — Type selector grid
══════════════════════════════════ */
.pm-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.pm-type-opt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 0.75rem 0.5rem;
  border: 1.5px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  background: var(--sp-surface-muted);
  cursor: pointer;
  color: var(--sp-text-muted);
  transition:
    border-color var(--sp-t-fast) var(--sp-ease),
    background var(--sp-t-fast) var(--sp-ease),
    color var(--sp-t-fast) var(--sp-ease),
    transform var(--sp-t-fast) var(--sp-ease);
  font-family: var(--sp-font);
}

.pm-type-opt:hover {
  border-color: var(--sp-border-strong);
  background: var(--sp-surface-solid);
  transform: translateY(-1px);
}

.pm-type-opt .pm-type-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.pm-type-opt-label {
  font-size: var(--sp-text-xs);
  font-weight: 600;
  text-align: center;
}

.pm-type-opt--selected {
  font-weight: 700;
}

/* ── Type readonly ── */
.pm-type-readonly {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  padding: 0.5rem 0.85rem;
  border-radius: var(--sp-radius-md);
  font-family: var(--sp-font);
}

.pm-type-readonly .pm-type-icon :deep(svg) {
  width: 15px;
  height: 15px;
}

/* ══════════════════════════════════
   DRAWER — Toggle de estado
══════════════════════════════════ */
.pm-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0.9rem;
  background: var(--sp-surface-muted);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-md);
  cursor: pointer;
  transition: background var(--sp-t-fast) var(--sp-ease);
}

.pm-toggle-row:hover {
  background: var(--sp-surface-subtle);
}

.pm-toggle-label {
  display: block;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-strong);
  font-family: var(--sp-font);
}

.pm-toggle-sub {
  display: block;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  margin-top: 2px;
  font-family: var(--sp-font);
}

.pm-toggle-track {
  width: 2.3rem;
  height: 1.25rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-border-strong);
  position: relative;
  flex-shrink: 0;
  transition: background 200ms var(--sp-ease);
}

.pm-toggle-track--on {
  background: var(--sp-primary);
}

.pm-toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(1.25rem - 4px);
  height: calc(1.25rem - 4px);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18);
  transition: transform 200ms var(--sp-ease);
}

.pm-toggle-track--on .pm-toggle-knob {
  transform: translateX(1.05rem);
}

/* ══════════════════════════════════
   Confirm popup
══════════════════════════════════ */
.pm-confirm-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 60;
  width: min(22rem, calc(100vw - 2rem));
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  padding: 2rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  text-align: center;
  box-shadow: var(--sp-shadow-lg);
  font-family: var(--sp-font);
}

.pm-confirm-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--sp-radius-lg);
  background: var(--sp-warning-soft);
  color: var(--sp-warning);
  display: flex;
  align-items: center;
  justify-content: center;
}

.pm-confirm-title {
  font-size: var(--sp-text-lg);
  font-weight: 800;
  color: var(--sp-text-strong);
  letter-spacing: -0.02em;
  margin: 0;
  font-family: var(--sp-font);
}

.pm-confirm-sub {
  font-size: var(--sp-text-sm);
  color: var(--sp-text-muted);
  line-height: 1.55;
  margin: 0;
}

.pm-confirm-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
  width: 100%;
}

.pm-confirm-actions .sp-drawer-btn {
  flex: 1;
  justify-content: center;
}

/* Botón de peligro (solo en confirm) */
.pm-btn-danger {
  background: var(--sp-danger);
  color: #fff;
  box-shadow: 0 6px 18px rgba(239, 68, 68, 0.22);
}

.pm-btn-danger:hover:not(:disabled) {
  background: #dc2626;
  box-shadow: 0 10px 24px rgba(239, 68, 68, 0.3);
  transform: translateY(-1px);
}

.pm-btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* ── Popup transition ── */
.pm-popup-enter-active {
  transition: all 0.25s var(--sp-ease);
}
.pm-popup-leave-active {
  transition: all 0.18s ease;
}
.pm-popup-enter-from {
  opacity: 0;
  transform: translate(-50%, -47%) scale(0.96);
}
.pm-popup-leave-to {
  opacity: 0;
  transform: translate(-50%, -49%) scale(0.97);
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .pm-page {
    padding: 1rem;
  }
  .pm-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

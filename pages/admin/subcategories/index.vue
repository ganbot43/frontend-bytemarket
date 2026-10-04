<template>
  <div class="subcat-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Subcategorías</h1>
        <p class="sp-page-toolbar__sub">
          {{ items.length }} subcategorías registradas
        </p>
      </div>
      <button class="sp-page-btn" @click="openDrawer()">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Nueva subcategoría
      </button>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Nombre</th>
              <th class="sp-th">Categoría</th>
              <th class="sp-th">Slug</th>
              <th class="sp-th">Orden</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in items" :key="s.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ s.name }}</p>
              </td>
              <td class="sp-td">
                <p class="sp-table-sub">{{ s.category?.name ?? '-' }}</p>
              </td>
              <td class="sp-td">{{ s.slug }}</td>
              <td class="sp-td">{{ s.sortOrder }}</td>
              <td class="sp-td">
                <span class="sp-badge" :class="s.isActive ? 'sp-badge--success' : 'sp-badge--danger'">
                  <span class="sp-badge__dot"></span>
                  {{ s.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{ formatDateTime(s.createdAt) }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--edit" @click="openDrawer(s)" title="Editar">
                    <Pencil class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button class="sp-table-btn sp-table-btn--del" @click="deleteItem(s.id)" title="Eliminar">
                    <Trash2 class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!items.length">
              <td colspan="6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Inbox class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">No hay subcategorías aún</p>
                  <button class="sp-table-empty__cta" @click="openDrawer()">Crear la primera</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="drawerOpen" class="sp-drawer-overlay" @click.self="closeDrawer" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <aside v-if="drawerOpen" class="sp-drawer-panel" role="dialog" aria-modal="true">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">{{ isEditing ? 'Editar' : 'Nueva' }}</p>
              <h2 class="sp-drawer-header__title">{{ isEditing ? form.name || 'Subcategoría' : 'Crear subcategoría' }}</h2>
            </div>
            <button class="sp-drawer-close" @click="closeDrawer" aria-label="Cerrar">
              <X class="w-4 h-4" stroke-width="1.8" />
            </button>
          </div>

          <div class="sp-drawer-body">
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Nombre <span class="sp-drawer-req">*</span></label>
              <input v-model="form.name" class="sp-drawer-input" placeholder="Ej. Camisetas" />
            </div>

            <div class="sp-drawer-row">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Categoría</label>
                <select v-model="form.categoryId" class="sp-drawer-input sp-drawer-select">
                  <option :value="null">Sin categoría</option>
                  <option v-for="c in categoryOptions" :key="c.value" :value="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Orden</label>
                <input type="number" v-model.number="form.sortOrder" class="sp-drawer-input" min="0" />
              </div>
            </div>

            <div class="sp-drawer-switches">
              <label class="sp-drawer-switch">
                <input type="checkbox" v-model="form.isActive" class="sp-drawer-switch__input" />
                <span class="sp-drawer-switch__track"><span class="sp-drawer-switch__thumb"></span></span>
                <span class="sp-drawer-switch__label">Activo</span>
              </label>
            </div>

            <p v-if="formError" class="sp-drawer-error">{{ formError }}</p>
          </div>

          <div class="sp-drawer-footer">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="closeDrawer">Cancelar</button>
            <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="saving" @click="save">
              <Loader2 v-if="saving" class="sp-drawer-spin w-3.5 h-3.5" stroke-width="2" />
              <Check v-else class="w-3.5 h-3.5 text-current" stroke-width="1.8" />
              {{ isEditing ? 'Guardar cambios' : 'Crear subcategoría' }}
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Plus, Pencil, Trash2, Inbox, X, Loader2, Check } from "lucide-vue-next";
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Subcategorías — Admin" });

const { data, refresh } = await useFetch<{ data: any[] }>("/api/admin/subcategories");
const { data: categoriesData } = await useFetch("/api/admin/categories");
const items = computed(() => data.value?.data ?? []);
const { formatDateTime } = useFormatDateTime();

const drawerOpen = ref(false);
const editingId = ref<number | null>(null);
const isEditing = computed(() => !!editingId.value);
const saving = ref(false);
const formError = ref("");

const emptyForm = () => ({ name: "", categoryId: null as number | null, sortOrder: 0, isActive: true });
const form = reactive(emptyForm());

function openDrawer(s?: any) {
  formError.value = "";
  if (s) {
    editingId.value = s.id;
    form.name = s.name;
    form.categoryId = s.categoryId ?? null;
    form.sortOrder = s.sortOrder ?? 0;
    form.isActive = !!s.isActive;
  } else {
    editingId.value = null;
    Object.assign(form, emptyForm());
  }
  drawerOpen.value = true;
}

function closeDrawer() { drawerOpen.value = false; }

const categoryOptions = computed(() => (categoriesData.value?.data ?? []).map((c: any) => ({ label: c.name, value: c.id })));

async function save() {
  if (!form.name) {
    formError.value = "El nombre es requerido";
    return;
  }
  saving.value = true;
  formError.value = "";
  try {
    if (isEditing.value) {
      await $fetch(`/api/admin/subcategories/${editingId.value}`, { method: 'PUT', body: form });
    } else {
      await $fetch('/api/admin/subcategories', { method: 'POST', body: form });
    }
    useAppToast().add({ title: isEditing.value ? 'Subcategoría actualizada' : 'Subcategoría creada', color: 'success' });
    closeDrawer();
    await refresh();
  } catch (e: any) {
    formError.value = e?.data?.message ?? 'Error al guardar';
  } finally {
    saving.value = false;
  }
}

async function deleteItem(id: number) {
  if (!confirm('¿Eliminar esta subcategoría?')) return;
  await $fetch(`/api/admin/subcategories/${id}`, { method: 'DELETE' });
  await refresh();
  useAppToast().add({ title: 'Subcategoría eliminada', color: 'success' });
}
</script>

<style scoped>
.subcat-page { display: flex; flex-direction: column; gap: 1.25rem; }
</style>

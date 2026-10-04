<template>
  <div class="cat-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Categorías</h1>
        <p class="sp-page-toolbar__sub">
          {{ categories.length }} categorías registradas
        </p>
      </div>
      <button class="sp-page-btn" @click="openDrawer()">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 3v10M3 8h10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        Nueva categoría
      </button>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Categoría</th>
              <th class="sp-th">Slug</th>
              <th class="sp-th">Fecha</th>
              <th class="sp-th" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ cat.name }}</p>
              </td>
              <td class="sp-td">
                <span class="sp-table-num">{{ cat.slug }}</span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{ formatDateTime(cat.createdAt) }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button
                    class="sp-table-btn sp-table-btn--edit"
                    @click="openDrawer(cat)"
                    title="Editar"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    class="sp-table-btn sp-table-btn--del"
                    @click="deleteCategory(cat.id)"
                    title="Eliminar"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4M4 5l1 8h6l1-8"
                        stroke="currentColor"
                        stroke-width="1.4"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!categories.length">
              <td colspan="3" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="2"
                        y="7"
                        width="20"
                        height="14"
                        rx="2"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <path
                        d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                    </svg>
                  </div>
                  <p class="sp-table-empty__msg">No hay categorías aún</p>
                  <button class="sp-table-empty__cta" @click="openDrawer()">
                    Crear la primera
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div
          v-if="drawerOpen"
          class="sp-drawer-overlay"
          @click.self="closeDrawer"
        />
      </Transition>
      <Transition name="sp-drawer-panel">
        <aside
          v-if="drawerOpen"
          class="sp-drawer-panel"
          role="dialog"
          aria-modal="true"
        >
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">
                {{ isEditing ? "Editar" : "Nueva" }}
              </p>
              <h2 class="sp-drawer-header__title">
                {{ isEditing ? form.name || "Categoría" : "Crear categoría" }}
              </h2>
            </div>
            <button
              class="sp-drawer-close"
              @click="closeDrawer"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 3l10 10M13 3L3 13"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div class="sp-drawer-body">
            <div class="sp-drawer-field">
              <label class="sp-drawer-label"
                >Nombre <span class="sp-drawer-req">*</span></label
              >
              <input
                v-model="form.name"
                class="sp-drawer-input"
                placeholder="Ej. Ropa deportiva"
              />
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Sección <span class="sp-drawer-hint-small">(opcional)</span></label>
              <input
                v-model.number="form.seccion"
                type="number"
                min="0"
                class="sp-drawer-input"
                placeholder="Ej. 1, 2, 3..."
              />
              <span class="sp-drawer-hint">Número de sección para organizar la categoría</span>
            </div>

            <!-- <div class="sp-drawer-field">
              <label class="sp-drawer-label">ID Producto <span class="sp-drawer-hint-small">(opcional)</span></label>
              <input
                v-model.number="form.idProducto"
                type="number"
                min="0"
                class="sp-drawer-input"
                placeholder="Ej. 1, 5, 10..."
              />
              <span class="sp-drawer-hint">ID del producto asociado a esta categoría</span>
            </div> -->

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Imagen Banner <span class="sp-drawer-hint-small">(opcional)</span></label>
              <div v-if="form.imagenBanner" class="categoria-preview">
                <img :src="form.imagenBanner" alt="Preview" />
                <button
                  type="button"
                  class="categoria-preview-remove"
                  @click="form.imagenBanner = ''"
                  :disabled="uploadingBanner"
                  title="Eliminar imagen"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 3l10 10M13 3L3 13"
                      stroke="currentColor"
                      stroke-width="1.8"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
              <label
                v-else
                class="categoria-upload-zone"
                :class="{ 'categoria-upload-zone--uploading': uploadingBanner }"
              >
                <input
                  ref="bannerFileInputRef"
                  type="file"
                  accept="image/*"
                  class="categoria-upload-input"
                  @change="onBannerFileSelected"
                />
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    stroke-width="1.8"
                    stroke-linecap="round"
                  />
                </svg>
                <span v-if="!uploadingBanner">Subir imagen</span>
                <span v-else class="categoria-uploading-text">Subiendo...</span>
              </label>
              <span class="sp-drawer-hint">Sube una imagen desde tu computadora (máx. 2 MB)</span>
              <p v-if="bannerUploadError" class="sp-drawer-error">{{ bannerUploadError }}</p>
            </div>

            <p v-if="formError" class="sp-drawer-error">{{ formError }}</p>
          </div>

          <div class="sp-drawer-footer">
            <button
              class="sp-drawer-btn sp-drawer-btn--ghost"
              @click="closeDrawer"
            >
              Cancelar
            </button>
            <button
              class="sp-drawer-btn sp-drawer-btn--primary"
              :disabled="saving"
              @click="save"
            >
              <svg
                v-if="saving"
                class="sp-drawer-spin"
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-dasharray="25 13"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                v-else
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3 8l4 4 6-6"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              {{ isEditing ? "Guardar cambios" : "Crear categoría" }}
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Categorías — Admin" });

const { data, refresh } = await useFetch<{ data: any[] }>(
  "/api/admin/categories",
);
const categories = computed(() => data.value?.data ?? []);
const { formatDateTime } = useFormatDateTime();

const drawerOpen = ref(false);
const editingId = ref<number | null>(null);
const isEditing = computed(() => !!editingId.value);
const saving = ref(false);
const formError = ref("");
const uploadingBanner = ref(false);
const bannerUploadError = ref("");
const bannerFileInputRef = ref<HTMLInputElement>();

const emptyForm = () => ({ name: "", seccion: null, idProducto: null, imagenBanner: "" });
const form = reactive(emptyForm());

function openDrawer(cat?: any) {
  formError.value = "";
  if (cat) {
    editingId.value = cat.id;
    form.name = cat.name;
    form.seccion = cat.seccion || null;
    form.idProducto = cat.idProducto || null;
    form.imagenBanner = cat.imagenBanner || "";
  } else {
    editingId.value = null;
    Object.assign(form, emptyForm());
  }
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
}

async function save() {
  if (!form.name) {
    formError.value = "El nombre es requerido";
    return;
  }
  saving.value = true;
  formError.value = "";
  try {
    if (isEditing.value) {
      await $fetch(`/api/admin/categories/${editingId.value}`, {
        method: "PUT",
        body: form,
      });
    } else {
      await $fetch("/api/admin/categories", { method: "POST", body: form });
    }
    useAppToast().add({
      title: isEditing.value ? "Categoría actualizada" : "Categoría creada",
      color: "success",
    });
    closeDrawer();
    await refresh();
  } catch (e: any) {
    formError.value = e?.data?.message ?? "Error al guardar";
  } finally {
    saving.value = false;
  }
}

async function onBannerFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length) return;
  
  const file = input.files[0];
  bannerUploadError.value = "";
  
  // Validaciones
  const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
  
  if (!ALLOWED.includes(file.type)) {
    bannerUploadError.value = "Tipo no permitido: solo jpg, png, webp o gif";
    input.value = "";
    return;
  }
  
  if (file.size > MAX_SIZE) {
    bannerUploadError.value = "La imagen debe ser menor a 2 MB";
    input.value = "";
    return;
  }
  
  uploadingBanner.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "categories");
    const res: any = await $fetch("/api/upload/image", {
      method: "POST",
      body: fd,
    });
    form.imagenBanner = res.url;
    if (bannerFileInputRef.value) {
      bannerFileInputRef.value.value = "";
    }
  } catch (e: any) {
    bannerUploadError.value = e?.data?.message ?? "Error al subir la imagen";
  } finally {
    uploadingBanner.value = false;
  }
}

async function deleteCategory(id: number) {
  if (!confirm("¿Eliminar esta categoría?")) return;
  await $fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
  await refresh();
  useAppToast().add({ title: "Categoría eliminada", color: "success" });
}
</script>

<style scoped>
.cat-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.categoria-preview {
  margin-bottom: 1rem;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f5f5f5;
  height: auto;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.categoria-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.categoria-preview-remove {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 2rem;
  height: 2rem;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 0.375rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.categoria-preview-remove:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.9);
}

.categoria-preview-remove:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.categoria-upload-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem 1rem;
  border: 2px dashed #ddd;
  border-radius: 0.5rem;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  font-size: 0.875rem;
  font-weight: 500;
}

.categoria-upload-zone:hover {
  border-color: #999;
  background: #f0f0f0;
}

.categoria-upload-zone--uploading {
  opacity: 0.6;
  cursor: not-allowed;
}

.categoria-upload-input {
  display: none;
}

.categoria-uploading-text {
  display: inline-block;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.sp-drawer-hint-small {
  font-size: 0.75rem;
  color: #999;
  font-weight: normal;
}
</style>

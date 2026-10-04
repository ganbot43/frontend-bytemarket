<template>
  <div class="banners-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Banners</h1>
        <p class="sp-page-toolbar__sub">
          {{ banners.length }} banners registrados
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
        Nuevo banner
      </button>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th" style="width: 140px">Preview</th>
              <th class="sp-th">Contenido</th>
              <th class="sp-th">Enlace</th>
              <th class="sp-th sp-th--center" style="width: 80px">Orden</th>
              <th class="sp-th" style="width: 100px">Estado</th>
              <th class="sp-th" style="width: 100px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="banner in banners" :key="banner.id" class="sp-tr">
              <td class="sp-td">
                <div class="banner-thumb">
                  <img
                    v-if="banner.imageUrl"
                    :src="banner.imageUrl"
                    :alt="`Banner ${banner.sortOrder}`"
                  />
                  <div v-else class="banner-thumb__empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="3"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path
                        d="M3 15l5-5 4 4 3-3 6 6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </td>

              <td class="sp-td">
                <div class="banner-content">
                  <p v-if="banner.title" class="banner-content__title">{{ banner.title }}</p>
                  <p v-else class="banner-content__title banner-content__title--none">
                    Solo imagen (sin texto)
                  </p>
                  <p v-if="banner.subtitle" class="banner-content__sub">{{ banner.subtitle }}</p>
                </div>
              </td>

              <td class="sp-td">
                <p
                  v-if="banner.linkUrl"
                  class="banner-url banner-url--link"
                  :title="banner.linkUrl"
                >
                  {{ banner.linkUrl }}
                </p>
                <span v-else class="sp-table-num">—</span>
              </td>

              <td class="sp-td sp-td--center">
                <span class="banner-order">{{ banner.sortOrder }}</span>
              </td>

              <td class="sp-td">
                <span
                  class="sp-badge"
                  :class="
                    banner.isActive ? 'sp-badge--success' : 'sp-badge--danger'
                  "
                >
                  <span class="sp-badge__dot"></span>
                  {{ banner.isActive ? "Activo" : "Inactivo" }}
                </span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button
                    class="sp-table-btn sp-table-btn--edit"
                    @click="openDrawer(banner)"
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
                    @click="deleteBanner(banner.id)"
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

            <tr v-if="!banners.length">
              <td colspan="6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                      <rect
                        x="3"
                        y="3"
                        width="18"
                        height="18"
                        rx="3"
                        stroke="currentColor"
                        stroke-width="1.5"
                      />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path
                        d="M3 15l5-5 4 4 3-3 6 6"
                        stroke="currentColor"
                        stroke-width="1.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <p class="sp-table-empty__msg">No hay banners aún</p>
                  <button class="sp-table-empty__cta" @click="openDrawer()">
                    Crear el primero
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
                {{ isEditing ? "Editar" : "Nuevo" }}
              </p>
              <h2 class="sp-drawer-header__title">
                {{ isEditing ? "Editar banner" : "Crear banner" }}
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
            <!-- Vista previa: reproduce la composición real de la portada
                 (velo + texto según alineación), no solo la foto suelta. -->
            <div class="bnr-preview">
              <div class="bnr-preview__stage">
                <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="bnr-preview__img" />
                <div v-else class="bnr-preview__brand" />

                <div v-if="hasText" class="bnr-preview__scrim" :class="`is-${form.align}`" />

                <div v-if="hasText" class="bnr-preview__body" :class="`is-${form.align}`">
                  <span v-if="form.eyebrow" class="bnr-preview__eyebrow">{{ form.eyebrow }}</span>
                  <span v-if="form.title" class="bnr-preview__title">{{ form.title }}</span>
                  <span v-if="form.subtitle" class="bnr-preview__sub">{{ form.subtitle }}</span>
                  <span v-if="form.ctaLabel" class="bnr-preview__cta">{{ form.ctaLabel }}</span>
                </div>
              </div>
              <p class="bnr-preview__note">
                Vista previa aproximada · proporción 21:9 en escritorio
              </p>
            </div>

            <!-- ── Imagen ── -->
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Imagen <span class="sp-drawer-req">*</span>
              </label>

              <div class="bnr-upload">
                <label class="bnr-upload__btn" :class="{ 'is-busy': uploading }">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    :disabled="uploading"
                    @change="onPickFile"
                  />
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M8 11V3M5 6l3-3 3 3M3 11v2h10v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ uploading ? "Subiendo…" : "Subir imagen" }}
                </label>

                <button
                  v-if="form.imageUrl"
                  type="button"
                  class="bnr-upload__clear"
                  @click="form.imageUrl = ''"
                >
                  Quitar
                </button>
              </div>

              <input
                v-model="form.imageUrl"
                class="sp-drawer-input"
                placeholder="…o pega una URL: https://…"
              />
              <span class="sp-drawer-hint">
                Proporción recomendada 21:9 (ej. 1680×720px). JPG, PNG o WebP.
              </span>
            </div>

            <!-- ── Texto sobre la imagen ── -->
            <div class="bnr-divider">
              <span>Texto sobre la imagen</span>
              <small>Deja todo vacío si la imagen ya trae el mensaje</small>
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Etiqueta <span class="banner-optional">opcional</span>
              </label>
              <input
                v-model="form.eyebrow"
                class="sp-drawer-input"
                maxlength="80"
                placeholder="Ej. Oferta de temporada"
              />
              <span class="sp-drawer-hint">Línea pequeña en mayúsculas sobre el titular</span>
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Titular <span class="banner-optional">opcional</span>
              </label>
              <input
                v-model="form.title"
                class="sp-drawer-input"
                maxlength="160"
                placeholder="Ej. Pantallas con 20% de descuento"
              />
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Bajada <span class="banner-optional">opcional</span>
              </label>
              <textarea
                v-model="form.subtitle"
                class="sp-drawer-input bnr-textarea"
                maxlength="300"
                rows="2"
                placeholder="Una o dos líneas explicando la promoción"
              />
            </div>

            <div class="sp-drawer-row">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">
                  Texto del botón <span class="banner-optional">opcional</span>
                </label>
                <input
                  v-model="form.ctaLabel"
                  class="sp-drawer-input"
                  maxlength="60"
                  placeholder="Ej. Ver ofertas"
                />
              </div>

              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Posición del texto</label>
                <select v-model="form.align" class="sp-drawer-input sp-drawer-select">
                  <option value="left">Izquierda</option>
                  <option value="center">Centro</option>
                  <option value="right">Derecha</option>
                </select>
              </div>
            </div>

            <!-- ── Destino y orden ── -->
            <div class="bnr-divider"><span>Destino y orden</span></div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Enlace <span class="banner-optional">opcional</span>
              </label>
              <input
                v-model="form.linkUrl"
                class="sp-drawer-input"
                placeholder="/productos?categoria=pantallas  o  https://…"
              />
              <span class="sp-drawer-hint">
                Ruta interna (empieza con /) o URL completa. Vacío = el banner no es clicable.
              </span>
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Orden</label>
              <input
                v-model.number="form.sortOrder"
                type="number"
                min="0"
                class="sp-drawer-input banner-input-order"
                placeholder="0"
              />
              <span class="sp-drawer-hint">Menor número = aparece primero</span>
            </div>

            <div class="sp-drawer-switches">
              <label class="sp-drawer-switch">
                <input
                  type="checkbox"
                  v-model="form.isActive"
                  class="sp-drawer-switch__input"
                />
                <span class="sp-drawer-switch__track"
                  ><span class="sp-drawer-switch__thumb"></span
                ></span>
                <span class="sp-drawer-switch__label">Banner activo</span>
              </label>
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
              {{ isEditing ? "Guardar cambios" : "Crear banner" }}
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Banners — Admin" });

const { data, refresh } = await useFetch<{ data: any[] }>("/api/admin/banners");
const banners = computed(() => data.value?.data ?? []);

const drawerOpen = ref(false);
const editingId = ref<number | null>(null);
const isEditing = computed(() => !!editingId.value);
const saving = ref(false);
const uploading = ref(false);
const formError = ref("");

const emptyForm = () => ({
  imageUrl: "",
  linkUrl: "",
  eyebrow: "",
  title: "",
  subtitle: "",
  ctaLabel: "",
  align: "left" as "left" | "center" | "right",
  sortOrder: 0,
  isActive: true,
});
const form = reactive(emptyForm());

/* La portada solo dibuja el velo y el bloque de texto si hay algo que
   escribir; la vista previa tiene que reflejar exactamente esa regla. */
const hasText = computed(() =>
  Boolean(form.eyebrow || form.title || form.subtitle || form.ctaLabel),
);

function openDrawer(banner?: any) {
  formError.value = "";
  if (banner) {
    editingId.value = banner.id;
    Object.assign(form, {
      imageUrl: banner.imageUrl ?? "",
      linkUrl: banner.linkUrl ?? "",
      eyebrow: banner.eyebrow ?? "",
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      ctaLabel: banner.ctaLabel ?? "",
      align: banner.align ?? "left",
      sortOrder: banner.sortOrder ?? 0,
      isActive: banner.isActive ?? true,
    });
  } else {
    editingId.value = null;
    Object.assign(form, emptyForm());
  }
  drawerOpen.value = true;
}

function closeDrawer() {
  drawerOpen.value = false;
}

const MAX_UPLOAD_MB = 5;

async function onPickFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  /* Se valida antes de enviar: el servidor devolvería el mismo error
     pero después de subir varios megabytes por la red. */
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    formError.value = `La imagen supera los ${MAX_UPLOAD_MB} MB`;
    input.value = "";
    return;
  }

  uploading.value = true;
  formError.value = "";
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "banners");
    const res: any = await $fetch("/api/upload/image", { method: "POST", body: fd });
    form.imageUrl = res.url;
  } catch (e: any) {
    formError.value = e?.data?.message ?? "No se pudo subir la imagen";
  } finally {
    uploading.value = false;
    /* Limpiar el input permite volver a elegir el mismo archivo si el
       primer intento falló. */
    input.value = "";
  }
}

async function save() {
  if (!form.imageUrl) {
    formError.value = "La imagen es requerida";
    return;
  }

  const link = form.linkUrl.trim();
  if (link && !/^https?:\/\//i.test(link) && !link.startsWith("/")) {
    formError.value = "El enlace debe empezar con / (ruta interna) o con http(s)://";
    return;
  }

  saving.value = true;
  formError.value = "";
  try {
    const body = {
      ...form,
      linkUrl: link || null,
      /* Cadenas vacías a null: guardar "" haría que la portada pinte un
         bloque de texto sin contenido que igual desplaza la imagen. */
      eyebrow: form.eyebrow.trim() || null,
      title: form.title.trim() || null,
      subtitle: form.subtitle.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
    };

    if (isEditing.value) {
      await $fetch(`/api/admin/banners/${editingId.value}`, { method: "PUT", body });
    } else {
      await $fetch("/api/admin/banners", { method: "POST", body });
    }
    useAppToast().add({
      title: isEditing.value ? "Banner actualizado" : "Banner creado",
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

async function deleteBanner(id: number) {
  if (!confirm("¿Eliminar este banner?")) return;
  await $fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
  await refresh();
  useAppToast().add({ title: "Banner eliminado", color: "success" });
}
</script>

<style scoped>
.banners-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Thumbnail en tabla ── */
.banner-thumb {
  width: 7rem;
  height: 2.5rem;
  border-radius: var(--sp-radius-xs);
  overflow: hidden;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.banner-thumb__empty {
  color: var(--sp-text-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* ── URL truncada ── */
.banner-url {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-muted);
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin: 0;
}
.banner-url--link {
  color: var(--sp-primary);
}

/* ── Orden ── */
.banner-order {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-muted);
  font-variant-numeric: tabular-nums;
}

/* ── Contenido en tabla ── */
.banner-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-width: 22rem;
}
.banner-content__title {
  margin: 0;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.banner-content__title--none {
  font-weight: 500;
  font-style: italic;
  color: var(--sp-text-soft);
}
.banner-content__sub {
  margin: 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Vista previa del banner ──
   Replica la composición de la portada (velo + bloque de texto según
   alineación) para que el administrador vea el resultado real y no
   tenga que publicar para descubrir que el titular no se lee. ── */
.bnr-preview {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.bnr-preview__stage {
  position: relative;
  width: 100%;
  aspect-ratio: 21 / 9;
  border-radius: var(--sp-radius-lg);
  overflow: hidden;
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
}

.bnr-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.bnr-preview__brand {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #071e52 0%, #0077c8 100%);
}

.bnr-preview__scrim {
  position: absolute;
  inset: 0;
}
.bnr-preview__scrim.is-left {
  background: linear-gradient(90deg, rgba(7,30,82,.88) 0%, rgba(7,30,82,.66) 38%, rgba(7,30,82,.12) 72%, transparent 100%);
}
.bnr-preview__scrim.is-right {
  background: linear-gradient(270deg, rgba(7,30,82,.88) 0%, rgba(7,30,82,.66) 38%, rgba(7,30,82,.12) 72%, transparent 100%);
}
.bnr-preview__scrim.is-center {
  background: linear-gradient(180deg, rgba(7,30,82,.5) 0%, rgba(7,30,82,.72) 100%);
}

.bnr-preview__body {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.3rem;
  padding: 1.1rem 1.3rem;
}
.bnr-preview__body.is-left {
  align-items: flex-start;
  text-align: left;
  padding-right: 38%;
}
.bnr-preview__body.is-right {
  align-items: flex-end;
  text-align: right;
  padding-left: 38%;
}
.bnr-preview__body.is-center {
  align-items: center;
  text-align: center;
}

.bnr-preview__eyebrow {
  font-size: 0.55rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #50d0ff;
}
.bnr-preview__title {
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.02em;
  color: #fff;
}
.bnr-preview__sub {
  font-size: 0.68rem;
  line-height: 1.4;
  color: rgba(232, 246, 255, 0.85);
}
.bnr-preview__cta {
  margin-top: 0.3rem;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  background: #00aeef;
  color: #071e52;
  font-size: 0.6rem;
  font-weight: 800;
}

.bnr-preview__note {
  margin: 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
}

/* ── Subida de imagen ── */
.bnr-upload {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.bnr-upload__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.25rem;
  padding: 0 0.9rem;
  border-radius: var(--sp-radius-xs);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  color: var(--sp-text);
  font-size: var(--sp-text-xs);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}
.bnr-upload__btn:hover {
  background: var(--sp-surface-muted);
}
.bnr-upload__btn.is-busy {
  opacity: 0.6;
  cursor: wait;
}

.bnr-upload__clear {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: var(--sp-text-xs);
  font-weight: 600;
  color: var(--sp-text-muted);
  cursor: pointer;
}
.bnr-upload__clear:hover {
  color: var(--sp-danger, #dc2626);
}

/* ── Separador de bloque en el formulario ── */
.bnr-divider {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding-top: 0.9rem;
  margin-top: 0.3rem;
  border-top: 1px solid var(--sp-border);
}
.bnr-divider span {
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sp-text-muted);
}
.bnr-divider small {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
}

.bnr-textarea {
  min-height: 4.5rem;
  padding-top: 0.55rem;
  padding-bottom: 0.55rem;
  resize: vertical;
  line-height: 1.5;
}

/* ── Input orden (ancho reducido) ── */
.banner-input-order {
  max-width: 8rem;
}

/* ── Label opcional ── */
.banner-optional {
  font-size: var(--sp-text-xs);
  font-weight: 500;
  color: var(--sp-text-soft);
  margin-left: 0.3rem;
  text-transform: none;
  letter-spacing: 0;
}
</style>

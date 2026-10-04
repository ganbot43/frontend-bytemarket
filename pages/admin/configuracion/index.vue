<template>
  <div class="cfg-page">
    <!-- Page toolbar -->
    <div class="sp-page-toolbar" style="margin-bottom: 1.25rem">
      <div>
        <h1 class="sp-page-toolbar__title">Configuración del negocio</h1>
        <p class="sp-page-toolbar__sub">Ajusta los datos y módulos de tu tienda</p>
      </div>
      <div v-if="form.logoUrl" class="cfg-logo-preview">
        <img :src="form.logoUrl" alt="Logo" @error="logoError = true" v-if="!logoError" />
        <span v-else class="cfg-logo-fallback">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.5" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity=".5" />
            <path d="M3 15l5-5 4 4 3-3 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    </div>

    <div v-if="config" class="admin-fade-in">

      <!-- Tabs -->
      <div class="cfg-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="cfg-tab"
          :class="{ 'cfg-tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <span v-html="tab.icon" class="cfg-tab-icon" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab: General -->
      <div v-if="activeTab === 'general'" class="cfg-card">
        <div class="cfg-section-header">
          <div class="cfg-section-icon">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 14c0-2.21 2.686-4 6-4s6 1.79 6 4v1H4v-1z" fill="currentColor" opacity=".85" />
            </svg>
          </div>
          <div>
            <h2 class="cfg-section-title">Información general</h2>
            <p class="cfg-section-sub">Datos públicos de tu negocio</p>
          </div>
        </div>

        <div class="cfg-fields">
          <div class="sp-drawer-field">
            <label class="sp-drawer-label">Nombre del negocio <span class="sp-drawer-req">*</span></label>
            <input v-model="form.name" class="sp-drawer-input" placeholder="Mi tienda online" />
          </div>

          <div class="sp-drawer-field">
            <label class="sp-drawer-label">RUC / Razón Social</label>
            <input v-model="form.ruc" class="sp-drawer-input" placeholder="20123456789" />
          </div>

          <div class="sp-drawer-field">
            <label class="sp-drawer-label">Correo electrónico</label>
            <div class="cfg-input-group">
              <span class="cfg-input-prefix">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </span>
              <input v-model="form.email" class="sp-drawer-input cfg-input-with-prefix" type="email" placeholder="hola@mi-tienda.com" />
            </div>
          </div>

          <div class="sp-drawer-field">
            <label class="sp-drawer-label">WhatsApp</label>
            <div class="cfg-input-group">
              <span class="cfg-input-prefix">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="currentColor" opacity=".8" />
                </svg>
              </span>
              <input v-model="form.whatsapp" class="sp-drawer-input cfg-input-with-prefix" placeholder="+51 996 111 303" />
            </div>
          </div>

          <div class="sp-drawer-field">
            <label class="sp-drawer-label">Dirección</label>
            <div class="cfg-input-group">
              <span class="cfg-input-prefix">
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a6 6 0 00-6 6c0 4 6 10 6 10s6-6 6-10a6 6 0 00-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z" fill="currentColor" opacity=".8" />
                </svg>
              </span>
              <input v-model="form.address" class="sp-drawer-input cfg-input-with-prefix" placeholder="Av. Principal 123" />
            </div>
          </div>

          <div class="sp-drawer-field cfg-field--full">
            <label class="sp-drawer-label">Logo del Negocio</label>
            <p class="sp-drawer-hint">Sube una imagen desde tu PC (PNG, JPG o SVG, max 5MB)</p>
            
            <div style="margin-top: 8px;">
              <input type="file" accept="image/*" class="cfg-hidden-input" ref="fileInput" @change="uploadLogo" style="display: none;" />
              <button type="button" class="cfg-upload-btn" @click="triggerUpload" :disabled="uploadingLogo" style="width: 100%;">
                <template v-if="uploadingLogo">
                  <svg class="cfg-spin" width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px;">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round" />
                  </svg>
                  Subiendo imagen...
                </template>
                <template v-else>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-right: 6px;">
                    <path d="M8 12V4m0 0L4.5 7.5M8 4l3.5 3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Seleccionar archivo desde la PC
                </template>
              </button>
            </div>
          </div>
        </div>

        <div class="cfg-card-footer">
          <p v-if="error" class="sp-drawer-error">{{ error }}</p>
          <div class="cfg-footer-row">
            <button class="cfg-save-btn" :class="{ 'cfg-save-btn--loading': saving }" :disabled="saving || !form.name" @click="save">
              <template v-if="!saving">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Guardar cambios
              </template>
              <template v-else>
                <svg class="cfg-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round" />
                </svg>
                Guardando…
              </template>
            </button>
            <div v-if="saved" class="cfg-saved-badge">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Cambios guardados
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Módulos -->
      <div v-if="activeTab === 'modulos'" class="cfg-card">
        <div class="cfg-section-header">
          <div class="cfg-section-icon">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85" />
            </svg>
          </div>
          <div>
            <h2 class="cfg-section-title">Módulos</h2>
            <p class="cfg-section-sub">Activa o desactiva funcionalidades de la tienda</p>
          </div>
        </div>

        <div class="cfg-modules">
          <div
            v-for="mod in modules"
            :key="mod.key"
            class="cfg-module-row"
            :class="{ 'cfg-module-row--on': form[mod.key] }"
            @click="form[mod.key] = !form[mod.key]"
          >
            <div class="cfg-module-icon" :class="`cfg-module-icon--${mod.color}`">
              <span v-html="mod.icon" />
            </div>
            <div class="cfg-module-info">
              <span class="cfg-module-name">{{ mod.label }}</span>
              <span class="cfg-module-desc">{{ mod.desc }}</span>
            </div>
            <div class="cfg-toggle-track" :class="{ 'cfg-toggle-track--on': form[mod.key] }">
              <div class="cfg-toggle-knob" />
            </div>
          </div>
        </div>

        <div class="cfg-card-footer">
          <p v-if="error" class="sp-drawer-error">{{ error }}</p>
          <div class="cfg-footer-row">
            <button class="cfg-save-btn" :class="{ 'cfg-save-btn--loading': saving }" :disabled="saving || !form.name" @click="save">
              <template v-if="!saving">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Guardar cambios
              </template>
              <template v-else>
                <svg class="cfg-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round" />
                </svg>
                Guardando…
              </template>
            </button>
            <div v-if="saved" class="cfg-saved-badge">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Cambios guardados
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: Acceso -->
      <div v-if="activeTab === 'acceso'" class="cfg-card">
        <div class="cfg-section-header">
          <div class="cfg-section-icon">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6H8V6a2 2 0 114 0v2z" fill="currentColor" opacity=".85" />
            </svg>
          </div>
          <div>
            <h2 class="cfg-section-title">Acceso y seguridad</h2>
            <p class="cfg-section-sub">Configuración de usuarios y permisos</p>
          </div>
        </div>

        <div class="cfg-access-list">
          <div class="cfg-access-item">
            <div class="cfg-access-info">
              <span class="cfg-access-label">Multi-usuario</span>
              <span class="cfg-access-desc">Permite varios operadores con roles diferenciados</span>
            </div>
            <div
              class="cfg-toggle-track"
              :class="{ 'cfg-toggle-track--on': form.multiuserEnabled }"
              @click="form.multiuserEnabled = !form.multiuserEnabled"
            >
              <div class="cfg-toggle-knob" />
            </div>
          </div>

          <div class="cfg-access-item cfg-access-item--info">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="none" style="flex-shrink:0; margin-top:1px;">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" opacity=".6" />
              <path d="M10 9v5M10 7h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
            <p class="cfg-access-note">
              La gestión avanzada de roles y usuarios estará disponible próximamente. Por ahora puedes activar o desactivar el acceso multi-usuario.
            </p>
          </div>
        </div>

        <div class="cfg-card-footer">
          <p v-if="error" class="sp-drawer-error">{{ error }}</p>
          <div class="cfg-footer-row">
            <button class="cfg-save-btn" :class="{ 'cfg-save-btn--loading': saving }" :disabled="saving || !form.name" @click="save">
              <template v-if="!saving">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                Guardar cambios
              </template>
              <template v-else>
                <svg class="cfg-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="28" stroke-dashoffset="10" stroke-linecap="round" />
                </svg>
                Guardando…
              </template>
            </button>
            <div v-if="saved" class="cfg-saved-badge">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5 6.5-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Cambios guardados
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Skeleton -->
    <div v-else class="cfg-card cfg-skeleton">
      <div class="cfg-skel-line cfg-skel-line--wide" />
      <div class="cfg-skel-line" />
      <div class="cfg-skel-line" />
      <div class="cfg-skel-line cfg-skel-line--short" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth", "superadmin"], layout: "admin" });
useSeoMeta({ title: "Configuración — Admin" });

const { data: config, refresh } = await useFetch<any>("/api/business-config");

const activeTab = ref<"general" | "modulos" | "acceso">("general");

const error = ref("");
const saved = ref(false);
const saving = ref(false);
const logoError = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const uploadingLogo = ref(false);

const tabs: Array<{ key: "general" | "modulos" | "acceso"; label: string; icon: string }> = [
  {
    key: "general",
    label: "General",
    icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 14c0-2.21 2.686-4 6-4s6 1.79 6 4v1H4v-1z" fill="currentColor" opacity=".85"/></svg>`,
  },
  {
    key: "modulos",
    label: "Módulos",
    icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/><rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/><rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".85"/></svg>`,
  },
  {
    key: "acceso",
    label: "Acceso",
    icon: `<svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 2a4 4 0 00-4 4v2H5a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V9a1 1 0 00-1-1h-1V6a4 4 0 00-4-4zm2 6H8V6a2 2 0 114 0v2z" fill="currentColor" opacity=".85"/></svg>`,
  },
];

const form = reactive({
  name: config.value?.name ?? "",
  ruc: config.value?.ruc ?? "",
  email: config.value?.email ?? "",
  whatsapp: config.value?.whatsapp ?? "",
  address: config.value?.address ?? "",
  logoUrl: config.value?.logoUrl ?? "",
  stockEnabled: config.value?.stockEnabled ?? false,
  autoPaymentEnabled: config.value?.autoPaymentEnabled ?? false,
  couponsEnabled: config.value?.couponsEnabled ?? false,
  multiuserEnabled: config.value?.multiuserEnabled ?? false,
});

watchEffect(() => {
  if (!config.value) return;
  Object.assign(form, {
    name: config.value.name ?? "",
    ruc: config.value.ruc ?? "",
    email: config.value.email ?? "",
    whatsapp: config.value.whatsapp ?? "",
    address: config.value.address ?? "",
    logoUrl: config.value.logoUrl ?? "",
    stockEnabled: config.value.stockEnabled ?? false,
    autoPaymentEnabled: config.value.autoPaymentEnabled ?? false,
    couponsEnabled: config.value.couponsEnabled ?? false,
    multiuserEnabled: config.value.multiuserEnabled ?? false,
  });
});

const modules = [
  {
    key: "stockEnabled",
    label: "Control de stock",
    desc: "Gestiona inventario y alertas de bajo stock",
    color: "blue",
    icon: `<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M3 4h14M3 8h14M3 12h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M13.5 14.5l1 1 2-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    key: "autoPaymentEnabled",
    label: "Pago automático",
    desc: "Confirma pedidos al recibir el pago sin intervención manual",
    color: "green",
    icon: `<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 9h16" stroke="currentColor" stroke-width="1.5"/><circle cx="6" cy="13" r="1" fill="currentColor"/></svg>`,
  },
  {
    key: "couponsEnabled",
    label: "Cupones de descuento",
    desc: "Crea y distribuye códigos promocionales",
    color: "amber",
    icon: `<svg width="15" height="15" viewBox="0 0 20 20" fill="none"><path d="M2 10a2 2 0 002-2V5h12v3a2 2 0 002 2v1a2 2 0 00-2 2v3H4v-3a2 2 0 00-2-2v-1z" stroke="currentColor" stroke-width="1.5"/><path d="M8 10h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="1.5 1.5"/></svg>`,
  },
] as const;

async function save() {
  if (!form.name) return;
  saving.value = true;
  saved.value = false;
  error.value = "";
  try {
    await $fetch("/api/admin/business-config", {
      method: "PUT",
      body: { ...form },
    });
    await refresh();
    saved.value = true;
    useAppToast().add({ title: "Configuración guardada", color: "success" });
    saved.value = true;
    setTimeout(() => (saved.value = false), 3000);
  } catch (e: any) {
    error.value = e.data?.message || "Ocurrió un error inesperado";
  } finally {
    saving.value = false;
  }
}

function triggerUpload() {
  fileInput.value?.click();
}

async function uploadLogo(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;
  const file = input.files[0];
  const MAX_SIZE = 5 * 1024 * 1024;
  
  if (file.size > MAX_SIZE) {
    error.value = "La imagen debe ser menor a 5 MB";
    input.value = "";
    return;
  }
  
  uploadingLogo.value = true;
  error.value = "";
  try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "photo-business");
    const res: any = await $fetch("/api/upload/image", {
      method: "POST",
      body: fd,
    });
    form.logoUrl = res.url;
    logoError.value = false;
    if (fileInput.value) {
      fileInput.value.value = "";
    }
  } catch (e: any) {
    error.value = e?.data?.message ?? "Error al subir la imagen";
  } finally {
    uploadingLogo.value = false;
  }
}
</script>

<style scoped>
.cfg-page {
  padding: 1.5rem;
  max-width: 680px;
}

.cfg-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  background-color: var(--surface-sunken);
  border: 1px solid var(--border-light);
  color: var(--ink-faint);
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cfg-upload-btn:hover:not(:disabled) {
  background-color: var(--surface-section);
  color: var(--ink-strong);
  border-color: rgba(255, 255, 255, 0.2);
}

.cfg-upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ── Tabs ── */
.cfg-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--sp-border);
  padding-bottom: 0;
}

.cfg-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1rem;
  font-size: var(--sp-text-sm);
  font-weight: 600;
  color: var(--sp-text-soft);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  cursor: pointer;
  border-radius: var(--sp-radius-sm) var(--sp-radius-sm) 0 0;
  transition: color var(--sp-t-fast) var(--sp-ease), border-color var(--sp-t-fast) var(--sp-ease);
  font-family: var(--sp-font);
}

.cfg-tab:hover {
  color: var(--sp-text-strong);
}

.cfg-tab--active {
  color: var(--sp-primary);
  border-bottom-color: var(--sp-primary);
}

.cfg-tab-icon {
  display: flex;
  align-items: center;
  opacity: 0.75;
}

/* ── Card ── */
.cfg-card {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-xl);
  box-shadow: var(--sp-shadow-sm);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Section header ── */
.cfg-section-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1.5rem 1.75rem 0;
}

.cfg-section-icon {
  width: 2.1rem;
  height: 2.1rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.cfg-section-title {
  font-size: var(--sp-text-md);
  font-weight: 800;
  color: var(--sp-text-strong);
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0;
  font-family: var(--sp-font);
}

.cfg-section-sub {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  margin: 0.2rem 0 0;
  font-family: var(--sp-font);
}

/* ── Fields ── */
.cfg-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1.25rem 1.75rem;
}

.cfg-field--full {
  grid-column: 1 / -1;
}

.cfg-input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.cfg-input-prefix {
  position: absolute;
  left: 0.75rem;
  display: flex;
  align-items: center;
  color: var(--sp-text-soft);
  pointer-events: none;
  z-index: 1;
}

.cfg-input-with-prefix {
  padding-left: 2.25rem !important;
}

/* ── Logo preview ── */
.cfg-logo-preview {
  width: 3rem;
  height: 3rem;
  border-radius: var(--sp-radius-md);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-subtle);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cfg-logo-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.cfg-logo-fallback {
  color: var(--sp-text-soft);
  display: flex;
}

/* ── Módulos ── */
.cfg-modules {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem 1.75rem;
}

.cfg-module-row {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem 1rem;
  border-radius: var(--sp-radius-md);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-muted);
  cursor: pointer;
  transition:
    background var(--sp-t-fast) var(--sp-ease),
    border-color var(--sp-t-fast) var(--sp-ease);
  user-select: none;
}

.cfg-module-row:hover {
  background: var(--sp-surface-subtle);
  border-color: var(--sp-border-strong);
}

.cfg-module-row--on {
  background: var(--sp-primary-soft);
  border-color: rgba(0, 174, 239, 0.22);
}

.cfg-module-row--on:hover {
  background: rgba(0, 174, 239, 0.13);
}

.cfg-module-icon {
  width: 2rem;
  height: 2rem;
  border-radius: var(--sp-radius-xs);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cfg-module-icon :deep(svg),
.cfg-module-icon span { display: flex; }

.cfg-module-icon--blue   { background: rgba(0, 174, 239, 0.12); color: var(--sp-primary); }
.cfg-module-icon--green  { background: var(--sp-success-soft);   color: var(--sp-success); }
.cfg-module-icon--amber  { background: var(--sp-warning-soft);   color: var(--sp-warning); }
.cfg-module-icon--purple { background: rgba(109, 40, 217, 0.1);  color: #6d28d9; }

.cfg-module-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.cfg-module-name {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-strong);
  font-family: var(--sp-font);
}

.cfg-module-desc {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  font-family: var(--sp-font);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Acceso ── */
.cfg-access-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem 1.75rem;
}

.cfg-access-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: var(--sp-radius-md);
  border: 1px solid var(--sp-border);
  background: var(--sp-surface-muted);
}

.cfg-access-item--info {
  background: var(--sp-primary-soft);
  border-color: rgba(0, 174, 239, 0.15);
  color: var(--sp-primary);
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.65rem;
}

.cfg-access-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cfg-access-label {
  font-size: var(--sp-text-sm);
  font-weight: 700;
  color: var(--sp-text-strong);
  font-family: var(--sp-font);
}

.cfg-access-desc {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  font-family: var(--sp-font);
}

.cfg-access-note {
  font-size: var(--sp-text-xs);
  color: var(--sp-primary);
  font-family: var(--sp-font);
  line-height: 1.5;
  margin: 0;
  opacity: 0.85;
}

/* ── Toggle ── */
.cfg-toggle-track {
  width: 2.3rem;
  height: 1.25rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-border-strong);
  position: relative;
  flex-shrink: 0;
  transition: background 200ms var(--sp-ease);
  cursor: pointer;
}

.cfg-toggle-track--on {
  background: var(--sp-primary);
}

.cfg-toggle-knob {
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

.cfg-toggle-track--on .cfg-toggle-knob {
  transform: translateX(1.05rem);
}

/* ── Card footer ── */
.cfg-card-footer {
  padding: 1rem 1.75rem 1.5rem;
  border-top: 1px solid var(--sp-border);
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cfg-footer-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ── Botón guardar ── */
.cfg-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.4rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-action);
  color: #fff;
  font-size: var(--sp-text-sm);
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(15, 45, 107, 0.16);
  transition:
    transform var(--sp-t-fast) var(--sp-ease),
    box-shadow var(--sp-t-fast) var(--sp-ease),
    opacity var(--sp-t-fast) var(--sp-ease);
  font-family: var(--sp-font);
}

.cfg-save-btn:hover:not(:disabled) {
  background: var(--sp-action-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 45, 107, 0.22);
}

.cfg-save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.cfg-save-btn--loading { pointer-events: none; }

.cfg-spin {
  animation: cfg-spin 0.8s linear infinite;
}

@keyframes cfg-spin {
  to { transform: rotate(360deg); }
}

/* ── Badge guardado ── */
.cfg-saved-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: #0a7a56;
  background: var(--sp-success-soft);
  border: 1px solid rgba(16, 185, 129, 0.18);
  border-radius: var(--sp-radius-pill);
  padding: 0.35rem 0.75rem;
  animation: cfg-fadein 200ms var(--sp-ease) both;
  font-family: var(--sp-font);
}

@keyframes cfg-fadein {
  from { opacity: 0; transform: translateX(-6px); }
  to   { opacity: 1; transform: translateX(0); }
}

/* ── Skeleton ── */
.cfg-skeleton {
  padding: 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cfg-skel-line {
  height: 0.9rem;
  border-radius: var(--sp-radius-pill);
  background: var(--sp-surface-subtle);
  animation: cfg-pulse 1.4s ease-in-out infinite;
  width: 60%;
}

.cfg-skel-line--wide  { width: 85%; }
.cfg-skel-line--short { width: 35%; }

@keyframes cfg-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .cfg-page { padding: 1rem; }
  .cfg-section-header { padding: 1.25rem 1.25rem 0; }
  .cfg-fields { grid-template-columns: 1fr; padding: 1rem 1.25rem; }
  .cfg-field--full { grid-column: 1; }
  .cfg-modules { padding: 1rem 1.25rem; }
  .cfg-access-list { padding: 1rem 1.25rem; }
  .cfg-card-footer { padding: 1rem 1.25rem 1.25rem; }
  .cfg-module-desc { display: none; }
  .cfg-tab { padding: 0.5rem 0.75rem; font-size: var(--sp-text-xs); }
}
</style>
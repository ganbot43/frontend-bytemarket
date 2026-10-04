<template>
  <div class="lr-page">
    <!-- Marca de agua legal flotante -->
    <div class="lr-watermark">LIBRO DE<br />RECLAMACIONES</div>

    <div class="lr-wrap">
      <!-- Header -->
      <header class="lr-header">
        <div class="lr-header__badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="M9 12l2 2 4-4"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Oficial · INDECOPI
        </div>
        <h1 class="lr-header__title">Libro de<br />Reclamaciones</h1>
        <p class="lr-header__legal">
          La formulación del reclamo no impide acudir a otras vías de solución
          de controversias ni es requisito previo para interponer una denuncia
          ante INDECOPI.
        </p>
      </header>

      <!-- Datos del negocio -->
      <div v-if="business" class="lr-business">
        <div class="lr-business__row">
          <div class="lr-business__item">
            <span class="lr-business__key">Razón social</span>
            <span class="lr-business__val">{{ business.name }}</span>
          </div>
          <div class="lr-business__item">
            <span class="lr-business__key">RUC</span>
            <span class="lr-business__val">{{ business.ruc || "—" }}</span>
          </div>
          <div class="lr-business__item">
            <span class="lr-business__key">Dirección</span>
            <span class="lr-business__val">{{ business.address || "—" }}</span>
          </div>
          <div class="lr-business__item">
            <span class="lr-business__key">Correo</span>
            <span class="lr-business__val">{{ business.email || "—" }}</span>
          </div>
        </div>
      </div>

      <!-- Resultado exitoso -->
      <div v-if="result" class="lr-success">
        <div class="lr-success__icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <div>
          <p class="lr-success__title">Reclamo registrado correctamente</p>
          <p class="lr-success__code">
            Código: <strong>{{ result.codigo }}</strong>
          </p>
          <p class="lr-success__sub">
            Le responderemos en un plazo máximo de
            <strong>{{ result.plazo_respuesta }}</strong
            >. Guarde su código para hacer seguimiento.
          </p>
        </div>
      </div>

      <!-- Formulario -->
      <form
        v-if="!result"
        @submit.prevent="submit"
        enctype="multipart/form-data"
        autocomplete="on"
      >
        <!-- Paso 1: Consumidor -->
        <div class="lr-section">
          <div class="lr-section__head">
            <div class="lr-section__num">1</div>
            <div>
              <h2 class="lr-section__title">Datos del consumidor</h2>
              <p class="lr-section__sub">
                Información de quien presenta el reclamo
              </p>
            </div>
          </div>

          <div class="lr-grid lr-grid--3">
            <div class="lr-field lr-field--full">
              <label for="nombre_completo" class="lr-label"
                >Nombre completo <span class="lr-req">*</span></label
              >
              <input
                id="nombre_completo"
                v-model="form.nombre_completo"
                type="text"
                autocomplete="name"
                name="name"
                maxlength="100"
                class="lr-input"
                placeholder="Ej. María García López"
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.nombre_completo.length > 70,
                  'lr-counter--error': form.nombre_completo.length > 90,
                }"
                >{{ form.nombre_completo.length }}/100</span
              >
            </div>
            <div class="lr-field">
              <label for="tipo_documento" class="lr-label"
                >Tipo de documento</label
              >
              <select
                id="tipo_documento"
                v-model="form.tipo_documento"
                autocomplete="off"
                name="tipo_documento"
                class="lr-input lr-select"
              >
                <option>DNI</option>
                <option>CE</option>
                <option>Pasaporte</option>
              </select>
            </div>
            <div class="lr-field">
              <label for="numero_documento" class="lr-label"
                >Número de documento <span class="lr-req">*</span></label
              >
              <input
                id="numero_documento"
                v-model="form.numero_documento"
                type="text"
                autocomplete="off"
                name="numero_documento"
                maxlength="20"
                class="lr-input"
                placeholder="12345678"
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.numero_documento.length > 14,
                  'lr-counter--error': form.numero_documento.length > 18,
                }"
                >{{ form.numero_documento.length }}/20</span
              >
            </div>
            <div class="lr-field">
              <label for="telefono" class="lr-label"
                >Teléfono <span class="lr-req">*</span></label
              >
              <input
                id="telefono"
                v-model="form.telefono"
                type="tel"
                autocomplete="tel"
                name="tel"
                maxlength="20"
                class="lr-input"
                placeholder="+51 996 111 303"
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.telefono.length > 14,
                  'lr-counter--error': form.telefono.length > 18,
                }"
                >{{ form.telefono.length }}/20</span
              >
            </div>
            <div class="lr-field lr-field--span2">
              <label for="email" class="lr-label"
                >Correo electrónico <span class="lr-req">*</span></label
              >
              <input
                id="email"
                v-model="form.email"
                type="email"
                autocomplete="email"
                name="email"
                maxlength="254"
                class="lr-input"
                placeholder="hola@kite.com"
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.email.length > 177,
                  'lr-counter--error': form.email.length > 228,
                }"
                >{{ form.email.length }}/254</span
              >
            </div>
            <div class="lr-field lr-field--full">
              <label for="direccion" class="lr-label">Dirección</label>
              <input
                id="direccion"
                v-model="form.direccion"
                type="text"
                autocomplete="street-address"
                name="street-address"
                maxlength="200"
                class="lr-input"
                placeholder="Av. Ejemplo 123, Lima"
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.direccion.length > 140,
                  'lr-counter--error': form.direccion.length > 180,
                }"
                >{{ form.direccion.length }}/200</span
              >
            </div>
          </div>
        </div>

        <!-- Paso 2: Bien -->
        <div class="lr-section">
          <div class="lr-section__head">
            <div class="lr-section__num">2</div>
            <div>
              <h2 class="lr-section__title">Bien contratado</h2>
              <p class="lr-section__sub">
                Producto o servicio objeto del reclamo
              </p>
            </div>
          </div>

          <div class="lr-grid lr-grid--2">
            <div class="lr-field">
              <label class="lr-label">Tipo de bien</label>
              <div class="lr-toggle-group">
                <button
                  type="button"
                  class="lr-toggle"
                  :class="{
                    'lr-toggle--active': form.tipo_bien === 'Producto',
                  }"
                  @click="form.tipo_bien = 'Producto'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
                  Producto
                </button>
                <button
                  type="button"
                  class="lr-toggle"
                  :class="{
                    'lr-toggle--active': form.tipo_bien === 'Servicio',
                  }"
                  @click="form.tipo_bien = 'Servicio'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="M12 8v4l3 3"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                  Servicio
                </button>
              </div>
            </div>
            <div class="lr-field">
              <label class="lr-label">Monto reclamado (S/)</label>
              <input
                id="monto_reclamado"
                v-model.number="form.monto_reclamado"
                type="number"
                step="0.01"
                min="0"
                max="999999.99"
                inputmode="decimal"
                autocomplete="off"
                name="monto_reclamado"
                class="lr-input"
                placeholder="0.00"
              />
            </div>
            <div class="lr-field lr-field--full">
              <label for="descripcion_bien" class="lr-label"
                >Descripción del bien <span class="lr-req">*</span></label
              >
              <textarea
                id="descripcion_bien"
                v-model="form.descripcion_bien"
                class="lr-input lr-textarea"
                rows="3"
                maxlength="500"
                autocomplete="off"
                name="descripcion_bien"
                placeholder="Describa el producto o servicio adquirido..."
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.descripcion_bien.length > 350,
                  'lr-counter--error': form.descripcion_bien.length > 450,
                }"
                >{{ form.descripcion_bien.length }}/500</span
              >
            </div>
          </div>
        </div>

        <!-- Paso 3: Reclamo -->
        <div class="lr-section">
          <div class="lr-section__head">
            <div class="lr-section__num">3</div>
            <div>
              <h2 class="lr-section__title">Detalle del reclamo</h2>
              <p class="lr-section__sub">Describa con claridad lo ocurrido</p>
            </div>
          </div>

          <div class="lr-grid lr-grid--1">
            <div class="lr-field">
              <label class="lr-label">Tipo de reclamo</label>
              <div class="lr-toggle-group">
                <button
                  type="button"
                  class="lr-toggle"
                  :class="{
                    'lr-toggle--active': form.tipo_reclamo === 'Reclamo',
                  }"
                  @click="form.tipo_reclamo = 'Reclamo'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      stroke-width="1.5"
                    />
                    <path
                      d="M12 8v4m0 4h.01"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                  Reclamo
                  <span class="lr-toggle__hint"
                    >Disconformidad con un bien/servicio</span
                  >
                </button>
                <button
                  type="button"
                  class="lr-toggle"
                  :class="{
                    'lr-toggle--active': form.tipo_reclamo === 'Queja',
                  }"
                  @click="form.tipo_reclamo = 'Queja'"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  Queja
                  <span class="lr-toggle__hint"
                    >Malestar o descontento sin disconformidad</span
                  >
                </button>
              </div>
            </div>

            <div class="lr-field">
              <label for="descripcion" class="lr-label"
                >Descripción del reclamo <span class="lr-req">*</span></label
              >
              <textarea
                id="descripcion"
                v-model="form.descripcion"
                class="lr-input lr-textarea"
                rows="4"
                maxlength="500"
                autocomplete="off"
                name="descripcion"
                placeholder="Explique detalladamente los hechos que motivan su reclamo..."
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.descripcion.length > 350,
                  'lr-counter--error': form.descripcion.length > 450,
                }"
                >{{ form.descripcion.length }}/500</span
              >
            </div>

            <div class="lr-field">
              <label for="pedido_cliente" class="lr-label"
                >¿Qué solicita? <span class="lr-req">*</span></label
              >
              <input
                id="pedido_cliente"
                v-model="form.pedido_cliente"
                type="text"
                maxlength="300"
                autocomplete="off"
                name="pedido_cliente"
                class="lr-input"
                placeholder="Ej. Devolución del producto, reembolso, cambio..."
                required
              />
              <span
                class="lr-counter"
                :class="{
                  'lr-counter--warning': form.pedido_cliente.length > 210,
                  'lr-counter--error': form.pedido_cliente.length > 270,
                }"
                >{{ form.pedido_cliente.length }}/300</span
              >
            </div>

            <div class="lr-field">
              <label class="lr-label"
                >Adjunto
                <span class="lr-label-opt"
                  >(imagen o PDF · opcional · máx. 5 MB)</span
                ></label
              >
              <label class="lr-file">
                <input
                  type="file"
                  ref="fileRef"
                  accept="image/*,application/pdf"
                  class="lr-file__input"
                  @change="onFileChange"
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span class="lr-file__text">{{
                  fileName || "Seleccionar archivo"
                }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Declaración + envío -->
        <div class="lr-footer">
          <label class="lr-check">
            <input
              type="checkbox"
              v-model="form.declara"
              required
              class="lr-check__input"
            />
            <span class="lr-check__box">
              <svg
                v-if="form.declara"
                width="11"
                height="11"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 6l2.5 2.5L10 3.5"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <span class="lr-check__text">
              Declaro que la información proporcionada es verídica y asumo
              responsabilidad por su veracidad. <span class="lr-req">*</span>
            </span>
          </label>

          <button
            type="submit"
            class="lr-submit"
            :disabled="loading || !form.declara"
          >
            <svg
              v-if="loading"
              class="lr-spin"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <circle
                cx="8"
                cy="8"
                r="6"
                stroke="rgba(255,255,255,0.3)"
                stroke-width="2"
              />
              <path
                d="M8 2a6 6 0 0 1 6 6"
                stroke="#fff"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <template v-else>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7Z"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              Enviar reclamo
            </template>
          </button>

          <p class="lr-privacy">
            Sus datos serán tratados conforme a nuestra
            <NuxtLink to="/privacidad" class="lr-link"
              >política de privacidad</NuxtLink
            >.
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: "landing" });
import { ref, reactive, nextTick } from "vue";
import { useBusinessConfig } from "~/composables/useBusinessConfig";
import { useAppToast } from "~/composables/useToast";

useSeoMeta({
  title: 'Libro de Reclamaciones | ByteMarket',
  description: 'Presenta tu reclamo o queja en el Libro de Reclamaciones de ByteMarket de forma segura y rapida.',
  ogTitle: 'Libro de Reclamaciones | ByteMarket',
  ogDescription: 'Canal oficial para registrar reclamos y quejas de clientes de ByteMarket.',
  ogType: 'website',
  ogUrl: 'https://bytemarket.pe/libro-de-reclamaciones',
  ogImage: 'https://bytemarket.pe/images/logo.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Libro de Reclamaciones | ByteMarket',
  twitterDescription: 'Registra tu reclamo en el Libro de Reclamaciones de ByteMarket.',
  twitterImage: 'https://bytemarket.pe/images/logo.png',
})

const businessState = useBusinessConfig();
const business = businessState.value;
const { add: addToast } = useAppToast();
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const form = reactive({
  nombre_completo: "",
  tipo_documento: "DNI",
  numero_documento: "",
  direccion: "",
  telefono: "",
  email: "",
  tipo_bien: "Producto",
  descripcion_bien: "",
  monto_reclamado: null,
  tipo_reclamo: "Reclamo",
  descripcion: "",
  pedido_cliente: "",
  declara: false,
});

const fileRef = ref(null);
const fileName = ref("");
const loading = ref(false);
const result = ref(null);

function onFileChange() {
  const file = fileRef.value?.files?.[0];

  if (!file) {
    fileName.value = "";
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    addToast({
      title: "Archivo demasiado grande",
      description: "El adjunto debe pesar como máximo 5 MB.",
      color: "error",
    });
    if (fileRef.value) fileRef.value.value = "";
    fileName.value = "";
    return;
  }

  fileName.value = file.name;
}

const resetDefaults = {
  tipo_documento: "DNI",
  tipo_bien: "Producto",
  tipo_reclamo: "Reclamo",
  monto_reclamado: null,
  declara: false,
};

async function submit() {
  loading.value = true;
  try {
    const fd = new FormData();
    for (const k of Object.keys(form)) {
      if (k === "declara") {
        fd.append(k, form[k] ? "true" : "false");
      } else if (form[k] !== null && form[k] !== undefined) {
        fd.append(k, String(form[k]));
      }
    }
    const f = fileRef.value?.files?.[0];
    if (f) {
      if (f.size > MAX_FILE_SIZE) {
        addToast({
          title: "Archivo demasiado grande",
          description: "El adjunto debe pesar como máximo 5 MB.",
          color: "error",
        });
        return;
      }
      fd.append("adjunto", f);
    }

    const res = await $fetch("/api/reclamaciones", {
      method: "POST",
      body: fd,
    });
    result.value = res;
    await nextTick();
    window.scrollTo({ top: 0, behavior: "smooth" });
    addToast({
      title: res.codigo,
      description: `¡Reclamo enviado! Tu código es: ${res.codigo}`,
      color: "success",
    });

    Object.keys(form).forEach((k) => {
      form[k] = k in resetDefaults ? resetDefaults[k] : "";
    });
    if (fileRef.value) fileRef.value.value = "";
    fileName.value = "";
  } catch (err) {
    console.error(err);
    const message =
      err?.data?.message || err?.message || "Error enviando reclamo";
    addToast({ title: "Error", description: message, color: "error" });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════
  TOKENS KITE -> BYTEMARKET
═══════════════════════════════════ */
.lr-page {
  --kite-green: var(--cp-electric);
  --kite-green-dark: var(--cp-navy);
  --kite-green-glow: rgba(0, 174, 239, 0.25);
  --kite-green-soft: rgba(0, 174, 239, 0.08);
  --kite-green-line: rgba(0, 174, 239, 0.2);
  --kite-yellow: #eab308;
  --kite-yellow-dim: rgba(234, 179, 8, 0.8);
  --cp-surface: var(--bg-surface);
  --cp-surface2: var(--bg-surface);
  --cp-surface3: var(--bg-surface);
  --cp-border-line: var(--border-light);
  --cp-border-strong: var(--border-mid);
  --cp-text: var(--text-primary);
  --cp-text-dim: var(--text-body);
  --cp-text-muted: var(--text-muted);
}

/* ── Base ── */
.lr-page {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(248, 247, 244, 0.96), rgba(241, 239, 234, 1));
  padding: 48px 16px 80px;
  position: relative;
  overflow: hidden;
}

/* Marca de agua decorativa */
.lr-watermark {
  position: fixed;
  top: 50%;
  right: -60px;
  transform: translateY(-50%) rotate(90deg);
  font-size: 72px;
  font-weight: 900;
  letter-spacing: -0.04em;
  color: rgba(45, 106, 79, 0.04);
  pointer-events: none;
  white-space: nowrap;
  line-height: 1;
  user-select: none;
}

.lr-wrap {
  max-width: 780px;
  margin: 0 auto;
  position: relative;
}

/* ── Header ── */
.lr-header {
  margin-bottom: 36px;
}

.lr-header__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #2D6A4F;
  background: rgba(45, 106, 79, 0.06);
  border: 1px solid var(--kite-green-line);
  border-radius: 4px;
  padding: 5px 10px;
  margin-bottom: 20px;
}

.lr-header__title {
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 700;
  line-height: 1.1;
  color: var(--ink-strong);
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}

.lr-header__legal {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.6;
  max-width: 560px;
  font-style: italic;
  padding-left: 12px;
  border-left: 2px solid var(--kite-green-line);
}

/* ── Datos del negocio ── */
.lr-business {
  background: var(--surface-sunken);
  border: 1px solid var(--line-soft);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 32px;
}

.lr-business__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
}

.lr-business__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.lr-business__key {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ink-muted);
  font-weight: 700;
}

.lr-business__val {
  font-size: 13px;
  color: var(--ink-muted);
  font-weight: 500;
}

/* ── Éxito ── */
.lr-success {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: rgba(45, 106, 79, 0.05);
  border: 1px solid var(--kite-green-line);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 32px;
}

.lr-success__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    var(--kite-green),
    var(--kite-green-dark)
  );
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 24px var(--kite-green-glow);
}

.lr-success__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-strong);
  margin: 0 0 4px;
}

.lr-success__code {
  font-size: 13px;
  color: var(--kite-green);
  font-weight: 700;
  margin: 0 0 6px;
}

.lr-success__sub {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
  line-height: 1.5;
}

/* ── Secciones del formulario ── */
.lr-section {
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 14px;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 2px 12px rgba(17, 17, 17, 0.03), inset 0 1px 0 rgba(255,255,255,0.4);
}

.lr-section:focus-within {
  border-color: var(--kite-green-line);
  box-shadow:
    0 0 0 1px var(--kite-green-line),
    0 0 24px rgba(45, 106, 79, 0.05);
}

.lr-section__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line-soft);
}

.lr-section__num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--kite-green);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 16px var(--kite-green-glow);
}

.lr-section__title {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink-strong);
  margin: 0 0 3px;
  letter-spacing: -0.01em;
}

.lr-section__sub {
  font-size: 12px;
  color: var(--ink-muted);
  margin: 0;
  font-style: italic;
}

/* ── Grid ── */
.lr-grid {
  display: grid;
  gap: 14px;
}
.lr-grid--1 {
  grid-template-columns: 1fr;
}
.lr-grid--2 {
  grid-template-columns: 1fr 1fr;
}
.lr-grid--3 {
  grid-template-columns: 1fr 1fr 1fr;
}

@media (max-width: 600px) {
  .lr-grid--2,
  .lr-grid--3 {
    grid-template-columns: 1fr;
  }
  .lr-section {
    padding: 18px 16px;
  }
  .lr-footer {
    padding: 18px 16px;
  }
}

.lr-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.lr-field--full {
  grid-column: 1 / -1;
}
.lr-field--span2 {
  grid-column: span 2;
}

@media (max-width: 600px) {
  .lr-field--span2 {
    grid-column: 1 / -1;
  }
}

/* ── Labels ── */
.lr-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
}

.lr-label-opt {
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
  font-style: italic;
  font-size: 11px;
  color: var(--ink-muted);
}

.lr-req {
  color: var(--kite-green);
}

/* ── Inputs ── */
.lr-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 7px;
  font-size: 14px;
  color: var(--ink-strong);
  background: var(--bg-surface);
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
  outline: none;
  box-sizing: border-box;
}

.lr-input:focus {
  border-color: var(--kite-green);
  background: var(--bg-surface);
  box-shadow:
    0 0 0 3px var(--kite-green-soft),
    0 0 16px var(--kite-green-glow);
}

.lr-input::placeholder {
  color: var(--ink-muted);
}

.lr-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 9l6 6 6-6' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.lr-select option {
  background: var(--bg-surface);
  color: var(--ink-strong);
}

.lr-textarea {
  resize: vertical;
  min-height: 80px;
  line-height: 1.5;
}

/* ── Contadores de caracteres ── */
.lr-counter {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-muted);
  margin-top: 4px;
  text-align: right;
  transition: color 0.2s ease;
}

.lr-counter--warning {
  color: #e6a800;
}

.lr-counter--error {
  color: var(--kite-green);
}

/* ── Toggle buttons ── */
.lr-toggle-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lr-toggle {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 9px 14px;
  border-radius: 7px;
  border: 1px solid var(--line);
  background: var(--bg-surface);
  font-size: 13px;
  color: var(--ink-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.lr-toggle:hover {
  border-color: var(--kite-green-line);
  color: var(--kite-green);
  background: var(--kite-green-soft);
  box-shadow: 0 0 10px var(--kite-green-glow);
}

.lr-toggle--active {
  border-color: var(--kite-green);
  background: var(--kite-green);
  color: #ffffff;
  box-shadow: 0 0 18px var(--kite-green-glow);
}

.lr-toggle__hint {
  font-size: 10px;
  color: var(--ink-muted);
  font-style: italic;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

.lr-toggle--active .lr-toggle__hint {
  color: rgba(255, 255, 255, 0.7);
}

/* ── File input ── */
.lr-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: 1px dashed var(--line);
  border-radius: 7px;
  background: var(--surface-sunken);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.15s;
  color: var(--ink-muted);
}

.lr-file:hover {
  border-color: var(--kite-green);
  background: rgba(45, 106, 79, 0.04);
  color: var(--kite-green);
  box-shadow: 0 0 12px rgba(45, 106, 79, 0.1);
}

.lr-file__input {
  display: none;
}

.lr-file__text {
  font-size: 13px;
  font-style: italic;
}

/* ── Footer del form ── */
.lr-footer {
  background: #ffffff;
  border: 1px solid var(--line-soft);
  border-radius: 12px;
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 14px;
}

/* ── Checkbox ── */
.lr-check {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}

.lr-check__input {
  display: none;
}

.lr-check__box {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid var(--line);
  background: #ffffff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  margin-top: 1px;
  color: #ffffff;
}

.lr-check:has(.lr-check__input:checked) .lr-check__box {
  background: var(--kite-green);
  border-color: var(--kite-green);
  box-shadow: 0 0 12px var(--kite-green-glow);
}

.lr-check__text {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.5;
}

/* ── Botón enviar ── */
.lr-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 32px;
  background: var(--kite-green);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
  align-self: flex-start;
  transition:
    transform 0.15s,
    box-shadow 0.15s,
    background 0.15s;
  box-shadow:
    0 0 20px var(--kite-green-glow),
    0 4px 16px rgba(45, 106, 79, 0.25);
}

.lr-submit:hover:not(:disabled) {
  background: var(--kite-green-dark);
  transform: translateY(-2px);
  box-shadow:
    0 0 32px var(--kite-green-glow),
    0 8px 24px rgba(45, 106, 79, 0.3);
}

.lr-submit:active:not(:disabled) {
  transform: translateY(0);
  box-shadow: 0 0 12px var(--kite-green-glow);
}

.lr-submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.lr-privacy {
  font-size: 11px;
  color: var(--ink-muted);
  font-style: italic;
  margin: 0;
}

.lr-link {
  color: var(--ink-muted);
  text-decoration: underline;
  transition: color 0.15s;
}

.lr-link:hover {
  color: var(--kite-green);
}

/* ── Spinner ── */
@keyframes lr-spin {
  to {
    transform: rotate(360deg);
  }
}
.lr-spin {
  animation: lr-spin 0.75s linear infinite;
  flex-shrink: 0;
}
</style>

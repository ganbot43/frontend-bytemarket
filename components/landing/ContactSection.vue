<script setup lang="ts">

import { MessageCircle, Instagram, Facebook, Mail } from "lucide-vue-next";

const { waLink } = useWhatsapp();
const businessState = useBusinessConfig();

const channels = computed(() => {
  const config = businessState.value;
  return [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      handle: config?.whatsapp ? `${config.whatsapp} · Respuesta inmediata` : "+51 XXX XXX XXX · Respuesta inmediata",
      href: config?.whatsapp ? `https://wa.me/${config.whatsapp.replace(/\D/g, '')}` : "https://wa.me/51923821520",
      type: "wa",
    },
    {
      icon: Instagram,
      label: "Instagram",
      handle: config?.socialLinks?.instagram ? `@${config.socialLinks.instagram}` : "@bytemarket",
      href: config?.socialLinks?.instagram ? `https://instagram.com/${config.socialLinks.instagram}` : "https://instagram.com/bytemarket",
      type: "ig",
    },
    {
      icon: Facebook,
      label: "Facebook",
      handle: config?.socialLinks?.facebook ? config.socialLinks.facebook : "ByteMarket SAC",
      href: config?.socialLinks?.facebook ? `https://facebook.com/${config.socialLinks.facebook}` : "https://facebook.com/bytemarket",
      type: "fb",
    },
    {
      icon: Mail,
      label: "Correo electrónico",
      handle: config?.email || "hola@bytemarket.com",
      href: `mailto:${config?.email || "hola@bytemarket.com"}`,
      type: "mail",
    },
  ];
});

const topics = [
  { value: "", label: "Selecciona una opción" },
  { value: "consulta", label: "Consulta de producto" },
  { value: "pedido", label: "Hacer un pedido" },
  { value: "precio", label: "Consultar precio" },
  { value: "otro", label: "Otro" },
];

const form = reactive({
  nombre: "",
  telefono: "",
  email: "",
  asunto: "",
  mensaje: "",
});

function handleSubmit() {
  const msg = `Hola ByteMarket, mi nombre es ${form.nombre}. Tengo una consulta sobre "${form.asunto}". Mi correo es ${form.email} y mi teléfono es ${form.telefono}. ${form.mensaje}`;
  window.open(waLink(msg), "_blank", "noopener");
}
</script>

<template>
  <section class="contact" id="contacto">
    <div class="contact-container">

      <div class="section-intro">
        <span class="section-label">Contacto</span>
        <h2 class="section-title">
          Estamos para ayudarte<span class="accent-dot" />
        </h2>
        <p class="section-subtitle">
          ¿Tienes alguna consulta? Escríbenos por el canal que prefieras.
        </p>
      </div>

      <div class="contact-grid">

        <!-- Channels -->
        <div class="contact-info">
          <p class="contact-intro">
            La forma más rápida de contactarnos es por
            <strong>WhatsApp</strong>. También puedes encontrarnos en redes
            sociales o enviarnos un mensaje.
          </p>

          <a
            v-for="ch in channels"
            :key="ch.label"
            :href="ch.href"
            class="contact-channel"
            target="_blank"
            rel="noopener"
          >
            <!-- ICONO LUCIDE -->
            <div class="contact-channel-icon" :class="ch.type">
              <component :is="ch.icon" class="w-5 h-5" />
            </div>

            <!-- TEXTO -->
            <div class="contact-channel-text">
              <strong>{{ ch.label }}</strong>
              <span>{{ ch.handle }}</span>
            </div>

            <span class="contact-channel-arrow">→</span>
          </a>
        </div>

        <!-- Form -->
        <div class="contact-form">
          <h3>Envíanos un mensaje</h3>

          <div class="form-row">
            <div class="form-group">
              <label>Nombre</label>
              <input v-model="form.nombre" type="text" placeholder="Tu nombre" />
            </div>

            <div class="form-group">
              <label>Teléfono</label>
              <input v-model="form.telefono" type="text" placeholder="+51 XXX XXX XXX" />
            </div>
          </div>

          <div class="form-group">
            <label>Correo electrónico</label>
            <input v-model="form.email" type="email" :placeholder="businessState?.email || 'hola@bytemarket.com'" />
          </div>

          <div class="form-group">
            <label>¿Qué necesitas?</label>
            <select v-model="form.asunto">
              <option
                v-for="t in topics"
                :key="t.value"
                :value="t.value"
              >
                {{ t.label }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Mensaje</label>
            <textarea
              v-model="form.mensaje"
              placeholder="Cuéntanos cómo podemos ayudarte..."
            />
          </div>

          <LandingAppButton
            variant="wa"
            class="submit-btn"
            @click="handleSubmit"
          >
            <LandingWaIcon />
            Enviar mensaje
          </LandingAppButton>

          <p class="form-note">
            También puedes contactarnos directamente por WhatsApp para una
            respuesta más rápida.
          </p>
        </div>

      </div>
    </div>
  </section>
</template>

<style scoped>
/* ═══════════════════════════════════
   CONTACT SECTION — BYTEMARKET
   100% tokens de main.css — sin hardcode
═══════════════════════════════════ */

.contact {
  position: relative;
  overflow: hidden;
  /* Mismo ritmo que el resto: llevaba el doble de aire. */
  padding-block: var(--section-y-sm);
  background: var(--bg-page);
}

/* Línea técnica superior */
.contact::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  display: none; /* background: var(--line-brand); */
  z-index: 1;
}

/* Decoración de fondo */
.contact::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, var(--cp-ice) 0%, transparent 40%),
    radial-gradient(circle at bottom left, var(--cp-frost) 0%, transparent 40%);
  opacity: 0.8;
  pointer-events: none;
  z-index: 0;
}

/* CONTENEDOR */
.contact-container {
  position: relative;
  z-index: 2;
  max-width: var(--container-width);
  margin: 0 auto;
  padding: 0 var(--space-8);
}

/* ── HEADER ── */
.section-intro {
  text-align: center;
  margin-bottom: var(--space-12);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.section-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--cp-electric);
  margin-bottom: var(--space-3);
}

.section-label::before,
.section-label::after {
  content: "";
  width: 20px;
  height: 1px;
  background: var(--cp-electric);
  opacity: 0.5;
}

.section-title {
  margin: 0;
  color: var(--text-primary);
  font-family: var(--font-display);
  font-size: clamp(2.2rem, 4.5vw, 3.6rem);
  font-weight: 800;
  line-height: 1.02;
  letter-spacing: -0.045em;
}

.accent-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  margin-left: var(--space-2);
  border-radius: 50%;
  background: var(--cp-electric);
  position: relative;
  top: -6px;
  box-shadow: var(--glow-soft);
}

.section-subtitle {
  margin: var(--space-3) 0 0;
  max-width: 600px;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.8;
}

/* ── GRID ── */
.contact-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: var(--space-12);
}

/* ── CHANNELS ── */
.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.contact-intro {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: var(--space-2);
}

.contact-channel {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-5);
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  text-decoration: none;
  transition:
    transform var(--t-base) var(--ease-snappy),
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
  box-shadow: var(--card-shadow);
}

.contact-channel:hover {
  transform: translateX(6px);
  border-color: var(--border-mid);
  box-shadow: var(--card-shadow-hover);
}

.contact-channel-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--r-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: var(--bg-alt);
}

.contact-channel-text strong {
  display: block;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.contact-channel-text span {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.contact-channel-arrow {
  margin-left: auto;
  color: var(--cp-electric);
  font-weight: 700;
  opacity: 0.5;
  transition: opacity var(--t-fast) var(--ease-smooth);
}

.contact-channel:hover .contact-channel-arrow {
  opacity: 1;
}

/* ── FORM ── */
.contact-form {
  background: var(--bg-surface);
  border: 1px solid var(--border-light);
  border-radius: var(--r-xl);
  padding: clamp(30px, 5vw, 42px);
  box-shadow: var(--card-shadow);
}

.contact-form h3 {
  margin-bottom: var(--space-6);
  font-family: var(--font-display);
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: var(--r-md);
  border: 1.5px solid var(--border-light);
  background: var(--bg-alt);
  font-size: 0.9rem;
  color: var(--text-primary);
  font-family: var(--font-body);
  transition:
    border-color var(--t-fast) var(--ease-smooth),
    box-shadow var(--t-fast) var(--ease-smooth),
    background var(--t-fast) var(--ease-smooth);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: var(--text-faint);
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  background: var(--bg-surface);
  border-color: var(--cp-electric);
  box-shadow: 0 0 0 3px rgba(0, 174, 239, 0.15);
  outline: none;
}

textarea {
  min-height: 120px;
  resize: vertical;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.submit-btn {
  width: 100%;
  justify-content: center;
  margin-top: var(--space-3);
  height: 48px;
}

.form-note {
  margin-top: var(--space-4);
  font-size: 0.8rem;
  text-align: center;
  color: var(--text-muted);
  line-height: 1.6;
}

/* ═══════════════════════════════════
   RESPONSIVE
═══════════════════════════════════ */
@media (max-width: 960px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: var(--space-10);
  }

  .contact-form {
    order: -1;
    /* Poner el formulario arriba en mobile */
  }
}

@media (max-width: 640px) {
  .contact {
    padding: var(--space-16) 0;
  }

  .contact-container {
    padding: 0 var(--space-5);
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>

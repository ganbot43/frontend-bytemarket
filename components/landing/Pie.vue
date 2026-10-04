<template>
  <footer class="ft cp-dark">
    <!-- ═══ Franja de ayuda ═══
         Antes del mapa de enlaces: quien baja hasta aquí suele venir
         con una duda, no buscando el organigrama del sitio. -->
    <div class="ft__help">
      <div class="cp-container ft__help-inner">
        <div class="ft__help-text">
          <p class="ft__help-title">¿Dudas con un repuesto?</p>
          <p class="ft__help-note">
            Escríbenos el modelo de tu equipo y te confirmamos qué pieza necesita.
          </p>
        </div>

        <div class="ft__help-actions">
          <a
            :href="waLink('Hola ByteMarket, quisiera hacer una consulta sobre un repuesto')"
            target="_blank"
            rel="noopener noreferrer"
            class="ft__help-btn ft__help-btn--solid"
          >
            <LandingWaIcon :size="15" />
            WhatsApp
          </a>
          <a :href="`mailto:${email}`" class="ft__help-btn ft__help-btn--quiet">
            {{ email }}
          </a>
        </div>
      </div>
    </div>

    <!-- ═══ Cuerpo ═══ -->
    <div class="cp-container ft__main">
      <!-- Marca -->
      <div class="ft__brand">
        <NuxtLink to="/" class="ft__logo" :aria-label="`${nombre} — Inicio`">
          <img :src="logo" :alt="nombre" class="ft__logo-img" />
        </NuxtLink>

        <p class="ft__desc">
          Vendemos repuestos y accesorios para celulares en el Perú: pantallas,
          baterías, flex, conectores y accesorios de las marcas que la gente
          realmente usa. Catálogo corto y bien descrito antes que uno enorme
          donde nadie sabe qué está comprando.
        </p>

        <ul class="ft__socials">
          <li v-for="social in socials" :key="social.label">
            <a
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              class="ft__social"
              :aria-label="social.label"
            >
              <component :is="social.icon" class="ft__social-icon" />
            </a>
          </li>
        </ul>
      </div>

      <!-- Columnas de enlaces -->
      <nav v-for="col in columns" :key="col.title" class="ft__col" :aria-label="col.title">
        <p class="ft__col-title">{{ col.title }}</p>
        <ul class="ft__links">
          <li v-for="link in col.links" :key="link.label">
            <NuxtLink :to="link.to" class="ft__link">{{ link.label }}</NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Contacto -->
      <div class="ft__col">
        <p class="ft__col-title">Contacto</p>
        <ul class="ft__contact">
          <li>
            <span class="ft__contact-label">WhatsApp</span>
            <a :href="waLink()" target="_blank" rel="noopener noreferrer" class="ft__contact-value">
              {{ phoneDisplay }}
            </a>
          </li>
          <li>
            <span class="ft__contact-label">Correo</span>
            <a :href="`mailto:${email}`" class="ft__contact-value">{{ email }}</a>
          </li>
          <li>
            <span class="ft__contact-label">Dónde estamos</span>
            <span class="ft__contact-value ft__contact-value--plain">
              {{ businessState?.address || "Lima, Perú" }}
            </span>
          </li>
          <li>
            <span class="ft__contact-label">Atención</span>
            <span class="ft__contact-value ft__contact-value--plain">
              Lun a Sáb · 9:00 a 19:00
            </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- ═══ Pie legal ═══ -->
    <div class="ft__bottom">
      <div class="cp-container ft__bottom-inner">
        <p class="ft__copy">
          © {{ currentYear }} {{ businessState?.name || "ByteMarket" }}. Todos los derechos reservados.
          <span v-if="businessState?.ruc" class="ft__ruc">RUC {{ businessState.ruc }}</span>
        </p>

        <ul class="ft__legal">
          <li><NuxtLink to="/terminos">Términos</NuxtLink></li>
          <li><NuxtLink to="/privacidad">Privacidad</NuxtLink></li>
          <li><NuxtLink to="/libro-de-reclamaciones">Libro de reclamaciones</NuxtLink></li>
        </ul>

        <a
          href="https://smartcsperu.com"
          target="_blank"
          rel="noopener noreferrer"
          class="ft__credit"
        >
          Desarrollada por <strong>Smart CS</strong>
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Instagram, Facebook, X } from "lucide-vue-next";

const businessState = useBusinessConfig();
const { logo, nombre } = useLogo();
const { waLink, WA_NUMBER } = useWhatsapp();
const currentYear = new Date().getFullYear();

const email = computed(() => businessState.value?.email || "ventas@bytemarket.pe");

const phoneDisplay = computed(() => {
  const raw = String(businessState.value?.whatsapp || WA_NUMBER).replace(/\D/g, "");
  const local = raw.startsWith("51") ? raw.slice(2) : raw;
  return local.length === 9
    ? `+51 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
    : `+${raw}`;
});

/* Las redes viven en business_config como JSON. Si la tienda no ha
   configurado ninguna se cae a los perfiles por defecto en lugar de
   dejar la fila vacía. */
const socials = computed(() => {
  let stored: Record<string, string> = {};
  try {
    stored = JSON.parse(String(businessState.value?.socialLinks ?? "{}")) ?? {};
  } catch {
    stored = {};
  }

  return [
    { label: "Instagram", icon: Instagram, href: stored.instagram || "https://instagram.com" },
    { label: "Facebook", icon: Facebook, href: stored.facebook || "https://facebook.com" },
    { label: "X", icon: X, href: stored.x || stored.twitter || "https://x.com" },
  ];
});

const columns = [
  {
    title: "Comprar",
    links: [
      { label: "Todo el catálogo", to: "/productos" },
      { label: "Novedades", to: "/productos?nuevoLanzamiento=1" },
      { label: "Favoritos", to: "/favoritos" },
      { label: "Mi carrito", to: "/checkout" },
    ],
  },
  {
    title: "Mi cuenta",
    links: [
      { label: "Ingresar", to: "/login" },
      { label: "Crear cuenta", to: "/registro" },
      { label: "Mis pedidos", to: "/mi-cuenta/pedidos" },
      { label: "Seguir un pedido", to: "/mi-cuenta/pedidos" },
    ],
  },
  {
    title: "La tienda",
    links: [
      { label: "Sobre nosotros", to: "/sobre-nosotros" },
      { label: "Contacto", to: "/#contacto" },
      { label: "Términos y condiciones", to: "/terminos" },
      { label: "Política de privacidad", to: "/privacidad" },
    ],
  },
];
</script>

<style scoped>
/* ═══════════════════════════════════════════════════════
   PIE — BYTEMARKET
   Completo pero sin abarrotar: marca, tres columnas de
   enlaces, contacto y una línea legal. Superficie oscura
   de marca (.cp-dark invierte los tokens).
═══════════════════════════════════════════════════════ */

.ft {
  background: var(--cp-navy-900);
  color: var(--ink-body);
  margin-top: var(--section-y);
}

/* ── Franja de ayuda ── */
.ft__help {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.ft__help-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-6);
  padding-block: var(--sp-6);
}

.ft__help-title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-tight);
  color: #fff;
}

.ft__help-note {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  margin-top: 2px;
}

.ft__help-actions {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
}

.ft__help-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 var(--sp-5);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  font-size: var(--fs-xs);
  font-weight: var(--fw-bold);
  white-space: nowrap;
  transition:
    background var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth);
}

.ft__help-btn--solid {
  background: var(--cp-cyan-400);
  color: var(--cp-navy-900);
}

.ft__help-btn--solid:hover {
  background: var(--cp-cyan-300);
  color: var(--cp-navy-900);
}

.ft__help-btn--quiet {
  border-color: rgba(255, 255, 255, 0.2);
  color: var(--ink-body);
}

.ft__help-btn--quiet:hover {
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
}

/* ── Cuerpo ── */
.ft__main {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr)) minmax(0, 1.15fr);
  gap: var(--sp-8) var(--sp-6);
  padding-block: var(--sp-12);
}

.ft__brand {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
  padding-right: var(--sp-6);
}

.ft__logo {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-3);
}

/* Sobre fondo oscuro un logotipo pensado para claro pierde contraste:
   se le da un respaldo blanco propio, como haría una etiqueta impresa. */
.ft__logo-img {
  height: 44px;
  width: auto;
  max-width: 190px;
  object-fit: contain;
  object-position: left center;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  background: #fff;
}

.ft__desc {
  font-size: var(--fs-xs);
  line-height: var(--leading-relaxed);
  color: var(--ink-muted);
  max-width: 46ch;
}

.ft__socials {
  display: flex;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ft__social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  transition:
    color var(--t-base) var(--ease-smooth),
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth);
}

.ft__social:hover {
  color: var(--cp-navy-900);
  background: var(--cp-cyan-400);
  border-color: var(--cp-cyan-400);
}

.ft__social-icon {
  width: 16px;
  height: 16px;
}

/* ── Columnas ── */
.ft__col-title {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-black);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: #fff;
  margin-bottom: var(--sp-4);
}

.ft__links {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ft__link {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  transition: color var(--t-fast) var(--ease-smooth);
}

.ft__link:hover {
  color: var(--accent);
}

/* ── Contacto ── */
.ft__contact {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ft__contact li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ft__contact-label {
  font-size: 0.625rem;
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}

.ft__contact-value {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: #fff;
  transition: color var(--t-fast) var(--ease-smooth);
}

a.ft__contact-value:hover {
  color: var(--accent);
}

.ft__contact-value--plain {
  font-weight: var(--fw-medium);
  color: var(--ink-body);
}

/* ── Pie legal ── */
.ft__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.ft__bottom-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-4);
  padding-block: var(--sp-5);
  flex-wrap: wrap;
}

.ft__copy {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

.ft__ruc {
  margin-left: var(--sp-2);
  padding-left: var(--sp-2);
  border-left: 1px solid rgba(255, 255, 255, 0.14);
}

.ft__legal {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  margin: 0;
  padding: 0;
  list-style: none;
}

.ft__legal a {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
}

.ft__legal a:hover {
  color: var(--accent);
}

.ft__credit {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

.ft__credit strong {
  color: var(--ink-muted);
  font-weight: var(--fw-bold);
}

.ft__credit:hover strong {
  color: var(--accent);
}

/* ═══ Responsive ═══ */
@media (max-width: 1100px) {
  .ft__main {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ft__brand {
    grid-column: 1 / -1;
    padding-right: 0;
  }
}

@media (max-width: 760px) {
  .ft__help-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .ft__help-actions {
    width: 100%;
  }

  .ft__help-btn {
    flex: 1;
    justify-content: center;
  }

  .ft__main {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-block: var(--sp-8);
  }

  .ft__bottom-inner {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-3);
  }
}

@media (max-width: 460px) {
  .ft__main {
    grid-template-columns: minmax(0, 1fr);
  }

  .ft__legal {
    flex-wrap: wrap;
    gap: var(--sp-3);
  }
}
</style>

<template>
  <div class="pt">
    <div class="cp-container">
      <nav class="pt__crumb" aria-label="Ubicación">
        <NuxtLink to="/">Inicio</NuxtLink>
        <span aria-hidden="true">/</span>
        <span class="pt__crumb-now">Mi cuenta</span>
      </nav>

      <div class="pt__grid">
        <!-- ═══ Barra de cuenta ═══ -->
        <aside class="pt__aside">
          <div class="pt__user">
            <span class="pt__avatar" aria-hidden="true">{{ iniciales }}</span>
            <span class="pt__user-text">
              <strong>{{ user?.name || "Mi cuenta" }}</strong>
              <small>{{ user?.email }}</small>
            </span>
          </div>

          <nav class="pt__nav" aria-label="Secciones de mi cuenta">
            <NuxtLink
              to="/mi-cuenta"
              class="pt__link"
              exact-active-class="is-active"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V20h13V9.5" />
              </svg>
              Resumen
            </NuxtLink>

            <NuxtLink
              to="/mi-cuenta/pedidos"
              class="pt__link"
              active-class="is-active"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M4.5 7.5h15l-1 12.5h-13z" />
                <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" />
              </svg>
              Mis pedidos
            </NuxtLink>

            <NuxtLink to="/favoritos" class="pt__link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.7 1.1-1a5.5 5.5 0 0 0 0-7.9z" />
              </svg>
              Favoritos
            </NuxtLink>
          </nav>

          <button type="button" class="pt__logout" @click="logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M15 4.5H7.5A1.5 1.5 0 0 0 6 6v12a1.5 1.5 0 0 0 1.5 1.5H15" />
              <path d="M17 15.5 20.5 12 17 8.5M20.5 12H10" />
            </svg>
            Cerrar sesión
          </button>
        </aside>

        <!-- ═══ Contenido ═══ -->
        <main class="pt__main">
          <NuxtPage />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "default", middleware: "auth-customer" });

const { user, clear } = useUserSession();

const iniciales = computed(() => {
  const nombre = String(user.value?.name ?? "").trim();
  if (!nombre) return "C";
  /* Dos iniciales cuando hay nombre y apellido: una sola letra en un
     círculo de 48px se ve desangelada. */
  const partes = nombre.split(/\s+/).filter(Boolean);
  return partes
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
});

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>

<style scoped>
.pt {
  padding-block: var(--sp-6) var(--section-y);
}

.pt__crumb {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  font-size: var(--fs-2xs);
  font-weight: var(--fw-medium);
  color: var(--ink-faint);
  margin-bottom: var(--sp-5);
}

.pt__crumb a:hover {
  color: var(--accent-strong);
}

.pt__crumb-now {
  color: var(--ink-body);
  font-weight: var(--fw-semibold);
}

.pt__grid {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: var(--sp-6);
  align-items: start;
}

/* ── Barra lateral ── */
.pt__aside {
  position: sticky;
  top: calc(var(--header-total) + var(--sp-4));
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
  overflow: hidden;
}

.pt__user {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
  background: var(--surface-sunken);
}

.pt__avatar {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--cp-navy-900);
  color: #fff;
  font-size: var(--fs-sm);
  font-weight: var(--fw-black);
  letter-spacing: 0.02em;
}

.pt__user-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.pt__user-text strong {
  font-size: var(--fs-sm);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pt__user-text small {
  font-size: var(--fs-2xs);
  color: var(--ink-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pt__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--sp-3);
}

.pt__link {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  min-height: 42px;
  padding: 0 var(--sp-3);
  border-radius: var(--radius-sm);
  color: var(--ink-body);
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.pt__link svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--ink-faint);
  transition: color var(--t-fast) var(--ease-smooth);
}

.pt__link:hover {
  background: var(--surface-sunken);
  color: var(--ink-strong);
}

.pt__link.is-active {
  background: var(--accent-quiet);
  color: var(--accent-strong);
  font-weight: var(--fw-bold);
}

.pt__link.is-active svg,
.pt__link:hover svg {
  color: currentColor;
}

.pt__logout {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  min-height: 46px;
  padding: 0 var(--sp-4);
  border: 0;
  border-top: 1px solid var(--line-soft);
  background: transparent;
  color: var(--ink-muted);
  font-family: inherit;
  font-size: var(--fs-sm);
  font-weight: var(--fw-medium);
  text-align: left;
  transition:
    background var(--t-fast) var(--ease-smooth),
    color var(--t-fast) var(--ease-smooth);
}

.pt__logout svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.pt__logout:hover {
  background: var(--cp-error-bg);
  color: var(--cp-danger);
}

/* ── Contenido ── */
.pt__main {
  min-width: 0;
}

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
  .pt__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--sp-4);
  }

  .pt__aside {
    position: static;
  }

  /* La navegación pasa a fila deslizable: apilada verticalmente en
     móvil empuja el contenido fuera de la primera pantalla. */
  .pt__nav {
    flex-direction: row;
    overflow-x: auto;
    scrollbar-width: none;
    border-bottom: 1px solid var(--line-soft);
  }

  .pt__nav::-webkit-scrollbar {
    display: none;
  }

  .pt__link {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .pt__logout {
    border-top: 0;
  }
}

@media (max-width: 480px) {
  .pt__user {
    padding: var(--sp-3);
  }

  .pt__avatar {
    width: 36px;
    height: 36px;
    font-size: var(--fs-xs);
  }
}
</style>

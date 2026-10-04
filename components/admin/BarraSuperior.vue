<template>
  <header class="sp-topbar">
    <!-- Dentro de tu sp-topbar, al inicio del lado izquierdo, agrega: -->
    <button
      class="sp-sidebar-toggle"
      @click="sidebarRef?.openDrawer()"
      aria-label="Abrir menú"
    >
      <Menu class="w-5 h-5 text-current" stroke-width="2" />
    </button>

    <!-- Breadcrumb / título -->
    <div class="sp-topbar__title-group">
      <span class="sp-topbar__section-label">Panel</span>
      <span class="sp-topbar__sep">
        <ChevronRight class="w-3.5 h-3.5 text-current" stroke-width="2.5" />
      </span>
      <h1 class="sp-topbar__page-title">{{ pageTitle }}</h1>
    </div>

    <!-- Acciones -->
    <div class="sp-topbar__actions">
      <!-- Hora -->
      <!-- <div class="sp-topbar__clock" aria-label="Hora actual">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle
            cx="8"
            cy="8"
            r="6.5"
            stroke="currentColor"
            stroke-width="1.4"
          />
          <path
            d="M8 5v3.5l2 1.5"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
          />
        </svg>
        {{ currentTime }}
      </div>

      <div class="sp-topbar__divider" role="separator"></div> -->

      <!-- Usuario -->
      <div class="sp-topbar__user">
        <div class="sp-topbar__avatar" aria-hidden="true">
          {{ initials }}
        </div>
        <div class="sp-topbar__user-info">
          <span class="sp-topbar__user-name">{{
            userDisplayName
          }}</span>
          <span class="sp-topbar__user-role">Administrador</span>
        </div>
      </div>

      <div class="sp-topbar__divider" role="separator"></div>

      <!-- Logout -->
      <button
        class="sp-topbar__logout"
        :class="{ 'sp-topbar__logout--loading': loggingOut }"
        :disabled="loggingOut"
        @click="logout"
        aria-label="Cerrar sesión"
      >
        <LogOut v-if="!loggingOut" class="w-4 h-4 text-current" stroke-width="2" />
        <Loader2 v-else class="sp-topbar__spinner w-4 h-4 text-current animate-spin" stroke-width="2" />
        <span class="sp-topbar__logout-label">Salir</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, ChevronRight, LogOut, Loader2 } from 'lucide-vue-next';
import { useAuthStore } from '~/stores/auth'
const route = useRoute();
const loggingOut = ref(false);
const { session, clear: clearSession } = useUserSession();
const sidebarRef = inject<{ openDrawer: () => void } | null>('sidebarRef', null);
const { formatTime } = useFormatDateTime();

/* ── Título de página ── */
const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/pedidos": "Pedidos",
  "/admin/productos": "Productos",
  "/admin/inventario": "Inventario",
  "/admin/categorias": "Categorías",
  "/admin/metodos-pago": "Métodos de Pago",
  "/admin/banners": "Banners",
  "/admin/configuracion": "Configuración",
};

const pageTitle = computed(() => {
  for (const [path, title] of Object.entries(pageTitles)) {
    if (
      route.path.startsWith(path) &&
      (path === "/admin" ? route.path === "/admin" : true)
    ) {
      return title;
    }
  }
  return "Admin";
});

/* ── Iniciales del usuario ── */
const userDisplayName = computed(() => {
  const user = session.value?.user as Record<string, unknown> | undefined;
  return (
    (typeof user?.name === "string" && user.name) ||
    (typeof user?.fullName === "string" && user.fullName) ||
    (typeof user?.email === "string" && user.email) ||
    "Admin"
  );
});

const initials = computed(() => {
  const name = userDisplayName.value ?? "A";
  return name
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
});

/* ── Reloj ── */
const currentTime = ref("");
let clockTimer: ReturnType<typeof setInterval>;

function updateClock() {
  currentTime.value = formatTime(new Date());
}

onMounted(() => {
  updateClock();
  clockTimer = setInterval(updateClock, 10_000);
});
onUnmounted(() => clearInterval(clockTimer));

/* ── Logout ── */
async function logout() {
  loggingOut.value = true;
  await $fetch("/api/auth/logout", { method: "POST" });
  await clearSession();
  try {
    const authStore = useAuthStore()
    authStore.user = null
  } catch (e) {
    // ignore if store not available
  }
  await navigateTo("/login");
}
</script>

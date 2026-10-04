<template>
  <div class="sp-sidebar-inner">
    <!-- Brand -->
    <div class="sp-sidebar__brand">
      <NuxtLink to="/admin" class="sp-brand" @click="emit('close')">
        <img :src="logo" :alt="nombre" class="sp-brand__logo" />
        <div class="sp-brand__text">
          <span class="sp-brand__name">{{ nombre }}</span>
          <span class="sp-brand__role">
            {{ user?.role === "superadmin" ? "Super Admin" : "Administrador" }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="sp-sidebar__nav">
      <div class="sp-nav-group">
        <span class="sp-nav-group__label">General</span>
        <NuxtLink
          v-for="item in baseItems"
          :key="item.to"
          :to="item.to"
          class="sp-nav-item"
          :class="{ 'sp-nav-item--active': isActive(item.to) }"
          @click="emit('close')"
        >
          <span class="sp-nav-item__icon">
            <component :is="item.icon" class="w-5 h-5" stroke-width="1.5" />
          </span>
          <span class="sp-nav-item__label">{{ item.label }}</span>
          <span v-if="isActive(item.to)" class="sp-nav-item__dot" />
        </NuxtLink>
      </div>

      <div v-if="user?.role === 'superadmin'" class="sp-nav-group">
        <span class="sp-nav-group__label">Sistema</span>
        <NuxtLink
          v-for="item in superadminItems"
          :key="item.to"
          :to="item.to"
          class="sp-nav-item"
          :class="{ 'sp-nav-item--active': isActive(item.to) }"
          @click="emit('close')"
        >
          <span class="sp-nav-item__icon">
            <component :is="item.icon" class="w-5 h-5" stroke-width="1.5" />
          </span>
          <span class="sp-nav-item__label">{{ item.label }}</span>
          <span v-if="isActive(item.to)" class="sp-nav-item__dot" />
        </NuxtLink>
      </div>
    </nav>

    <!-- Footer -->
    <div class="sp-sidebar__footer">
      <NuxtLink to="/" target="_blank" class="sp-footer-link">
        <ExternalLink class="w-4 h-4" stroke-width="2" />
        Ver tienda
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  LayoutDashboard, ShoppingBag, Package, Archive, Tags, Layers, BookOpen, CreditCard, Settings, ExternalLink, BarChart
} from "lucide-vue-next";

const props = defineProps<{ user: any }>();

/* Logo y nombre salen de Configuración, igual que en la tienda: estaban
   escritos a mano y el panel decía "Smart Panel" en vez del negocio. */
const { logo, nombre } = useLogo();
const emit = defineEmits<{ (e: "close"): void }>();

const route = useRoute();

const baseItems = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/admin/reportes",
    label: "Reportes",
    icon: BarChart,
  },
  {
    to: "/admin/pedidos",
    label: "Pedidos",
    icon: ShoppingBag,
  },
  {
    to: "/admin/productos",
    label: "Productos",
    icon: Package,
  },
  {
    to: "/admin/inventario",
    label: "Inventario",
    icon: Archive,
  },
  {
    to: "/admin/categorias",
    label: "Categorías",
    icon: Tags,
  },
  {
    to: "/admin/subcategories",
    label: "Subcategorías",
    icon: Layers,
  },
  {
    to: "/admin/reclamaciones",
    label: "Libro de Reclamaciones",
    icon: BookOpen,
  },
];

const superadminItems = [
  {
    to: "/admin/metodos-pago",
    label: "Métodos de Pago",
    icon: CreditCard,
  },
  {
    to: "/admin/configuracion",
    label: "Configuración",
    icon: Settings,
  },
];

function isActive(path: string) {
  if (path === "/admin") return route.path === "/admin";
  return route.path.startsWith(path);
}
</script>

<style scoped>
.sp-sidebar-inner {
  width: 15.5rem;
  min-height: 100dvh;
  background: var(--sp-sidebar-bg);
  border-right: 1px solid var(--sp-sidebar-border);
  display: flex;
  flex-direction: column;
  font-family: var(--sp-font);
}

.sp-sidebar__brand {
  padding: 1.2rem 1rem 1rem;
  border-bottom: 1px solid var(--sp-sidebar-border);
}

.sp-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  border-radius: 10px;
  padding: 6px 8px;
  margin: -6px -8px;
  transition: background var(--sp-t) var(--sp-ease);
}

.sp-brand:hover {
  background: var(--sp-sidebar-hover-bg);
}

/* Alto fijo y ancho libre: admite tanto un isotipo cuadrado como un
   logotipo apaisado sin deformar ninguno. Respaldo blanco porque la
   barra es navy y un logo para fondo claro se perdería. */
.sp-brand__logo {
  height: 34px;
  width: auto;
  max-width: 108px;
  object-fit: contain;
  object-position: left center;
  border-radius: var(--sp-radius-xs);
  background: #fff;
  padding: 4px 6px;
  flex-shrink: 0;
}

.sp-brand__text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.sp-brand__name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--sp-sidebar-brand-name);
  letter-spacing: -0.02em;
  line-height: 1.2;
  white-space: nowrap;
}

.sp-brand__role {
  font-size: 0.62rem;
  color: var(--sp-sidebar-brand-role);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}

.sp-sidebar__nav {
  flex: 1;
  padding: 1rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-y: auto;
}

.sp-nav-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sp-nav-group__label {
  display: block;
  padding: 0.4rem 0.75rem;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--sp-sidebar-label);
}

.sp-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--sp-radius-md);
  text-decoration: none;
  color: var(--sp-sidebar-text);
  font-size: 0.85rem;
  font-weight: 500;
  transition:
    color var(--sp-t) var(--sp-ease),
    background var(--sp-t) var(--sp-ease);
  position: relative;
}

.sp-nav-item:hover {
  background: var(--sp-sidebar-hover-bg);
  color: var(--sp-sidebar-text-hover);
}

.sp-nav-item--active {
  background: var(--sp-sidebar-active-bg);
  color: var(--sp-sidebar-text-active);
}

.sp-nav-item__icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 2px;
}

.sp-nav-item__label {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sp-nav-item__dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--sp-sidebar-active-dot);
  flex-shrink: 0;
}

.sp-sidebar__footer {
  padding: 1rem 0.75rem;
  border-top: 1px solid var(--sp-sidebar-border);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sp-footer-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--sp-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--sp-sidebar-footer-link);
  text-decoration: none;
  transition:
    color var(--sp-t) var(--sp-ease),
    background var(--sp-t) var(--sp-ease);
}

.sp-footer-link:hover {
  background: var(--sp-sidebar-footer-bg);
  color: var(--sp-sidebar-footer-hover);
}

.sp-footer-link svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}
</style>

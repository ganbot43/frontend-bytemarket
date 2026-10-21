<template>
  <div class="sp-sidebar-inner">
    <!-- Brand -->
    <div class="sp-sidebar__brand">
      <NuxtLink to="/admin" class="sp-brand" @click="emit('close')">
        <img :src="logo" :alt="nombre" class="sp-brand__logo" />
        <div class="sp-brand__text">
          <span class="sp-brand__name">{{ nombre }}</span>
          <span class="sp-brand__role">
            {{ ETIQUETA_ROL[user?.role as string] ?? "Administrador" }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="sp-sidebar__nav">
      <div class="sp-nav-group">
        <span class="sp-nav-group__label">General</span>
        <NuxtLink
          v-for="item in itemsVisibles"
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

      <div v-if="itemsSistema.length" class="sp-nav-group">
        <span class="sp-nav-group__label">Sistema</span>
        <NuxtLink
          v-for="item in itemsSistema"
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
  LayoutDashboard, ShoppingBag, Package, Archive, Tags, Layers, GalleryHorizontalEnd, BookOpen, Ticket, Star, CreditCard, Settings, ExternalLink, BarChart, Calculator, Wallet, Users, ShieldCheck
} from "lucide-vue-next";

const props = defineProps<{ user: any }>();

/* Logo y nombre salen de Configuración, igual que en la tienda: estaban
   escritos a mano y el panel decía "Smart Panel" en vez del negocio. */
const { logo, nombre } = useLogo();
const emit = defineEmits<{ (e: "close"): void }>();

const route = useRoute();

/** Cómo se presenta cada rol en la cabecera del menú. */
const ETIQUETA_ROL: Record<string, string> = {
  superadmin: "Gerente",
  admin: "Encargado de tienda",
  jefe_ventas: "Jefe de ventas",
  cajero: "Cajero",
};

/*
 * Qué ve cada rol.
 *
 * Ya no está escrito aquí: cada entrada declara a qué MÓDULO pertenece y
 * quién lo ve sale de la matriz que el gerente edita en Roles y permisos.
 * Antes eran dos listas de roles a mano —SOLO_GESTION y CON_EL_JEFE— que
 * había que mantener a la par de los SecurityConfig de cuatro servicios.
 *
 * El menú no es seguridad: el backend decide, y ahí está la regla de
 * verdad. Pero enseñar entradas que acaban en un 403 es peor que no
 * enseñarlas: el cajero no tiene por qué descubrir a base de errores que no
 * puede entrar a Productos.
 */
const { cargar, puedeVer } = usePermisos();
await cargar();

const baseItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, mod: "dashboard" },
  { to: "/admin/caja", label: "Caja", icon: Calculator, mod: "caja" },
  /* Aperturas, fondos y arqueo. Separada de "Caja" porque es de otra
     persona: el cajero cobra, el jefe le entrega el fondo y le cuadra el
     cajón. Juntarlas en una pantalla con pestañas haría parecer que son
     dos vistas del mismo trabajo. */
  { to: "/admin/cajas", label: "Cajas", icon: Wallet, mod: "cajas" },
  { to: "/admin/reportes", label: "Reportes", icon: BarChart, mod: "reportes" },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag, mod: "pedidos" },
  { to: "/admin/productos", label: "Productos", icon: Package, mod: "productos" },
  { to: "/admin/inventario", label: "Inventario", icon: Archive, mod: "inventario" },
  { to: "/admin/categorias", label: "Categorías", icon: Tags, mod: "categorias" },
  { to: "/admin/subcategories", label: "Subcategorías", icon: Layers, mod: "subcategorias" },
  /* La página existía desde el principio pero no estaba enlazada aquí:
     sin entrada en el menú, los banners de la portada solo se podían
     editar escribiendo la URL a mano. */
  { to: "/admin/banners", label: "Banners", icon: GalleryHorizontalEnd, mod: "banners" },
  { to: "/admin/cupones", label: "Cupones", icon: Ticket, mod: "cupones" },
  { to: "/admin/resenas", label: "Reseñas", icon: Star, mod: "resenas" },
  { to: "/admin/reclamaciones", label: "Libro de Reclamaciones", icon: BookOpen, mod: "reclamaciones" },
];

function visiblesPara(items: any[]) {
  return items.filter((i: any) => puedeVer(i.mod));
}

const itemsVisibles = computed(() => visiblesPara(baseItems));

/*
 * El grupo "Sistema": lo que configura el negocio en vez de operarlo.
 *
 * "Roles y permisos" es de quien reparte poder, y la propia matriz decide
 * quién lo ve: por defecto el gerente y el encargado, porque la pirámide le
 * deja al encargado solo jefe de ventas y cajero. Darle la entrada a un
 * cajero sería inofensivo —debajo de él no hay a quién editar—, pero
 * tampoco tiene sentido enseñársela.
 */
const itemsDeSistema = [
  { to: "/admin/roles", label: "Roles y permisos", icon: ShieldCheck, mod: "roles" },
  { to: "/admin/usuarios", label: "Usuarios", icon: Users, mod: "usuarios" },
  { to: "/admin/metodos-pago", label: "Métodos de Pago", icon: CreditCard, mod: "metodos_pago" },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings, mod: "configuracion" },
];

const itemsSistema = computed(() => visiblesPara(itemsDeSistema));

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

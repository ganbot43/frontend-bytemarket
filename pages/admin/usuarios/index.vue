<template>
  <div class="sp-page usu-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Usuarios</h1>
        <p class="sp-page-toolbar__sub">
          {{ total }} {{ esPersonal ? "en el equipo" : "clientes registrados" }}
        </p>
      </div>
      <button class="sp-page-btn" @click="abrir()">
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        {{ esPersonal ? "Nuevo miembro" : "Nuevo cliente" }}
      </button>
    </div>

    <!-- Equipo y clientes son dos listas distintas: se administran por
         motivos distintos y mezclarlas haría la tabla inútil. -->
    <nav class="sp-tabs usu-tabs">
      <button v-for="t in pestanas" :key="t.value" class="sp-tab"
              :class="{ 'sp-tab--active': pestana === t.value }" @click="pestana = t.value">
        {{ t.label }}
      </button>
    </nav>

    <SharedBarraTabla v-model="busqueda" placeholder="Buscar por nombre o correo…" />

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Usuario</th>
              <th class="sp-th">Rol</th>
              <th v-if="!esPersonal" class="sp-th">Contacto</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th">Registro</th>
              <th class="sp-th sp-th--center" style="width: 120px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id" class="sp-tr">
              <td class="sp-td">
                <div class="usu-cell">
                  <span class="usu-avatar">{{ iniciales(u.name) }}</span>
                  <div>
                    <p class="sp-table-title">{{ u.name }}</p>
                    <p class="usu-mail">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="sp-td">
                <span class="usu-rol" :class="`usu-rol--${u.role}`">{{ rolLabel(u.role) }}</span>
              </td>
              <td v-if="!esPersonal" class="sp-td sp-td--muted">
                <span class="usu-dato">{{ u.phone || "–" }}</span>
                <span v-if="u.dni" class="usu-dato usu-dato--soft">DNI {{ u.dni }}</span>
              </td>
              <td class="sp-td">
                <span class="usu-estado" :class="u.isActive ? 'usu-estado--on' : 'usu-estado--off'">
                  {{ u.isActive ? "Activo" : "Inhabilitado" }}
                </span>
              </td>
              <td class="sp-td sp-td--muted">
                <span class="usu-dato">{{ formatDateTime(u.createdAt) }}</span>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button class="sp-table-btn sp-table-btn--edit" title="Editar" @click="abrir(u)">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M11.5 2.5a1.414 1.414 0 0 1 2 2L5 13H3v-2L11.5 2.5Z"
                            stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button class="sp-table-btn" :title="u.isActive ? 'Inhabilitar' : 'Reactivar'"
                          :disabled="esYoMismo(u)" @click="alternarEstado(u)">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path :d="u.isActive ? 'M5 8h6' : 'M8 5v6M5 8h6'"
                            stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                    </svg>
                  </button>
                  <button class="sp-table-btn sp-table-btn--del" title="Eliminar"
                          :disabled="esYoMismo(u)" @click="pedirBorrado(u)">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M3 5h10M6 5V3h4v2M6 8v4M10 8v4M4 5l1 8h6l1-8"
                            stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="!usuarios.length">
              <td :colspan="esPersonal ? 5 : 6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <p class="sp-table-empty__msg">
                    {{ busqueda ? "Nadie coincide con esa búsqueda" : "Todavía no hay nadie aquí" }}
                  </p>
                  <button v-if="!busqueda" class="sp-table-empty__cta" @click="abrir()">
                    {{ esPersonal ? "Agregar al primer miembro" : "Registrar el primer cliente" }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <SharedPaginacion v-model:pagina="pagina" :total="total" :limite="limite" />
    </div>

    <!-- ── Alta y edición ────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="drawerOpen" class="sp-drawer-overlay" @click.self="cerrar" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <aside v-if="drawerOpen" class="sp-drawer-panel" role="dialog" aria-modal="true">
          <div class="sp-drawer-header">
            <div>
              <p class="sp-drawer-header__eyebrow">{{ editando ? "Editar" : "Nuevo" }}</p>
              <h2 class="sp-drawer-header__title">
                {{ editando ? form.name || "Usuario" : esPersonal ? "Nuevo miembro" : "Nuevo cliente" }}
              </h2>
            </div>
            <button class="sp-drawer-close" @click="cerrar" aria-label="Cerrar">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </button>
          </div>

          <div class="sp-drawer-body">
            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Nombre <span class="sp-drawer-req">*</span></label>
              <input v-model="form.name" class="sp-drawer-input" placeholder="Nombre y apellido" />
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Correo <span class="sp-drawer-req">*</span></label>
              <input v-model="form.email" type="email" class="sp-drawer-input" placeholder="persona@correo.com" />
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">
                Contraseña
                <span v-if="editando" class="sp-drawer-hint-small">(dejar vacío para no cambiarla)</span>
                <span v-else class="sp-drawer-req">*</span>
              </label>
              <input v-model="form.password" type="password" class="sp-drawer-input"
                     placeholder="Mínimo 6 caracteres" autocomplete="new-password" />
            </div>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Rol <span class="sp-drawer-req">*</span></label>
              <select v-model="form.role" class="sp-drawer-input sp-drawer-select">
                <option value="customer">Cliente</option>
                <option value="admin">Administrador</option>
                <option value="superadmin">Superadministrador</option>
              </select>
              <p class="sp-drawer-hint">{{ ayudaRol }}</p>
            </div>

            <!-- La ficha de cliente solo existe para el rol cliente: el
                 backend la borra si el rol cambia a staff. -->
            <template v-if="form.role === 'customer'">
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Teléfono</label>
                <input v-model="form.phone" type="tel" class="sp-drawer-input" placeholder="987654321" />
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">DNI</label>
                <input v-model="form.dni" class="sp-drawer-input" placeholder="12345678" />
              </div>
              <div class="sp-drawer-field">
                <label class="sp-drawer-label">Dirección</label>
                <input v-model="form.address" class="sp-drawer-input" placeholder="Av. ..." />
              </div>
            </template>

            <div class="sp-drawer-field">
              <label class="sp-drawer-label">Estado</label>
              <select v-model.number="form.isActive" class="sp-drawer-input sp-drawer-select">
                <option :value="1">Activo</option>
                <option :value="0">Inhabilitado</option>
              </select>
              <p class="sp-drawer-hint">Un usuario inhabilitado no puede iniciar sesión.</p>
            </div>

            <p v-if="errorForm" class="sp-drawer-error">{{ errorForm }}</p>
          </div>

          <div class="sp-drawer-footer">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrar">Cancelar</button>
            <button class="sp-drawer-btn" :disabled="guardando" @click="guardar">
              {{ guardando ? "Guardando…" : editando ? "Guardar cambios" : "Crear" }}
            </button>
          </div>
        </aside>
      </Transition>
    </Teleport>

    <!-- ── Confirmación de borrado ───────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-drawer-overlay">
        <div v-if="porBorrar" class="sp-drawer-overlay" @click.self="porBorrar = null" />
      </Transition>
      <Transition name="sp-drawer-panel">
        <div v-if="porBorrar" class="usu-confirm" role="alertdialog" aria-modal="true">
          <h3>Eliminar a {{ porBorrar.name }}</h3>
          <p>
            Se borra la cuenta y su ficha. Sus pedidos no se tocan, pero
            dejarán de estar asociados a un usuario.
          </p>
          <p class="usu-confirm__tip">
            Si solo quieres quitarle el acceso, <strong>inhabilítalo</strong> en vez de borrarlo.
          </p>
          <div class="usu-confirm__actions">
            <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="porBorrar = null">Cancelar</button>
            <button class="sp-drawer-btn usu-confirm__del" :disabled="borrando" @click="borrar">
              {{ borrando ? "Eliminando…" : "Eliminar" }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Usuarios del panel y clientes.
 *
 * El backend de esto existía completo desde hacía tiempo —alta, edición,
 * estado y borrado en /api/admin/users, enrutado en el gateway— y no había
 * ninguna pantalla que lo usara: los únicos usuarios eran los que siembra
 * el DatabaseSeeder. No se podía dar de alta a un empleado ni quitarle el
 * acceso a quien se fue.
 *
 * Importa más desde que existe la caja: cada venta guarda quién la hizo, y
 * eso solo sirve si las cuentas corresponden a personas reales.
 */
definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Usuarios · Admin" });

const { formatDateTime } = useFormatDateTime();
const toast = useAppToast();
const { user: yo } = useUserSession();

const pestanas = [
  { value: "staff", label: "Equipo" },
  { value: "customer", label: "Clientes" },
];
const pestana = ref("staff");
const esPersonal = computed(() => pestana.value === "staff");

const busqueda = ref("");
const pagina = ref(0);
const limite = 10;
const usuarios = ref<any[]>([]);
const total = ref(0);

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/users", {
      query: {
        page: pagina.value,
        size: limite,
        // El backend acepta varios roles por coma; el equipo son los dos
        // roles de staff vistos como una sola lista.
        role: esPersonal.value ? "admin,superadmin" : "customer",
        q: busqueda.value.trim() || undefined,
      },
    });
    usuarios.value = res?.data ?? [];
    total.value = res?.total ?? usuarios.value.length;
  } catch (e: any) {
    toast.add({ title: "No se pudo cargar la lista", color: "error" });
  }
}

watch([pestana, busqueda], () => {
  pagina.value = 0;
  cargar();
});
watch(pagina, cargar);
onMounted(cargar);

const ROLES: Record<string, string> = {
  customer: "Cliente",
  admin: "Administrador",
  superadmin: "Superadmin",
};
const rolLabel = (r: string) => ROLES[r] ?? r;
const iniciales = (n: string) =>
  (n || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

/** Nadie puede inhabilitarse ni borrarse a sí mismo: se quedaría fuera. */
const esYoMismo = (u: any) => u.email === (yo.value as any)?.email;

// ── Alta y edición ──────────────────────────────────────────
const drawerOpen = ref(false);
const editandoId = ref<number | null>(null);
const editando = computed(() => editandoId.value !== null);
const guardando = ref(false);
const errorForm = ref("");

const vacio = () => ({
  name: "", email: "", password: "", role: "admin",
  phone: "", dni: "", address: "", isActive: 1,
});
const form = reactive(vacio());

const ayudaRol = computed(() => {
  if (form.role === "customer") return "Compra en la tienda. No entra al panel.";
  if (form.role === "admin") return "Entra al panel: pedidos, productos, caja e inventario.";
  return "Todo lo del administrador, más la configuración del negocio.";
});

function abrir(u?: any) {
  errorForm.value = "";
  Object.assign(form, vacio());
  if (u) {
    editandoId.value = u.id;
    Object.assign(form, {
      name: u.name ?? "", email: u.email ?? "", password: "",
      role: u.role ?? "customer", phone: u.phone ?? "",
      dni: u.dni ?? "", address: u.address ?? "", isActive: u.isActive ? 1 : 0,
    });
  } else {
    editandoId.value = null;
    form.role = esPersonal.value ? "admin" : "customer";
  }
  drawerOpen.value = true;
}
const cerrar = () => { drawerOpen.value = false; };

async function guardar() {
  errorForm.value = "";
  if (!form.name.trim()) return (errorForm.value = "El nombre es obligatorio");
  if (!form.email.trim()) return (errorForm.value = "El correo es obligatorio");
  if (!editando.value && form.password.length < 6) {
    return (errorForm.value = "La contraseña debe tener al menos 6 caracteres");
  }
  if (editando.value && form.password && form.password.length < 6) {
    return (errorForm.value = "La contraseña nueva debe tener al menos 6 caracteres");
  }

  guardando.value = true;
  try {
    const body: any = {
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      isActive: form.isActive,
    };
    // Al editar, una contraseña vacía significa "no la toques".
    if (form.password) body.password = form.password;
    if (form.role === "customer") {
      body.phone = form.phone.trim() || null;
      body.dni = form.dni.trim() || null;
      body.address = form.address.trim() || null;
    }

    if (editando.value) {
      await $fetch(`/api/admin/users/${editandoId.value}`, { method: "PUT", body });
    } else {
      await $fetch("/api/admin/users", { method: "POST", body });
    }
    toast.add({ title: editando.value ? "Usuario actualizado" : "Usuario creado", color: "success" });
    cerrar();
    await cargar();
  } catch (e: any) {
    errorForm.value = e?.data?.message ?? "No se pudo guardar";
  } finally {
    guardando.value = false;
  }
}

async function alternarEstado(u: any) {
  try {
    await $fetch(`/api/admin/users/${u.id}/status`, {
      method: "PUT",
      body: { isActive: u.isActive ? 0 : 1 },
    });
    toast.add({
      title: u.isActive ? `${u.name} ya no puede entrar` : `${u.name} vuelve a tener acceso`,
      color: "success",
    });
    await cargar();
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? "No se pudo cambiar el estado", color: "error" });
  }
}

// ── Borrado ─────────────────────────────────────────────────
const porBorrar = ref<any>(null);
const borrando = ref(false);
const pedirBorrado = (u: any) => { porBorrar.value = u; };

async function borrar() {
  if (!porBorrar.value) return;
  borrando.value = true;
  try {
    await $fetch(`/api/admin/users/${porBorrar.value.id}`, { method: "DELETE" });
    toast.add({ title: "Usuario eliminado", color: "success" });
    porBorrar.value = null;
    await cargar();
  } catch (e: any) {
    toast.add({ title: e?.data?.message ?? "No se pudo eliminar", color: "error" });
  } finally {
    borrando.value = false;
  }
}
</script>

<style scoped>
.usu-page { padding: 1.5rem; }
.usu-tabs { margin-bottom: 0.9rem; display: flex; gap: 0.3rem; }

.usu-cell { display: flex; align-items: center; gap: 0.6rem; }
.usu-avatar {
  width: 32px; height: 32px; flex: 0 0 32px; border-radius: 50%;
  display: grid; place-items: center; background: #e0e7ff; color: #3730a3;
  font-size: 0.72rem; font-weight: 800;
}
.usu-mail { margin: 0.1rem 0 0; font-size: 0.72rem; color: #64748b; }

.usu-rol {
  display: inline-block; padding: 0.12rem 0.55rem; border-radius: 999px;
  font-size: 0.7rem; font-weight: 700; background: #f1f5f9; color: #475569;
}
.usu-rol--admin { background: #eff6ff; color: #1d4ed8; }
.usu-rol--superadmin { background: #f5f3ff; color: #6d28d9; }

.usu-estado { font-size: 0.75rem; font-weight: 700; }
.usu-estado--on { color: #15803d; }
.usu-estado--off { color: #b91c1c; }

.usu-dato { display: block; font-size: 0.78rem; }
.usu-dato--soft { font-size: 0.68rem; color: #64748b; }

.sp-table-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── Confirmación ── */
.usu-confirm {
  position: fixed; z-index: 60; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: min(420px, calc(100vw - 2rem)); padding: 1.4rem;
  background: #fff; border-radius: 14px; box-shadow: 0 20px 50px rgb(0 0 0 / 0.22);
}
.usu-confirm h3 { margin: 0 0 0.5rem; font-size: 1.05rem; font-weight: 800; }
.usu-confirm p { margin: 0 0 0.5rem; font-size: 0.85rem; color: #475569; line-height: 1.45; }
.usu-confirm__tip {
  padding: 0.5rem 0.7rem; border-radius: 8px; background: #fffbeb; color: #92400e; font-size: 0.8rem !important;
}
.usu-confirm__actions { margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end; }
.usu-confirm__del { background: #dc2626 !important; border-color: #dc2626 !important; }

/* ── Móvil ──
   La tabla se recorre dentro de .sp-table-scroll, así que aquí solo se
   ajusta lo que vive fuera de ella. */
@media (max-width: 768px) {
  .usu-page {
    padding: 1rem 0.75rem;
  }

  .usu-tabs {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* El correo bajo el nombre es lo primero que sobra cuando falta ancho:
     está también en el detalle al editar. */
  .usu-mail {
    display: none;
  }

  .usu-confirm {
    top: 1rem;
    transform: translate(-50%, 0);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
  }
}
</style>

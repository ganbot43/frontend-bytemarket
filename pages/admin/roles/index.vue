<template>
  <div class="sp-page rol-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Roles y permisos</h1>
        <p class="sp-page-toolbar__sub">
          Qué módulos del panel toca cada puesto
        </p>
      </div>
      <button
        class="sp-page-btn"
        :disabled="!haycambios || guardando"
        @click="guardar"
      >
        <Save class="w-3.5 h-3.5" stroke-width="2" />
        {{ guardando ? "Guardando…" : "Guardar cambios" }}
      </button>
    </div>

    <!-- Por qué el gerente no se puede editar. Sin decirlo, su columna
         llena de candados se lee como un error de la pantalla. -->
    <div class="rol-aviso">
      <ShieldCheck class="w-4 h-4" stroke-width="1.75" />
      <p>
        <strong>{{ gerenteLabel }}</strong> tiene todos los módulos siempre y no
        aparece en la tabla: si sus permisos se pudieran guardar, un error al
        hacerlo lo dejaría fuera de su propio sistema. Y cada puesto solo
        reparte permisos a los que están por debajo —y solo los que él mismo
        tiene—, así que nadie puede usar esta pantalla para subir.
      </p>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table rol-tabla">
          <thead>
            <tr>
              <th class="sp-th">Módulo</th>
              <th
                v-for="rol in roles"
                :key="rol.key"
                class="sp-th sp-th--center"
              >
                {{ rol.label }}
                <span v-if="!rol.editable" class="rol-candado" :title="motivoBloqueo(rol)">
                  <Lock class="w-3 h-3" stroke-width="2" />
                </span>
              </th>
              <th class="sp-th sp-th--center rol-col-gerente">
                {{ gerenteLabel }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="modulo in modules" :key="modulo.key" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ modulo.label }}</p>
              </td>

              <td
                v-for="rol in roles"
                :key="rol.key"
                class="sp-td sp-td--center"
              >
                <div class="rol-celda">
                  <label class="rol-check" :class="{ 'rol-check--off': !rol.editable }">
                    <input
                      type="checkbox"
                      :checked="borrador[rol.key]?.[modulo.key]?.view"
                      :disabled="!rol.editable || !puedoConceder(modulo.key, 'view')"
                      @change="marcar(rol.key, modulo.key, 'view', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Ver</span>
                  </label>
                  <label class="rol-check" :class="{ 'rol-check--off': !rol.editable }">
                    <input
                      type="checkbox"
                      :checked="borrador[rol.key]?.[modulo.key]?.edit"
                      :disabled="!rol.editable || !puedoConceder(modulo.key, 'edit')"
                      @change="marcar(rol.key, modulo.key, 'edit', ($event.target as HTMLInputElement).checked)"
                    />
                    <span>Editar</span>
                  </label>
                </div>
              </td>

              <!-- El gerente, siempre todo: se pinta para que la tabla se
                   lea completa, no como una casilla que alguien olvidó. -->
              <td class="sp-td sp-td--center rol-col-gerente">
                <span class="sp-badge sp-badge--success">
                  <span class="sp-badge__dot" />
                  Todo
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="haycambios" class="rol-pie">
      Hay cambios sin guardar. Quien esté dentro del panel los notará al
      recargar: el permiso se comprueba en el servidor en cada llamada, así
      que lo que puede queda limitado desde ya.
    </p>
  </div>
</template>

<script setup lang="ts">
import { Save, Lock, ShieldCheck } from "lucide-vue-next";

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Roles y permisos · Admin" });

type Permiso = { view: boolean; edit: boolean };
type Matriz = Record<string, Record<string, Permiso>>;

const toast = useAppToast();
const { cargar: recargarMisPermisos, puedeVer, puedeEditar } = usePermisos();

const modules = ref<Array<{ key: string; label: string }>>([]);
const roles = ref<Array<{ key: string; label: string; editable: boolean }>>([]);
const gerenteLabel = ref("Gerente");

/* La matriz tal como vino del servidor y la que se está editando. Se
   comparan para saber qué mandar: enviar la tabla entera haría que el
   backend rechazara filas que nadie tocó —las de los roles no editables— y
   la respuesta llegaría llena de avisos por cambios que no se pidieron. */
const original = ref<Matriz>({});
const borrador = ref<Matriz>({});
const guardando = ref(false);

const haycambios = computed(() => Object.keys(cambiosPendientes()).length > 0);

const clonar = (m: Matriz): Matriz => JSON.parse(JSON.stringify(m));

/* useFetch y no $fetch, como el resto de las pantallas del panel: en SSR
   $fetch sale sin las cookies del navegador, la API responde 403 y el
   <script setup> lanza, que es una pantalla en blanco sin explicación. */
const { data: inicial } = await useFetch<any>("/api/admin/permissions");

function aplicar(data: any) {
  if (!data) return;
  modules.value = data.modules ?? [];
  roles.value = data.roles ?? [];
  gerenteLabel.value = data.gerenteLabel ?? "Gerente";
  original.value = clonar(data.matrix ?? {});
  borrador.value = clonar(data.matrix ?? {});
}

aplicar(inicial.value);
watch(inicial, (v) => aplicar(v));

/**
 * Un permiso solo se puede conceder si quien edita lo tiene.
 *
 * El backend ya lo rechaza —es la tercera regla de la pirámide— pero dejar
 * la casilla activa para que la API diga no es enseñar una puerta que no
 * abre.
 *
 * Se mira CASILLA por casilla y no el módulo entero: el encargado tiene el
 * Dashboard en solo ver, y con la comprobación puesta sobre "editar" no
 * podía concederle al cajero ni el ver, que sí está en su mano. La pantalla
 * era más estricta que la regla.
 */
function puedoConceder(modulo: string, campo: "view" | "edit") {
  if (esGerente.value) return true;
  return campo === "edit" ? puedeEditar(modulo) : puedeVer(modulo);
}

const esGerente = computed(() => roles.value.every((r) => r.editable));

function motivoBloqueo(rol: { key: string }) {
  return `No puedes editar los permisos de este puesto: solo los de quienes están por debajo de ti.`;
}

function marcar(rol: string, modulo: string, campo: "view" | "edit", valor: boolean) {
  const celda = borrador.value[rol]?.[modulo];
  if (!celda) return;
  celda[campo] = valor;
  /* Editar sin ver no significa nada: la pantalla no se abre, así que el
     permiso de escritura sería inalcanzable. El backend lo normaliza
     igual; hacerlo aquí evita que la casilla mienta hasta que se guarde. */
  if (campo === "edit" && valor) celda.view = true;
  if (campo === "view" && !valor) celda.edit = false;
}

/** Solo los roles y módulos que de verdad cambiaron. */
function cambiosPendientes(): Matriz {
  const out: Matriz = {};
  for (const rol of roles.value) {
    if (!rol.editable) continue;
    for (const modulo of modules.value) {
      const antes = original.value[rol.key]?.[modulo.key];
      const ahora = borrador.value[rol.key]?.[modulo.key];
      if (!antes || !ahora) continue;
      if (antes.view !== ahora.view || antes.edit !== ahora.edit) {
        out[rol.key] ??= {};
        out[rol.key][modulo.key] = { view: ahora.view, edit: ahora.edit };
      }
    }
  }
  return out;
}

async function guardar() {
  const cambios = cambiosPendientes();
  if (!Object.keys(cambios).length) return;
  guardando.value = true;
  try {
    const r = await $fetch<any>("/api/admin/permissions", {
      method: "PUT",
      body: cambios,
    });
    original.value = clonar(r.matrix ?? borrador.value);
    borrador.value = clonar(original.value);

    /* Los rechazos se muestran uno a uno y no como "hubo errores": el
       backend aplica lo válido de un lote y rechaza el resto, así que
       decir solo que falló algo dejaría sin saber qué sí se guardó. */
    if (r.rechazos?.length) {
      for (const motivo of r.rechazos) {
        toast.add({ title: "No se aplicó", description: motivo, color: "warning" });
      }
    } else {
      toast.add({ title: "Permisos guardados", color: "success" });
    }

    /* Quien guardó puede haberse cambiado lo que ve en su propio menú
       —el encargado puede quitarle módulos a otros, pero la matriz que
       alimenta la barra lateral es la misma—, así que se vuelve a pedir. */
    await recargarMisPermisos(true);
  } catch (e: any) {
    toast.add({
      title: "No se pudo guardar",
      description: e?.data?.message ?? "Inténtalo de nuevo.",
      color: "error",
    });
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.rol-aviso {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 14px;
  margin-bottom: 1rem;
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 10px;
  background: var(--sp-surface-soft, #f9fafb);
  color: var(--sp-text-muted, #4b5563);
  font-size: 0.82rem;
  line-height: 1.5;
}

.rol-aviso svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.rol-celda {
  display: inline-flex;
  gap: 12px;
  justify-content: center;
}

.rol-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  color: var(--sp-text-muted, #4b5563);
  cursor: pointer;
  user-select: none;
}

.rol-check input {
  cursor: pointer;
  accent-color: var(--sp-primary, #4f46e5);
}

.rol-check--off,
.rol-check input:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.rol-candado {
  display: inline-flex;
  margin-left: 5px;
  vertical-align: middle;
  color: var(--sp-text-muted, #9ca3af);
}

.rol-col-gerente {
  background: var(--sp-surface-soft, #f9fafb);
}

.rol-pie {
  margin-top: 0.85rem;
  font-size: 0.78rem;
  color: var(--sp-text-muted, #6b7280);
  line-height: 1.5;
}
</style>

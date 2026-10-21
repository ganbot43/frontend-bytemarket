<template>
  <div class="sp-page rol-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Roles y permisos</h1>
        <p class="sp-page-toolbar__sub">
          Qué puede ver y hacer cada puesto, módulo por módulo
        </p>
      </div>
      <button class="sp-page-btn" :disabled="!haycambios || guardando" @click="guardar">
        <Save class="w-3.5 h-3.5" stroke-width="2" />
        {{ guardando ? "Guardando…" : "Guardar cambios" }}
      </button>
    </div>

    <!-- ── Elegir el puesto ─────────────────────────────────────
         Un puesto a la vez y no los tres en columnas: con cuatro
         acciones por módulo, la tabla cruzada son 204 casillas y nadie
         puede repasarlas. Repartir permisos se hace pensando en una
         persona, no comparando tres a la vez. -->
    <div class="rol-puestos">
      <button
        v-for="rol in roles"
        :key="rol.key"
        class="rol-puesto"
        :class="{
          'rol-puesto--activo': rol.key === rolActivo,
          'rol-puesto--bloqueado': !rol.editable,
        }"
        :disabled="!rol.editable"
        :title="rol.editable ? '' : 'Solo repartes permisos a los puestos por debajo del tuyo'"
        @click="cambiarDePuesto(rol.key)"
      >
        <span class="rol-puesto__nombre">
          {{ rol.label }}
          <Lock v-if="!rol.editable" class="w-3 h-3" stroke-width="2.25" />
        </span>
        <span class="rol-puesto__cuenta">
          {{ concedidos(rol.key) }} de {{ modules.length }} módulos
        </span>
      </button>

      <!-- El gerente no está en la tabla, y la pantalla tiene que decirlo:
           una columna ausente sin explicación se lee como un fallo. -->
      <div class="rol-puesto rol-puesto--gerente">
        <span class="rol-puesto__nombre">
          {{ gerenteLabel }}
          <ShieldCheck class="w-3.5 h-3.5" stroke-width="2" />
        </span>
        <span class="rol-puesto__cuenta">todo, siempre</span>
      </div>
    </div>

    <div class="rol-aviso">
      <Info class="w-4 h-4" stroke-width="1.75" />
      <p>
        <strong>{{ gerenteLabel }}</strong> lo tiene todo y no se edita: si sus
        permisos se pudieran guardar, un error al hacerlo lo dejaría fuera de su
        propio sistema. Y cada puesto solo reparte lo que él mismo tiene a los
        que están por debajo, así que nadie puede usar esta pantalla para subir.
      </p>
    </div>

    <!-- ── Barra de trabajo ────────────────────────────────────── -->
    <div class="rol-barra">
      <div class="rol-barra__fila">
        <div class="rol-buscar">
          <Search class="w-3.5 h-3.5" stroke-width="2" />
          <input
            v-model="busqueda"
            type="search"
            class="rol-buscar__input"
            placeholder="Buscar un módulo…"
          />
        </div>
        <div class="rol-atajos">
          <button class="rol-atajo" :disabled="!editable" @click="aplicarATodo('todo')">
            Todo
          </button>
          <button
            class="rol-atajo"
            :disabled="!editable"
            title="Deja Ver en todos los módulos y apaga crear, editar y eliminar"
            @click="aplicarATodo('lectura')"
          >
            Solo lectura
          </button>
          <button class="rol-atajo rol-atajo--suave" :disabled="!editable" @click="aplicarATodo('nada')">
            Limpiar
          </button>
        </div>
      </div>
      <div class="rol-barra__pie">
        <span>
          <strong>{{ totalConcedidos }}</strong> permisos otorgados ·
          <strong>{{ concedidos(rolActivo) }}</strong> de {{ modules.length }}
          módulos visibles en su menú
        </span>
        <span v-if="!busqueda.trim()" class="rol-barra__plegar">
          <button @click="abrirTodo(true)">Expandir todo</button>
          <span class="rol-barra__sep">·</span>
          <button @click="abrirTodo(false)">Contraer todo</button>
        </span>
      </div>
    </div>

    <!-- ── Los módulos, agrupados como el menú ─────────────────── -->
    <p v-if="!gruposVisibles.length" class="rol-vacio">
      Ningún módulo coincide con «{{ busqueda }}».
    </p>

    <section v-for="grupo in gruposVisibles" :key="grupo.nombre" class="rol-grupo">
      <button class="rol-grupo__cab" @click="alternarGrupo(grupo.nombre)">
        <ChevronDown
          class="w-3.5 h-3.5 rol-grupo__flecha"
          :class="{ 'rol-grupo__flecha--cerrada': !estaAbierto(grupo.nombre) }"
          stroke-width="2.5"
        />
        <span class="rol-grupo__nombre">{{ grupo.nombre }}</span>
        <span class="rol-grupo__cuenta">
          {{ grupo.modulos.filter((m) => tieneAlgo(m.key)).length }}/{{ grupo.modulos.length }}
        </span>
      </button>

      <div v-if="estaAbierto(grupo.nombre)" class="rol-tabla">
        <div class="rol-fila rol-fila--cab">
          <span class="rol-fila__modulo">Módulo</span>
          <span v-for="a in actions" :key="a.key" class="rol-fila__accion" :title="a.help">
            {{ a.label }}
          </span>
        </div>

        <label
          v-for="modulo in grupo.modulos"
          :key="modulo.key"
          class="rol-fila"
          :class="{ 'rol-fila--activa': tieneAlgo(modulo.key) }"
        >
          <span class="rol-fila__modulo">
            {{ modulo.label }}
            <small v-if="!puedoConcederAlgo(modulo.key)" class="rol-fila__nota">
              no lo tienes
            </small>
          </span>
          <span v-for="a in actions" :key="a.key" class="rol-fila__accion">
            <input
              type="checkbox"
              class="rol-check"
              :checked="celda(modulo.key)[a.key]"
              :disabled="!editable || !puedoConceder(modulo.key, a.key)"
              :aria-label="`${a.label} ${modulo.label}`"
              @change="marcar(modulo.key, a.key, ($event.target as HTMLInputElement).checked)"
            />
          </span>
        </label>
      </div>
    </section>

    <p v-if="haycambios" class="rol-pie">
      Hay cambios sin guardar. Al guardarlos, quien esté dentro del panel los
      nota en menos de un minuto: el permiso se comprueba en el servidor en cada
      llamada, no al iniciar sesión.
    </p>
  </div>
</template>

<script setup lang="ts">
import { Save, Lock, ShieldCheck, Info, Search, ChevronDown } from "lucide-vue-next";
import type { Accion, Permiso } from "~/composables/usePermisos";

definePageMeta({ middleware: "auth", layout: "admin" });
useSeoMeta({ title: "Roles y permisos · Admin" });

type Modulo = { key: string; label: string; group: string };
type Rol = { key: string; label: string; editable: boolean };
type Matriz = Record<string, Record<string, Permiso>>;

const toast = useAppToast();
const { cargar: recargarMisPermisos, puede: yoPuedo } = usePermisos();

const modules = ref<Modulo[]>([]);
const roles = ref<Rol[]>([]);
const actions = ref<Array<{ key: Accion; label: string; help: string }>>([]);
const grupos = ref<string[]>([]);
const gerenteLabel = ref("Gerente");

/* La matriz tal como vino del servidor y la que se está editando. Se comparan
   para mandar solo lo que cambió: enviar la tabla entera haría que el backend
   rechazara filas que nadie tocó —las de los puestos no editables— y la
   respuesta llegaría llena de avisos por cambios que no se pidieron. */
const original = ref<Matriz>({});
const borrador = ref<Matriz>({});
const guardando = ref(false);
const busqueda = ref("");
const rolActivo = ref("");
const cerrados = ref(new Set<string>());

const clonar = (m: Matriz): Matriz => JSON.parse(JSON.stringify(m));

/* useFetch y no $fetch, como el resto del panel: en SSR $fetch sale sin las
   cookies del navegador, la API responde 403 y el <script setup> lanza, que es
   una pantalla en blanco sin explicación. */
const { data: inicial } = await useFetch<any>("/api/admin/permissions");

function aplicar(data: any) {
  if (!data) return;
  modules.value = data.modules ?? [];
  roles.value = data.roles ?? [];
  actions.value = data.actions ?? [];
  grupos.value = data.groups ?? [];
  gerenteLabel.value = data.gerenteLabel ?? "Gerente";
  original.value = clonar(data.matrix ?? {});
  borrador.value = clonar(data.matrix ?? {});
  if (!rolActivo.value || !roles.value.some((r) => r.key === rolActivo.value && r.editable)) {
    rolActivo.value = roles.value.find((r) => r.editable)?.key ?? "";
  }
}

aplicar(inicial.value);
watch(inicial, (v) => aplicar(v));

const editable = computed(
  () => roles.value.find((r) => r.key === rolActivo.value)?.editable ?? false,
);

/** Si quien administra es el gerente: para él no hay tope que respetar. */
const esGerente = computed(() => roles.value.length > 0 && roles.value.every((r) => r.editable));

const VACIO: Permiso = { view: false, create: false, edit: false, delete: false };
const celda = (modulo: string): Permiso =>
  borrador.value[rolActivo.value]?.[modulo] ?? VACIO;

const tieneAlgo = (modulo: string) => Object.values(celda(modulo)).some(Boolean);

const concedidos = (rol: string) =>
  modules.value.filter((m) => Object.values(borrador.value[rol]?.[m.key] ?? VACIO).some(Boolean))
    .length;

const totalConcedidos = computed(() =>
  modules.value.reduce(
    (n, m) => n + Object.values(celda(m.key)).filter(Boolean).length,
    0,
  ),
);

/**
 * Una acción solo se puede conceder si quien administra la tiene.
 *
 * El backend ya lo rechaza —es la tercera regla de la pirámide— pero dejar la
 * casilla activa para que la API diga no es enseñar una puerta que no abre. Se
 * mira acción por acción y no el módulo entero: el encargado tiene el Dashboard
 * en solo ver, y debe poder conceder ese ver aunque no tenga el resto.
 */
function puedoConceder(modulo: string, accion: Accion) {
  return esGerente.value || yoPuedo(modulo, accion);
}

const puedoConcederAlgo = (modulo: string) =>
  actions.value.some((a) => puedoConceder(modulo, a.key));

function cambiarDePuesto(rol: string) {
  if (haycambios.value && !confirm("Hay cambios sin guardar en este puesto. ¿Los descartas?")) return;
  borrador.value = clonar(original.value);
  rolActivo.value = rol;
}

function marcar(modulo: string, accion: Accion, valor: boolean) {
  const fila = borrador.value[rolActivo.value]?.[modulo];
  if (!fila) return;
  fila[accion] = valor;
  /* Hacer algo exige poder verlo: sin ver, la pantalla no se abre y el permiso
     sería inalcanzable. El backend lo normaliza igual; hacerlo aquí evita que
     la casilla mienta hasta que se guarde. */
  if (accion !== "view" && valor) fila.view = true;
  if (accion === "view" && !valor) {
    fila.create = false;
    fila.edit = false;
    fila.delete = false;
  }
}

function aplicarATodo(modo: "todo" | "lectura" | "nada") {
  for (const m of modulosVisibles.value) {
    for (const a of actions.value) {
      const quiere = modo === "todo" ? true : modo === "lectura" ? a.key === "view" : false;
      if (quiere && !puedoConceder(m.key, a.key)) continue;
      marcar(m.key, a.key, quiere);
    }
  }
}

// ── Agrupación y búsqueda ────────────────────────────────────

const modulosVisibles = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  if (!q) return modules.value;
  return modules.value.filter((m) => m.label.toLowerCase().includes(q));
});

const gruposVisibles = computed(() =>
  grupos.value
    .map((nombre) => ({ nombre, modulos: modulosVisibles.value.filter((m) => m.group === nombre) }))
    .filter((g) => g.modulos.length > 0),
);

/* Se guarda qué está CERRADO y no qué está abierto: así un grupo nuevo nace
   abierto, que es lo que se espera de algo que acaba de aparecer. */
const estaAbierto = (nombre: string) => busqueda.value.trim() !== "" || !cerrados.value.has(nombre);

function alternarGrupo(nombre: string) {
  const s = new Set(cerrados.value);
  s.has(nombre) ? s.delete(nombre) : s.add(nombre);
  cerrados.value = s;
}

const abrirTodo = (abrir: boolean) => {
  cerrados.value = abrir ? new Set() : new Set(grupos.value);
};

// ── Guardar ──────────────────────────────────────────────────

const haycambios = computed(() => Object.keys(cambiosPendientes()).length > 0);

function cambiosPendientes(): Matriz {
  const out: Matriz = {};
  for (const rol of roles.value) {
    if (!rol.editable) continue;
    for (const m of modules.value) {
      const antes = original.value[rol.key]?.[m.key];
      const ahora = borrador.value[rol.key]?.[m.key];
      if (!antes || !ahora) continue;
      if (actions.value.some((a) => antes[a.key] !== ahora[a.key])) {
        out[rol.key] ??= {};
        out[rol.key][m.key] = { ...ahora };
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
    const r = await $fetch<any>("/api/admin/permissions", { method: "PUT", body: cambios });
    original.value = clonar(r.matrix ?? borrador.value);
    borrador.value = clonar(original.value);

    /* Los rechazos se muestran uno a uno y no como "hubo errores": el backend
       aplica lo válido de un lote y rechaza el resto, así que decir solo que
       falló algo dejaría sin saber qué sí se guardó. */
    if (r.rechazos?.length) {
      for (const motivo of r.rechazos) {
        toast.add({ title: "No se aplicó", description: motivo, color: "warning" });
      }
    } else {
      toast.add({ title: "Permisos guardados", color: "success" });
    }

    /* Quien guardó puede haberse cambiado lo que ve en su propio menú, así que
       se vuelve a pedir. */
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
/* ── Puestos ─────────────────────────────────────────────── */
.rol-puestos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10.5rem, 1fr));
  gap: 0.6rem;
  margin-bottom: 0.9rem;
}

.rol-puesto {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 0.65rem 0.85rem;
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 12px;
  background: var(--sp-surface, #fff);
  text-align: left;
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease, box-shadow .15s ease;
}

.rol-puesto:hover:not(:disabled):not(.rol-puesto--gerente) {
  border-color: var(--sp-primary, #4f46e5);
}

.rol-puesto--activo {
  border-color: var(--sp-primary, #4f46e5);
  background: color-mix(in srgb, var(--sp-primary, #4f46e5) 7%, transparent);
  box-shadow: 0 0 0 1px var(--sp-primary, #4f46e5) inset;
}

.rol-puesto--bloqueado,
.rol-puesto--gerente {
  cursor: default;
  opacity: .72;
  background: var(--sp-surface-soft, #f9fafb);
}

.rol-puesto__nombre {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: .84rem;
  font-weight: 650;
  color: var(--sp-text, #111827);
}

.rol-puesto__cuenta {
  font-size: .7rem;
  color: var(--sp-text-muted, #6b7280);
}

/* ── Aviso ───────────────────────────────────────────────── */
.rol-aviso {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  padding: 10px 13px;
  margin-bottom: .9rem;
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 10px;
  background: var(--sp-surface-soft, #f9fafb);
  color: var(--sp-text-muted, #4b5563);
  font-size: .76rem;
  line-height: 1.5;
}

.rol-aviso svg { flex-shrink: 0; margin-top: 2px; }

/* ── Barra de trabajo ────────────────────────────────────── */
.rol-barra {
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 12px;
  background: var(--sp-surface-soft, #f9fafb);
  padding: .65rem .75rem;
  margin-bottom: .9rem;
}

.rol-barra__fila {
  display: flex;
  flex-wrap: wrap;
  gap: .5rem;
  align-items: center;
}

.rol-buscar {
  flex: 1 1 14rem;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: .4rem .65rem;
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 9px;
  background: var(--sp-surface, #fff);
  color: var(--sp-text-muted, #9ca3af);
}

/* Mismos reseteos que la casilla: admin-panel.css le pone a todo input
   min-height de 2.6rem, padding y un borde pensados para un campo suelto, y
   aquí el borde y el alto los pone el envoltorio .rol-buscar. */
.rol-buscar__input {
  flex: 1;
  width: auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
  border: 0;
  outline: 0;
  box-shadow: none;
  background: transparent;
  font-size: .8rem;
  color: var(--sp-text, #111827);
}

.rol-atajos { display: flex; gap: .35rem; }

.rol-atajo {
  padding: .35rem .7rem;
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 8px;
  background: var(--sp-surface, #fff);
  font-size: .74rem;
  color: var(--sp-text, #374151);
  cursor: pointer;
}

.rol-atajo:hover:not(:disabled) { border-color: var(--sp-primary, #4f46e5); }
.rol-atajo:disabled { opacity: .45; cursor: not-allowed; }
.rol-atajo--suave { border-color: transparent; color: var(--sp-text-muted, #6b7280); }

.rol-barra__pie {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: .5rem;
  margin-top: .55rem;
  font-size: .73rem;
  color: var(--sp-text-muted, #6b7280);
}

.rol-barra__pie strong { color: var(--sp-text, #111827); font-variant-numeric: tabular-nums; }
.rol-barra__plegar button { color: var(--sp-primary, #4f46e5); cursor: pointer; background: none; border: 0; font-size: .73rem; }
.rol-barra__plegar button:hover { text-decoration: underline; }
.rol-barra__sep { color: #d1d5db; margin: 0 .3rem; }

/* ── Grupos y filas ──────────────────────────────────────── */
.rol-grupo {
  border: 1px solid var(--sp-border, #e5e7eb);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: .6rem;
  background: var(--sp-surface, #fff);
}

.rol-grupo__cab {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: .6rem .8rem;
  background: var(--sp-surface, #fff);
  border: 0;
  cursor: pointer;
  text-align: left;
}

.rol-grupo__cab:hover { background: var(--sp-surface-soft, #f9fafb); }
.rol-grupo__flecha { color: var(--sp-text-muted, #9ca3af); transition: transform .15s ease; }
.rol-grupo__flecha--cerrada { transform: rotate(-90deg); }
.rol-grupo__nombre { flex: 1; font-size: .84rem; font-weight: 650; color: var(--sp-text, #111827); }
.rol-grupo__cuenta {
  font-size: .7rem;
  color: var(--sp-text-muted, #6b7280);
  font-variant-numeric: tabular-nums;
}

.rol-tabla { border-top: 1px solid var(--sp-border, #e5e7eb); }

.rol-fila {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) repeat(4, 3.6rem);
  align-items: center;
  padding: .3rem .8rem;
  border-bottom: 1px solid color-mix(in srgb, var(--sp-border, #e5e7eb) 60%, transparent);
  cursor: pointer;
}

.rol-fila:last-child { border-bottom: 0; }
.rol-fila:hover:not(.rol-fila--cab) { background: var(--sp-surface-soft, #f9fafb); }

.rol-fila--cab {
  cursor: default;
  background: var(--sp-surface-soft, #f9fafb);
  font-size: .68rem;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: var(--sp-text-muted, #6b7280);
}

.rol-fila--cab:hover { background: var(--sp-surface-soft, #f9fafb); }
.rol-fila--activa .rol-fila__modulo { color: var(--sp-text, #111827); font-weight: 600; }

.rol-fila__modulo {
  font-size: .8rem;
  color: var(--sp-text, #374151);
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.rol-fila__nota {
  font-size: .64rem;
  color: var(--sp-text-muted, #9ca3af);
  font-style: italic;
}

.rol-fila__accion { text-align: center; }

/*
 * La casilla, dibujada a mano.
 *
 * La del sistema se perdía sobre el fondo claro del panel y la fila parecía
 * no tener nada que marcar.
 *
 * Los tres reseteos de abajo NO son de adorno: admin-panel.css le da a todo
 * input del panel `width: 100%`, `min-height: 2.6rem` y `padding: .65rem
 * .9rem`, pensando en campos de texto. Fijar solo width y height no basta
 * —min-height gana sobre height, y con border-box un padding de .9rem a cada
 * lado fuerza el ancho aunque el width declarado sea menor—, y el resultado
 * eran rectángulos de 50px en vez de casillas.
 */
.rol-check {
  appearance: none;
  width: .9rem;
  height: .9rem;
  min-width: 0;
  min-height: 0;
  padding: 0;
  flex: none;
  border: 1.5px solid var(--sp-border-strong, #cbd5e1);
  border-radius: 4px;
  background: var(--sp-surface, #fff);
  box-shadow: none;
  cursor: pointer;
  position: relative;
  transition: background .12s ease, border-color .12s ease;
  vertical-align: middle;
}

.rol-check:hover:not(:disabled) { border-color: var(--sp-primary, #4f46e5); }

.rol-check:checked {
  background: var(--sp-primary, #4f46e5);
  border-color: var(--sp-primary, #4f46e5);
}

.rol-check:checked::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 46%;
  width: 3px;
  height: 6.5px;
  border: solid #fff;
  border-width: 0 1.5px 1.5px 0;
  /* Centrado con transform y no con left/top a pelo: así no hay que volver
     a medir si la casilla cambia de tamaño. */
  transform: translate(-50%, -50%) rotate(45deg);
}

.rol-check:focus-visible {
  outline: 2px solid var(--sp-primary, #4f46e5);
  outline-offset: 2px;
}

.rol-check:disabled {
  cursor: not-allowed;
  opacity: .4;
  background: var(--sp-surface-soft, #f3f4f6);
}

.rol-vacio,
.rol-pie {
  font-size: .78rem;
  color: var(--sp-text-muted, #6b7280);
  line-height: 1.5;
}

.rol-vacio { text-align: center; padding: 2rem 0; }
.rol-pie { margin-top: .85rem; }
</style>

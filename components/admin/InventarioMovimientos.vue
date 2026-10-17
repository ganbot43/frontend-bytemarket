<template>
  <div>
    <!-- Mismo buscador y misma barra de filtros que Productos. Antes esto
         era una fila hecha a mano con quince atributos style: un input sin
         lupa, un desplegable de productos flotante y un botón "Filtrar"
         que había que pulsar. -->
    <SharedBarraTabla v-model="busqueda" placeholder="Buscar producto en el kardex…">
      <template #filtros>
        <select v-model="filtros.type" class="sp-drawer-input sp-drawer-select bt-select">
          <option value="">Todos los movimientos</option>
          <option value="entry">Entradas</option>
          <option value="exit">Salidas</option>
          <option value="adjustment">Ajustes</option>
        </select>
      </template>
    </SharedBarraTabla>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Producto</th>
              <th class="sp-th">Movimiento</th>
              <th class="sp-th sp-th--center">Cantidad</th>
              <th class="sp-th sp-th--right">Cambio</th>
              <th class="sp-th">Motivo</th>
              <th class="sp-th">Usuario</th>
              <th class="sp-th">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in items" :key="m.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ m.productName || `#${m.productId}` }}</p>
              </td>
              <td class="sp-td">
                <span class="sp-badge" :class="BADGE[m.movementType] ?? 'sp-badge--neutral'">
                  <span class="sp-badge__dot" />
                  {{ TIPOS[m.movementType] ?? m.movementType }}
                </span>
              </td>
              <td class="sp-td sp-td--center">
                <span class="sp-table-num">{{ m.quantity }}</span>
              </td>
              <td class="sp-td sp-td--right">
                <span class="sp-table-num" :class="{
                  'mov-delta--sube': (m.delta ?? 0) > 0,
                  'mov-delta--baja': (m.delta ?? 0) < 0,
                }">{{ formatSigned(m.delta) }}</span>
              </td>
              <td class="sp-td">
                {{ m.reason || (m.relatedOrderId ? `Venta del pedido #${m.relatedOrderId}` : "—") }}
              </td>
              <td class="sp-td sp-td--muted">{{ m.createdByName || m.createdBy || "—" }}</td>
              <td class="sp-td sp-td--muted">
                <span class="sp-table-date">{{ formatDateTimeCompact(m.createdAt) }}</span>
              </td>
            </tr>

            <tr v-if="!items.length">
              <td colspan="7" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <ClipboardList class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">
                    {{ hayFiltro ? "No hay movimientos con esos filtros" : "No hay movimientos aún" }}
                  </p>
                  <button v-if="hayFiltro" class="sp-table-empty__cta" @click="limpiarFiltros">
                    Quitar filtros
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <SharedPaginacion v-model:pagina="page" :total="total" :limite="limit" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * El kardex: qué entró, qué salió y qué se ajustó.
 *
 * Era una página aparte con su propio botón de "Nuevo movimiento", un
 * formulario donde había que buscar el producto en un desplegable y elegir
 * entre "entrada", "salida" y "ajuste" sabiendo lo que significan. Esa
 * creación manual quedó de más cuando Existencias ganó el botón de ajustar
 * en la fila del producto: ahí ya sabes de qué producto hablas y se
 * pregunta qué pasó en vez de qué movimiento hacer.
 *
 * Así que esto es solo consulta, y vive como pestaña de Existencias para
 * poder pasar de "qué tengo" a "qué pasó" sin cambiar de pantalla.
 */
import { ClipboardList } from "lucide-vue-next";

const props = defineProps<{ producto?: number | null }>();

const { formatDateTimeCompact } = useFormatDateTime();

const TIPOS: Record<string, string> = {
  entry: "Entrada",
  exit: "Salida",
  adjustment: "Ajuste",
};

/* Los mismos colores que el resto del panel: verde lo que suma, rojo lo
   que resta, ámbar lo que corrige. Antes el tipo era texto pelado y el
   color vivía en un :style con los hex escritos a mano. */
const BADGE: Record<string, string> = {
  entry: "sp-badge--success",
  exit: "sp-badge--danger",
  adjustment: "sp-badge--warning",
};

const items = ref<any[]>([]);
const total = ref<number>(0);
const page = ref<number>(0);
const limit = ref<number>(10);
const busqueda = ref("");
const filtros = reactive<{ productId: number | null; type: string }>({
  productId: props.producto ?? null,
  type: "",
});

const hayFiltro = computed(
  () => Boolean(busqueda.value.trim() || filtros.type || filtros.productId),
);

function formatSigned(n: number | null | undefined) {
  if (n === null || n === undefined) return "";
  const v = Number(n);
  return v > 0 ? `+${v}` : `${v}`;
}

async function fetchMovements() {
  try {
    const params: any = {
      limit: limit.value,
      offset: page.value * limit.value,
    };
    if (filtros.productId) params.productId = filtros.productId;
    if (filtros.type) params.type = filtros.type;
    if (busqueda.value.trim()) params.q = busqueda.value.trim();
    const res: any = await $fetch("/api/admin/inventory/movements", {
      query: params,
    });
    items.value = res?.data || [];
    total.value = res?.total ?? items.value.length;
  } catch {
    items.value = [];
    total.value = 0;
  }
}

function limpiarFiltros() {
  busqueda.value = "";
  filtros.type = "";
  filtros.productId = null;
  page.value = 0;
  fetchMovements();
}

/* Cuando Existencias manda un producto, el filtro cambia solo. */
watch(
  () => props.producto,
  (id) => {
    filtros.productId = id ?? null;
    page.value = 0;
    fetchMovements();
  },
);

watch([busqueda, () => filtros.type], () => {
  page.value = 0;
  fetchMovements();
});

watch(page, () => fetchMovements());

onMounted(fetchMovements);
</script>

<template>
  <div class="sp-page caja-page">
    <!-- Cabecera y cambio de modo -->
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">{{ esPedido ? "Nuevo pedido" : "Caja" }}</h1>
        <p class="sp-page-toolbar__sub">
          {{ esPedido
            ? "Registra un pedido que llegó por WhatsApp, redes o teléfono"
            : "Venta en el local: cobra, calcula el vuelto y descuenta stock" }}
        </p>
      </div>
      <div class="caja-modo">
        <button class="caja-modo__btn" :class="{ 'caja-modo__btn--on': !esPedido }" @click="setModo(false)">
          Caja
        </button>
        <button class="caja-modo__btn" :class="{ 'caja-modo__btn--on': esPedido }" @click="setModo(true)">
          Pedido
        </button>
      </div>
    </div>

    <!-- El turno solo rige la caja. Un pedido de WhatsApp no pasa por
         el cajón: se cobra después, por Yape o transferencia. -->
    <AdminCajaTurno v-if="!esPedido" v-model:abierta="cajaAbierta" />

    <!-- ── Voucher de comercio ────────────────────────────────── -->
    <!-- Se imprime ANTES que la boleta y se lo queda el cajero: es el
         papel contra el que se cuadra la tarjeta y el QR al cerrar el
         turno. En efectivo no sale, porque allí el comprobante es el
         propio dinero. -->
    <Teleport to="body">
      <div v-if="papelVoucher && hecho?.voucher" class="sp-papel">
        <header class="sp-papel__head">
          <p class="sp-papel__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="sp-papel__meta">RUC {{ negocio.ruc }}</p>
          <p v-if="negocio.address" class="sp-papel__meta">{{ negocio.address }}</p>
        </header>

        <p class="sp-papel__kind">Voucher de comercio</p>
        <p class="sp-papel__destacado">{{ hecho.voucher }}</p>

        <dl class="sp-papel__info">
          <div><dt>Forma de pago</dt><dd>{{ hecho.formaDePago }}</dd></div>
          <div><dt>Importe</dt><dd>S/ {{ hecho.total.toFixed(2) }}</dd></div>
          <div><dt>Fecha</dt><dd>{{ hecho.fecha }}</dd></div>
          <div><dt>Cajero</dt><dd>{{ hecho.cajero }}</dd></div>
          <div><dt>Boleta</dt><dd>{{ hecho.boleta || hecho.orderCode }}</dd></div>
          <div><dt>Pedido</dt><dd>{{ hecho.orderCode }}</dd></div>
        </dl>

        <!-- La tarjeta se firma; el QR no, que lo confirma el teléfono. -->
        <div v-if="hecho.paymentType === 'tarjeta'" class="sp-papel__firmas">
          <div><span>Firma del cliente</span><p>&nbsp;</p></div>
        </div>

        <p class="sp-papel__pie">
          Copia para el comercio. Guárdalo: con él se cuadra la caja al
          cerrar el turno.
        </p>
      </div>
    </Teleport>

    <!-- ── Comprobante de la venta cerrada ───────────────────── -->
    <div v-if="hecho" class="caja-ticket-wrap">
      <div id="caja-comprobante" class="caja-ticket">
        <header class="caja-ticket__head">
          <p class="caja-ticket__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="caja-ticket__meta">RUC {{ negocio.ruc }}</p>
          <p v-if="negocio.address" class="caja-ticket__meta">{{ negocio.address }}</p>
          <p v-if="negocio.whatsapp" class="caja-ticket__meta">{{ negocio.whatsapp }}</p>
        </header>

        <!-- La boleta es lo que se lleva el cliente, así que su número es
             lo primero y lo más grande. El código interno del pedido baja a
             ser una referencia: sirve para buscarlo en el panel, no para
             identificar el comprobante. -->
        <p class="caja-ticket__kind">
          {{ hecho.boleta ? "Boleta de venta" : "Comprobante de venta" }}
        </p>
        <p v-if="hecho.boleta" class="caja-ticket__boleta">{{ hecho.boleta }}</p>

        <dl class="caja-ticket__info">
          <div>
            <dt>Pedido</dt>
            <dd class="caja-ticket__strong">{{ hecho.orderCode }}</dd>
          </div>
          <div>
            <dt>Fecha</dt>
            <dd>{{ hecho.fecha }}</dd>
          </div>
          <div>
            <dt>Atendió</dt>
            <dd>{{ hecho.cajero }}</dd>
          </div>
          <div v-if="hecho.cliente">
            <dt>Cliente</dt>
            <dd>{{ hecho.cliente }}</dd>
          </div>
        </dl>

        <table class="caja-ticket__items">
          <thead>
            <tr>
              <th class="caja-ticket__c">Cant</th>
              <th>Descripción</th>
              <th class="caja-ticket__num">P. Unit</th>
              <th class="caja-ticket__num">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in hecho.lineas" :key="l.productId">
              <td class="caja-ticket__c">{{ l.quantity }}</td>
              <td>{{ l.name }}</td>
              <td class="caja-ticket__num">{{ l.unitPrice.toFixed(2) }}</td>
              <td class="caja-ticket__num">{{ (l.unitPrice * l.quantity).toFixed(2) }}</td>
            </tr>
          </tbody>
        </table>

        <dl class="caja-ticket__totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{{ money(hecho.subtotal) }}</dd>
          </div>
          <div v-if="hecho.descuento > 0" class="caja-ticket__desc">
            <dt>Descuento{{ hecho.cupon ? ` (${hecho.cupon})` : "" }}</dt>
            <dd>-{{ money(hecho.descuento) }}</dd>
          </div>
          <div class="caja-ticket__total">
            <dt>TOTAL</dt>
            <dd>{{ money(hecho.total) }}</dd>
          </div>
        </dl>

        <dl class="caja-ticket__pago">
          <div>
            <dt>Forma de pago</dt>
            <dd>{{ hecho.formaDePago }}</dd>
          </div>
          <template v-if="hecho.recibido != null">
            <div>
              <dt>Recibido</dt>
              <dd>{{ money(hecho.recibido) }}</dd>
            </div>
            <div class="caja-ticket__vuelto">
              <dt>Vuelto</dt>
              <dd>{{ money(hecho.vuelto ?? 0) }}</dd>
            </div>
          </template>
          <div>
            <dt>Artículos</dt>
            <dd>{{ hecho.unidades }}</dd>
          </div>
        </dl>

        <footer class="caja-ticket__foot">
          <p class="caja-ticket__thanks">¡Gracias por su compra!</p>
          <!-- El papel lleva serie y correlativo, que es lo que lo hace
               rastreable, pero esto NO es una boleta electrónica de SUNAT:
               no hay XML firmado ni envío a un OSE. La nota lo dice sin
               contradecir la cabecera —matiza, no niega— porque darlo por
               fiscal sin estarlo es un problema legal, no de diseño. -->
          <p class="caja-ticket__legal">
            Numeración interna del negocio. No constituye comprobante de pago
            electrónico autorizado por SUNAT.
          </p>
        </footer>
      </div>

      <div class="caja-ticket__actions">
        <button class="sp-page-btn" @click="nuevaVenta">Nueva venta</button>
        <!-- Cuando hay voucher salen los dos papeles en orden: primero el
             del comercio y encima la boleta del cliente. Reimprimir solo
             uno se puede, que a veces es lo que falla. -->
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="hecho.voucher ? imprimirTodo() : imprimir()">
          {{ hecho.voucher ? "Imprimir voucher y boleta" : "Imprimir boleta" }}
        </button>
        <button v-if="hecho.voucher" class="sp-drawer-btn sp-drawer-btn--ghost" @click="imprimirVoucher">
          Solo el voucher
        </button>
        <a v-if="hecho.whatsapp" :href="hecho.whatsapp" target="_blank" rel="noopener"
          class="sp-drawer-btn sp-drawer-btn--ghost">Avisar por WhatsApp</a>
        <NuxtLink :to="`/admin/pedidos?buscar=${hecho.orderCode}`" class="sp-drawer-btn sp-drawer-btn--ghost">
          Ver el pedido
        </NuxtLink>
      </div>
    </div>
    <!-- Sin turno abierto no se vende: una venta que no pertenece a
         ningún turno no sale en ningún arqueo, y basta una para que el
         cuadre del día deje de significar nada. El aviso lo da el propio
         componente del turno, arriba. -->
    <!-- "Abre la caja" decía antes, y al cajero eso le pedía algo que no
         puede hacer: la apertura es de su jefe. El aviso de arriba ya
         explica a quién pedírsela. -->
    <div v-else-if="!esPedido && !cajaAbierta" class="caja-bloqueada">
      <p>Sin una caja aperturada no se puede cobrar.</p>
    </div>

    <!-- ── Pantalla de venta ─────────────────────────────────── -->
    <div v-else class="caja-grid">
      <!-- Catálogo -->
      <section class="caja-catalogo">
        <input ref="buscadorRef" v-model="q" class="caja-buscador" type="search"
          placeholder="Busca por nombre, o escanea el código…" @keydown.enter.prevent="agregarDesdeBuscador" />

        <p v-if="buscando" class="caja-hint">Buscando…</p>
        <p v-else-if="!productos.length" class="caja-hint">
          {{ q ? "Ningún producto coincide." : "No hay productos activos." }}
        </p>

        <div class="caja-productos">
          <button v-for="p in productos" :key="p.id" class="caja-producto"
            :class="{ 'caja-producto--off': sinStock(p) }" :disabled="sinStock(p)" @click="agregar(p)">
            <SharedImagen :src="p.images?.[0]?.url" :alt="p.name" class="caja-producto__img" />
            <span class="caja-producto__name">{{ p.name }}</span>
            <span class="caja-producto__price">{{ money(p.price) }}</span>
            <span class="caja-producto__stock" :class="{ 'caja-producto__stock--low': p.trackStock && p.stock <= 5 }">
              {{ p.trackStock ? `${p.stock} en stock` : "sin control de stock" }}
            </span>
          </button>
        </div>
      </section>

      <!-- Venta en curso -->
      <section class="caja-venta">
        <h2 class="caja-venta__title">
          Venta en curso
          <span v-if="unidades" class="caja-venta__badge">{{ unidades }}</span>
        </h2>

        <p v-if="!lineas.length" class="caja-hint">
          Toca un producto para agregarlo.
        </p>

        <ul v-else class="caja-lineas">
          <li v-for="(l, i) in lineas" :key="l.productId" class="caja-linea">
            <div class="caja-linea__top">
              <span class="caja-linea__name">{{ l.name }}</span>
              <button class="caja-linea__del" title="Quitar" @click="quitar(i)">&times;</button>
            </div>
            <div class="caja-linea__ctrl">
              <div class="caja-step">
                <button @click="paso(i, -1)" :disabled="l.quantity <= 1">&minus;</button>
                <input v-model.number="l.quantity" type="number" min="1" max="999" />
                <button @click="paso(i, 1)">+</button>
              </div>
              <!-- Al cajero el precio se le enseña, no se le da a escribir:
                   el servicio le rechaza cualquier otro, y un campo que
                   siempre devuelve error es peor que no tenerlo. -->
              <label v-if="puedeTocarPrecios" class="caja-precio">
                <span>Precio</span>
                <input v-model.number="l.unitPrice" type="number" min="0" step="0.10" />
              </label>
              <span v-else class="caja-precio caja-precio--fijo">
                <span>Precio</span>
                <strong>{{ money(l.unitPrice) }}</strong>
              </span>
              <span class="caja-linea__sub">{{ money((l.unitPrice || 0) * (l.quantity || 0)) }}</span>
            </div>
            <p v-if="l.trackStock && l.quantity > l.stock" class="caja-linea__warn">
              Solo quedan {{ l.stock }} unidades
            </p>
          </li>
        </ul>

        <!-- Datos del cliente: solo para pedidos -->
        <div v-if="esPedido" class="caja-cliente">
          <div class="caja-field">
            <label>Canal</label>
            <select v-model="canal" class="sp-drawer-input sp-drawer-select">
              <option v-for="c in canales" :key="c.value" :value="c.value">{{ c.label }}</option>
            </select>
          </div>
          <div class="caja-field">
            <label>Nombre del cliente *</label>
            <input v-model="cliente.customerName" type="text" class="sp-drawer-input" placeholder="Nombre y apellido" />
          </div>
          <div class="caja-field">
            <label>Teléfono</label>
            <input v-model="cliente.customerPhone" type="tel" class="sp-drawer-input" placeholder="987654321" />
          </div>
          <div class="caja-field">
            <label>Correo</label>
            <input v-model="cliente.customerEmail" type="email" class="sp-drawer-input" placeholder="cliente@correo.com" />
          </div>
          <div class="caja-field caja-field--wide">
            <label>Dirección</label>
            <input v-model="cliente.customerAddress" type="text" class="sp-drawer-input" placeholder="Dirección de entrega" />
          </div>
          <div class="caja-field caja-field--wide">
            <label>Nota</label>
            <input v-model="cliente.customerNotes" type="text" class="sp-drawer-input" placeholder="Referencia, indicaciones…" />
          </div>
        </div>

        <!-- Cobro -->
        <div class="caja-cobro">
          <div v-if="puedeTocarPrecios" class="caja-field">
            <label>Descuento</label>
            <input v-model.number="descuento" type="number" class="sp-drawer-input" min="0" step="0.10" />
          </div>
          <!-- El cupón es de la tienda web. En el mostrador no se aplica:
               dejarlo teclear aquí lo convierte en un descuento a mano con
               otro nombre, y además salta por encima de la regla de que el
               cajero no descuenta. El servicio lo rechaza igual. -->
          <div v-if="esPedido" class="caja-field">
            <label>Cupón</label>
            <input v-model="cupon" type="text" class="sp-drawer-input" placeholder="Código" />
          </div>
          <div class="caja-field">
            <label>Forma de pago</label>
            <select v-model="formaDePago" class="sp-drawer-input sp-drawer-select">
              <option v-for="p in formasDePago" :key="p.value" :value="p.value">{{ p.label }}</option>
            </select>
          </div>
          <div v-if="esPedido" class="caja-field">
            <label>Estado del pago</label>
            <select v-model="pagado" class="sp-drawer-input sp-drawer-select">
              <option :value="true">Cobrado</option>
              <option :value="false">Por cobrar</option>
            </select>
          </div>
          <div v-if="formaDePago === 'efectivo'" class="caja-field">
            <label>Efectivo recibido</label>
            <input v-model.number="efectivo" type="number" class="sp-drawer-input" min="0" step="0.10" placeholder="0.00" />
          </div>
          <!-- Sin campo para el voucher: el cliente paga, se confirma, y
               el sistema emite el voucher de comercio con su número. Pedirlo
               a mano era teclear un dato que ya tenemos y que así podía
               escribirse mal justo en lo que sirve para cuadrar. -->
        </div>

        <dl class="caja-totales">
          <div>
            <dt>Subtotal</dt>
            <dd>{{ money(subtotal) }}</dd>
          </div>
          <div v-if="descuentoAplicado > 0" class="caja-totales__desc">
            <dt>Descuento</dt>
            <dd>-{{ money(descuentoAplicado) }}</dd>
          </div>
          <div class="caja-totales__total">
            <dt>Total</dt>
            <dd>{{ money(total) }}</dd>
          </div>
          <div v-if="vuelto != null" class="caja-totales__vuelto" :class="{ 'caja-totales__vuelto--bad': vuelto < 0 }">
            <dt>{{ vuelto < 0 ? "Falta" : "Vuelto" }}</dt>
            <dd>{{ money(Math.abs(vuelto)) }}</dd>
          </div>
        </dl>

        <p v-if="error" class="caja-error">{{ error }}</p>

        <div class="caja-acciones">
          <button class="sp-page-btn caja-cobrar" :disabled="!puedeCobrar || guardando" @click="cobrar">
            {{ guardando ? "Registrando…" : esPedido ? "Registrar pedido" : `Cobrar ${money(total)}` }}
          </button>
          <button v-if="lineas.length" class="sp-drawer-btn sp-drawer-btn--ghost" @click="limpiar">
            Vaciar
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Caja del local y registro de pedidos manuales.
 *
 * Dos modos en la misma pantalla porque son el mismo gesto —elegir
 * productos y cobrar— con dos finales distintos: la caja entrega en el acto
 * y el pedido hay que enviarlo. Separarlos en dos páginas duplicaría el
 * buscador, las líneas y los totales.
 */
definePageMeta({ middleware: "auth", layout: "admin" });

interface Producto {
  id: number;
  name: string;
  price: number;
  stock: number;
  trackStock: boolean;
  images?: Array<{ url: string }>;
}
interface Linea {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  stock: number;
  trackStock: boolean;
}

const route = useRoute();
const router = useRouter();
const { nombre } = useLogo();
// Los datos del negocio (RUC, dirección, WhatsApp) van impresos en el
// comprobante: un papel sin ellos no sirve para que el cliente vuelva.
const negocio = computed<any>(() => useBusinessConfig().value ?? {});
const { user } = useUserSession();
const formatPrice = useFormatPrice();
const money = (n: number) => formatPrice.format(Number.isFinite(n) ? n : 0);

const esPedido = computed(() => route.query.tipo === "pedido");
useSeoMeta({ title: () => `${esPedido.value ? "Nuevo pedido" : "Caja"} · Admin` });
const setModo = (pedido: boolean) => {
  /* El cupón se queda escrito al cambiar de modo y el campo desaparece,
     así que de caja saldría un código invisible que el servicio rechaza.
     Mejor vaciarlo aquí que explicar un error que nadie ve venir. */
  if (!pedido) cupon.value = "";
  router.replace({ query: pedido ? { tipo: "pedido" } : {} });
};

// ── Catálogo ────────────────────────────────────────────────
// Se reutiliza /api/admin/products, que ya filtra y pagina: no hacía falta
// un endpoint nuevo para el buscador de la caja.
const q = ref("");
const productos = ref<Producto[]>([]);
const buscando = ref(false);
const buscadorRef = ref<HTMLInputElement>();
let temporizador: ReturnType<typeof setTimeout> | undefined;

async function buscar() {
  buscando.value = true;
  try {
    const res: any = await $fetch("/api/admin/products", {
      query: { limit: 24, offset: 0, isActive: 1, q: q.value || undefined },
    });
    productos.value = res?.data ?? [];
  } catch {
    productos.value = [];
  } finally {
    buscando.value = false;
  }
}
// Espera corta mientras se escribe: sin ella, cada letra es una petición.
watch(q, () => {
  clearTimeout(temporizador);
  temporizador = setTimeout(buscar, 250);
});

const sinStock = (p: Producto) => p.trackStock && p.stock <= 0;

// ── Venta en curso ──────────────────────────────────────────
// Se guarda en el navegador: una venta a medias no puede perderse porque
// alguien recargue la página o se le cierre la pestaña.
const BORRADOR = "bytemarket-caja-venta";
/** Lo mantiene AdminCajaTurno; aquí solo decide si se puede cobrar. */
const cajaAbierta = ref(false);

const lineas = ref<Linea[]>([]);

onMounted(() => {
  try {
    const guardado = localStorage.getItem(BORRADOR);
    if (guardado) lineas.value = JSON.parse(guardado);
  } catch {
    /* un borrador corrupto no debe impedir abrir la caja */
  }
  buscar();
  // En computadora el cursor va al buscador, que es lo que necesita el
  // lector de códigos. En celular no, porque abriría el teclado tapando
  // media pantalla.
  if (window.innerWidth > 1024) buscadorRef.value?.focus();
});

watch(lineas, (v) => {
  try {
    localStorage.setItem(BORRADOR, JSON.stringify(v));
  } catch {
    /* sin almacenamiento la caja sigue funcionando, solo sin borrador */
  }
}, { deep: true });

function agregar(p: Producto) {
  const existente = lineas.value.find((l) => l.productId === p.id);
  if (existente) existente.quantity++;
  else
    lineas.value.push({
      productId: p.id,
      name: p.name,
      quantity: 1,
      unitPrice: p.price,
      stock: p.stock,
      trackStock: p.trackStock,
    });
}

/**
 * Enter en el buscador agrega directamente si no hay ambigüedad.
 *
 * Es lo que hace que un lector de código de barras funcione sin
 * configurarlo: el lector teclea el código y pulsa Enter.
 */
async function agregarDesdeBuscador() {
  clearTimeout(temporizador);
  await buscar();
  const disponibles = productos.value.filter((p) => !sinStock(p));
  if (disponibles.length === 1) {
    agregar(disponibles[0]!);
    q.value = "";
  }
}

const quitar = (i: number) => lineas.value.splice(i, 1);
function paso(i: number, delta: number) {
  const l = lineas.value[i]!;
  l.quantity = Math.max(1, Math.min(999, (Number(l.quantity) || 1) + delta));
}

// ── Cobro ───────────────────────────────────────────────────
const { data: opciones } = await useFetch<any>("/api/admin/orders/sale-options");
/*
 * En el mostrador se cobra con menos formas que en un pedido.
 *
 * Nada de transferencia: el cliente está delante y se va con el producto,
 * y una transferencia hay que esperar a verla en el banco. Y de los QR
 * solo salen los que el negocio tenga dados de alta —lo decide el
 * servidor, que es quien sabe cuáles existen—.
 */
const formasDePago = computed(() => {
  const todas = opciones.value?.paymentTypes ?? [{ value: "efectivo", label: "Efectivo" }];
  if (esPedido.value) return todas;
  return opciones.value?.cashPaymentTypes ?? [{ value: "efectivo", label: "Efectivo" }];
});

/* Si se cambia a caja con una forma que allí no vale, hay que moverla: si
   no, el desplegable se queda en blanco y el cobro revienta al enviarlo. */
watch(formasDePago, (lista) => {
  if (lista.length && !lista.some((f: any) => f.value === formaDePago.value)) {
    formaDePago.value = lista[0].value;
  }
});
const canales = computed(() => opciones.value?.channels ?? [{ value: "whatsapp", label: "WhatsApp" }]);

const canal = ref("whatsapp");
const formaDePago = ref("efectivo");
const descuento = ref(0);

/*
 * Quién puede mover el precio de una línea o aplicar un descuento a mano.
 *
 * En el mostrador se regatea, así que el encargado y el jefe de ventas sí.
 * El cajero no: con el precio en sus manos, el arqueo deja de servir para
 * lo que existe —vendiendo a 10 lo que vale 155, el cajón cuadra perfecto
 * y los 145 no aparecen en ningún sitio—. El servicio lo rechaza igual;
 * esto solo evita enseñarle un campo que siempre le va a rebotar.
 */
const puedeTocarPrecios = computed(() => (user.value as any)?.role !== "cajero");
const cupon = ref("");
/* El papel del voucher se monta solo mientras se imprime: si se quedara
   montado, la regla de impresión lo sacaría junto a cualquier otro. */
const papelVoucher = ref(false);
const { imprimirPapel } = useImpresion();
const pagado = ref(true);
const efectivo = ref<number | null>(null);

const vacio = () => ({
  customerName: "", customerPhone: "", customerEmail: "",
  customerAddress: "", customerNotes: "",
});
const cliente = reactive(vacio());

const unidades = computed(() => lineas.value.reduce((a, l) => a + (Number(l.quantity) || 0), 0));
const subtotal = computed(() =>
  Math.round(lineas.value.reduce((a, l) => a + (Number(l.unitPrice) || 0) * (Number(l.quantity) || 0), 0) * 100) / 100,
);
// El cupón lo calcula el servidor; aquí solo se refleja el descuento a mano
// para que el total de pantalla no mienta antes de enviar.
const descuentoAplicado = computed(() => Math.min(Number(descuento.value) || 0, subtotal.value));
const total = computed(() => Math.round((subtotal.value - descuentoAplicado.value) * 100) / 100);
const vuelto = computed(() =>
  formaDePago.value === "efectivo" && efectivo.value != null && efectivo.value > 0
    ? Math.round((efectivo.value - total.value) * 100) / 100
    : null,
);

const guardando = ref(false);
const error = ref("");
const ticketRef = ref<HTMLElement>();

const puedeCobrar = computed(() => {
  if (!lineas.value.length) return false;
  if (esPedido.value && cliente.customerName.trim().length < 2) return false;
  if (vuelto.value != null && vuelto.value < 0) return false;
  return true;
});

const hecho = ref<null | {
  orderCode: string; boleta: string | null; voucher: string | null; paymentType: string | null;
  total: number; subtotal: number; descuento: number; cupon: string | null;
  formaDePago: string; recibido: number | null; vuelto: number | null; fecha: string;
  lineas: Linea[]; whatsapp: string | null; cajero: string; cliente: string; unidades: number;
}>(null);

async function cobrar() {
  error.value = "";
  if (!puedeCobrar.value) return;
  guardando.value = true;
  try {
    const res: any = await $fetch("/api/admin/orders", {
      method: "POST",
      body: {
        channel: esPedido.value ? canal.value : "caja",
        ...(esPedido.value ? cliente : {}),
        items: lineas.value.map((l) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
        })),
        discount: Number(descuento.value) || 0,
        couponCode: esPedido.value ? cupon.value.trim() || null : null,
        paymentType: formaDePago.value,
        paymentStatus: esPedido.value && !pagado.value ? "pending" : "paid",
        cashReceived: formaDePago.value === "efectivo" ? efectivo.value : null,
      },
    });

    const tel = (cliente.customerPhone || "").replace(/\D/g, "");
    const waTel = /^9\d{8}$/.test(tel) ? `51${tel}` : tel;
    hecho.value = {
      orderCode: res.orderCode,
      // Null mientras la venta esté por cobrar: la boleta acompaña al
      // dinero, y un pedido de WhatsApp sin pagar todavía no la tiene.
      boleta: res.boleta ?? null,
      // El voucher de comercio que emitió el sistema. Null en efectivo.
      voucher: res.voucher ?? null,
      paymentType: res.paymentType ?? null,
      total: res.total,
      subtotal: res.subtotal,
      descuento: res.discountApplied ?? 0,
      cupon: res.couponCode ?? null,
      formaDePago: res.paymentMethodLabel,
      recibido: res.cashReceived ?? null,
      vuelto: res.change ?? null,
      fecha: new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima", dateStyle: "short", timeStyle: "short",
      }).format(new Date(res.createdAt)),
      lineas: lineas.value.map((l) => ({ ...l })),
      // Quién atendió queda impreso: con varias personas en el mostrador es
      // lo único que permite rastrear una venta mal cobrada.
      cajero: (user.value as any)?.name ?? "Panel",
      cliente: res.customerName ?? "",
      unidades: unidades.value,
      whatsapp: waTel.length >= 9
        ? `https://wa.me/${waTel}?text=${encodeURIComponent(
          `Hola${cliente.customerName ? ` ${cliente.customerName.split(" ")[0]}` : ""}, registramos tu pedido ${res.orderCode} por ${money(res.total)}.`,
        )}`
        : null,
    };

    useAppToast().add({
      title: esPedido.value ? "Pedido registrado" : "Venta cobrada",
      description: `${res.orderCode} · ${money(res.total)}`,
      color: "success",
    });
    // El stock cambió: se recarga para que la próxima venta lo vea.
    buscar();
  } catch (e: any) {
    error.value = e?.data?.message ?? "No se pudo registrar la venta";
  } finally {
    guardando.value = false;
  }
}

function limpiar() {
  lineas.value = [];
  descuento.value = 0;
  cupon.value = "";
  efectivo.value = null;
  pagado.value = true;
  Object.assign(cliente, vacio());
  error.value = "";
}

function nuevaVenta() {
  hecho.value = null;
  limpiar();
  nextTick(() => {
    if (window.innerWidth > 1024) buscadorRef.value?.focus();
  });
}

/* La clase se pone y se quita alrededor de la impresión: es lo que decide
   qué sale en la hoja, y dejarla puesta estropearía la siguiente impresión
   de cualquier otra pantalla. */
const imprimir = () => {
  document.body.classList.add("sp-imprimiendo-ticket");
  window.print();
  document.body.classList.remove("sp-imprimiendo-ticket");
};

/** El voucher de comercio, que va aparte y antes. */
async function imprimirVoucher() {
  if (!hecho.value?.voucher) return;
  papelVoucher.value = true;
  await imprimirPapel();
  papelVoucher.value = false;
}

/*
 * Los dos papeles, en el orden en que salen por la impresora.
 *
 * Primero el voucher de comercio —que firma el cliente y se queda el
 * cajero— y encima la boleta que se lleva él. Son dos diálogos de
 * impresión seguidos a propósito: son dos papeles distintos, y juntarlos
 * en uno dejaría al cajero recortando.
 */
async function imprimirTodo() {
  await imprimirVoucher();
  imprimir();
}
</script>

<style scoped>
.caja-page {
  padding-bottom: 2rem;
}

/* ── Cambio de modo ── */
.caja-modo {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 10px;
  background: var(--sp-surface-2, #f1f5f9);
}

.caja-modo__btn {
  padding: 0.45rem 1rem;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--sp-text-muted, #64748b);
  cursor: pointer;
}

.caja-modo__btn--on {
  background: #fff;
  color: var(--sp-text, #0f172a);
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.1);
}

/* ── Dos columnas: catálogo y venta ── */
.caja-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 1024px) {
  .caja-grid {
    grid-template-columns: 1fr;
  }
}

.caja-catalogo,
.caja-venta {
  background: var(--sp-surface, #fff);
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 14px;
  padding: 1rem;
}

/* Pegajosa, pero con alto máximo y scroll propio.
   Sin el max-height, una venta con varias líneas hacía la tarjeta más alta
   que la pantalla y el navegador recortaba la cabecera: el título "Venta en
   curso" quedaba cortado y no había forma de volver a verlo. */
.caja-venta {
  position: sticky;
  top: 1rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .caja-venta {
    position: static;
    max-height: none;
    overflow: visible;
  }
}

.caja-buscador {
  width: 100%;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 10px;
  font-size: 0.95rem;
}

.caja-buscador:focus {
  outline: 2px solid var(--sp-primary, #071e52);
  outline-offset: 1px;
}

.caja-hint {
  margin: 0.9rem 0;
  font-size: 0.85rem;
  color: var(--sp-text-muted, #64748b);
}

/* ── Productos ── */
.caja-productos {
  margin-top: 0.9rem;
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
}

.caja-producto {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 12px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.12s, transform 0.12s;
}

.caja-producto:hover:not(:disabled) {
  border-color: var(--sp-primary, #071e52);
  transform: translateY(-2px);
}

.caja-producto--off {
  opacity: 0.45;
  cursor: not-allowed;
}

.caja-producto__img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  background: #f1f5f9;
}

.caja-producto__name {
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.25;
}

.caja-producto__price {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--sp-primary, #071e52);
}

.caja-producto__stock {
  font-size: 0.7rem;
  color: var(--sp-text-muted, #64748b);
}

.caja-producto__stock--low {
  color: #b45309;
  font-weight: 600;
}

/* ── Líneas de la venta ── */
/* Queda fijo arriba mientras se recorre la venta por dentro. */
.caja-venta__title {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: -1rem -1rem 0.8rem;
  padding: 1rem 1rem 0.7rem;
  background: var(--sp-surface, #fff);
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.caja-venta__badge {
  padding: 0.1rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background: var(--sp-primary, #071e52);
  color: #fff;
}

/* Sin scroll propio: lo lleva la tarjeta. Dos barras de desplazamiento
   anidadas en la misma columna hacían imposible llegar al botón de cobrar. */
.caja-lineas {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.caja-linea {
  padding: 0.6rem;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 10px;
}

.caja-linea__top {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.caja-linea__name {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.3;
}

.caja-linea__del {
  border: 0;
  background: transparent;
  font-size: 1.1rem;
  line-height: 1;
  color: #64748b;
  cursor: pointer;
}

.caja-linea__del:hover {
  color: #dc2626;
}

.caja-linea__ctrl {
  margin-top: 0.5rem;
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.caja-linea__sub {
  margin-left: auto;
  font-size: 0.95rem;
  font-weight: 800;
  white-space: nowrap;
}

.caja-linea__warn {
  margin: 0.4rem 0 0;
  font-size: 0.72rem;
  color: #b45309;
}

/* Las flechitas nativas de <input type="number"> se quitan en toda la caja.
   En el contador de cantidad ocupaban el ancho entero del campo y TAPABAN el
   número: no se veía cuántas unidades llevaba la línea. Y donde sí caben
   sobran igual, porque al lado ya están los botones - y +. */
.caja-page input[type="number"] {
  appearance: textfield;
  -moz-appearance: textfield;
}

.caja-page input[type="number"]::-webkit-outer-spin-button,
.caja-page input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}

.caja-step {
  display: inline-flex;
  align-items: stretch;
  flex: 0 0 auto;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
}

.caja-step button {
  /* 44px en táctil: la caja se usa de pie en el mostrador, muchas veces en
     tablet, y este es el control que más se pulsa de toda la pantalla. */
  width: 30px;
  border: 0;
  background: #f1f5f9;
  color: #334155;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  font-weight: 600;
}

@media (pointer: coarse) {

  .caja-step button,
  .caja-step input {
    height: 44px;
  }

  .caja-step button {
    width: 44px;
  }

  .caja-step input {
    width: 56px;
  }
}

.caja-step button:hover:not(:disabled) {
  background: #e2e8f0;
}

.caja-step button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.caja-step input {
  width: 46px;
  height: 32px;
  border: 0;
  border-left: 1px solid var(--sp-border, #e2e8f0);
  border-right: 1px solid var(--sp-border, #e2e8f0);
  text-align: center;
  font-size: 0.9rem;
  font-weight: 700;
  background: #fff;
}

.caja-precio {
  display: inline-flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.caja-precio span {
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
}

.caja-precio input {
  width: 84px;
  height: 32px;
  padding: 0 0.5rem;
  text-align: right;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

/* La misma caja que el campo, sin borde: la fila no cambia de altura
   según quién esté mirando. */
.caja-precio--fijo strong {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 84px;
  height: 32px;
  padding: 0 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--sp-text-strong, #0f172a);
}

/* ── Formularios ── */
.caja-cliente,
.caja-cobro {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
  padding-top: 0.9rem;
  border-top: 1px dashed var(--sp-border, #e2e8f0);
}

.caja-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.caja-field--wide {
  grid-column: 1 / -1;
}

.caja-field label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  font-weight: 600;
}

/* Los campos usan .sp-drawer-input / .sp-drawer-select del panel, que es lo
   que ya usa el resto del admin.
   Tenían estilo propio aquí y los <select> salían más bajos que los
   <input>: el mismo padding no da la misma altura en un select, porque el
   navegador le suma su propia caja. El panel ya lo resolvía con
   appearance:none y un chevron dibujado. Solo se fuerza el ancho, que el
   drawer da por hecho que es 100%. */
.caja-field :deep(.sp-drawer-input) {
  width: 100%;
}

/* ── Totales ── */
.caja-totales {
  margin: 1rem 0 0;
  padding-top: 0.8rem;
  border-top: 1px solid var(--sp-border, #e2e8f0);
}

.caja-totales>div {
  display: flex;
  justify-content: space-between;
  padding: 0.18rem 0;
  font-size: 0.85rem;
}

.caja-totales dt,
.caja-totales dd {
  margin: 0;
}

.caja-totales__desc {
  color: #15803d;
}

.caja-totales__total {
  margin-top: 0.3rem;
  padding-top: 0.5rem !important;
  border-top: 1px solid var(--sp-border, #e2e8f0);
  font-size: 1.1rem !important;
  font-weight: 800;
}

.caja-totales__vuelto {
  font-weight: 700;
  color: #1d4ed8;
}

.caja-totales__vuelto--bad {
  color: #dc2626;
}

.caja-error {
  margin: 0.7rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 0.8rem;
}

.caja-acciones {
  margin-top: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.caja-cobrar {
  width: 100%;
  justify-content: center;
  font-size: 1rem;
  padding: 0.75rem;
}

.caja-cobrar:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ── Ticket ── */
.caja-bloqueada {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--sp-text-soft);
  font-size: var(--sp-text-sm);
}

.caja-ticket-wrap {
  max-width: 420px;
  margin: 1rem auto;
}

.caja-ticket {
  padding: 1.4rem 1.3rem;
  border: 1px solid var(--sp-border, #e2e8f0);
  border-radius: 12px;
  background: #fff;
  /* Monoespaciada: es lo que alinea las columnas de importes sin tener que
     fijar anchos, y lo que hace que se lea como un comprobante y no como
     una página web. */
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  color: #0f172a;
}

/* Separadores a #848f9e (3.28:1). Estaban a #cbd5e1, que da 1.48:1: en
   pantalla apenas se veían y son los que estructuran el comprobante. El
   umbral de los elementos no textuales es 3:1, no 4.5:1. */
.caja-ticket__head {
  text-align: center;
  padding-bottom: 0.7rem;
  border-bottom: 1px dashed #848f9e;
}

.caja-ticket__store {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.caja-ticket__meta {
  margin: 0.12rem 0 0;
  font-size: 0.7rem;
  color: #64748b;
}

.caja-ticket__kind {
  margin: 0.7rem 0 0.15rem;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #475569;
}

/* El número de la boleta, que es lo que identifica el papel: más grande
   que todo lo demás de la cabecera y con los dígitos alineados, porque es
   lo que la gente compara cuando viene a reclamar. */
.caja-ticket__boleta {
  margin: 0 0 0.7rem;
  text-align: center;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  color: #0f172a;
}

/* Datos de la venta, en dos columnas etiqueta/valor. */
.caja-ticket__info {
  margin: 0 0 0.8rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px dashed #848f9e;
  font-size: 0.74rem;
}

.caja-ticket__info>div {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.1rem 0;
}

.caja-ticket__info dt,
.caja-ticket__info dd {
  margin: 0;
}

.caja-ticket__info dt {
  color: #64748b;
}

.caja-ticket__strong {
  font-weight: 800;
}

.caja-ticket__items {
  width: 100%;
  margin: 0 0 0.6rem;
  border-collapse: collapse;
  font-size: 0.73rem;
}

.caja-ticket__items th {
  padding: 0 0.2rem 0.3rem;
  border-bottom: 1px solid #848f9e;
  font-size: 0.64rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #64748b;
  text-align: left;
}

.caja-ticket__items td {
  padding: 0.22rem 0.2rem;
  vertical-align: top;
}

.caja-ticket__items tbody tr+tr td {
  border-top: 1px dotted #e2e8f0;
}

.caja-ticket__c {
  width: 2.2rem;
  text-align: center !important;
}

.caja-ticket__num {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.caja-ticket__totals {
  margin: 0;
  padding-top: 0.6rem;
  border-top: 1px dashed #848f9e;
  font-size: 0.8rem;
}

.caja-ticket__totals>div,
.caja-ticket__pago>div {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.12rem 0;
}

.caja-ticket__totals dt,
.caja-ticket__totals dd,
.caja-ticket__pago dt,
.caja-ticket__pago dd {
  margin: 0;
}

.caja-ticket__desc {
  color: #15803d;
}

.caja-ticket__total {
  margin-top: 0.35rem;
  padding-top: 0.45rem;
  border-top: 1px solid #0f172a;
  font-size: 1.05rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.caja-ticket__pago {
  margin: 0.7rem 0 0;
  padding-top: 0.6rem;
  border-top: 1px dashed #848f9e;
  font-size: 0.75rem;
}

.caja-ticket__vuelto {
  font-weight: 800;
}

.caja-ticket__foot {
  margin-top: 1rem;
  padding-top: 0.7rem;
  border-top: 1px dashed #848f9e;
  text-align: center;
}

.caja-ticket__thanks {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
}

.caja-ticket__legal {
  margin: 0.35rem 0 0;
  font-size: 0.62rem;
  line-height: 1.35;
  color: #64748b;
}

.caja-ticket__actions {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

</style>

<!--
  Estilos de impresión SIN `scoped` a propósito.

  El bloque anterior sí lo era, y por eso imprimía la página entera: un
  estilo con `scoped` solo alcanza a los elementos de ESTE componente, y la
  barra lateral y la superior viven en el layout `admin`. Daba igual lo que
  ocultara aquí dentro, el resto del panel seguía saliendo en el papel.

  La técnica es ocultar TODO por visibilidad y volver a mostrar solo el
  comprobante. Con `display: none` habría que ir enumerando cada contenedor
  del layout, y cualquiera nuevo volvería a colarse en la impresión; con
  `visibility` basta una regla y aguanta cambios de layout.
-->
<style>
/*
 * Este bloque NO lleva scoped a propósito: necesita llegar a <body>, y el
 * compilador le añadiría el atributo del componente.
 *
 * Y justo por eso va colgado de una clase que solo existe mientras se
 * imprime el comprobante. Sin ella, la regla era `body *` a secas: el
 * navegador carga esta hoja en todo el panel —el bundle agrupa las rutas
 * vecinas—, así que imprimir desde cualquier otra pantalla apagaba la
 * página entera con !important y solo volvía a encender
 * #caja-comprobante, que allí no existe. Salía una hoja en blanco, y el
 * cierre de caja de /admin/cajas se topó exactamente con eso.
 */
@media print {
  /* Nada se ve... */
  body.sp-imprimiendo-ticket * {
    visibility: hidden !important;
  }

  /* ...salvo el comprobante y lo que lleva dentro. */
  body.sp-imprimiendo-ticket #caja-comprobante,
  body.sp-imprimiendo-ticket #caja-comprobante * {
    visibility: visible !important;
  }

  /* Los padres conservan su hueco, así que el comprobante se saca al
     origen de la hoja; si no, aparece desplazado donde estaba en pantalla. */
  /* 80 mm, el ancho del rollo, igual que los tres papeles de caja.
     Estaba al 100% de la hoja y en una A4 las etiquetas quedaban a la
     izquierda del todo y los importes contra el borde derecho: una línea
     de veinte centímetros que nadie puede leer de un vistazo. */
  body.sp-imprimiendo-ticket #caja-comprobante {
    position: absolute !important;
    left: 0;
    top: 0;
    width: 80mm;
    max-width: none;
    margin: 0;
    padding: 0;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    color: #000 !important;
  }

  /* Tinta: en papel el gris claro no se lee. */
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__meta,
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__legal,
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__info dt,
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__items th {
    color: #333 !important;
  }

  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__desc,
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__vuelto,
  body.sp-imprimiendo-ticket #caja-comprobante .caja-ticket__boleta {
    color: #000 !important;
  }

  html,
  body {
    background: #fff !important;
  }

  @page {
    margin: 10mm;
  }
}
</style>

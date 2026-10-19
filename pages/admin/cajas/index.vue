<template>
  <div class="sp-page cajas-page">
    <div class="sp-page-toolbar">
      <div>
        <h1 class="sp-page-toolbar__title">Cajas</h1>
        <p class="sp-page-toolbar__sub">
          {{ turnos.length }} turno(s) en curso · fondos, arqueo y cuadre
        </p>
      </div>
      <button class="sp-page-btn" @click="abrirAsignacion">
        <Plus class="w-3.5 h-3.5" stroke-width="2" />
        Asignar fondo
      </button>
    </div>

    <div class="sp-table-wrap">
      <div class="sp-table-scroll">
        <table class="sp-table">
          <thead>
            <tr>
              <th class="sp-th">Cajero</th>
              <th class="sp-th">Estado</th>
              <th class="sp-th sp-th--right">Fondo</th>
              <th class="sp-th sp-th--right">Efectivo esperado</th>
              <th class="sp-th">Ventas del turno</th>
              <th class="sp-th sp-th--center" style="width: 150px">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in turnos" :key="t.id" class="sp-tr">
              <td class="sp-td">
                <p class="sp-table-title">{{ t.cashierName || "—" }}</p>
                <p class="sp-table-sub">
                  <template v-if="t.cashierDni">DNI {{ t.cashierDni }} · </template>
                  fondo de {{ t.assignedByName || "—" }}
                </p>
              </td>
              <td class="sp-td">
                <span class="sp-badge" :class="badgeEstado(t.estado)">
                  <span class="sp-badge__dot" />
                  {{ t.estadoTexto }}
                </span>
                <p class="sp-table-sub">{{ formatDateTimeCompact(t.openedAt || t.assignedAt) }}</p>
              </td>
              <td class="sp-td sp-td--right">
                <span class="sp-table-amount">{{ money(t.openingFloat) }}</span>
              </td>
              <td class="sp-td sp-td--right">
                <!-- Aquí sí va la cifra: es con lo que el encargado se pone a
                     contar billetes. El vigilado es el cajero, y el cajero no
                     ve esta pantalla. -->
                <span class="sp-table-num">{{ money(t.expectedCash) }}</span>
                <p class="sp-table-sub">{{ money(t.cashSales) }} cobrados</p>
              </td>
              <td class="sp-td">
                <span class="sp-table-num">{{ totalVentas(t) }}</span>
                <p class="sp-table-sub">{{ formasDe(t) }}</p>
              </td>
              <td class="sp-td">
                <div class="sp-table-actions">
                  <button v-if="t.estado === 'fund_assigned'" class="sp-table-btn sp-table-btn--view"
                          title="Habilitar al cajero" @click="habilitar(t)">
                    <Check class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button v-if="t.estado === 'open'" class="sp-table-btn sp-table-btn--edit"
                          title="Movimiento de efectivo" @click="abrirMovimiento(t)">
                    <ArrowLeftRight class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button v-if="t.estado === 'open'" class="sp-table-btn sp-table-btn--view"
                          title="Arqueo sorpresivo" @click="abrirArqueo(t)">
                    <Search class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <button v-if="t.estado === 'closed'" class="sp-table-btn sp-table-btn--warn"
                          title="Cuadrar y firmar" @click="abrirCuadre(t)">
                    <ClipboardCheck class="w-3.5 h-3.5" stroke-width="1.5" />
                  </button>
                  <span v-if="t.estado === 'enabled'" class="cajas-espera">esperando al cajero</span>
                </div>
              </td>
            </tr>

            <tr v-if="!turnos.length">
              <td colspan="6" class="sp-table-empty">
                <div class="sp-table-empty__inner">
                  <div class="sp-table-empty__icon">
                    <Wallet class="w-8 h-8 text-current" stroke-width="1.5" />
                  </div>
                  <p class="sp-table-empty__msg">No hay ningún turno en curso</p>
                  <button class="sp-table-empty__cta" @click="abrirAsignacion">
                    Asignar el primer fondo
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p class="cajas-pie">
      Los turnos ya cuadrados se consultan en
      <NuxtLink to="/admin/reportes">Reportes</NuxtLink>.
    </p>

    <!-- ── Asignar fondo ──────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'fondo'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Asignar fondo</h3>
                <p class="sp-modal-header__meta">
                  Entregas el dinero y queda registrado que lo entregaste tú.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
            </div>

            <div class="sp-modal-body">
              <div class="cajas-campo">
                <label class="sp-drawer-label" for="cajero">Cajero</label>
                <select id="cajero" v-model="fondo.cashierId" class="sp-drawer-input sp-drawer-select">
                  <option :value="null" disabled>Elige a quién le entregas el fondo</option>
                  <option v-for="c in cajeros" :key="c.id" :value="c.id">
                    {{ c.name }}{{ c.dni ? ` · DNI ${c.dni}` : "" }}
                  </option>
                  <!-- El encargado que también atiende: su caja es la suya,
                       pero sigue constando quién entregó el fondo. -->
                  <option v-if="yo?.id" :value="yo.id">Yo mismo ({{ yo.email }})</option>
                </select>
                <p v-if="!cajeros.length" class="cajas-nota">
                  No hay cajeros activos. Da de alta uno en
                  <NuxtLink to="/admin/usuarios">Usuarios</NuxtLink> y vuelve.
                </p>
                <p v-else-if="elegidoSinDni" class="cajas-nota">
                  Ese cajero no tiene DNI registrado: el ticket de apertura
                  saldrá sin él. Puedes añadírselo en
                  <NuxtLink to="/admin/usuarios">Usuarios</NuxtLink>.
                </p>
              </div>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="monto">Fondo inicial</label>
                <div class="cajas-money">
                  <span>S/</span>
                  <input id="monto" ref="montoRef" v-model.number="fondo.openingFloat"
                         type="number" min="0" step="0.10" class="sp-drawer-input"
                         placeholder="0.00" @keydown.enter.prevent="asignar" />
                </div>
                <p class="cajas-nota">
                  Cuenta el sencillo antes de entregarlo. Es la cifra contra la
                  que se cuadrará al final, así que vale la pena contarlo bien.
                </p>
              </div>

              <label class="cajas-check">
                <input v-model="fondo.habilitar" type="checkbox" />
                <span>
                  Habilitarlo ya para que pueda abrir
                  <em>Si lo dejas sin marcar, el fondo queda registrado y lo habilitas cuando abra la tienda.</em>
                </span>
              </label>

              <p v-if="error" class="cajas-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary" :disabled="cargando" @click="asignar">
                {{ cargando ? "Guardando…" : "Entregar fondo" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Movimiento de efectivo ─────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'movimiento'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Movimiento de efectivo</h3>
                <p class="sp-modal-header__meta">
                  Caja de {{ turno?.cashierName || "—" }} · dinero que entra o sale
                  del cajón sin ser una venta.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
            </div>

            <div class="sp-modal-body">
              <div class="cajas-tipos">
                <button v-for="t in TIPOS" :key="t.value" type="button" class="cajas-tipo"
                        :class="{ 'cajas-tipo--on': mov.type === t.value }" @click="mov.type = t.value">
                  <strong>{{ t.label }}</strong>
                  <span>{{ t.hint }}</span>
                </button>
              </div>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="mov-importe">Importe</label>
                <input id="mov-importe" v-model.number="mov.amount" type="number" min="0.1"
                       step="0.10" class="sp-drawer-input" placeholder="0.00" />
              </div>
              <div class="cajas-campo">
                <label class="sp-drawer-label" for="mov-motivo">Motivo</label>
                <input id="mov-motivo" v-model="mov.reason" type="text" class="sp-drawer-input"
                       placeholder="Ej: retiro a caja fuerte"
                       @keydown.enter.prevent="guardarMovimiento" />
                <p class="cajas-nota">
                  Un retiro de 200 soles sin explicar es indistinguible de un
                  faltante cuando alguien revise el turno dentro de un mes.
                </p>
              </div>

              <p v-if="error" class="cajas-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary"
                      :disabled="cargando || !mov.amount || !mov.reason.trim()"
                      @click="guardarMovimiento">
                {{ cargando ? "Guardando…" : "Registrar" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Arqueo sorpresivo ──────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'arqueo'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <div class="sp-modal-header">
              <div class="sp-modal-header__content">
                <h3 class="sp-modal-header__title">Arqueo sorpresivo</h3>
                <p class="sp-modal-header__meta">
                  Caja de {{ turno?.cashierName || "—" }} · no la cierra, el cajero
                  sigue vendiendo en cuanto termines.
                </p>
              </div>
              <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
            </div>

            <div class="sp-modal-body">
              <ul class="cajas-cuadre">
                <li><span>Fondo inicial</span><strong>{{ money(turno?.openingFloat) }}</strong></li>
                <li>
                  <span>Cobrado en efectivo<em v-if="ventasDe('efectivo')"> · {{ ventasDe("efectivo") }} venta(s)</em></span>
                  <strong>{{ money(turno?.cashSales) }}</strong>
                </li>
                <li v-if="(turno?.movementsTotal ?? 0) !== 0">
                  <span>Entradas y salidas</span><strong>{{ conSigno(turno?.movementsTotal) }}</strong>
                </li>
                <li class="cajas-cuadre__total">
                  <span>Debería haber en el cajón</span>
                  <strong>{{ money(turno?.expectedCash) }}</strong>
                </li>
              </ul>

              <!-- Lo cobrado por tarjeta y QR no entra en el cajón, pero el
                   encargado lo quiere ver: es el otro lado del turno, y si
                   sospecha de algo va a querer contrastar los vouchers
                   aunque el efectivo le cuadre. -->
              <ul v-if="sinEfectivo.length" class="cajas-cuadre cajas-cuadre--aparte">
                <li v-for="f in sinEfectivo" :key="f.type">
                  <span>{{ f.label }}<em> · {{ f.sales }} venta(s), {{ f.vouchers }} voucher(s)</em></span>
                  <strong>{{ money(f.amount) }}</strong>
                </li>
                <li class="cajas-cuadre__pie">
                  <span>No pasa por el cajón: no entra en esta cuenta.</span>
                </li>
              </ul>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="arq-contado">Efectivo contado</label>
                <div class="cajas-money">
                  <span>S/</span>
                  <input id="arq-contado" ref="contadoRef" v-model.number="arqueo.countedCash"
                         type="number" min="0" step="0.10" class="sp-drawer-input" placeholder="0.00" />
                </div>
              </div>

              <p v-if="difArqueo !== null" class="cajas-dif" :class="claseDif(difArqueo)">
                {{ textoDif(difArqueo) }}
              </p>

              <div class="cajas-campo">
                <label class="sp-drawer-label" for="arq-obs">
                  Observación
                  <span v-if="difArqueo && Math.abs(difArqueo) >= 0.005" class="cajas-req">obligatoria</span>
                  <span v-else class="cajas-opt">(opcional)</span>
                </label>
                <input id="arq-obs" v-model="arqueo.observation" type="text" class="sp-drawer-input"
                       placeholder="Ej: el cajero fue al banco con 200" />
              </div>

              <p v-if="error" class="cajas-error">{{ error }}</p>
            </div>

            <div class="sp-modal-footer">
              <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
              <button class="sp-drawer-btn sp-drawer-btn--primary"
                      :disabled="cargando || arqueo.countedCash === null" @click="guardarArqueo">
                {{ cargando ? "Guardando…" : "Finalizar arqueo" }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── Cuadre ─────────────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sp-modal">
        <div v-if="modal === 'cuadre'" class="sp-modal-backdrop" @click.self="cerrarModal">
          <div class="sp-modal-box cajas-modal" role="dialog" aria-modal="true">
            <template v-if="!cuadrado">
              <div class="sp-modal-header">
                <div class="sp-modal-header__content">
                  <h3 class="sp-modal-header__title">Cuadre de caja</h3>
                  <p class="sp-modal-header__meta">
                    Caja de {{ turno?.cashierName || "—" }} ·
                    cerrada {{ formatDateTimeCompact(turno?.closedAt) }}
                  </p>
                </div>
                <button class="sp-modal-close" aria-label="Cerrar" @click="cerrarModal">✕</button>
              </div>

              <div class="sp-modal-body">
                <p class="cajas-aviso">
                  Cuenta el efectivo y los vouchers <strong>delante del cajero</strong>.
                  Lo que escribas aquí es lo que los dos firmáis.
                </p>

                <div v-for="f in (turno?.toCount || [])" :key="f.type" class="cajas-forma">
                  <div class="cajas-forma__head">
                    <strong>{{ f.label }}</strong>
                    <span>{{ CONTRA[f.type] || "contra su comprobante" }}</span>
                  </div>
                  <ul class="cajas-forma__sistema">
                    <li><span>El sistema dice</span><strong>{{ money(f.amount) }}</strong></li>
                    <li><span>Ventas</span><strong>{{ f.sales }}</strong></li>
                  </ul>
                  <div class="cajas-forma__campos">
                    <label>
                      <span>Contado</span>
                      <input v-model.number="contado[f.type]" type="number" min="0" step="0.10"
                             class="sp-drawer-input" placeholder="0.00" />
                    </label>
                    <!-- En efectivo no hay papeles que contar: el comprobante
                         del cajero es el propio dinero. -->
                    <label v-if="f.type !== 'efectivo'">
                      <span>Vouchers en mano</span>
                      <input v-model.number="vouchers[f.type]" type="number" min="0" step="1"
                             class="sp-drawer-input" :placeholder="String(f.sales)" />
                    </label>
                  </div>
                  <p v-if="avisoDe(f)" class="cajas-forma__aviso">{{ avisoDe(f) }}</p>
                </div>

                <!-- La línea de tiempo del turno. Es lo que se mira cuando
                     el cuadre sale raro: quién movió qué y a qué hora. -->
                <details v-if="(turno?.historial || []).length" class="cajas-historial">
                  <summary>Historial del turno ({{ turno.historial.length }})</summary>
                  <ol>
                    <li v-for="h in turno.historial" :key="h.id">
                      <span class="cajas-historial__hora">{{ soloHora(h.createdAt) }}</span>
                      <span class="cajas-historial__que">{{ ACCION[h.action] || h.action }}</span>
                      <span class="cajas-historial__quien">{{ h.userName || "—" }}</span>
                      <span class="cajas-historial__detalle">{{ h.detail }}</span>
                    </li>
                  </ol>
                </details>

                <div class="cajas-campo">
                  <label class="sp-drawer-label" for="cua-obs">
                    Observación
                    <span v-if="hayDiferencias" class="cajas-req">obligatoria</span>
                    <span v-else class="cajas-opt">(opcional)</span>
                  </label>
                  <input id="cua-obs" v-model="observacion" type="text" class="sp-drawer-input"
                         placeholder="Ej: faltó un billete de 10 y un voucher de Niubiz" />
                </div>

                <p v-if="error" class="cajas-error">{{ error }}</p>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cancelar</button>
                <button class="sp-drawer-btn sp-drawer-btn--primary"
                        :disabled="cargando || !todoContado" @click="cuadrar">
                  {{ cargando ? "Cuadrando…" : "Cuadrar e imprimir" }}
                </button>
              </div>
            </template>

            <template v-else>
              <div class="sp-modal-header">
                <div class="sp-modal-header__content">
                  <h3 class="sp-modal-header__title">Caja cuadrada</h3>
                  <p class="sp-modal-header__meta">{{ formatDateTimeCompact(cuadrado.settledAt) }}</p>
                </div>
              </div>

              <div class="sp-modal-body">
                <p class="cajas-dif" :class="claseDif(cuadrado.difference)">
                  {{ textoDif(cuadrado.difference) }}
                </p>

                <table class="cajas-arqueo__tabla">
                  <thead>
                    <tr><th>Forma</th><th>Esperado</th><th>Contado</th><th>Dif.</th><th>Vouchers</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in (cuadrado.counts || [])" :key="c.type">
                      <td>{{ c.label }}</td>
                      <td>{{ money(c.expected) }}</td>
                      <td>{{ money(c.counted) }}</td>
                      <td :class="claseDif(c.difference)">{{ conSigno(c.difference) }}</td>
                      <td>{{ c.vouchersCounted ?? "—" }} / {{ c.sales }}</td>
                    </tr>
                  </tbody>
                </table>

                <p v-if="cuadrado.closingNotes" class="cajas-nota">{{ cuadrado.closingNotes }}</p>
              </div>

              <div class="sp-modal-footer">
                <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="cerrarModal">Cerrar</button>
                <button class="sp-drawer-btn sp-drawer-btn--primary" @click="imprimir()">
                  Imprimir papel de caja
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ── El papel de caja ───────────────────────────────────── -->
    <Teleport to="body">
      <div v-if="papel && cuadrado" class="sp-papel">
        <header class="sp-papel__head">
          <p class="sp-papel__store">{{ negocio.name || nombre }}</p>
          <p v-if="negocio.ruc" class="sp-papel__meta">RUC {{ negocio.ruc }}</p>
          <p v-if="negocio.address" class="sp-papel__meta">{{ negocio.address }}</p>
        </header>

        <p class="sp-papel__kind">Papel de caja Nº {{ cuadrado.id }}</p>

        <dl class="sp-papel__info">
          <div><dt>Cajero</dt><dd>{{ cuadrado.cashierName || "—" }}</dd></div>
          <div v-if="cuadrado.cashierDni"><dt>DNI</dt><dd>{{ cuadrado.cashierDni }}</dd></div>
          <div><dt>Fondo entregado por</dt><dd>{{ cuadrado.assignedByName || "—" }}</dd></div>
          <div><dt>Cuadró</dt><dd>{{ cuadrado.settledByName || "—" }}</dd></div>
          <div><dt>Apertura</dt><dd>{{ formatDateTimeCompact(cuadrado.openedAt) }}</dd></div>
          <div><dt>Cierre</dt><dd>{{ formatDateTimeCompact(cuadrado.closedAt) }}</dd></div>
        </dl>

        <table class="sp-papel__tabla">
          <thead>
            <tr><th>Forma</th><th>Esperado</th><th>Contado</th><th>Dif.</th><th>Vouch.</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in (cuadrado.counts || [])" :key="c.type">
              <td>{{ c.label }}</td>
              <td>{{ money(c.expected) }}</td>
              <td>{{ money(c.counted) }}</td>
              <td>{{ conSigno(c.difference) }}</td>
              <td>{{ c.vouchersCounted ?? "—" }}/{{ c.sales }}</td>
            </tr>
          </tbody>
        </table>

        <ul class="sp-papel__lista">
          <li><span>Fondo inicial</span><strong>{{ money(cuadrado.openingFloat) }}</strong></li>
          <li><span>Entradas y salidas</span><strong>{{ conSigno(cuadrado.movementsTotal) }}</strong></li>
          <li v-for="m in (cuadrado.movements || [])" :key="m.id" class="sp-papel__chico">
            <span>{{ etiquetaMov(m.type) }} · {{ m.reason }}</span>
            <strong>{{ conSigno(m.delta) }}</strong>
          </li>
          <li v-for="a in (cuadrado.audits || [])" :key="'a' + a.id" class="sp-papel__chico">
            <span>Arqueo {{ formatDateTimeCompact(a.createdAt) }} · {{ a.performedByName }}</span>
            <strong>{{ conSigno(a.difference) }}</strong>
          </li>
        </ul>

        <p class="sp-papel__destacado">{{ textoDif(cuadrado.difference) }}</p>
        <p v-if="cuadrado.closingNotes" class="sp-papel__nota">
          Observación: {{ cuadrado.closingNotes }}
        </p>

        <!-- Las dos firmas son el motivo de que esto se imprima: el cajero
             reconoce con qué efectivo y qué vouchers entregó la caja, y el
             encargado que los contó él. -->
        <div class="sp-papel__firmas">
          <div><span>Firma del cajero</span><p>{{ cuadrado.cashierName || "" }}</p></div>
          <div><span>Firma del encargado</span><p>{{ cuadrado.settledByName || "" }}</p></div>
        </div>

        <p class="sp-papel__pie">
          Conforme con el cuadre arriba detallado. Documento interno de control
          de caja; no es un comprobante de pago.
        </p>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
/**
 * Fondos, arqueo y cuadre: la pantalla del jefe de ventas y del encargado.
 *
 * Aquí viven las cuatro cosas que el cajero no hace: entregarle el fondo,
 * mover el efectivo del cajón, arquearlo por sorpresa y cuadrarlo al final.
 * Está separada de /admin/caja a propósito —no es una pestaña más—, porque
 * es de otra persona.
 *
 * A diferencia de la pantalla del cajero, esta SÍ enseña los importes, y es
 * deliberado: el encargado mira cuánto lleva vendido el cajero en efectivo
 * y con esa cifra se pone a contar billetes. Quien vigila es él; el vigilado
 * es el cajero, que no ve esta pantalla.
 */
import { Plus, Wallet, ArrowLeftRight, ClipboardCheck, Search, Check } from "lucide-vue-next";

definePageMeta({ layout: "admin", middleware: "auth" });
useSeoMeta({ title: "Cajas · Admin" });

const { formatDateTimeCompact } = useFormatDateTime();
const formatPrice = useFormatPrice();
const { imprimirPapel } = useImpresion();
const { nombre } = useLogo();
const negocio = computed<any>(() => useBusinessConfig().value ?? {});
const { user } = useUserSession();
const yo = computed<any>(() => user.value ?? null);

const money = (n: any) => formatPrice.format(Number(n ?? 0));
const conSigno = (n: any) => {
  const v = Number(n ?? 0);
  return (v > 0 ? "+" : "") + money(v).replace("S/", "S/ ").trim();
};

/* Contra qué se cuenta cada forma. Es la mitad del cuadre: sin decirlo, el
   encargado no sabe de dónde sacar la cifra de Yape y acaba copiando la del
   sistema —que es justo lo que el cuadre intenta comprobar—. */
const CONTRA: Record<string, string> = {
  efectivo: "cuenta el dinero del cajón",
  tarjeta: "cierre de lote del POS (Niubiz)",
  yape: "abonos recibidos en el Yape del negocio",
  plin: "abonos recibidos en el Plin del negocio",
  bank_transfer: "abonos en la cuenta del banco",
};

const TIPOS = [
  { value: "in", label: "Entra dinero", hint: "Sencillo, reposición de fondo" },
  { value: "out", label: "Retiro", hint: "A la caja fuerte o al banco" },
  { value: "expense", label: "Gasto", hint: "Pagado con el efectivo del cajón" },
];
const etiquetaMov = (t: string) => TIPOS.find((x) => x.value === t)?.label ?? t;

/** Los pasos del turno, en palabras. */
const ACCION: Record<string, string> = {
  assigned: "Fondo asignado",
  enabled: "Habilitado",
  opened: "Caja abierta",
  sale: "Venta",
  movement: "Movimiento",
  audit: "Arqueo",
  closed: "Caja cerrada",
  settled: "Cuadrada",
};

/* En el historial solo cabe la hora: el turno es de un día y la fecha ya
   está en la cabecera. */
const soloHora = (v: any) =>
  v ? new Intl.DateTimeFormat("es-PE", { timeZone: "America/Lima", timeStyle: "short" })
        .format(new Date(v)) : "";

const turnos = ref<any[]>([]);
const cajeros = ref<any[]>([]);
const cargando = ref(false);
const error = ref("");

const modal = ref<"" | "fondo" | "movimiento" | "arqueo" | "cuadre">("");
const turno = ref<any>(null);
const montoRef = ref<HTMLInputElement>();
const contadoRef = ref<HTMLInputElement>();

const fondo = reactive<{ cashierId: number | null; openingFloat: number | null; habilitar: boolean }>({
  cashierId: null,
  openingFloat: null,
  habilitar: true,
});
const mov = reactive({ type: "out", amount: null as number | null, reason: "" });
const arqueo = reactive({ countedCash: null as number | null, observation: "" });
const contado = ref<Record<string, number | null>>({});
const vouchers = ref<Record<string, number | null>>({});
const observacion = ref("");
const cuadrado = ref<any>(null);
const papel = ref(false);

const elegidoSinDni = computed(() => {
  const c = cajeros.value.find((x: any) => x.id === fondo.cashierId);
  return Boolean(c && !c.dni);
});

const difArqueo = computed(() => {
  if (arqueo.countedCash === null || turno.value?.expectedCash === undefined) return null;
  return Math.round((Number(arqueo.countedCash) - Number(turno.value.expectedCash)) * 100) / 100;
});

/** Ninguna forma puede quedar en blanco: un cuadre a medias parece completo. */
const todoContado = computed(() =>
  (turno.value?.toCount || []).every((f: any) => {
    const v = contado.value[f.type];
    return v !== null && v !== undefined && (v as any) !== "" && Number(v) >= 0;
  })
);

/** Si algo no cuadra —dinero o papeles— la observación deja de ser opcional. */
const hayDiferencias = computed(() =>
  (turno.value?.toCount || []).some((f: any) => {
    const c = contado.value[f.type];
    if (c !== null && c !== undefined && Math.abs(Number(c) - Number(f.amount)) >= 0.005) return true;
    if (f.type === "efectivo") return false;
    const v = vouchers.value[f.type];
    return v !== null && v !== undefined && Number(v) !== Number(f.sales);
  })
);

function avisoDe(f: any) {
  const c = contado.value[f.type];
  if (c !== null && c !== undefined && Math.abs(Number(c) - Number(f.amount)) >= 0.005) {
    const d = Number(c) - Number(f.amount);
    return d > 0 ? `Sobran ${money(d)}` : `Faltan ${money(Math.abs(d))}`;
  }
  if (f.type === "efectivo") return "";
  const v = vouchers.value[f.type];
  if (v !== null && v !== undefined && Number(v) !== Number(f.sales)) {
    return `El sistema dice ${f.sales} venta(s) y tienes ${v} voucher(s)`;
  }
  return "";
}

/** Lo cobrado por formas que no pasan por el cajón. */
const sinEfectivo = computed(() =>
  (turno.value?.toCount || []).filter((f: any) => f.type !== "efectivo" && f.sales > 0)
);
const ventasDe = (tipo: string) =>
  (turno.value?.toCount || []).find((f: any) => f.type === tipo)?.sales ?? 0;

const totalVentas = (t: any) =>
  (t.toCount || []).reduce((a: number, f: any) => a + Number(f.sales || 0), 0);
const formasDe = (t: any) =>
  (t.toCount || []).filter((f: any) => f.sales > 0).map((f: any) => f.label).join(" · ") || "sin ventas aún";

function badgeEstado(estado: string) {
  if (estado === "open") return "sp-badge--success";
  if (estado === "closed") return "sp-badge--warning";
  if (estado === "enabled") return "sp-badge--primary";
  return "sp-badge--neutral";
}

async function cargar() {
  try {
    const res: any = await $fetch("/api/admin/caja/sesiones/activas");
    turnos.value = res?.data ?? [];
  } catch {
    turnos.value = [];
  }
}

async function cargarCajeros() {
  try {
    const res: any = await $fetch("/api/admin/users", { query: { role: "cajero", size: 100 } });
    // Un cajero desactivado no puede entrar: asignarle fondo deja un turno
    // abierto que nadie va a usar y que alguien tendrá que cuadrar.
    cajeros.value = (res?.data ?? []).filter((u: any) => u.isActive);
  } catch {
    cajeros.value = [];
  }
}

function mensaje(e: any, porDefecto: string) {
  return e?.data?.message ?? porDefecto;
}

function cerrarModal() {
  modal.value = "";
  error.value = "";
  if (cuadrado.value) {
    cuadrado.value = null;
    cargar();
  }
}

// ── Asignar fondo ───────────────────────────────────────────

function abrirAsignacion() {
  error.value = "";
  fondo.cashierId = null;
  fondo.openingFloat = null;
  fondo.habilitar = true;
  modal.value = "fondo";
  cargarCajeros();
  nextTick(() => montoRef.value?.focus());
}

async function asignar() {
  error.value = "";
  if (!fondo.cashierId) {
    error.value = "Elige a qué cajero le entregas el fondo.";
    return;
  }
  /* Vacío no es cero. Un turno puede empezar sin fondo —se escribe 0— pero
     dejarlo en blanco suele ser un despiste, y empezar con 0 por accidente
     hace que el cuadre salga mal sin que nadie sepa por qué. */
  if (fondo.openingFloat === null || (fondo.openingFloat as any) === "") {
    error.value = "Escribe el fondo inicial. Si empieza sin sencillo, pon 0.";
    montoRef.value?.focus();
    return;
  }
  if (fondo.openingFloat < 0) {
    error.value = "El fondo no puede ser negativo.";
    montoRef.value?.focus();
    return;
  }

  const elegido =
    cajeros.value.find((c: any) => c.id === fondo.cashierId) ??
    (fondo.cashierId === yo.value?.id ? yo.value : null);

  cargando.value = true;
  try {
    await $fetch("/api/admin/caja/asignar-fondo", {
      method: "POST",
      body: {
        cashierId: fondo.cashierId,
        cashierName: elegido?.name || elegido?.email || null,
        cashierDni: elegido?.dni || null,
        openingFloat: fondo.openingFloat,
        habilitar: fondo.habilitar,
      },
    });
    modal.value = "";
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo asignar el fondo");
  } finally {
    cargando.value = false;
  }
}

async function habilitar(t: any) {
  error.value = "";
  try {
    await $fetch(`/api/admin/caja/${t.id}/habilitar`, { method: "POST" });
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo habilitar");
  }
}

// ── Movimientos ─────────────────────────────────────────────

function abrirMovimiento(t: any) {
  error.value = "";
  turno.value = t;
  mov.type = "out";
  mov.amount = null;
  mov.reason = "";
  modal.value = "movimiento";
}

async function guardarMovimiento() {
  error.value = "";
  cargando.value = true;
  try {
    await $fetch("/api/admin/caja/movimientos", {
      method: "POST",
      body: { sessionId: turno.value?.id, type: mov.type, amount: mov.amount, reason: mov.reason },
    });
    modal.value = "";
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo registrar el movimiento");
  } finally {
    cargando.value = false;
  }
}

// ── Arqueo sorpresivo ───────────────────────────────────────

function abrirArqueo(t: any) {
  error.value = "";
  turno.value = t;
  arqueo.countedCash = null;
  arqueo.observation = "";
  modal.value = "arqueo";
  nextTick(() => contadoRef.value?.focus());
}

async function guardarArqueo() {
  error.value = "";
  cargando.value = true;
  try {
    await $fetch(`/api/admin/caja/${turno.value?.id}/arqueo`, {
      method: "POST",
      body: { countedCash: arqueo.countedCash, observation: arqueo.observation },
    });
    modal.value = "";
    await cargar();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo guardar el arqueo");
  } finally {
    cargando.value = false;
  }
}

// ── Cuadre ──────────────────────────────────────────────────

function abrirCuadre(t: any) {
  error.value = "";
  turno.value = t;
  cuadrado.value = null;
  observacion.value = "";
  contado.value = {};
  vouchers.value = {};
  for (const f of t.toCount || []) {
    contado.value[f.type] = null;
    if (f.type !== "efectivo") vouchers.value[f.type] = null;
  }
  modal.value = "cuadre";
}

async function cuadrar() {
  error.value = "";
  cargando.value = true;
  try {
    const cifras: Record<string, number> = {};
    for (const [k, v] of Object.entries(contado.value)) cifras[k] = Number(v ?? 0);
    const papeles: Record<string, number> = {};
    for (const [k, v] of Object.entries(vouchers.value)) {
      if (v !== null && v !== undefined && (v as any) !== "") papeles[k] = Number(v);
    }
    cuadrado.value = await $fetch(`/api/admin/caja/${turno.value?.id}/cuadrar`, {
      method: "POST",
      body: { counted: cifras, vouchers: papeles, observation: observacion.value },
    });
    await imprimir();
  } catch (e: any) {
    error.value = mensaje(e, "No se pudo cuadrar la caja");
  } finally {
    cargando.value = false;
  }
}

async function imprimir() {
  papel.value = true;
  try {
    await imprimirPapel();
  } finally {
    // En el finally: si la impresión falla, el papel se quedaba montado
    // y la siguiente sacaría dos en la misma hoja.
    papel.value = false;
  }
}

function claseDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "cajas-dif--ok";
  return v > 0 ? "cajas-dif--sobra" : "cajas-dif--falta";
}

function textoDif(d: any) {
  const v = Number(d ?? 0);
  if (Math.abs(v) < 0.005) return "El efectivo cuadra exactamente.";
  return v > 0
    ? `Sobran ${money(v)} en el cajón.`
    : `Faltan ${money(Math.abs(v))} en el cajón.`;
}

onMounted(() => {
  cargar();
  cargarCajeros();
});
</script>

<style scoped>
.cajas-pie {
  margin: 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
}
.cajas-pie a { color: var(--sp-primary); font-weight: 600; }

.cajas-espera {
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  font-style: italic;
}

.cajas-modal { max-width: 580px; }

.cajas-campo { margin-bottom: 1rem; }
.cajas-campo input,
.cajas-campo select { width: 100%; }
.cajas-money { display: flex; align-items: center; gap: 0.4rem; }
.cajas-money > span { font-weight: 700; color: var(--sp-text-soft); }

.cajas-opt { font-weight: 500; color: var(--sp-text-soft); }
.cajas-req {
  margin-left: 0.35rem;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #b91c1c;
}

.cajas-nota {
  margin: 0.35rem 0 0;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.45;
}
.cajas-nota a { color: var(--sp-primary); font-weight: 600; }

.cajas-check {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1rem;
  font-size: var(--sp-text-sm);
  cursor: pointer;
}
.cajas-check input { margin-top: 0.2rem; }
.cajas-check em {
  display: block;
  margin-top: 0.15rem;
  font-style: normal;
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.4;
}

.cajas-aviso {
  margin: 0 0 1rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-subtle);
  border: 1px solid var(--sp-border);
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  line-height: 1.5;
}
.cajas-aviso strong { color: var(--sp-text-strong); }

.cajas-error {
  margin: 0.6rem 0 0;
  padding: 0.5rem 0.7rem;
  border-radius: var(--sp-radius-sm);
  background: var(--sp-danger-soft);
  color: #b91c1c;
  font-size: var(--sp-text-xs);
  font-weight: 600;
}

/* Los tres tipos de movimiento: una rejilla, no una lista. */
.cajas-tipos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.cajas-tipo {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.6rem 0.7rem;
  text-align: left;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-solid);
  cursor: pointer;
  font-family: var(--sp-font);
  transition: border-color var(--sp-t-fast) var(--sp-ease),
    background var(--sp-t-fast) var(--sp-ease);
}
.cajas-tipo strong { font-size: var(--sp-text-sm); color: var(--sp-text-strong); }
.cajas-tipo span { font-size: var(--sp-text-xs); color: var(--sp-text-soft); line-height: 1.3; }
.cajas-tipo:hover { border-color: var(--sp-border-strong); }
.cajas-tipo--on { border-color: var(--sp-primary); background: var(--sp-primary-soft); }

/* Una tarjeta por forma de pago: el conteo de cada una con lo que dice el
   sistema al lado, que es contra lo que se contrasta. */
.cajas-forma {
  margin-bottom: 0.9rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-sm);
  background: var(--sp-surface-subtle);
}
.cajas-forma__head { display: flex; flex-direction: column; gap: 0.1rem; margin-bottom: 0.5rem; }
.cajas-forma__head strong { font-size: var(--sp-text-sm); color: var(--sp-text-strong); }
.cajas-forma__head span { font-size: var(--sp-text-xs); color: var(--sp-text-soft); }

.cajas-forma__sistema { list-style: none; margin: 0 0 0.6rem; padding: 0; display: flex; gap: 1.25rem; }
.cajas-forma__sistema li { display: flex; flex-direction: column; }
.cajas-forma__sistema span { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sp-text-soft); font-weight: 700; }
.cajas-forma__sistema strong { font-size: var(--sp-text-sm); font-variant-numeric: tabular-nums; }

.cajas-forma__campos { display: flex; gap: 0.75rem; }
.cajas-forma__campos label { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
.cajas-forma__campos span { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--sp-text-soft); font-weight: 700; }
.cajas-forma__campos input { width: 100%; }

.cajas-forma__aviso {
  margin: 0.5rem 0 0;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: #92600a;
}

.cajas-cuadre { list-style: none; margin: 0 0 1rem; padding: 0; }
.cajas-cuadre li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.45rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-sm);
}
.cajas-cuadre li span { color: var(--sp-text-soft); }
.cajas-cuadre li em { font-style: normal; font-size: var(--sp-text-xs); opacity: 0.8; }
.cajas-cuadre--aparte { margin-top: -0.4rem; }
.cajas-cuadre__pie { border-bottom: none; padding-top: 0.2rem; }
.cajas-cuadre__pie span { font-size: var(--sp-text-xs); font-style: italic; }

/* Plegado: la mayoría de los cuadres no lo necesitan, y abierto empuja el
   conteo fuera de la pantalla, que es lo que de verdad hay que rellenar. */
.cajas-historial { margin-bottom: 1rem; }
.cajas-historial summary {
  cursor: pointer;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-text-soft);
}
.cajas-historial ol {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  max-height: 14rem;
  overflow-y: auto;
}
.cajas-historial li {
  display: grid;
  grid-template-columns: 3.4rem 7rem 1fr;
  gap: 0.4rem;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--sp-border);
  font-size: var(--sp-text-xs);
}
.cajas-historial__hora { font-variant-numeric: tabular-nums; color: var(--sp-text-soft); }
.cajas-historial__que { font-weight: 700; color: var(--sp-text-strong); }
.cajas-historial__quien { grid-column: 2; color: var(--sp-text-soft); }
.cajas-historial__detalle { grid-column: 3; grid-row: 1 / span 2; color: var(--sp-text-soft); }
.cajas-cuadre li strong { font-variant-numeric: tabular-nums; }
.cajas-cuadre__total {
  background: var(--sp-surface-subtle);
  margin: 0.3rem -0.5rem;
  padding: 0.55rem 0.5rem;
  border-radius: var(--sp-radius-sm);
  border-bottom: none;
}
.cajas-cuadre__total span, .cajas-cuadre__total strong { font-weight: 800; }

.cajas-dif {
  margin: 0 0 1rem;
  padding: 0.7rem 0.9rem;
  border-radius: var(--sp-radius-sm);
  font-size: var(--sp-text-sm);
  font-weight: 700;
}
.cajas-dif--ok { background: var(--sp-success-soft); color: #0a7a56; }
.cajas-dif--sobra { background: var(--sp-warning-soft); color: #92600a; }
.cajas-dif--falta { background: var(--sp-danger-soft); color: #b91c1c; }

/* En la tabla del cuadre la diferencia es una celda, no un bloque: hereda
   el color pero no el fondo ni el relleno. */
.cajas-arqueo__tabla td.cajas-dif--ok,
.cajas-arqueo__tabla td.cajas-dif--sobra,
.cajas-arqueo__tabla td.cajas-dif--falta {
  background: none;
  margin: 0;
  padding: 0.35rem 0.5rem;
  font-weight: 700;
}
.cajas-arqueo__tabla td.cajas-dif--ok { color: #0a7a56; }
.cajas-arqueo__tabla td.cajas-dif--sobra { color: #92600a; }
.cajas-arqueo__tabla td.cajas-dif--falta { color: #b91c1c; }

.cajas-arqueo__tabla { width: 100%; border-collapse: collapse; font-size: var(--sp-text-sm); }
.cajas-arqueo__tabla th {
  text-align: right;
  padding: 0.35rem 0.5rem;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sp-text-soft);
  border-bottom: 1px solid var(--sp-border);
}
.cajas-arqueo__tabla th:first-child,
.cajas-arqueo__tabla td:first-child { text-align: left; }
.cajas-arqueo__tabla td {
  text-align: right;
  padding: 0.35rem 0.5rem;
  border-bottom: 1px solid var(--sp-border);
  font-variant-numeric: tabular-nums;
}
</style>

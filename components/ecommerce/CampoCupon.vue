<template>
  <div class="cc">
    <!-- ── Aplicado ── -->
    <div v-if="aplicado" class="cc__ok">
      <span class="cc__ok-icono" aria-hidden="true">
        <Ticket :size="16" stroke-width="2" />
      </span>
      <span class="cc__ok-texto">
        <strong class="cc__ok-codigo">{{ aplicado.code }}</strong>
        <span class="cc__ok-ahorro">
          Ahorras {{ formatPrice.format(aplicado.discount) }}
        </span>
      </span>
      <button type="button" class="cc__quitar" @click="quitar">Quitar</button>
    </div>

    <!-- ── Formulario ── -->
    <template v-else>
      <button
        v-if="!abierto"
        type="button"
        class="cc__abrir"
        @click="abrir"
      >
        <Ticket :size="15" stroke-width="2" aria-hidden="true" />
        ¿Tienes un cupón?
      </button>

      <div v-else class="cc__form">
        <label class="cc__label" for="cc-codigo">Código de cupón</label>
        <div class="cc__fila">
          <input
            id="cc-codigo"
            ref="entrada"
            v-model="codigo"
            class="cc__input"
            type="text"
            maxlength="40"
            autocapitalize="characters"
            autocomplete="off"
            placeholder="BIENVENIDA10"
            :disabled="validando"
            :aria-invalid="!!mensaje"
            aria-describedby="cc-msg"
            @input="alEscribir"
            @keydown.enter.prevent="validar"
          />
          <button
            type="button"
            class="cc__aplicar"
            :disabled="validando || !codigo.trim()"
            @click="validar"
          >
            {{ validando ? "…" : "Aplicar" }}
          </button>
        </div>
        <p v-if="mensaje" id="cc-msg" class="cc__msg" role="status">
          {{ mensaje }}
        </p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Ticket } from "lucide-vue-next";

const props = defineProps<{ subtotal: number }>();

const emit = defineEmits<{
  (e: "aplicado", v: { code: string; discount: number } | null): void;
}>();

const formatPrice = useFormatPrice();

const abierto = ref(false);
const codigo = ref("");
const validando = ref(false);
const mensaje = ref("");
const aplicado = ref<{ code: string; discount: number } | null>(null);
const entrada = ref<HTMLInputElement | null>(null);

async function abrir() {
  abierto.value = true;
  await nextTick();
  entrada.value?.focus();
}

function alEscribir() {
  codigo.value = codigo.value.toUpperCase();
  mensaje.value = "";
}

/* Pide al backend el descuento en vez de calcularlo aquí: las reglas del
   cupón (tipo, caducidad, tope de usos) viven en order-service y duplicarlas
   en el navegador sería mentirle al cliente en cuanto cambiaran. */
async function consultar(code: string) {
  return await $fetch<{
    valid: boolean;
    code?: string;
    discount?: number;
    total?: number;
    message?: string;
  }>("/api/coupons/validate", {
    method: "POST",
    body: { code, subtotal: props.subtotal },
  });
}

async function validar() {
  const code = codigo.value.trim().toUpperCase();
  if (!code || validando.value) return;

  validando.value = true;
  mensaje.value = "";
  try {
    const r = await consultar(code);
    if (r.valid) {
      aplicado.value = { code: r.code ?? code, discount: Number(r.discount ?? 0) };
      emit("aplicado", aplicado.value);
    } else {
      mensaje.value = r.message ?? "El cupón no es válido.";
    }
  } catch (e: any) {
    mensaje.value =
      e?.data?.message ?? "No pudimos validar el cupón. Intenta de nuevo.";
  } finally {
    validando.value = false;
  }
}

function quitar() {
  aplicado.value = null;
  codigo.value = "";
  mensaje.value = "";
  abierto.value = true;
  emit("aplicado", null);
}

/* Si el carrito cambia, el descuento de un cupón porcentual cambia con él.
   Se vuelve a pedir en silencio; si dejó de servir, se retira y se avisa en
   vez de cobrar un descuento que el backend ya no va a aplicar. */
watch(
  () => props.subtotal,
  async (nuevo) => {
    if (!aplicado.value) return;
    if (nuevo <= 0) {
      quitar();
      return;
    }
    try {
      const r = await consultar(aplicado.value.code);
      if (r.valid) {
        aplicado.value = {
          code: r.code ?? aplicado.value.code,
          discount: Number(r.discount ?? 0),
        };
        emit("aplicado", aplicado.value);
      } else {
        const code = aplicado.value.code;
        quitar();
        mensaje.value = `El cupón ${code} ya no aplica: ${r.message ?? "no es válido"}.`;
      }
    } catch {
      /* Fallo de red: se deja como estaba. El backend recalcula al
         confirmar, así que el importe final nunca depende de esto. */
    }
  },
);
</script>

<style scoped>
.cc {
  padding: 0.9rem 0;
  border-top: 1px solid var(--cp-border);
}

/* ── Disparador ── */
.cc__abrir {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  color: var(--cp-deep);
  font-family: inherit;
  font-size: 0.84rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--cp-deep) 35%, transparent);
  text-underline-offset: 3px;
}

.cc__abrir:hover {
  color: var(--cp-electric);
}

/* ── Formulario ── */
.cc__label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.74rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--cp-text-muted);
}

.cc__fila {
  display: flex;
  gap: 0.45rem;
}

.cc__input {
  flex: 1;
  min-width: 0;
  padding: 0.55rem 0.7rem;
  border: 1px solid var(--cp-border-mid);
  border-radius: 9px;
  background: var(--cp-white);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--cp-text-dark);
}

.cc__input:focus {
  outline: none;
  border-color: var(--cp-electric);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cp-electric) 18%, transparent);
}

.cc__input:disabled {
  opacity: 0.6;
}

.cc__aplicar {
  flex-shrink: 0;
  padding: 0.55rem 0.95rem;
  border: 1px solid var(--cp-navy);
  border-radius: 9px;
  background: var(--cp-navy);
  color: var(--cp-white);
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 160ms ease;
}

.cc__aplicar:hover:not(:disabled) {
  background: var(--cp-navy-mid);
}

.cc__aplicar:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cc__msg {
  margin: 0.45rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--cp-error-text);
}

/* ── Aplicado ── */
.cc__ok {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.7rem;
  border: 1px dashed var(--cp-success-border);
  border-radius: 10px;
  background: var(--cp-success-bg);
}

.cc__ok-icono {
  display: flex;
  flex-shrink: 0;
  color: var(--cp-success-text);
}

.cc__ok-texto {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.cc__ok-codigo {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--cp-success-text);
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc__ok-ahorro {
  font-size: 0.74rem;
  color: var(--cp-success-text);
  opacity: 0.85;
}

.cc__quitar {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  color: var(--cp-text-muted);
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.cc__quitar:hover {
  color: var(--cp-error-text);
}
</style>

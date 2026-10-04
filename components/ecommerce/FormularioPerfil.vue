<template>
  <section class="fp">
    <div class="fp__head">
      <h2 class="fp__title">Mis datos</h2>
      <button
        v-if="!editando && !pending"
        type="button"
        class="fp__edit"
        @click="abrir"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
        </svg>
        Editar
      </button>
    </div>

    <!-- ── Carga ── -->
    <div v-if="pending" class="fp__loading">
      <div class="cp-skeleton" style="height: 14px; width: 60%" />
      <div class="cp-skeleton" style="height: 14px; width: 80%" />
      <div class="cp-skeleton" style="height: 14px; width: 45%" />
    </div>

    <!-- ── Lectura ── -->
    <template v-else-if="!editando">
      <dl class="fp__data">
        <div>
          <dt>Nombre</dt>
          <dd>{{ perfil?.name || "—" }}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{{ perfil?.email || "—" }}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd :class="{ 'fp__missing': !perfil?.phone }">
            {{ perfil?.phone || "Sin registrar" }}
          </dd>
        </div>
        <div>
          <dt>Dirección de entrega</dt>
          <dd :class="{ 'fp__missing': !perfil?.address }">
            {{ perfil?.address || "Sin registrar" }}
          </dd>
        </div>
        <div v-if="perfil?.addressReference">
          <dt>Referencia</dt>
          <dd>{{ perfil.addressReference }}</dd>
        </div>
      </dl>

      <!-- Sin dirección el checkout obliga a escribirla en cada compra:
           merece la pena avisarlo aquí. -->
      <p v-if="!perfil?.address" class="fp__tip">
        Guarda tu dirección y la usaremos como predeterminada al comprar.
      </p>
    </template>

    <!-- ── Edición ── -->
    <form v-else class="fp__form" @submit.prevent="guardar">
      <div class="fp__field">
        <label class="fp__label" for="fp-name">
          Nombre completo <span class="fp__req">*</span>
        </label>
        <input
          id="fp-name"
          v-model="form.name"
          type="text"
          class="fp__input"
          :class="{ 'is-invalid': tocado && !nombreOk }"
          autocomplete="name"
          maxlength="120"
          required
        />
        <span v-if="tocado && !nombreOk" class="fp__error">
          Escribe tu nombre (al menos 2 caracteres).
        </span>
      </div>

      <div class="fp__field">
        <label class="fp__label" for="fp-phone">Teléfono</label>
        <input
          id="fp-phone"
          v-model="form.phone"
          type="tel"
          inputmode="tel"
          class="fp__input"
          :class="{ 'is-invalid': tocado && !telefonoOk }"
          placeholder="999 999 999"
          autocomplete="tel"
        />
        <span v-if="tocado && !telefonoOk" class="fp__error">
          El teléfono debe tener al menos 9 dígitos.
        </span>
        <span v-else class="fp__hint">Por aquí coordinamos las entregas.</span>
      </div>

      <div class="fp__field">
        <label class="fp__label" for="fp-address">Dirección de entrega</label>
        <input
          id="fp-address"
          v-model="form.address"
          type="text"
          class="fp__input"
          placeholder="Av. Principal 123, distrito, ciudad"
          autocomplete="street-address"
          maxlength="255"
        />
      </div>

      <div class="fp__field">
        <label class="fp__label" for="fp-ref">Referencia</label>
        <input
          id="fp-ref"
          v-model="form.addressReference"
          type="text"
          class="fp__input"
          placeholder="Cerca al parque, edificio azul, portón negro…"
          autocomplete="address-line2"
          maxlength="255"
        />
      </div>

      <!-- El correo identifica la cuenta: cambiarlo afecta el acceso, así
           que se muestra pero no se edita aquí. -->
      <div class="fp__field">
        <label class="fp__label" for="fp-email">Correo</label>
        <input id="fp-email" :value="perfil?.email" type="email" class="fp__input" disabled />
        <span class="fp__hint">
          Para cambiar tu correo escríbenos por WhatsApp.
        </span>
      </div>

      <p v-if="error" class="fp__alert" role="alert">{{ error }}</p>

      <div class="fp__actions">
        <button type="submit" class="btn btn-primary btn-sm" :disabled="guardando">
          {{ guardando ? "Guardando…" : "Guardar cambios" }}
        </button>
        <button type="button" class="btn btn-ghost btn-sm" :disabled="guardando" @click="cancelar">
          Cancelar
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
type Perfil = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  addressReference: string | null;
};

const toast = useAppToast();
const { fetch: refrescarSesion } = useUserSession();

const { data: perfil, pending, refresh } = await useFetch<Perfil>("/api/mi-perfil", {
  default: () => null,
});

const editando = ref(false);
const guardando = ref(false);
const tocado = ref(false);
const error = ref("");

const form = reactive({
  name: "",
  phone: "",
  address: "",
  addressReference: "",
});

const nombreOk = computed(() => form.name.trim().length >= 2);
/* El teléfono es opcional; si se escribe, tiene que ser usable. */
const telefonoOk = computed(
  () => !form.phone.trim() || form.phone.replace(/\D/g, "").length >= 9,
);

function abrir() {
  error.value = "";
  tocado.value = false;
  Object.assign(form, {
    name: perfil.value?.name ?? "",
    phone: perfil.value?.phone ?? "",
    address: perfil.value?.address ?? "",
    addressReference: perfil.value?.addressReference ?? "",
  });
  editando.value = true;
}

function cancelar() {
  editando.value = false;
  error.value = "";
}

async function guardar() {
  tocado.value = true;
  error.value = "";

  if (!nombreOk.value || !telefonoOk.value) return;

  guardando.value = true;
  try {
    await $fetch("/api/mi-perfil", { method: "PUT", body: { ...form } });

    /* Se refrescan ambos: el perfil para el formulario y la sesión para
       que el saludo del portal y el checkout vean los datos nuevos. */
    await Promise.all([refresh(), refrescarSesion()]);

    editando.value = false;
    toast.add({ title: "Datos actualizados", color: "success" });
  } catch (e: any) {
    error.value =
      e?.data?.message ?? "No se pudieron guardar los cambios. Inténtalo otra vez.";
  } finally {
    guardando.value = false;
  }
}
</script>

<style scoped>
.fp {
  display: flex;
  flex-direction: column;
  padding: var(--sp-5);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.fp__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding-bottom: var(--sp-4);
  border-bottom: 1px solid var(--line-soft);
  margin-bottom: var(--sp-4);
}

.fp__title {
  font-size: var(--fs-h4);
  font-weight: var(--fw-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--ink-strong);
}

.fp__edit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-body);
  font-family: inherit;
  font-size: var(--fs-2xs);
  font-weight: var(--fw-bold);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    background var(--t-base) var(--ease-smooth),
    color var(--t-base) var(--ease-smooth);
}

.fp__edit svg {
  width: 13px;
  height: 13px;
}

.fp__edit:hover {
  border-color: var(--accent-line);
  background: var(--accent-quiet);
  color: var(--accent-strong);
}

.fp__loading {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

/* ── Lectura ── */
.fp__data {
  display: flex;
  flex-direction: column;
  margin: 0;
}

.fp__data > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--sp-4);
  padding: var(--sp-3) 0;
  border-bottom: 1px solid var(--line-soft);
}

.fp__data > div:first-child {
  padding-top: 0;
}

.fp__data > div:last-child {
  border-bottom: 0;
}

.fp__data dt {
  font-size: var(--fs-xs);
  color: var(--ink-muted);
  flex-shrink: 0;
}

.fp__data dd {
  margin: 0;
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
  text-align: right;
  line-height: var(--leading-snug);
  word-break: break-word;
}

.fp__missing {
  font-weight: var(--fw-regular) !important;
  font-style: italic;
  color: var(--ink-faint) !important;
}

.fp__tip {
  margin-top: var(--sp-4);
  padding: var(--sp-3);
  border: 1px solid var(--accent-line);
  border-radius: var(--radius-sm);
  background: var(--accent-quiet);
  font-size: var(--fs-2xs);
  line-height: var(--leading-normal);
  color: var(--accent-strong);
}

/* ── Formulario ── */
.fp__form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-4);
}

.fp__field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.fp__label {
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
  color: var(--ink-strong);
}

.fp__req {
  color: var(--cp-danger);
}

.fp__input {
  width: 100%;
  height: 42px;
  padding: 0 var(--sp-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface-raised);
  color: var(--ink-strong);
  font-family: inherit;
  font-size: var(--fs-sm);
  transition:
    border-color var(--t-base) var(--ease-smooth),
    box-shadow var(--t-base) var(--ease-smooth);
}

.fp__input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--shadow-focus);
}

.fp__input:disabled {
  background: var(--surface-inset);
  color: var(--ink-muted);
  cursor: not-allowed;
}

.fp__input.is-invalid {
  border-color: var(--cp-danger);
}

.fp__hint {
  font-size: var(--fs-2xs);
  color: var(--ink-faint);
}

.fp__error {
  font-size: var(--fs-2xs);
  font-weight: var(--fw-semibold);
  color: var(--cp-danger);
}

.fp__alert {
  padding: var(--sp-3);
  border: 1px solid var(--cp-error-border);
  border-radius: var(--radius-sm);
  background: var(--cp-error-bg);
  color: var(--cp-error-text);
  font-size: var(--fs-xs);
  font-weight: var(--fw-semibold);
}

.fp__actions {
  display: flex;
  gap: var(--sp-2);
}

@media (max-width: 480px) {
  .fp__data > div {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .fp__data dd {
    text-align: left;
  }

  .fp__actions {
    flex-direction: column;
  }
}
</style>

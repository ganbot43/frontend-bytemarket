<template>
  <!-- Cargando -->
  <template v-if="pending && !item">
    <div class="sp-modal-state">
      <Loader2 class="rd-spin w-6 h-6 text-current" stroke-width="2" />
      <p class="sp-modal-state__text">Cargando reclamo...</p>
    </div>
  </template>

  <!-- Error -->
  <template v-else-if="error">
    <div class="sp-modal-state">
      <div class="sp-table-empty__icon">
        <AlertCircle class="w-6 h-6 text-current" stroke-width="1.5" />
      </div>
      <p class="sp-modal-state__text">No se pudo cargar el reclamo.</p>
      <div class="sp-modal-state__actions">
        <button class="sp-drawer-btn sp-drawer-btn--ghost" @click="refresh()">Reintentar</button>
        <button class="sp-drawer-btn sp-drawer-btn--primary" @click="$emit('close')">Cerrar</button>
      </div>
    </div>
  </template>

  <!-- Contenido -->
  <template v-else-if="item">

    <!-- Header -->
    <div class="sp-modal-header">
      <div class="sp-modal-header__content">
        <h2 class="sp-modal-header__title">{{ item.codigo }}</h2>
        <div class="sp-modal-header__sub">
          <span class="sp-modal-header__meta">{{ formatDateTime(item.createdAt) }}</span>
          <span class="sp-badge" :class="getStatusBadgeClass(item.estado)">
            <span class="sp-badge__dot"/>
            {{ formatEstado(item.estado) }}
          </span>
          <span class="sp-badge" :class="item.tipoReclamo === 'Queja' ? 'sp-badge--warning' : 'sp-badge--info'">
            {{ item.tipoReclamo }}
          </span>
        </div>
      </div>
      <button class="sp-modal-close" @click="$emit('close')">✕</button>
    </div>

    <!-- Body -->
    <div class="sp-modal-body">
      <div class="rd-grid">

        <!-- Datos del consumidor -->
        <section class="rd-card">
          <p class="rd-card__label">
            <User class="w-3 h-3 text-current" stroke-width="1.5" />
            Consumidor
          </p>
          <div class="rd-fields">
            <div class="rd-field rd-field--full">
              <span class="rd-field__key">Nombre</span>
              <span class="rd-field__val">{{ item.customerName }}</span>
            </div>
            <div class="rd-field">
              <span class="rd-field__key">Documento</span>
              <span class="rd-field__val">{{ item.tipoDocumento }} · {{ item.numeroDocumento }}</span>
            </div>
            <div class="rd-field">
              <span class="rd-field__key">Teléfono</span>
              <a :href="`tel:${item.telefono}`" class="rd-field__val rd-link">{{ item.telefono || '—' }}</a>
            </div>
            <div class="rd-field rd-field--full">
              <span class="rd-field__key">Email</span>
              <a :href="`mailto:${item.email}`" class="rd-field__val rd-link">{{ item.email }}</a>
            </div>
            <div v-if="item.direccion" class="rd-field rd-field--full">
              <span class="rd-field__key">Dirección</span>
              <span class="rd-field__val">{{ item.direccion }}</span>
            </div>
          </div>
        </section>

        <!-- Bien + Reclamo -->
        <div class="rd-col">

          <!-- Bien contratado -->
          <section class="rd-card">
            <p class="rd-card__label">
              <Package class="w-3 h-3 text-current" stroke-width="1.5" />
              Bien contratado
            </p>
            <div class="rd-fields">
              <div class="rd-field">
                <span class="rd-field__key">Tipo</span>
                <span class="rd-field__val">{{ item.tipoBien }}</span>
              </div>
              <div class="rd-field">
                <span class="rd-field__key">Monto</span>
                <span class="rd-field__val rd-field__val--amount">
                  {{ item.monto ? `S/ ${Number(item.monto).toFixed(2)}` : '—' }}
                </span>
              </div>
              <div class="rd-field rd-field--full">
                <span class="rd-field__key">Descripción</span>
                <span class="rd-field__val rd-field__val--long">{{ item.descripcionBien }}</span>
              </div>
            </div>
          </section>

          <!-- Detalle del reclamo -->
          <section class="rd-card">
            <p class="rd-card__label">
              <MessageCircle class="w-3 h-3 text-current" stroke-width="1.5" />
              Detalle del reclamo
            </p>
            <div class="rd-fields">
              <div class="rd-field rd-field--full">
                <span class="rd-field__key">Descripción</span>
                <span class="rd-field__val rd-field__val--long">{{ item.descripcion }}</span>
              </div>
              <div class="rd-field rd-field--full">
                <span class="rd-field__key">¿Qué solicita?</span>
                <span class="rd-field__val">{{ item.pedido }}</span>
              </div>
              <div v-if="item.archivoUrl" class="rd-field rd-field--full">
                <span class="rd-field__key">Adjunto</span>
                <a :href="item.archivoUrl" target="_blank" rel="noopener" class="rd-file-link">
                  <Paperclip class="w-3 h-3 text-current" stroke-width="1.5" />
                  Ver archivo adjunto
                </a>
              </div>
            </div>
          </section>
        </div>

      </div>

      <!-- Gestión y respuesta -->
      <section class="rd-card rd-card--action">
        <p class="rd-card__label">
          <Briefcase class="w-3 h-3 text-current" stroke-width="1.5" />
          Gestión y respuesta
        </p>

        <form @submit.prevent="save" class="rd-form">
          <div class="rd-form__row">
            <div class="rd-form__field">
              <label class="rd-form__label">Estado del reclamo</label>
              <select v-model="local.estado" class="sp-drawer-input sp-drawer-select">
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="respondido">Respondido</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </div>
          </div>

          <div class="rd-form__field rd-form__field--full">
            <label class="rd-form__label">
              Respuesta del negocio
              <span v-if="item.fechaRespuesta" class="rd-form__hint">
                · Última: {{ formatDateTime(item.fechaRespuesta) }}
              </span>
            </label>
            <textarea
              v-model="local.respuesta"
              class="sp-drawer-input sp-drawer-textarea"
              rows="4"
              placeholder="Escribe la respuesta al cliente..."
            />
            <div class="rd-form__info">
              <Info class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              <span>Esta respuesta será registrada en el sistema. <strong>No se enviará por correo electrónico</strong> al cliente.</span>
            </div>
          </div>

          <div class="rd-form__actions">
            <button type="submit" class="sp-drawer-btn sp-drawer-btn--primary" :disabled="saving">
              <Loader2 v-if="saving" class="rd-spin w-3.5 h-3.5" stroke-width="2" />
              <Check v-else class="w-3.5 h-3.5 text-current" stroke-width="1.5" />
              {{ saving ? 'Guardando...' : 'Guardar cambios' }}
            </button>
            <button type="button" class="sp-drawer-btn sp-drawer-btn--ghost" @click="$emit('close')">
              Cancelar
            </button>
          </div>
        </form>
      </section>
    </div>

  </template>
</template>

<script setup>
import { Loader2, AlertCircle, User, Package, MessageCircle, Paperclip, Briefcase, Info, Check } from "lucide-vue-next";

const props = defineProps({
  reclamacionId: { type: Number, required: true },
})

const emit = defineEmits(['close', 'updated'])

const { formatDateTime } = useFormatDateTime()

const { data, pending, error, refresh } = await useFetch(
  () => `/api/admin/reclamaciones/${props.reclamacionId}`,
  { watch: [() => props.reclamacionId] }
)

const item  = computed(() => data.value ?? null)
const local = reactive({ estado: '', respuesta: '' })
const saving = ref(false)

watch(item, (v) => {
  if (v) {
    local.estado    = v.estado
    local.respuesta = v.respuesta ?? ''
  }
}, { immediate: true })

function formatEstado(estado) {
  const map = {
    pendiente:  'Pendiente',
    en_proceso: 'En proceso',
    respondido: 'Respondido',
    cerrado:    'Cerrado',
  }
  return map[estado] || estado
}

function getStatusBadgeClass(estado) {
  switch (estado) {
    case 'pendiente':  return 'sp-badge--warning'
    case 'en_proceso': return 'sp-badge--info'
    case 'respondido': return 'sp-badge--success'
    case 'cerrado':    return 'sp-badge--neutral'
    default:           return 'sp-badge--neutral'
  }
}

async function save() {
  if (!local.respuesta.trim()) {
    useAppToast().add({ title: 'Escribe una respuesta antes de guardar', color: 'error' })
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/admin/reclamaciones/${props.reclamacionId}`, {
      method: 'PUT',
      body: { estado: local.estado, respuesta: local.respuesta },
    })
    await refresh()
    emit('updated')
    useAppToast().add({ title: 'Reclamo actualizado', color: 'success' })
  } catch (err) {
    useAppToast().add({ title: err?.data?.message || 'Error guardando', color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Grid 2 columnas */
.rd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 640px) {
  .rd-grid { grid-template-columns: 1fr; }
}

.rd-col { display: flex; flex-direction: column; gap: 1rem; }

/* Cards */
.rd-card {
  background: var(--sp-surface-solid);
  border: 1px solid var(--sp-border);
  border-radius: var(--sp-radius-lg);
  padding: 1rem 1.15rem;
  box-shadow: var(--sp-shadow-xs);
}

.rd-card--action {
  border-color: rgba(0, 174, 239, 0.14);
  background: linear-gradient(135deg,
    rgba(0, 174, 239, 0.02) 0%,
    var(--sp-surface-solid) 100%);
  margin-bottom: 0;
}

.rd-card__label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--sp-text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--sp-text-soft);
  margin: 0 0 0.85rem;
}

/* Fields */
.rd-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.rd-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--sp-surface-muted);
  border-radius: var(--sp-radius-sm);
  padding: 7px 10px;
}

.rd-field--full { grid-column: 1 / -1; }

.rd-field__key {
  font-size: 10px;
  color: var(--sp-text-soft);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.rd-field__val {
  font-size: var(--sp-text-sm);
  color: var(--sp-text-strong);
  font-weight: 500;
  line-height: 1.4;
}

.rd-field__val--long {
  white-space: pre-wrap;
  word-break: break-word;
  font-weight: 400;
  color: var(--sp-text);
}

.rd-field__val--amount {
  color: var(--sp-primary);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}

.rd-link {
  color: var(--sp-primary);
  text-decoration: none;
}
.rd-link:hover { text-decoration: underline; }

/* Adjunto */
.rd-file-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--sp-primary-soft);
  color: var(--sp-primary);
  border: 1px solid rgba(0, 174, 239, 0.15);
  border-radius: var(--sp-radius-pill);
  font-size: var(--sp-text-xs);
  font-weight: 600;
  text-decoration: none;
  transition: background var(--sp-t-fast) var(--sp-ease);
  width: fit-content;
}
.rd-file-link:hover {
  background: var(--sp-primary);
  color: #fff;
}

/* Formulario */
.rd-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.rd-form__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.rd-form__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rd-form__field--full { grid-column: 1 / -1; }

.rd-form__label {
  font-size: var(--sp-text-xs);
  font-weight: 700;
  color: var(--sp-text);
}

.rd-form__hint {
  font-weight: 400;
  color: var(--sp-text-soft);
}

.rd-form__info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 174, 239, 0.05);
  border: 1px solid rgba(0, 174, 239, 0.15);
  border-radius: var(--sp-radius-sm);
  font-size: var(--sp-text-xs);
  color: var(--sp-text-soft);
  margin-top: 4px;
}

.rd-form__info svg {
  flex-shrink: 0;
  color: var(--sp-primary);
  margin-top: 1px;
}

.rd-form__actions {
  display: flex;
  gap: 0.65rem;
  padding-top: 0.65rem;
  border-top: 1px solid var(--sp-border);
}

/* Badges */
.sp-badge--info {
  background: rgba(0, 174, 239, 0.1);
  color: #003f8a;
  border: 1px solid rgba(0, 174, 239, 0.18);
}

/* Spinner */
@keyframes rd-spin { to { transform: rotate(360deg); } }
.rd-spin { animation: rd-spin 0.75s linear infinite; flex-shrink: 0; }
</style>
<template>
  <section class="rp" aria-labelledby="rp-titulo">
    <div class="cp-container">
      <div class="cp-head">
        <div class="cp-head__text">
          <p class="cp-eyebrow">Opiniones</p>
          <h2 id="rp-titulo" class="cp-head__title">Reseñas del producto</h2>
          <p class="cp-head__sub">
            Solo publicamos las reseñas que revisamos antes.
          </p>
        </div>
      </div>

      <div class="rp__body">
        <!-- ═══ Resumen ═══ -->
        <aside class="rp__resumen">
          <template v-if="total > 0">
            <p class="rp__promedio">{{ promedioTexto }}</p>
            <SharedEstrellas :valor="promedio" tamano="md" />
            <p class="rp__total">
              {{ total }} {{ total === 1 ? "reseña" : "reseñas" }}
            </p>

            <!-- Reparto por puntuación: ayuda a leer si el promedio viene
                 de opiniones parejas o de extremos opuestos. -->
            <ul class="rp__reparto">
              <li v-for="n in [5, 4, 3, 2, 1]" :key="n" class="rp__reparto-fila">
                <span class="rp__reparto-n">{{ n }}★</span>
                <span class="rp__reparto-barra">
                  <span
                    class="rp__reparto-relleno"
                    :style="{ width: `${porcentaje(n)}%` }"
                  />
                </span>
                <span class="rp__reparto-c">{{ reparto[n] ?? 0 }}</span>
              </li>
            </ul>
          </template>

          <template v-else>
            <p class="rp__sin-promedio">Aún sin reseñas</p>
            <p class="rp__sin-texto">
              Sé la primera persona en opinar sobre este producto.
            </p>
          </template>
        </aside>

        <!-- ═══ Formulario + listado ═══ -->
        <div class="rp__principal">
          <!-- Escribir -->
          <div class="rp__caja">
            <!-- Sin sesión -->
            <template v-if="!loggedIn">
              <h3 class="rp__caja-titulo">Deja tu reseña</h3>
              <p class="rp__caja-texto">
                Necesitas una cuenta para opinar. Así evitamos reseñas falsas.
              </p>
              <NuxtLink :to="enlaceLogin" class="btn btn-primary btn-sm">
                Inicia sesión
              </NuxtLink>
            </template>

            <!-- Enviada -->
            <template v-else-if="estado === 'enviado'">
              <div class="rp__aviso rp__aviso--ok">
                <Check class="rp__aviso-icono" :size="18" stroke-width="2.5" />
                <div>
                  <p class="rp__aviso-titulo">¡Gracias por tu reseña!</p>
                  <p class="rp__aviso-texto">
                    La revisaremos y se publicará aquí en cuanto la aprobemos.
                  </p>
                </div>
              </div>
            </template>

            <!-- Ya opinó antes -->
            <template v-else-if="estado === 'ya-resenada'">
              <div class="rp__aviso">
                <Info class="rp__aviso-icono" :size="18" stroke-width="2.5" />
                <div>
                  <p class="rp__aviso-titulo">Ya dejaste tu reseña</p>
                  <p class="rp__aviso-texto">
                    Solo se admite una por producto y por cuenta.
                  </p>
                </div>
              </div>
            </template>

            <!-- Formulario -->
            <template v-else>
              <h3 class="rp__caja-titulo">Deja tu reseña</h3>

              <div class="cp-field">
                <label class="cp-field__label" id="rp-punt">Tu puntuación</label>
                <div
                  class="rp__picker"
                  role="radiogroup"
                  aria-labelledby="rp-punt"
                  @mouseleave="hover = 0"
                >
                  <button
                    v-for="n in 5"
                    :key="n"
                    type="button"
                    class="rp__picker-btn"
                    role="radio"
                    :aria-checked="form.rating === n"
                    :aria-label="`${n} de 5 estrellas`"
                    @click="form.rating = n"
                    @mouseenter="hover = n"
                    @focus="hover = n"
                  >
                    <Star
                      :size="26"
                      stroke-width="1.5"
                      :class="
                        n <= (hover || form.rating)
                          ? 'rp__estrella--on'
                          : 'rp__estrella--off'
                      "
                    />
                  </button>
                  <span v-if="form.rating" class="rp__picker-texto">
                    {{ textoPuntuacion[form.rating] }}
                  </span>
                </div>
              </div>

              <div class="cp-field">
                <label for="rp-comentario" class="cp-field__label">
                  Tu comentario <span class="rp__opcional">(opcional)</span>
                </label>
                <textarea
                  id="rp-comentario"
                  v-model="form.comment"
                  class="cp-input rp__textarea"
                  rows="4"
                  maxlength="1000"
                  placeholder="¿Qué tal te funcionó? ¿Encajó bien?"
                />
                <p class="rp__contador">{{ form.comment.length }}/1000</p>
              </div>

              <p v-if="error" class="rp__error">{{ error }}</p>

              <button
                type="button"
                class="btn btn-primary btn-sm"
                :disabled="enviando || !form.rating"
                @click="enviar"
              >
                {{ enviando ? "Enviando…" : "Publicar reseña" }}
              </button>
              <p v-if="!form.rating" class="rp__ayuda">
                Elige una puntuación para continuar.
              </p>
            </template>
          </div>

          <!-- Listado -->
          <ul v-if="resenas.length" class="rp__lista">
            <li v-for="r in resenas" :key="r.id" class="rp__item">
              <div class="rp__item-cab">
                <SharedEstrellas :valor="r.rating" tamano="sm" />
                <time class="rp__fecha" :datetime="r.createdAt">
                  {{ formatDate(r.createdAt) }}
                </time>
              </div>
              <p v-if="r.comment" class="rp__comentario">{{ r.comment }}</p>
              <p v-else class="rp__comentario rp__comentario--vacio">
                Puntuó sin dejar comentario.
              </p>
            </li>
          </ul>

          <p v-else-if="!cargando" class="rp__vacio">
            Todavía no hay reseñas publicadas de este producto.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Star, Check, Info } from "lucide-vue-next";

const props = defineProps<{ productoId: number | null | undefined }>();

/* La ficha necesita el promedio para el aggregateRating de sus datos
   estructurados. Se lo pasamos hacia arriba en vez de que repita la
   petición o lea la caché por clave. */
const emit = defineEmits<{
  (e: "resumen", v: { average: number; total: number }): void;
}>();

const { loggedIn } = useUserSession();
const route = useRoute();
const { formatDate } = useFormatDateTime();

/* Al volver del login se regresa a la ficha, no a la portada. */
const enlaceLogin = computed(
  () => `/login?redirect=${encodeURIComponent(route.fullPath)}`,
);

const textoPuntuacion: Record<number, string> = {
  1: "Muy malo",
  2: "Malo",
  3: "Regular",
  4: "Bueno",
  5: "Excelente",
};

/* Clave compartida: la ficha reutiliza estos datos para el aggregateRating
   de los datos estructurados sin repetir la petición. */
const clave = computed(() => `resenas-${props.productoId ?? "none"}`);

const { data, pending: cargando, refresh } = await useAsyncData<{
  data: any[];
  average: number;
  total: number;
}>(
  () => clave.value,
  async () => {
    if (!props.productoId) return { data: [], average: 0, total: 0 };
    return await $fetch(`/api/reviews?productId=${props.productoId}`);
  },
  { watch: [() => props.productoId] },
);

const resenas = computed(() => data.value?.data ?? []);
const total = computed(() => data.value?.total ?? 0);
const promedio = computed(() => Number(data.value?.average ?? 0));
/* El backend ya redondea a un decimal; "4" se lee mejor que "4.0". */
const promedioTexto = computed(() =>
  Number.isInteger(promedio.value)
    ? String(promedio.value)
    : promedio.value.toFixed(1),
);

watch(
  data,
  (v) => {
    if (v) emit("resumen", { average: Number(v.average ?? 0), total: v.total ?? 0 });
  },
  { immediate: true },
);

const reparto = computed<Record<number, number>>(() => {
  const r: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const x of resenas.value) if (r[x.rating] !== undefined) r[x.rating]++;
  return r;
});

function porcentaje(n: number) {
  if (!resenas.value.length) return 0;
  return Math.round(((reparto.value[n] ?? 0) / resenas.value.length) * 100);
}

const estado = ref<"formulario" | "enviado" | "ya-resenada">("formulario");
const hover = ref(0);
const enviando = ref(false);
const error = ref("");
const form = reactive({ rating: 0, comment: "" });

async function enviar() {
  if (!form.rating || !props.productoId) return;
  enviando.value = true;
  error.value = "";
  try {
    await $fetch("/api/reviews", {
      method: "POST",
      body: {
        productId: props.productoId,
        rating: form.rating,
        comment: form.comment.trim() || null,
      },
    });
    estado.value = "enviado";
    form.rating = 0;
    form.comment = "";
    /* Queda "pending", así que todavía no aparece en la lista; se recarga
       igual por si entretanto se aprobaron otras. */
    await refresh();
  } catch (e: any) {
    const status = e?.statusCode ?? e?.response?.status;
    if (status === 409) {
      estado.value = "ya-resenada";
    } else if (status === 401) {
      error.value = "Tu sesión expiró. Vuelve a iniciar sesión para opinar.";
    } else {
      error.value = e?.data?.message ?? "No pudimos enviar tu reseña. Intenta de nuevo.";
    }
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.rp {
  padding: 3rem 0 1rem;
  border-top: 1px solid var(--cp-border);
}

.rp__body {
  display: grid;
  grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
  gap: 2.5rem;
  margin-top: 1.5rem;
  align-items: start;
}

/* ── Resumen ── */
.rp__resumen {
  padding: 1.25rem;
  border: 1px solid var(--cp-border);
  border-radius: 14px;
  background: var(--cp-paper-25);
  text-align: center;
  position: sticky;
  top: 1.5rem;
}

.rp__promedio {
  margin: 0;
  font-size: 2.75rem;
  font-weight: 700;
  line-height: 1;
  color: var(--cp-text-dark);
  letter-spacing: -0.03em;
}

.rp__total {
  margin: 0.5rem 0 0;
  font-size: 0.82rem;
  color: var(--cp-text-muted);
}

.rp__sin-promedio {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--cp-text-dark);
}

.rp__sin-texto {
  margin: 0.4rem 0 0;
  font-size: 0.82rem;
  color: var(--cp-text-muted);
  line-height: 1.5;
}

/* ── Reparto ── */
.rp__reparto {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0.9rem 0 0;
  border-top: 1px solid var(--cp-border);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.rp__reparto-fila {
  display: grid;
  grid-template-columns: 1.9rem 1fr 1.2rem;
  align-items: center;
  gap: 0.5rem;
}

.rp__reparto-n,
.rp__reparto-c {
  font-size: 0.72rem;
  color: var(--cp-text-muted);
  font-variant-numeric: tabular-nums;
}

.rp__reparto-c {
  text-align: right;
}

.rp__reparto-barra {
  height: 6px;
  border-radius: 999px;
  background: var(--cp-paper-200);
  overflow: hidden;
}

.rp__reparto-relleno {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #f59e0b;
  transition: width 320ms ease;
}

/* ── Caja de escritura ── */
.rp__caja {
  padding: 1.25rem;
  border: 1px solid var(--cp-border);
  border-radius: 14px;
  background: var(--cp-white);
  margin-bottom: 1.5rem;
}

.rp__caja-titulo {
  margin: 0 0 0.35rem;
  font-size: 1.02rem;
  font-weight: 600;
  color: var(--cp-text-dark);
}

.rp__caja-texto {
  margin: 0 0 0.9rem;
  font-size: 0.85rem;
  color: var(--cp-text-muted);
  line-height: 1.55;
}

.rp__opcional {
  font-weight: 400;
  color: var(--cp-text-faint);
}

/* ── Selector de estrellas ── */
.rp__picker {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.rp__picker-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  line-height: 0;
  border-radius: 6px;
}

.rp__picker-btn:focus-visible {
  outline: 2px solid var(--cp-cyan-500);
  outline-offset: 1px;
}

.rp__picker-texto {
  margin-left: 0.6rem;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--cp-text-body);
}

.rp__estrella--on {
  color: #f59e0b;
  fill: #f59e0b;
}

.rp__estrella--off {
  color: var(--cp-slate-300);
}

.rp__textarea {
  resize: vertical;
  min-height: 5.5rem;
  font-family: inherit;
}

.rp__contador {
  margin: 0.3rem 0 0;
  font-size: 0.72rem;
  color: var(--cp-text-faint);
  text-align: right;
}

.rp__error {
  margin: 0 0 0.75rem;
  padding: 0.6rem 0.75rem;
  border: 1px solid var(--cp-error-border);
  border-radius: 8px;
  background: var(--cp-error-bg);
  color: var(--cp-error-text);
  font-size: 0.82rem;
}

.rp__ayuda {
  margin: 0.5rem 0 0;
  font-size: 0.75rem;
  color: var(--cp-text-faint);
}

/* ── Avisos ── */
.rp__aviso {
  display: flex;
  gap: 0.65rem;
  padding: 0.85rem;
  border: 1px solid var(--cp-info-border);
  border-radius: 10px;
  background: var(--cp-info-bg);
  color: var(--cp-info-text);
}

.rp__aviso--ok {
  border-color: var(--cp-success-border);
  background: var(--cp-success-bg);
  color: var(--cp-success-text);
}

.rp__aviso-icono {
  flex-shrink: 0;
  margin-top: 1px;
}

.rp__aviso-titulo {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
}

.rp__aviso-texto {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  line-height: 1.5;
  opacity: 0.9;
}

/* ── Listado ── */
.rp__lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.rp__item {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--cp-border);
}

.rp__item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.rp__item-cab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.45rem;
}

.rp__fecha {
  font-size: 0.75rem;
  color: var(--cp-text-faint);
  flex-shrink: 0;
}

.rp__comentario {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--cp-text-body);
  white-space: pre-line;
}

.rp__comentario--vacio {
  color: var(--cp-text-faint);
  font-style: italic;
}

.rp__vacio {
  margin: 0;
  font-size: 0.88rem;
  color: var(--cp-text-muted);
}

@media (max-width: 860px) {
  .rp__body {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }

  .rp__resumen {
    position: static;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0 1.25rem;
    text-align: left;
    align-items: center;
  }

  .rp__reparto {
    grid-column: 1 / -1;
  }
}
</style>

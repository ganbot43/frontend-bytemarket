<template>
  <div class="sp-auth__card" :class="{ 'sp-auth__card--shake': shaking }">
    <NuxtLink to="/" class="sp-auth__mobile-brand">
      <img :src="logo" :alt="companyName" />
      <span>{{ companyName }}</span>
    </NuxtLink>

    <h1 class="sp-auth__title">Crear cuenta</h1>
    <p class="sp-auth__sub">Para seguir tus pedidos y comprar más rápido.</p>

    <form class="sp-auth__form" @submit.prevent="register">
      <div class="sp-auth__field">
        <label class="sp-auth__label" for="reg-name">Nombre completo</label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
            </svg>
          </span>
          <input
            id="reg-name"
            v-model="form.name"
            type="text"
            class="sp-auth__input"
            placeholder="Tu nombre y apellido"
            autocomplete="name"
            required
          />
        </div>
      </div>

      <div class="sp-auth__field">
        <label class="sp-auth__label" for="reg-email">Correo electrónico</label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            id="reg-email"
            v-model="form.email"
            type="email"
            class="sp-auth__input"
            placeholder="tucorreo@ejemplo.com"
            autocomplete="email"
            required
          />
        </div>
      </div>

      <div class="sp-auth__field">
        <label class="sp-auth__label" for="reg-phone">
          Teléfono
          <span class="sp-auth__hint">· opcional</span>
        </label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="7" y="2.5" width="10" height="19" rx="2" />
              <path d="M11 18.5h2" />
            </svg>
          </span>
          <input
            id="reg-phone"
            v-model="form.phone"
            type="tel"
            class="sp-auth__input"
            placeholder="999 999 999"
            autocomplete="tel"
          />
        </div>
      </div>

      <div class="sp-auth__field">
        <label class="sp-auth__label" for="reg-password">Contraseña</label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            id="reg-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="sp-auth__input sp-auth__input--pw"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
            minlength="6"
            required
          />
          <button
            type="button"
            class="sp-auth__toggle"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <svg v-if="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.2 0 10 6 10 6a17 17 0 0 1-3.2 3.8M6.5 7.7A17 17 0 0 0 2 12s3.8 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
              <path d="m3 3 18 18" />
            </svg>
          </button>
        </div>
        <span class="sp-auth__hint">Usa al menos 6 caracteres.</span>
      </div>

      <p v-if="error" class="sp-auth__error" role="alert">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
        {{ error }}
      </p>

      <button type="submit" class="sp-auth__submit" :disabled="loading">
        <span v-if="loading" class="sp-auth__spin" aria-hidden="true" />
        {{ loading ? "Creando cuenta…" : "Crear cuenta" }}
      </button>
    </form>

    <p class="sp-auth__alt">
      ¿Ya tienes cuenta?
      <NuxtLink :to="loginHref">Iniciar sesión</NuxtLink>
    </p>

    <NuxtLink to="/" class="sp-auth__back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      Volver a la tienda
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "auth", middleware: "guest" });

const route = useRoute();
const { fetch: fetchUserSession } = useUserSession();

const { logo, nombre: companyName } = useLogo();

useSeoMeta({
  title: () => `Crear cuenta — ${companyName.value}`,
  description: "Crea tu cuenta para seguir tus pedidos y comprar más rápido.",
  robots: "noindex, nofollow",
});

const form = reactive({ name: "", email: "", phone: "", password: "" });
const loading = ref(false);
const error = ref("");
const shaking = ref(false);
const showPassword = ref(false);

const loginHref = computed(() => {
  const redirect = route.query.redirect as string | undefined;
  return redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : "/login";
});

function triggerShake() {
  shaking.value = true;
  setTimeout(() => (shaking.value = false), 420);
}

async function register() {
  if (!form.name || !form.email || !form.password) {
    error.value = "Completa tu nombre, correo y contraseña.";
    triggerShake();
    return;
  }

  /* Se comprueba aquí además del servidor: avisar antes de enviar
     evita un viaje de ida y vuelta para un error obvio. */
  if (form.password.length < 6) {
    error.value = "La contraseña debe tener al menos 6 caracteres.";
    triggerShake();
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await $fetch("/api/auth/register", { method: "POST", body: form });
    await fetchUserSession();

    const redirect = route.query.redirect as string | undefined;
    await navigateTo(redirect || "/mi-cuenta", { external: true });
  } catch (e: any) {
    error.value =
      e?.data?.message || e?.message || "No se pudo crear la cuenta. Inténtalo de nuevo.";
    triggerShake();
  } finally {
    loading.value = false;
  }
}
</script>

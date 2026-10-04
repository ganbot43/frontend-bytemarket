<template>
  <div class="sp-auth__card" :class="{ 'sp-auth__card--shake': shaking }">
    <!-- La marca solo aparece en móvil: en escritorio ya está en el
         costado navy del layout. -->
    <NuxtLink to="/" class="sp-auth__mobile-brand">
      <img :src="logo" :alt="companyName" />
      <span>{{ companyName }}</span>
    </NuxtLink>

    <h1 class="sp-auth__title">Iniciar sesión</h1>
    <p class="sp-auth__sub">Entra con tu correo y contraseña.</p>

    <form class="sp-auth__form" @submit.prevent="login">
      <div class="sp-auth__field">
        <label class="sp-auth__label" for="login-email">Correo electrónico</label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </span>
          <input
            id="login-email"
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
        <label class="sp-auth__label" for="login-password">Contraseña</label>
        <div class="sp-auth__control">
          <span class="sp-auth__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input
            id="login-password"
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            class="sp-auth__input sp-auth__input--pw"
            placeholder="Tu contraseña"
            autocomplete="current-password"
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
        {{ loading ? "Entrando…" : "Entrar" }}
      </button>
    </form>

    <p class="sp-auth__alt">
      ¿No tienes cuenta?
      <NuxtLink :to="registerHref">Crear una</NuxtLink>
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
  title: () => `Iniciar sesión — ${companyName.value}`,
  description: "Accede a tu cuenta para ver tus pedidos y comprar más rápido.",
  robots: "noindex, nofollow",
});

const form = reactive({ email: "", password: "" });
const loading = ref(false);
const error = ref("");
const shaking = ref(false);
const showPassword = ref(false);

/* El destino tras iniciar sesión se conserva al cambiar de pantalla:
   quien venía del checkout debe volver al checkout, no a la portada. */
const registerHref = computed(() => {
  const redirect = route.query.redirect as string | undefined;
  return redirect ? `/registro?redirect=${encodeURIComponent(redirect)}` : "/registro";
});

/* El mensaje de error solo no siempre se nota si el usuario está
   mirando el campo: la tarjeta se sacude una vez. */
function triggerShake() {
  shaking.value = true;
  setTimeout(() => (shaking.value = false), 420);
}

async function login() {
  if (!form.email || !form.password) {
    error.value = "Completa tu correo y tu contraseña.";
    triggerShake();
    return;
  }

  loading.value = true;
  error.value = "";

  try {
    await $fetch("/api/auth/login", { method: "POST", body: form });
    await fetchUserSession();

    const { user } = useUserSession();
    const redirect = route.query.redirect as string | undefined;

    /* Recarga completa a propósito: el shell del panel y el de la
       tienda son distintos y la sesión debe rehidratarse limpia. */
    if (user.value?.role === "admin" || user.value?.role === "superadmin") {
      await navigateTo("/admin", { external: true });
    } else {
      await navigateTo(redirect || "/mi-cuenta", { external: true });
    }
  } catch (e: any) {
    error.value =
      e?.data?.message || e?.message || "Credenciales inválidas. Inténtalo de nuevo.";
    triggerShake();
  } finally {
    loading.value = false;
  }
}
</script>

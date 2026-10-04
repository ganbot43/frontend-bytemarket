<template>
  <UApp>
    <div>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
    <SharedToastHost />
  </UApp>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

// Hydrate global business config
const { data: configData } = await useFetch('/api/business-config')
const businessState = useBusinessConfig()
if (configData.value) {
  businessState.value = configData.value as any
}

const siteUrl = computed(() => {
  const raw = String(runtimeConfig.public.siteUrl || 'https://bytemarket.pe')
  return raw.replace(/\/$/, '')
})

const canonicalUrl = computed(() => {
  const path = route.path?.startsWith('/') ? route.path : `/${route.path || ''}`
  if (path === '/') {
    return `${siteUrl.value}/`
  }
  return `${siteUrl.value}${path}`
})

useHead(() => ({
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  meta: [
    { property: 'og:url', content: canonicalUrl.value },
    { name: 'twitter:url', content: canonicalUrl.value },
  ],
}))

// Validar sesión cuando carga la app
watch(() => route.path, async (newPath) => {
  // Si está en una ruta protegida y no está autenticado, ir a login
  if (newPath.startsWith('/admin') && !loggedIn.value) {
    await navigateTo('/login')
  }
}, { immediate: true })
</script>

<style>
</style>

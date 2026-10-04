export default defineNuxtPlugin(() => {
  $fetch.create({
    async onResponseError({ response }) {
      // Si recibimos un 401, limpiar sesión y redirigir al login
      if (response.status === 401) {
        const { clear } = useUserSession()
        await clear()
        
        // Limpiar store de auth si existe
        try {
          const authStore = useAuthStore()
          authStore.clearAuth()
        } catch (e) {
          // Ignorar si el store no está disponible
        }
        
        // Evitar redirigir si ya estamos en login
        const route = useRoute()
        if (!route.path.startsWith('/login')) {
          await navigateTo('/login')
        }
      }
    }
  })
})

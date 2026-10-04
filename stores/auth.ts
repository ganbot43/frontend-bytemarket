import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as { id: number; name: string; role: string } | null,
  }),
  getters: {
    isLoggedIn: (s) => !!s.user,
  },
  actions: {
    async login(email: string, password: string) {
      const { fetch: fetchUserSession } = useUserSession()
      const data = await $fetch<{ user: any }>('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      await fetchUserSession()
      this.user = data.user
      const role = data.user?.role
      await navigateTo(role === 'admin' || role === 'superadmin' ? '/admin' : '/mi-cuenta')
    },
    async logout() {
      try {
        await $fetch('/api/auth/logout', { method: 'POST' })
      } catch (e) {
        // Continuar con logout incluso si la llamada falla
      }
      this.user = null
      const { clear } = useUserSession()
      await clear()
      await navigateTo('/login')
    },
    // Limpiar el store cuando se detecta un 401
    clearAuth() {
      this.user = null
    }
  },
  persist: true,
})

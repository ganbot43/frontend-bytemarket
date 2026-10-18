// Protege el panel /admin y manda a cada rol donde le toca
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  await fetch()
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  /*
   * Los cuatro roles de panel. El cajero entra, pero solo a vender: las
   * pantallas que no le tocan las corta cada página con su propio
   * middleware, y el backend tiene la última palabra en cualquier caso.
   */
  const role = user.value?.role as string | undefined
  if (!role || !['cajero', 'jefe_ventas', 'admin', 'superadmin'].includes(role)) {
    return navigateTo('/mi-cuenta')
  }

  /* El cajero aterriza en la caja, no en el dashboard: es su pantalla, y
     la del resumen del negocio no le corresponde.

     Comparación exacta y no startsWith: con el prefijo, /admin/cajas
     —aperturas y arqueo, que es de su jefe— también casaba, y el cajero
     entraba a una pantalla que luego le devuelve 403 en cada llamada. Se
     vería como una tabla vacía, que es la peor forma de decir que no. */
  if (role === 'cajero' && to.path !== '/admin/caja') {
    return navigateTo('/admin/caja')
  }
})

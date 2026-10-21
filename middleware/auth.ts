// Protege el panel /admin y manda a cada rol donde le toca
export default defineNuxtRouteMiddleware(async (to) => {
  const { loggedIn, user, fetch } = useUserSession()

  await fetch()
  if (!loggedIn.value) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  /*
   * Los cuatro roles de panel. Quién entra a qué pantalla ya no está escrito
   * aquí: sale de la matriz de permisos que el gerente edita.
   */
  const role = user.value?.role as string | undefined
  if (!role || !['cajero', 'jefe_ventas', 'admin', 'superadmin'].includes(role)) {
    return navigateTo('/mi-cuenta')
  }

  const { cargar, puedeVer } = usePermisos()
  await cargar()

  /*
   * A qué módulo pertenece cada ruta del panel.
   *
   * El orden importa: se busca la coincidencia MÁS LARGA. Sin eso,
   * /admin/inventario/movimientos caería en la regla de /admin y se daría
   * por buena sin mirar el módulo que de verdad le toca.
   */
  const MODULO_POR_RUTA: Array<[string, string]> = [
    ['/admin/caja', 'caja'],
    ['/admin/cajas', 'cajas'],
    ['/admin/reportes', 'reportes'],
    ['/admin/pedidos', 'pedidos'],
    ['/admin/productos', 'productos'],
    ['/admin/inventario', 'inventario'],
    ['/admin/categorias', 'categorias'],
    ['/admin/subcategories', 'subcategorias'],
    ['/admin/banners', 'banners'],
    ['/admin/cupones', 'cupones'],
    ['/admin/resenas', 'resenas'],
    ['/admin/reclamaciones', 'reclamaciones'],
    ['/admin/usuarios', 'usuarios'],
    ['/admin/metodos-pago', 'metodos_pago'],
    ['/admin/configuracion', 'configuracion'],
    ['/admin/roles', 'roles'],
  ]

  const modulo =
    to.path === '/admin'
      ? 'dashboard'
      : MODULO_POR_RUTA.filter(([ruta]) => to.path === ruta || to.path.startsWith(ruta + '/'))
          .sort((a, b) => b[0].length - a[0].length)[0]?.[1]

  /* Una ruta de /admin que no esté en la tabla no se deja pasar por
     omisión: si mañana se añade una pantalla y nadie la declara aquí,
     quedarse fuera es el error seguro. */
  if (!modulo) return navigateTo(destinoPorDefecto(puedeVer))

  if (!puedeVer(modulo)) {
    /* No se manda a /admin a ciegas: si tampoco puede ver el dashboard
       —el caso del cajero— sería un bucle de redirecciones. Se busca la
       primera pantalla que sí le corresponda. */
    return navigateTo(destinoPorDefecto(puedeVer))
  }
})

/**
 * La primera pantalla que esta persona puede abrir.
 *
 * El cajero aterriza en la caja y no en el dashboard: es su pantalla, y la
 * del resumen del negocio no le corresponde. Antes esto era un `if (role
 * === 'cajero')` escrito a mano; ahora sale de lo que tenga concedido, así
 * que sigue funcionando si el gerente le mueve los permisos.
 */
function destinoPorDefecto(puedeVer: (m: string) => boolean) {
  const CANDIDATOS: Array<[string, string]> = [
    ['dashboard', '/admin'],
    ['caja', '/admin/caja'],
    ['pedidos', '/admin/pedidos'],
    ['productos', '/admin/productos'],
  ]
  for (const [modulo, ruta] of CANDIDATOS) {
    if (puedeVer(modulo)) return ruta
  }
  /* Sin ningún módulo no hay panel que enseñar: a su cuenta, que es donde
     cualquiera puede estar. */
  return '/mi-cuenta'
}

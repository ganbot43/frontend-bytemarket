/**
 * Qué módulos del panel puede ver y tocar quien está dentro.
 *
 * Esto estaba repartido en tres sitios con los roles escritos a mano: las
 * listas SOLO_GESTION y CON_EL_JEFE del menú, el middleware de rutas y los
 * SecurityConfig del backend. Cambiar un permiso eran tres ediciones y un
 * despliegue. Ahora la respuesta la da user-service desde la matriz que el
 * gerente edita, y aquí solo se cachea.
 *
 * El menú no es seguridad —el backend decide, y ahí está la regla de
 * verdad—, pero enseñar entradas que acaban en un 403 es peor que no
 * enseñarlas.
 */
export type Permiso = { view: boolean; edit: boolean }

export type MisPermisos = {
  role: string
  isGerente: boolean
  permissions: Record<string, Permiso>
  editableRoles: string[]
}

export function usePermisos() {
  const estado = useState<MisPermisos | null>('misPermisos', () => null)
  const cargando = useState<boolean>('misPermisosCargando', () => false)

  /**
   * Se pide una sola vez por sesión de navegación.
   *
   * El guardia de rutas la llama en cada navegación, y sin esta guarda cada
   * clic del menú serían dos peticiones al gateway para una respuesta que no
   * cambia. Si el gerente mueve un permiso, se nota al recargar: el backend
   * sigue siendo quien corta, así que lo único que puede quedar viejo unos
   * minutos es qué se enseña, no qué se puede.
   */
  async function cargar(forzar = false) {
    if (estado.value && !forzar) return estado.value
    if (cargando.value) return estado.value
    cargando.value = true
    try {
      estado.value = await $fetch<MisPermisos>('/api/me/permissions')
    } catch {
      /* Sin permisos no se inventa nada: queda en null y quien pregunte
         recibe false. Un fallo de red no debe abrir puertas. */
      estado.value = null
    } finally {
      cargando.value = false
    }
    return estado.value
  }

  const puedeVer = (modulo: string) =>
    Boolean(estado.value?.permissions?.[modulo]?.view)

  const puedeEditar = (modulo: string) =>
    Boolean(estado.value?.permissions?.[modulo]?.edit)

  /** Los roles cuyos permisos puede administrar: la pirámide hacia abajo. */
  const rolesEditables = computed(() => estado.value?.editableRoles ?? [])

  return { permisos: estado, cargar, puedeVer, puedeEditar, rolesEditables }
}

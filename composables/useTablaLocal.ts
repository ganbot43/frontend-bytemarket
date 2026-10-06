import type { Ref } from 'vue'

/**
 * Búsqueda y paginación en el navegador.
 *
 * Solo para los módulos cuyo endpoint devuelve la lista completa (banners,
 * categorías, subcategorías, métodos de pago y reclamaciones): ahí filtrar
 * aquí es exacto, porque todos los registros ya están cargados.
 *
 * Los módulos que paginan en el servidor NO deben usar esto: buscarían solo
 * dentro de la página visible y el resultado mentiría.
 */
export function useTablaLocal<T extends Record<string, any>>(
  origen: Ref<T[]> | (() => T[]),
  campos: (keyof T | string)[],
  limite = 15,
) {
  const busqueda = ref('')
  const pagina = ref(0)

  const todos = computed<T[]>(() =>
    typeof origen === 'function' ? origen() : (origen.value ?? []),
  )

  /** Lee "category.name" además de "name". */
  const valor = (fila: T, campo: string): string => {
    const v = campo.split('.').reduce<any>((o, k) => (o == null ? o : o[k]), fila)
    return v == null ? '' : String(v)
  }

  const filtrados = computed<T[]>(() => {
    const q = busqueda.value.trim().toLowerCase()
    if (!q) return todos.value
    return todos.value.filter((fila) =>
      campos.some((c) => valor(fila, String(c)).toLowerCase().includes(q)),
    )
  })

  const total = computed(() => filtrados.value.length)

  const items = computed<T[]>(() => {
    const desde = pagina.value * limite
    return filtrados.value.slice(desde, desde + limite)
  })

  /* Si el filtro deja menos páginas de las que había, la actual puede quedar
     fuera de rango y la tabla saldría vacía sin explicación. */
  watch(filtrados, () => {
    const ultima = Math.max(0, Math.ceil(total.value / limite) - 1)
    if (pagina.value > ultima) pagina.value = ultima
  })

  watch(busqueda, () => {
    pagina.value = 0
  })

  return { busqueda, pagina, items, total, limite }
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Favoritos — lista de deseos local.
 *
 * Se guarda en el navegador, no en la cuenta: el comprador de repuestos
 * suele llegar sin sesión, comparar dos o tres piezas y volver días
 * después. Pedirle que se registre antes de poder guardar nada pierde
 * justo esa visita.
 *
 * Guardamos una foto del producto (nombre, precio, imagen) y no solo el
 * id para poder pintar /favoritos sin una petición por ítem; el precio
 * se refresca al abrir la ficha.
 *
 * Con sesión iniciada la lista además se sincroniza con la cuenta, así
 * que sobrevive al cambio de dispositivo. La fusión la hace el servidor:
 * nunca se sobrescribe lo de la cuenta con lo local, porque abrir la web
 * en un móvil nuevo borraría lo guardado desde el ordenador.
 */
export interface FavoriteItem {
  id: number | string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  image?: string | null
  addedAt: number
}

export const useFavoritesStore = defineStore('favorites', () => {
  const items = ref<FavoriteItem[]>([])

  const count = computed(() => items.value.length)
  const isEmpty = computed(() => items.value.length === 0)
  const ids = computed(() => new Set(items.value.map((i) => i.id)))

  /* Orden inverso de incorporación: lo último guardado es lo que el
     usuario tiene en la cabeza cuando vuelve. */
  const sorted = computed(() =>
    [...items.value].sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0)),
  )

  function has(id: FavoriteItem['id']) {
    return items.value.some((i) => i.id === id)
  }

  function add(product: Omit<FavoriteItem, 'addedAt'>) {
    if (product?.id == null || has(product.id)) return
    items.value.push({ ...product, addedAt: Date.now() })
  }

  function remove(id: FavoriteItem['id']) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) items.value.splice(idx, 1)
  }

  /** Devuelve el estado final para que el llamador avise al usuario. */
  function toggle(product: Omit<FavoriteItem, 'addedAt'>) {
    if (product?.id == null) return false
    if (has(product.id)) {
      remove(product.id)
      return false
    }
    add(product)
    return true
  }

  function clear() {
    items.value = []
  }

  /* ── Sincronización con la cuenta ──────────────────────────────── */

  const sincronizando = ref(false)

  /** Pasa del formato del catálogo al que guarda este store. */
  function aFavorito(p: any): FavoriteItem {
    const imagenes = p.images ?? []
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price) || 0,
      comparePrice: p.comparePrice ?? null,
      image: imagenes.find((i: any) => i.isPrimary)?.url ?? imagenes[0]?.url ?? null,
      addedAt: Date.now(),
    }
  }

  /**
   * Fusiona la lista local con la de la cuenta. Se llama al iniciar sesión.
   *
   * El servidor hace la unión de ambas y devuelve el resultado; aquí solo
   * se reemplaza lo local con esa respuesta. Si falla, no se toca nada: la
   * lista del navegador sigue siendo válida sin conexión.
   */
  async function sincronizar() {
    if (sincronizando.value) return
    sincronizando.value = true
    try {
      const r = await $fetch<{ data: any[] }>('/api/favorites/sync', {
        method: 'POST',
        body: { productIds: items.value.map((i) => i.id) },
      })
      items.value = (r.data ?? []).map(aFavorito)
    } catch {
      /* Sin sesión o sin red: la lista local se queda como está. */
    } finally {
      sincronizando.value = false
    }
  }

  /**
   * Igual que toggle, pero además lo guarda en la cuenta si hay sesión.
   *
   * No espera la respuesta del servidor para pintar el cambio: el corazón
   * tiene que responder al instante. Si la llamada falla, la lista local
   * ya quedó bien y la próxima sincronización lo corrige.
   */
  function toggleSincronizado(product: Omit<FavoriteItem, 'addedAt'>, conSesion: boolean) {
    const activo = toggle(product)
    if (!conSesion || product?.id == null) return activo

    const peticion = activo
      ? $fetch('/api/favorites', { method: 'POST', body: { productId: product.id } })
      : $fetch(`/api/favorites/${product.id}`, { method: 'DELETE' })
    peticion.catch(() => { /* se reconcilia en el siguiente sincronizar() */ })

    return activo
  }

  return {
    items, count, isEmpty, ids, sorted, sincronizando,
    has, add, remove, toggle, toggleSincronizado, sincronizar, clear,
  }
}, {
  persist: true, // requiere pinia-plugin-persistedstate
})

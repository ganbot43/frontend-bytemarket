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

  return { items, count, isEmpty, ids, sorted, has, add, remove, toggle, clear }
}, {
  persist: true, // requiere pinia-plugin-persistedstate
})

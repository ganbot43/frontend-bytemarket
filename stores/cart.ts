import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface CartItem {
  id: number | string
  name: string
  image?: string
  emoji?: string
  variant?: string
  price: number
  originalPrice?: number
  qty: number
  stock?: number
}

export const useCartStore = defineStore('cart', () => {
  const isOpen = ref(false)
  const items = ref<CartItem[]>([])

  // const SHIPPING_COST = 15
  // const FREE_SHIPPING_THRESHOLD = 150

  /**
   * Convierte cualquier valor a número seguro.
   * Evita NaN cuando pinia-plugin-persistedstate rehidrata strings desde localStorage.
   */
  function n(v: unknown): number {
    const num = Number(v)
    return Number.isFinite(num) ? num : 0
  }

  // ── Getters ──────────────────────────────────────────────────────────────────
  const isEmpty = computed(() => items.value.length === 0)

  const itemCount = computed(() =>
    items.value.reduce((acc, item) => acc + n(item.qty), 0)
  )

  const subtotal = computed(() =>
    items.value.reduce((acc, item) => acc + n(item.price) * n(item.qty), 0)
  )

  // const freeShipping = computed(() => subtotal.value >= FREE_SHIPPING_THRESHOLD)
  const freeShipping = computed(() => false) // temporal: lógica de envío comentada

  // const shippingCost = computed(() => (freeShipping.value ? 0 : SHIPPING_COST))
  const shippingCost = computed(() => 0) // temporal: sin costo de envío por ahora

  const discount = computed(() =>
    items.value.reduce((acc, item) => {
      const orig = n(item.originalPrice)
      const price = n(item.price)
      if (!orig || orig <= price) return acc
      return acc + (orig - price) * n(item.qty)
    }, 0)
  )

  // TOTAL: parseFloat final para limpiar cualquier artefacto de punto flotante
  // (temporalmente sin shippingCost mientras se maneja internamente)
  const total = computed(() =>
    parseFloat((subtotal.value).toFixed(2))
  )

  // ── Actions ───────────────────────────────────────────────────────────────────
  function addItem(newItem: Omit<CartItem, 'qty'>, qty = 1) {
    const safeQty = Math.max(1, Math.floor(n(qty)))
    const existing = items.value.find(i => i.id === newItem.id)

    if (existing) {
      const max = n(existing.stock) || 99
      existing.qty = Math.min(n(existing.qty) + safeQty, max)
    } else {
      items.value.push({
        ...newItem,
        price: n(newItem.price),
        originalPrice: newItem.originalPrice != null ? n(newItem.originalPrice) : undefined,
        qty: safeQty,
      })
    }
  }

  /**
   * Backwards-compatible alias used across the codebase.
   * Accepts payloads like { id, name, price, quantity, image, slug, stock }
   * and forwards to `addItem` normalizing field names.
   */
  function add(payload: Partial<CartItem> & { quantity?: number; qty?: number }) {
    if (!payload || typeof payload !== 'object' || payload.id == null) return
    const qty = payload.quantity ?? payload.qty ?? 1
    const { id, name, image, variant, price, originalPrice, stock } = payload as any
    addItem(
      {
        id,
        name: name ?? 'Producto',
        image,
        variant,
        price: price ?? 0,
        originalPrice: originalPrice ?? undefined,
        stock: stock ?? undefined,
      },
      qty,
    )
  }

  function increment(id: CartItem['id']) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    const max = n(item.stock) || 99
    if (n(item.qty) < max) item.qty = n(item.qty) + 1
  }

  function decrement(id: CartItem['id']) {
    const item = items.value.find(i => i.id === id)
    if (!item) return
    if (n(item.qty) > 1) {
      item.qty = n(item.qty) - 1
    } else {
      remove(id)
    }
  }

  function remove(id: CartItem['id']) {
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) items.value.splice(idx, 1)
  }

  function clear() { items.value = [] }
  function open() { isOpen.value = true }
  function close() { isOpen.value = false }
  function toggle() { isOpen.value = !isOpen.value }

  return {
    // state
    isOpen, items,
    // getters
    isEmpty, itemCount, subtotal, freeShipping, shippingCost, discount, total,
    // actions
    addItem, add, increment, decrement, remove, clear, open, close, toggle,
  }
}, {
  persist: true, // requiere pinia-plugin-persistedstate
})
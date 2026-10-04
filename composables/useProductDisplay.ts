import { computed, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Lógica de presentación de un producto, compartida por la tarjeta, la
 * ficha y las filas de la portada.
 *
 * Existe porque las tres vistas tenían su propia forma de decidir cuál
 * es la imagen principal y qué dice el stock, y se contradecían: el
 * catálogo marcaba "En stock" donde la ficha decía "Últimas unidades".
 */

export type DisplayProduct = {
  id: number | string
  name: string
  slug: string
  price: number
  comparePrice?: number | null
  stock?: number
  trackStock?: boolean
  isFeatured?: boolean
  nuevoLanzamiento?: boolean
  category?: { name: string } | null
  subcategory?: { name: string } | null
  images?: Array<{ id?: number; url: string; isPrimary?: boolean }>
} | null | undefined

export function useProductDisplay(product: MaybeRefOrGetter<DisplayProduct>) {
  /* toValue y no unref: los componentes pasan un getter —() => props.x—
     para que el composable siga las actualizaciones del prop. unref
     devuelve la función tal cual y todo se leía como undefined. */
  const p = computed(() => toValue(product))

  const image = computed(() => {
    const imgs = p.value?.images ?? []
    return imgs.find((i) => i.isPrimary)?.url ?? imgs[0]?.url ?? null
  })

  const gallery = computed(() => {
    const imgs = p.value?.images ?? []
    /* La principal primero: la galería y la miniatura deben abrir en la
       misma foto o el usuario cree que entró al producto equivocado. */
    return [...imgs].sort(
      (a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary),
    )
  })

  /* La subcategoría es más específica que la categoría —"Pantallas OLED"
     dice más que "Pantallas"— así que manda cuando existe. */
  const typeLabel = computed(
    () => p.value?.subcategory?.name ?? p.value?.category?.name ?? '',
  )

  const price = computed(() => Number(p.value?.price ?? 0))

  /* Solo hay rebaja si el precio anterior existe y es mayor. Un
     comparePrice igual o menor es dato sucio, no una oferta. */
  const comparePrice = computed(() => {
    const was = Number(p.value?.comparePrice ?? 0)
    return was > price.value ? was : null
  })

  const hasDiscount = computed(() => comparePrice.value !== null)

  const discountPct = computed(() => {
    if (!comparePrice.value) return 0
    return Math.round(((comparePrice.value - price.value) / comparePrice.value) * 100)
  })

  const saving = computed(() =>
    comparePrice.value ? comparePrice.value - price.value : 0,
  )

  const tracked = computed(() => p.value?.trackStock !== false)
  const stock = computed(() => Number(p.value?.stock ?? 0))
  const isOut = computed(() => tracked.value && stock.value <= 0)
  const isLow = computed(() => tracked.value && stock.value > 0 && stock.value <= 5)

  const stockLabel = computed(() => {
    if (!tracked.value) return 'Disponible'
    if (stock.value <= 0) return 'Sin stock'
    if (stock.value <= 5) return `Quedan ${stock.value}`
    return 'En stock'
  })

  const stockTone = computed<'ok' | 'low' | 'none'>(() => {
    if (!tracked.value) return 'ok'
    if (stock.value <= 0) return 'none'
    if (stock.value <= 5) return 'low'
    return 'ok'
  })

  return {
    image,
    gallery,
    typeLabel,
    price,
    comparePrice,
    hasDiscount,
    discountPct,
    saving,
    tracked,
    stock,
    isOut,
    isLow,
    stockLabel,
    stockTone,
  }
}

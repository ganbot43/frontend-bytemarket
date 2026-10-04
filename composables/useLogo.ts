/**
 * Logo de la tienda, en un solo lugar.
 *
 * La cabecera pintaba dos imágenes —el isotipo y el logotipo con el
 * nombre— y la segunda estaba escrita a mano, así que cambiar el logo
 * desde el panel solo reemplazaba la mitad. Ahora es una sola imagen y
 * siempre la misma fuente: lo que haya en Configuración, y si no, el
 * archivo del proyecto.
 */
export function useLogo() {
  const businessState = useBusinessConfig()
  const config = useRuntimeConfig()

  /* El de respaldo es el logotipo con el nombre (83 KB), no el isotipo
     de /images/logo.png: ese mide 1536×1024 y pesa 2,2 MB para
     mostrarse a 38px de alto. */
  const FALLBACK = '/images/logo-letra.png'

  const logo = computed(() => businessState.value?.logoUrl || FALLBACK)

  const nombre = computed(
    () => businessState.value?.name || config.public.companyName || 'ByteMarket',
  )

  /** true cuando el logo sale del panel y no del archivo por defecto. */
  const esPersonalizado = computed(() => Boolean(businessState.value?.logoUrl))

  return { logo, nombre, esPersonalizado }
}

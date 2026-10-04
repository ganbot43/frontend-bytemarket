export default defineAppConfig({
  ui: {
    /* Nuxt UI venía con su primario por defecto (verde): todos los
       UInput/UButton/UModal del sistema se pintaban fuera de marca.
       Se ancla a la paleta ByteMarket. */
    colors: {
      primary: 'bytemarket',
      neutral: 'slate',
    },
    input: {
      slots: {
        base: 'rounded-[var(--radius-sm)]',
      },
    },
  },
})

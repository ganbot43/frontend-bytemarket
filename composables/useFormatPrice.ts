export const useFormatPrice = () => ({
  format: (n: number) => `S/ ${n.toFixed(2)}`,
})

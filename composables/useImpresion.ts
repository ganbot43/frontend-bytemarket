/**
 * Imprimir uno de los papeles de caja.
 *
 * La clase en el <body> es lo que decide qué sale en la hoja, y se quita
 * siempre después: si se quedara puesta, la siguiente impresión de
 * cualquier otra pantalla saldría en blanco.
 *
 * El `nextTick` no es decorativo. El papel se monta con un v-if justo
 * antes de llamar aquí, y sin esperar al pintado `window.print()` se
 * ejecuta con el papel todavía fuera del DOM: sale una hoja vacía.
 *
 * Nota: el comprobante de venta de /admin/caja NO usa esto. Ese va dentro
 * de la página —el cajero lo ve en pantalla después de cobrar— así que no
 * se puede apagar a sus hermanos; lleva su propia clase
 * `sp-imprimiendo-ticket` y la técnica de visibility. Los tres papeles de
 * caja sí van teleportados al body y pasan por aquí.
 */
export function useImpresion() {
  async function imprimirPapel() {
    if (typeof document === "undefined") return;
    await nextTick();
    document.body.classList.add("sp-imprimiendo");
    try {
      window.print();
    } finally {
      document.body.classList.remove("sp-imprimiendo");
    }
  }

  return { imprimirPapel };
}

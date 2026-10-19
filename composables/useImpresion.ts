/**
 * Imprimir los papeles de caja.
 *
 * Dos cosas pasan aquí, y las dos son invisibles hasta que faltan.
 *
 * La clase en el <body> decide qué sale en la hoja, y se quita siempre
 * después: si se quedara puesta, la siguiente impresión de cualquier otra
 * pantalla saldría en blanco.
 *
 * Y el título del documento decide el nombre del archivo cuando alguien
 * elige "Guardar como PDF". Sin tocarlo, los cinco papeles se guardan
 * como "Caja · Admin" y al tercero ya nadie sabe cuál es cuál. Se pone
 * antes de abrir el diálogo y se devuelve al salir, porque es el título
 * de la pestaña: dejarlo puesto renombraría la pantalla.
 *
 * El `nextTick` no es decorativo. El papel se monta con un v-if justo
 * antes de llamar aquí, y sin esperar al pintado `window.print()` se
 * ejecuta con el papel todavía fuera del DOM: sale una hoja vacía.
 */
export function useImpresion() {
  async function conNombre(nombre: string | undefined, imprimir: () => void) {
    if (typeof document === "undefined") return;
    const antes = document.title;
    if (nombre) document.title = nombre;
    await nextTick();
    try {
      imprimir();
    } finally {
      document.title = antes;
    }
  }

  /** Los papeles teleportados al body: apertura, cierre, papel de caja, voucher. */
  async function imprimirPapel(nombre?: string) {
    await conNombre(nombre, () => {
      document.body.classList.add("sp-imprimiendo");
      try {
        window.print();
      } finally {
        document.body.classList.remove("sp-imprimiendo");
      }
    });
  }

  /**
   * La boleta de venta, que va dentro de la página.
   *
   * No se puede apagar a sus hermanos como a los otros: el cajero la ve en
   * pantalla después de cobrar. Lleva su propia clase y la técnica de
   * visibility, que vive en el <style> de /admin/caja.
   */
  async function imprimirTicket(nombre?: string) {
    await conNombre(nombre, () => {
      document.body.classList.add("sp-imprimiendo-ticket");
      try {
        window.print();
      } finally {
        document.body.classList.remove("sp-imprimiendo-ticket");
      }
    });
  }

  return { imprimirPapel, imprimirTicket };
}

/**
 * Estados de un pedido: nombre, tono y orden de avance.
 *
 * La tabla de traducción estaba copiada en cuatro archivos (resumen de
 * cuenta, historial, detalle y el panel). Cuando se añade un estado hay
 * que acordarse de los cuatro, y el que se olvide enseña la clave cruda
 * —"in_preparation"— al cliente.
 */

export type EstadoPedido =
  | 'pending'
  | 'voucher_sent'
  | 'payment_validated'
  | 'in_preparation'
  | 'delivered'
  | 'cancelled'

export type TonoEstado = 'espera' | 'progreso' | 'ok' | 'cancelado'

type DefEstado = {
  label: string
  tono: TonoEstado
  /** Texto para el cliente: qué pasa ahora y qué se espera de él. */
  ayuda: string
}

const ESTADOS: Record<EstadoPedido, DefEstado> = {
  pending: {
    label: 'Pendiente de pago',
    tono: 'espera',
    ayuda: 'Realiza el pago y envíanos la constancia por WhatsApp para procesar tu pedido.',
  },
  voucher_sent: {
    label: 'Comprobante enviado',
    tono: 'progreso',
    ayuda: 'Recibimos tu constancia. Estamos verificando el pago.',
  },
  payment_validated: {
    label: 'Pago validado',
    tono: 'progreso',
    ayuda: 'Confirmamos tu pago. Pronto preparamos el envío.',
  },
  in_preparation: {
    label: 'En preparación',
    tono: 'progreso',
    ayuda: 'Estamos alistando tus piezas para despacharlas.',
  },
  delivered: {
    label: 'Entregado',
    tono: 'ok',
    ayuda: 'Tu pedido fue entregado. Si algo no está bien, escríbenos.',
  },
  cancelled: {
    label: 'Cancelado',
    tono: 'cancelado',
    ayuda: 'Este pedido fue cancelado. Escríbenos si fue un error.',
  },
}

/* Recorrido normal de un pedido. 'cancelled' queda fuera a propósito:
   no es un paso del avance, es una salida. */
export const FLUJO_ESTADOS: EstadoPedido[] = [
  'pending',
  'voucher_sent',
  'payment_validated',
  'in_preparation',
  'delivered',
]

export function useEstadoPedido() {
  /* Un estado desconocido (añadido en el servidor y no aquí) se muestra
     legible en vez de con guiones bajos. */
  const def = (status: string): DefEstado =>
    ESTADOS[status as EstadoPedido] ?? {
      label: status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
      tono: 'espera',
      ayuda: '',
    }

  const etiqueta = (status: string) => def(status).label
  const tono = (status: string) => def(status).tono
  const ayuda = (status: string) => def(status).ayuda

  /** Paso actual dentro del flujo, o -1 si el pedido está cancelado. */
  const paso = (status: string) => FLUJO_ESTADOS.indexOf(status as EstadoPedido)

  const estaCancelado = (status: string) => status === 'cancelled'
  const estaCerrado = (status: string) =>
    status === 'delivered' || status === 'cancelled'

  return { etiqueta, tono, ayuda, paso, estaCancelado, estaCerrado, FLUJO_ESTADOS }
}

const PERU_TIME_ZONE = 'America/Lima'

/* El backend guarda LocalDateTime, que no lleva zona, y los contenedores
   corren en UTC. Así que la API devuelve "2026-10-03T07:23:51.321581":
   sin Z y sin desfase. JavaScript, ante una fecha sin zona, la interpreta
   como hora LOCAL — leía las 07:23 UTC como las 07:23 de Lima y pintaba
   todo cinco horas adelantado. Formatear a America/Lima después no
   arreglaba nada, porque el instante ya estaba mal.

   Solo se marcan como UTC las fechas con hora y sin zona. Las de solo día
   ("2026-10-03") se dejan intactas: el estándar ya las trata como UTC, y
   tocarlas movería un día las fechas de cupones. */
const SIN_ZONA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/

function parseDateInput(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date
  }
  const texto = date.trim()
  const normalizado = SIN_ZONA.test(texto)
    ? `${texto.replace(' ', 'T')}Z`
    : texto
  const parsed = new Date(normalizado)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatAmPm(value: string): string {
  return value
    .replace(/a\.\s?m\./gi, 'a.m.')
    .replace(/p\.\s?m\./gi, 'p.m.')
}

export const useFormatDateTime = () => {
  const formatDateTimeCompact = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    return formatAmPm(
      new Intl.DateTimeFormat('es-PE', {
        timeZone: PERU_TIME_ZONE,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed),
    )
  }

  const formatDateTime = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    return formatAmPm(
      new Intl.DateTimeFormat('es-PE', {
        timeZone: PERU_TIME_ZONE,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(parsed),
    )
  }

  const formatDate = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: PERU_TIME_ZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(parsed)
  }

  /* Solo la hora y el minuto. Para listas donde la fecha ya está en otro
     sitio —la línea de tiempo de un turno, el detalle de un papel— y
     repetirla en cada fila es ruido. Pasa por parseDateInput como todo lo
     demás: un `new Date()` crudo sobre lo que manda la API pinta cinco
     horas de más, que es el fallo que esta función existe para no
     repetir. */
  const formatHoraCorta = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    return formatAmPm(
      new Intl.DateTimeFormat('es-PE', {
        timeZone: PERU_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(parsed),
    )
  }

  const formatTime = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    return formatAmPm(
      new Intl.DateTimeFormat('es-PE', {
        timeZone: PERU_TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(parsed),
    )
  }

  const getTimeValue = (date: string | Date | null | undefined): number => {
    return parseDateInput(date)?.getTime() ?? 0
  }

  const formatRelativeTime = (
    date: string | Date | null | undefined,
    now: Date = new Date(),
  ): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '–'
    const diff = now.getTime() - parsed.getTime()
    if (diff < 0) return 'Ahora mismo'
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (mins < 1) return 'Ahora mismo'
    if (mins < 60) return `Hace ${mins} min`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return `Hace ${Math.floor(days / 7)} sem`
  }

  return {
    formatDateTime,
    formatDate,
    formatTime,
    formatHoraCorta,
    formatDateTimeCompact,
    formatRelativeTime,
    getTimeValue,
    parseDateInput,
  }
}
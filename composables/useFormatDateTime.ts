const PERU_TIME_ZONE = 'America/Lima'

function parseDateInput(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date
  }
  const parsed = new Date(date.trim())
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
    if (!parsed) return '—'
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
    if (!parsed) return '—'
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
    if (!parsed) return '—'
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: PERU_TIME_ZONE,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(parsed)
  }

  const formatTime = (date: string | Date | null | undefined): string => {
    const parsed = parseDateInput(date)
    if (!parsed) return '—'
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
    if (!parsed) return '—'
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
    formatDateTimeCompact,
    formatRelativeTime,
    getTimeValue,
    parseDateInput,
  }
}
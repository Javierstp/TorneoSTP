export function formatMatchDate(dateStr: string): string {
  const [datePart, timePart] = dateStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = (timePart || '00:00').split(':').map(Number)

  const d = new Date(Date.UTC(year, month - 1, day, hour, minute))
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  })
}

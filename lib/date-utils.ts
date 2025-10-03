export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0]
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return formatDate(date1) === formatDate(date2)
}

export function roundToInterval(date: Date, intervalMinutes: number): Date {
  const ms = 1000 * 60 * intervalMinutes
  return new Date(Math.round(date.getTime() / ms) * ms)
}

export function getTimeSlots(startHour: number, endHour: number, intervalMinutes: number): Date[] {
  const slots: Date[] = []
  const today = new Date()
  today.setHours(startHour, 0, 0, 0)

  const end = new Date()
  end.setHours(endHour, 0, 0, 0)

  let current = new Date(today)
  while (current < end) {
    slots.push(new Date(current))
    current = new Date(current.getTime() + intervalMinutes * 60 * 1000)
  }

  return slots
}

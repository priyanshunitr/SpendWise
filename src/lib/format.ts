const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹1,00,000 style (Indian digit grouping). */
export function rupees(n: number): string {
  const sign = n < 0 ? '−' : ''
  return `${sign}₹${inr.format(Math.abs(Math.round(n)))}`
}

const inr2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** ["₹1,976", ".00"] — the paise are drawn smaller and greyed out. */
export function rupeeParts(n: number): [string, string] {
  const [whole, frac] = inr2.format(Math.abs(n)).split('.')
  return [`${n < 0 ? '−' : ''}₹${whole}`, `.${frac}`]
}

export function dayKey(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d
  const m = String(x.getMonth() + 1).padStart(2, '0')
  const day = String(x.getDate()).padStart(2, '0')
  return `${x.getFullYear()}-${m}-${day}`
}

export function monthKey(d: Date | string): string {
  return dayKey(d).slice(0, 7)
}

export function daysInMonth(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

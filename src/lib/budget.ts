import type { CategoryId, Profile, Txn } from './types'
import { dayKey, daysInMonth, monthKey, rupees } from './format'

export function dailyBudget(profile: Profile, date = new Date()): number {
  const spendable = Math.max(0, profile.monthlyIncome - profile.fixedCosts)
  // Whole rupees: "₹3,226 a day" is easier to live by than ₹3,225.81.
  return Math.floor(spendable / daysInMonth(date))
}

export function txnsOnDay(txns: Txn[], date: Date | string): Txn[] {
  const k = typeof date === 'string' ? date : dayKey(date)
  return txns.filter((t) => dayKey(t.at) === k).sort((a, b) => b.at.localeCompare(a.at))
}

export function txnsInMonth(txns: Txn[], date: Date): Txn[] {
  const k = monthKey(date)
  return txns.filter((t) => monthKey(t.at) === k)
}

export const sum = (txns: Txn[]) => txns.reduce((s, t) => s + t.amount, 0)

/** Lime while comfortable, yellow when it's getting thin, pink once you're over. */
export function remainingTone(remaining: number, budget: number): 'good' | 'warn' | 'bad' {
  if (remaining < 0) return 'bad'
  if (budget > 0 && remaining / budget < 0.7) return 'warn'
  return 'good'
}

export function byCategory(txns: Txn[]): { id: CategoryId; total: number }[] {
  const m = new Map<CategoryId, number>()
  for (const t of txns) m.set(t.category, (m.get(t.category) ?? 0) + t.amount)
  return [...m.entries()].map(([id, total]) => ({ id, total })).sort((a, b) => b.total - a.total)
}

export function topMerchants(txns: Txn[], n = 5) {
  const m = new Map<string, { merchant: string; total: number; count: number }>()
  for (const t of txns) {
    const key = t.merchant.toLowerCase()
    const cur = m.get(key) ?? { merchant: t.merchant, total: 0, count: 0 }
    cur.total += t.amount
    cur.count += 1
    m.set(key, cur)
  }
  return [...m.values()].sort((a, b) => b.total - a.total).slice(0, n)
}

/** Per-day totals for the month so far (index 0 = 1st). */
export function dailyTotals(txns: Txn[], date: Date): number[] {
  const out = new Array(daysInMonth(date)).fill(0)
  for (const t of txnsInMonth(txns, date)) out[new Date(t.at).getDate() - 1] += t.amount
  return out
}

const ROASTS = [
  "Bro, you're literally working to fund your own bad decisions.",
  'Your salary called. It wants to know why you hate it.',
  'Quick commerce: 1. Your savings: 0.',
  'That was a budget, not a suggestion.',
  "10-minute delivery, 10-day regret.",
]
const PRAISE = [
  'Life is good 😎',
  'Future you just said thanks.',
  'Look at you, being a responsible adult.',
  'Your wallet is breathing again.',
]

function pick<T>(arr: T[], seed: string): T {
  let h = 0
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0
  return arr[Math.abs(h) % arr.length]
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export function morningMessage(name: string, budget: number) {
  return {
    title: `${greeting()}${name ? `, ${name}` : ''} ☀️`,
    body: `Your daily income is ${rupees(budget)}. Spend it wisely.`,
  }
}

export function nightMessage(budget: number, spent: number, day: string) {
  const diff = budget - spent
  if (diff < 0) {
    return {
      title: 'Congratulations 🎉',
      body: `Daily budget ${rupees(budget)}. You spent ${rupees(spent)}. ${pick(ROASTS, day)}`,
      over: true,
      diff,
    }
  }
  return {
    title: `You saved ${rupees(diff)} today`,
    body: `Daily budget ${rupees(budget)}, spent ${rupees(spent)}. ${pick(PRAISE, day)}`,
    over: false,
    diff,
  }
}

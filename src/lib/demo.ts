import { guessCategory } from './categories'
import type { Txn } from './types'
import { uid } from './format'

const POOL: [string, number, number, string][] = [
  // merchant, min, max, method
  ['Coffee', 180, 320, 'UPI'],
  ['Blinkit', 250, 900, 'UPI'],
  ['Zepto', 200, 700, 'UPI'],
  ['Swiggy', 300, 750, 'UPI'],
  ['Zomato', 280, 650, 'UPI'],
  ['Uber', 150, 480, 'UPI'],
  ['Rapido', 60, 140, 'UPI'],
  ['Amazon', 400, 2500, 'Card'],
  ['Myntra', 900, 2800, 'Card'],
  ['Chai Point', 40, 120, 'UPI'],
  ['Metro', 40, 80, 'UPI'],
  ['Random UPI', 100, 500, 'UPI'],
]

function rand(min: number, max: number) {
  return Math.round((min + Math.random() * (max - min)) / 10) * 10
}

/** Plausible month-to-date spending so the app has something to show. */
export function demoTxns(now = new Date()): Txn[] {
  const out: Txn[] = []
  const y = now.getFullYear()
  const mo = now.getMonth()
  const push = (merchant: string, amount: number, day: number, hour: number, method: string) => {
    const at = new Date(y, mo, day, hour, Math.floor(Math.random() * 60))
    if (at > now) return
    out.push({ id: uid(), amount, merchant, category: guessCategory(merchant), at: at.toISOString(), method, source: 'demo' })
  }

  // Subscriptions early in the month
  push('Netflix', 649, 2, 9, 'Card')
  push('Spotify', 119, 5, 9, 'UPI')
  push('YouTube Premium', 149, 7, 9, 'Card')
  push('Cult Gym', 1499, 1, 7, 'Card')
  push('Airtel Recharge', 349, 3, 20, 'UPI')

  for (let d = 1; d <= now.getDate(); d++) {
    const n = 2 + Math.floor(Math.random() * 4)
    for (let i = 0; i < n; i++) {
      const [m, lo, hi, method] = POOL[Math.floor(Math.random() * POOL.length)]
      push(m, rand(lo, hi), d, 8 + Math.floor(Math.random() * 14), method)
    }
  }
  // Today looks like the reel
  const today = now.getDate()
  push('Coffee', 250, today, 9, 'UPI')
  push('Blinkit', 600, today, 13, 'UPI')
  push('Zepto', 400, today, 16, 'UPI')
  return out
}

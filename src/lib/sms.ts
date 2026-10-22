import { guessCategory } from './categories'
import type { Txn } from './types'
import { uid } from './format'

/**
 * Parses debit alerts from Indian bank / UPI SMS. Handles the common shapes:
 *   "Rs.250.00 debited from A/c XX1234 on 22-10-26 to VPA bluetokai@ybl. UPI Ref 6123"
 *   "INR 600.00 spent on HDFC Bank Card XX1234 at BLINKIT on 2026-10-22"
 *   "Sent Rs.400.00 From HDFC Bank A/C *1234 To ZEPTO On 22/10/26"
 *   "A/c XX1234 debited for Rs 1,299 on 22Oct26 trf to NETFLIX"
 * Credits, OTPs and balance messages are skipped.
 */

const AMOUNT = /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i
const DEBIT = /\b(debited|spent|sent|paid|purchase|withdrawn|debit|dr\.?|txn of)\b/i
const CREDIT_ONLY = /\b(credited|received|refund|cashback)\b/i
const NOISE = /\b(otp|one time password|available bal|avl bal is|minimum due|statement)\b/i

const MERCHANT_PATTERNS = [
  /\bvpa\s+([\w.-]+@[\w.-]+)/i,
  /\b(?:trf to|transfer to|paid to|to)\s+([A-Za-z0-9&@.\-' ]{2,40}?)(?=\s+(?:on|ref|upi|via|for|avl|from)\b|[.,;(]|$)/i,
  /\b(?:at|towards|info:?)\s+([A-Za-z0-9&@.\-' ]{2,40}?)(?=\s+(?:on|ref|upi|via|for|avl)\b|[.,;(]|$)/i,
]

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function parseDate(msg: string): Date | null {
  let m = msg.match(/\b(\d{4})-(\d{2})-(\d{2})\b/)
  if (m) return new Date(+m[1], +m[2] - 1, +m[3])
  m = msg.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b/)
  if (m) {
    const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
    return new Date(y, +m[2] - 1, +m[1])
  }
  m = msg.match(/\b(\d{1,2})[-\s]?([A-Za-z]{3})[-\s]?(\d{2,4})\b/)
  if (m) {
    const mon = MONTHS.indexOf(m[2].toLowerCase())
    if (mon >= 0) {
      const y = m[3].length === 2 ? 2000 + +m[3] : +m[3]
      return new Date(y, mon, +m[1])
    }
  }
  return null
}

function cleanMerchant(raw: string): string {
  let s = raw.trim()
  if (s.includes('@')) {
    // UPI handle: "bluetokai.coffee@ybl" -> "Bluetokai Coffee"
    s = s.split('@')[0].replace(/[._-]+/g, ' ').replace(/\d{4,}/g, '')
  }
  s = s.replace(/\b(a\/c|ac|acct|account|xx\d+|\*+\d+)\b/gi, '').replace(/\s+/g, ' ').trim()
  if (!s) return 'Unknown'
  return s
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function parseSms(msg: string, now = new Date()): Omit<Txn, 'id'> | null {
  const text = msg.replace(/\s+/g, ' ').trim()
  if (!text || NOISE.test(text)) return null
  if (!DEBIT.test(text) || (CREDIT_ONLY.test(text) && !/debited/i.test(text))) return null

  const amt = text.match(AMOUNT)
  if (!amt) return null
  const amount = parseFloat(amt[1].replace(/,/g, ''))
  if (!amount || amount <= 0) return null

  let merchant = 'Unknown'
  for (const p of MERCHANT_PATTERNS) {
    const m = text.match(p)
    if (m && !/^(your|a\/c|ac|account|the)\b/i.test(m[1])) {
      merchant = cleanMerchant(m[1])
      break
    }
  }

  const date = parseDate(text)
  const at = date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), now.getHours(), now.getMinutes())
    : now
  const method = /upi|vpa/i.test(text) ? 'UPI' : /card/i.test(text) ? 'Card' : /atm|withdrawn/i.test(text) ? 'ATM' : 'Bank'

  return { amount, merchant, category: guessCategory(merchant), at: at.toISOString(), method, source: 'sms' }
}

/** Messages are separated by blank lines; if there are none, one message per line. */
export function parseSmsBatch(input: string): Txn[] {
  const chunks = /\n\s*\n/.test(input) ? input.split(/\n\s*\n/) : input.split('\n')
  return chunks.map((c) => parseSms(c)).filter((t): t is Omit<Txn, 'id'> => !!t).map((t) => ({ ...t, id: uid() }))
}

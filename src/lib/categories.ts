import type { CategoryId } from './types'

export interface Category {
  id: CategoryId
  label: string
  emoji: string
  color: string
}

export const CATEGORIES: Record<CategoryId, Category> = {
  food: { id: 'food', label: 'Food & drink', emoji: '☕', color: '#b6ff3b' },
  groceries: { id: 'groceries', label: 'Groceries', emoji: '🛒', color: '#3bd6ff' },
  shopping: { id: 'shopping', label: 'Shopping', emoji: '🛍️', color: '#ff6bd6' },
  transport: { id: 'transport', label: 'Transport', emoji: '🛵', color: '#ffd23f' },
  subscriptions: { id: 'subscriptions', label: 'Subscriptions', emoji: '🔁', color: '#8f7bff' },
  bills: { id: 'bills', label: 'Bills', emoji: '🧾', color: '#ff9f43' },
  random: { id: 'random', label: 'Random payments', emoji: '🎲', color: '#9aa0b4' },
}

export const CATEGORY_LIST = Object.values(CATEGORIES)

const KEYWORDS: [CategoryId, string[]][] = [
  ['groceries', ['blinkit', 'zepto', 'instamart', 'bigbasket', 'dmart', 'jiomart', 'grofers', 'kirana', 'swiggy instamart', 'bbnow']],
  ['food', ['swiggy', 'zomato', 'coffee', 'starbucks', 'cafe', 'chai', 'domino', 'mcdonald', 'kfc', 'pizza', 'burger', 'restaurant', 'blue tokai', 'third wave', 'eatclub', 'haldiram', 'bakery']],
  ['shopping', ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'zara', 'h&m', 'decathlon', 'croma', 'reliance digital', 'tata cliq']],
  ['transport', ['uber', 'ola', 'rapido', 'metro', 'irctc', 'petrol', 'fuel', 'indian oil', 'hpcl', 'bpcl', 'fastag', 'redbus', 'indigo']],
  ['subscriptions', ['netflix', 'spotify', 'hotstar', 'prime', 'youtube', 'apple', 'google one', 'jiocinema', 'sonyliv', 'chatgpt', 'openai', 'claude', 'linkedin', 'gym', 'cult']],
  ['bills', ['electricity', 'bescom', 'rent', 'broadband', 'recharge', 'airtel', 'jio', 'vodafone', 'act fibernet', 'gas', 'water', 'insurance', 'emi']],
]

export function guessCategory(merchant: string): CategoryId {
  const m = merchant.toLowerCase()
  for (const [cat, words] of KEYWORDS) {
    if (words.some((w) => m.includes(w))) return cat
  }
  return 'random'
}

/** Chips shown in the quick-add sheet. */
export const QUICK_MERCHANTS: { merchant: string; amount: number }[] = [
  { merchant: 'Coffee', amount: 250 },
  { merchant: 'Blinkit', amount: 600 },
  { merchant: 'Zepto', amount: 400 },
  { merchant: 'Swiggy', amount: 450 },
  { merchant: 'Zomato', amount: 380 },
  { merchant: 'Uber', amount: 220 },
  { merchant: 'Rapido', amount: 90 },
  { merchant: 'Amazon', amount: 1200 },
]

import { Bike, Coffee, Receipt, Repeat, ShoppingBag, ShoppingCart, Shuffle, type LucideIcon } from 'lucide-react'
import { CATEGORIES } from '../lib/categories'
import type { CategoryId } from '../lib/types'

const ICONS: Record<CategoryId, LucideIcon> = {
  food: Coffee,
  groceries: ShoppingCart,
  shopping: ShoppingBag,
  transport: Bike,
  subscriptions: Repeat,
  bills: Receipt,
  random: Shuffle,
}

/** Round avatar with the category's line icon, like the brand logos in the design. */
export function CategoryIcon({ id, size = 20 }: { id: CategoryId; size?: number }) {
  const Icon = ICONS[id]
  return (
    <span className="avatar" aria-hidden style={{ color: CATEGORIES[id].color }}>
      <Icon size={size} strokeWidth={2} />
    </span>
  )
}

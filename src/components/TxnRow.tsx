import { CATEGORIES } from '../lib/categories'
import { timeLabel } from '../lib/format'
import type { Txn } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { Money } from './Money'

export function TxnRow({ txn, onClick, showDate }: { txn: Txn; onClick?: () => void; showDate?: boolean }) {
  const when = showDate
    ? new Date(txn.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : timeLabel(txn.at)
  return (
    <button className="txn" onClick={onClick} type="button">
      <CategoryIcon id={txn.category} />
      <span className="txn-main">
        <span className="txn-name">{txn.merchant}</span>
        <span className="txn-meta">
          {CATEGORIES[txn.category].label} • {when}
          {txn.source === 'auto' && <span className="auto">AUTO</span>}
        </span>
      </span>
      <Money value={txn.amount} prefix="– " className="txn-amt" />
    </button>
  )
}

import { CATEGORIES } from '../lib/categories'
import { rupees, timeLabel } from '../lib/format'
import type { Txn } from '../lib/types'

export function TxnRow({ txn, onClick, showDate }: { txn: Txn; onClick?: () => void; showDate?: boolean }) {
  const cat = CATEGORIES[txn.category]
  const when = showDate
    ? new Date(txn.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    : timeLabel(txn.at)
  return (
    <button className="txn" onClick={onClick} type="button">
      <span className="txn-ico" aria-hidden>
        {cat.emoji}
      </span>
      <span className="txn-main">
        <span className="txn-name" style={{ display: 'block' }}>
          {txn.merchant}
        </span>
        <span className="txn-meta">
          {cat.label} · {txn.method}
          {txn.source === 'auto' ? ' · auto' : ''} · {when}
        </span>
      </span>
      <span className="txn-amt">−{rupees(txn.amount)}</span>
    </button>
  )
}

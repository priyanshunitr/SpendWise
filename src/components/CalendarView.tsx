import { useState } from 'react'
import { dailyBudget, dailyTotals, sum, txnsOnDay } from '../lib/budget'
import { dayKey, daysInMonth, rupees } from '../lib/format'
import type { Profile, Txn } from '../lib/types'
import { TxnRow } from './TxnRow'

function compact(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
  if (n >= 10000) return `₹${Math.round(n / 1000)}k`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return rupees(n)
}

export function CalendarView({ profile, txns, onEdit }: { profile: Profile; txns: Txn[]; onEdit: (t: Txn) => void }) {
  const now = new Date()
  const [selected, setSelected] = useState(now.getDate())
  const budget = dailyBudget(profile, now)
  const totals = dailyTotals(txns, now)
  const days = daysInMonth(now)
  const offset = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7 // Monday-first

  const past = totals.slice(0, now.getDate())
  const under = past.filter((t) => t <= budget).length
  const net = past.reduce((s, t) => s + (budget - t), 0)

  const selDate = new Date(now.getFullYear(), now.getMonth(), selected)
  const selTxns = txnsOnDay(txns, dayKey(selDate))
  const selSpent = sum(selTxns)

  return (
    <>
      <h2 className="display" style={{ fontSize: 30, margin: '0 4px 4px' }}>
        {now.toLocaleDateString('en-IN', { month: 'long' })}
      </h2>
      <p className="muted" style={{ margin: '0 4px 16px', fontSize: 14 }}>
        {rupees(budget)} every single day.
      </p>

      <div className="stats">
        <div className="card stat">
          <div className="eyebrow">Under</div>
          <div className="display tone-good">{under}d</div>
        </div>
        <div className="card stat">
          <div className="eyebrow">Over</div>
          <div className="display tone-bad">{past.length - under}d</div>
        </div>
        <div className="card stat">
          <div className="eyebrow">{net >= 0 ? 'Saved' : 'Overspent'}</div>
          <div className={`display ${net >= 0 ? 'tone-good' : 'tone-bad'}`}>{compact(Math.abs(net))}</div>
        </div>
      </div>

      <div className="cal-head">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="cal">
        {Array.from({ length: offset }, (_, i) => (
          <span key={`e${i}`} />
        ))}
        {totals.map((t, i) => {
          const d = i + 1
          const future = d > now.getDate()
          const cls = future ? 'future' : t > budget ? 'over' : 'under'
          return (
            <button
              key={d}
              className={`cal-day ${cls} ${d === now.getDate() ? 'today' : ''} ${d === selected ? 'selected' : ''}`}
              onClick={() => !future && setSelected(d)}
              disabled={future}
              aria-label={`${d}: spent ${rupees(t)}`}
            >
              <span className="n">{d}</span>
              <span className="v">{future ? compact(budget) : compact(t)}</span>
            </button>
          )
        })}
      </div>
      {days > 0 && (
        <div className="legend">
          <span>
            <i style={{ background: 'var(--lime)' }} />
            Within budget
          </span>
          <span>
            <i style={{ background: 'var(--pink)' }} />
            Over budget
          </span>
        </div>
      )}

      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span className="eyebrow">{selDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
        <span className={`eyebrow ${selSpent > budget ? 'neg' : ''}`}>
          {rupees(selSpent)} / {rupees(budget)}
        </span>
      </div>
      {selTxns.length === 0 ? (
        <div className="card empty">Nothing spent this day.</div>
      ) : (
        selTxns.map((t) => <TxnRow key={t.id} txn={t} onClick={() => onEdit(t)} />)
      )}
    </>
  )
}

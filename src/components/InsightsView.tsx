import { useMemo, useState, type PointerEvent } from 'react'
import { ArrowDown, ArrowUp, ChevronRight, Receipt, Wallet } from 'lucide-react'
import { byCategory, dailyBudget, dailyTotals, sum, topMerchants, txnsInMonth } from '../lib/budget'
import { CATEGORIES } from '../lib/categories'
import { rupees } from '../lib/format'
import type { CategoryId, Profile, Txn } from '../lib/types'
import { CategoryIcon } from './CategoryIcon'
import { Money } from './Money'
import { TxnRow } from './TxnRow'

const W = 360
const H = 190
const PAD_TOP = 52
const PAD_BOTTOM = 14
/** Keeps the first/last day's dot and tooltip off the screen edge. */
const PAD_X = 30

/**
 * Catmull-Rom → cubic Bézier, for the soft wave lines in the design. Control points are
 * clamped to the baseline so a spike after a ₹0 day doesn't dip the curve below zero.
 */
function smoothPath(pts: [number, number][], base: number) {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(base, p1[1] + (p2[1] - p0[1]) / 6)]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(base, p2[1] - (p3[1] - p1[1]) / 6)]
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`
  }
  return d
}

function rolling(values: number[], n: number) {
  return values.map((_, i) => {
    const win = values.slice(Math.max(0, i - n + 1), i + 1)
    return win.reduce((s, v) => s + v, 0) / win.length
  })
}

function WaveChart({ values, month }: { values: number[]; month: Date }) {
  const [sel, setSel] = useState(values.length - 1)
  const idx = Math.min(sel, values.length - 1)
  const avg = rolling(values, 7)
  const max = Math.max(1, ...values, ...avg) * 1.08
  const step = values.length > 1 ? (W - PAD_X * 2) / (values.length - 1) : W
  const x = (i: number) => (values.length > 1 ? PAD_X + i * step : W / 2)
  const y = (v: number) => H - PAD_BOTTOM - (v / max) * (H - PAD_TOP - PAD_BOTTOM)

  const spendLine = smoothPath(values.map((v, i) => [x(i), y(v)]), y(0))
  const avgLine = smoothPath(avg.map((v, i) => [x(i), y(v)]), y(0))
  const area = `${spendLine} L${x(values.length - 1)},${H} L${x(0)},${H} Z`

  const pick = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round((px - PAD_X) / step)
    setSel(Math.max(0, Math.min(values.length - 1, i)))
  }

  // ~6 evenly spaced day labels; the selected day replaces its nearest neighbour.
  const labels = useMemo(() => {
    const n = values.length
    const count = Math.min(6, n)
    const out = Array.from({ length: count }, (_, k) => Math.round((k * (n - 1)) / Math.max(1, count - 1)))
    let nearest = 0
    out.forEach((v, k) => Math.abs(v - idx) < Math.abs(out[nearest] - idx) && (nearest = k))
    out[nearest] = idx
    return out
  }, [values.length, idx])

  const pct = (x(idx) / W) * 100
  const left = `${pct}%`
  // The tooltip is ~90px wide: keep it on screen, and drop the arrow when it had to shift.
  const tipPct = Math.min(86, Math.max(14, pct))
  const monthShort = month.toLocaleDateString('en-IN', { month: 'short' })

  return (
    <>
      <div
        className="chart-wrap"
        onPointerDown={pick}
        onPointerMove={(e) => e.buttons && pick(e)}
        role="img"
        aria-label={`Daily spending this month. Day ${idx + 1}: ${rupees(values[idx])}`}
      >
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--lime)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--lime)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="band" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--lime)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--lime)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={x(idx) - step * 0.45} y={y(values[idx])} width={Math.max(step * 0.9, 10)} height={H} fill="url(#band)" />
          <path d={area} fill="url(#area)" />
          <path d={avgLine} fill="none" stroke="var(--lavender)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          <path d={spendLine} fill="none" stroke="var(--lime)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <span
          style={{
            position: 'absolute',
            left,
            top: y(values[idx]),
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'var(--lime)',
            boxShadow: '0 0 0 4px rgba(182,241,92,.3), 0 0 0 2px #fff inset',
            transform: 'translate(-50%,-50%)',
            pointerEvents: 'none',
          }}
        />
        <span
          className={`chart-tip ${tipPct !== pct ? 'no-arrow' : ''}`}
          style={{ left: `${tipPct}%`, top: Math.max(0, y(values[idx]) - 52) }}
        >
          {rupees(values[idx])}
        </span>
      </div>
      <div className="chart-x">
        {labels.map((d, k) => (
          <span key={k} className={d === idx ? 'on' : ''}>
            {d === idx ? `${d + 1} ${monthShort}` : d + 1}
          </span>
        ))}
      </div>
      <div className="legend" style={{ justifyContent: 'center' }}>
        <span>
          <i style={{ background: 'var(--lime)' }} />
          Daily spend
        </span>
        <span>
          <i style={{ background: 'var(--lavender)' }} />
          7-day average
        </span>
      </div>
    </>
  )
}

export function InsightsView({
  profile,
  txns,
  onEdit,
  onOpenMonth,
}: {
  profile: Profile
  txns: Txn[]
  onEdit: (t: Txn) => void
  onOpenMonth: () => void
}) {
  const [filter, setFilter] = useState<CategoryId | 'all'>('all')
  const [showAll, setShowAll] = useState(false)
  const now = new Date()
  const month = txnsInMonth(txns, now)
  const cats = byCategory(month)
  const shown = filter === 'all' ? month : month.filter((t) => t.category === filter)
  const spent = sum(shown)
  const spendable = Math.max(0, profile.monthlyIncome - profile.fixedCosts)
  const budgetSoFar = dailyBudget(profile, now) * now.getDate()
  const pace = budgetSoFar > 0 ? ((sum(month) - budgetSoFar) / budgetSoFar) * 100 : 0
  const totals = dailyTotals(shown, now).slice(0, now.getDate())
  const history = [...shown].sort((a, b) => b.at.localeCompare(a.at))
  const merchants = topMerchants(shown)
  const subs = month.filter((t) => t.category === 'subscriptions')

  return (
    <>
      <header className="head-title">
        <span />
        <h1>Analytics</h1>
        <span />
      </header>

      <div className="chips scroll">
        <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </button>
        {cats.map(({ id }) => (
          <button key={id} className="chip" aria-pressed={filter === id} onClick={() => setFilter(id)}>
            {CATEGORIES[id].label}
          </button>
        ))}
      </div>

      <div className="label" style={{ marginTop: 22 }}>
        {filter === 'all' ? 'Spent this month' : `${CATEGORIES[filter].label} this month`}
      </div>
      <Money value={spent} className="money-xl" />

      {month.length > 0 ? (
        <WaveChart key={filter} values={totals} month={now} />
      ) : (
        <div className="card empty" style={{ marginTop: 18 }}>
          Nothing tracked yet this month.
        </div>
      )}

      <div className="tiles">
        <div className="tile">
          <span className="ico" style={{ background: 'var(--lime)', color: 'var(--lime-ink)' }}>
            <Wallet size={20} />
          </span>
          <Money value={spendable} />
          <div className="label">Monthly budget</div>
        </div>
        <div className="tile">
          <span className="ico" style={{ background: 'var(--lavender)', color: 'var(--lavender-ink)' }}>
            <Receipt size={20} />
          </span>
          <Money value={spent} />
          <div className="label">{filter === 'all' ? 'Total spent' : CATEGORIES[filter].label}</div>
        </div>
      </div>

      {filter === 'all' && month.length > 0 && (
        <button className={`pace ${pace > 0 ? '' : 'lime'}`} onClick={onOpenMonth}>
          <div>
            <b>
              {pace > 0 ? '+' : '−'}
              {Math.abs(pace).toFixed(1)}%{pace > 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
            </b>
            <span>Spending is {pace > 0 ? 'above' : 'below'} your budget pace</span>
          </div>
          <ChevronRight size={22} />
        </button>
      )}

      <div className="section-head">
        <h2>Transactions History</h2>
        <span className="link">This month</span>
      </div>
      {history.length === 0 && <div className="empty">No transactions.</div>}
      {(showAll ? history : history.slice(0, 6)).map((t) => (
        <TxnRow key={t.id} txn={t} onClick={() => onEdit(t)} showDate />
      ))}
      {history.length > 6 && (
        <button className="btn btn-block" style={{ marginTop: 12 }} onClick={() => setShowAll(!showAll)}>
          {showAll ? 'Show less' : `Show all ${history.length}`}
        </button>
      )}

      {filter === 'all' && cats.length > 0 && (
        <>
          <div className="section-head">
            <h2>By Category</h2>
          </div>
          <div className="card">
            {cats.map(({ id, total }) => (
              <div className="cat-row" key={id}>
                <CategoryIcon id={id} size={18} />
                <div>
                  <div className="top">
                    {CATEGORIES[id].label} <span>{Math.round((total / sum(month)) * 100)}%</span>
                  </div>
                  <div className="cat-bar">
                    <i style={{ width: `${(total / cats[0].total) * 100}%`, background: CATEGORIES[id].color }} />
                  </div>
                </div>
                <span className="amt">{rupees(total)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {merchants.length > 0 && (
        <>
          <div className="section-head">
            <h2>Top Merchants</h2>
          </div>
          <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {merchants.map((m) => (
              <div className="list-row" key={m.merchant}>
                <span>
                  <b>{m.merchant}</b> <span className="muted">· {m.count}×</span>
                </span>
                <b>{rupees(m.total)}</b>
              </div>
            ))}
          </div>
        </>
      )}

      {filter === 'all' && subs.length > 0 && (
        <>
          <div className="section-head">
            <h2>Subscriptions</h2>
            <span className="link">{rupees(sum(subs) * 12)} / year</span>
          </div>
          <div className="card" style={{ paddingTop: 6, paddingBottom: 6 }}>
            {subs.map((t) => (
              <div className="list-row" key={t.id}>
                <span>
                  <b>{t.merchant}</b>{' '}
                  <span className="muted">· {new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </span>
                <b>{rupees(t.amount)}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

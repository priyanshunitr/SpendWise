import { byCategory, dailyBudget, dailyTotals, sum, topMerchants, txnsInMonth } from '../lib/budget'
import { CATEGORIES } from '../lib/categories'
import { rupees } from '../lib/format'
import type { Profile, Txn } from '../lib/types'

function DailyChart({ totals, budget, today }: { totals: number[]; budget: number; today: number }) {
  const W = 320
  const H = 140
  const max = Math.max(budget * 1.4, ...totals)
  const bw = W / totals.length
  const y = (v: number) => H - (v / max) * H
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label="Daily spending this month vs daily budget">
      {totals.map((t, i) => {
        const future = i + 1 > today
        const h = Math.max(future ? 0 : 2, H - y(t))
        return (
          <rect
            key={i}
            x={i * bw + bw * 0.18}
            y={H - h}
            width={bw * 0.64}
            height={h}
            rx={Math.min(3, bw * 0.3)}
            fill={t > budget ? 'var(--pink)' : 'var(--lime)'}
            opacity={i + 1 === today ? 1 : 0.75}
          >
            <title>{`${i + 1}: ${rupees(t)}`}</title>
          </rect>
        )
      })}
      <line x1="0" x2={W} y1={y(budget)} y2={y(budget)} stroke="var(--text)" strokeDasharray="4 4" opacity="0.5" />
      <text x={W} y={y(budget) - 5} textAnchor="end" fontSize="10" fill="var(--muted)">
        budget {rupees(budget)}
      </text>
      {[1, 8, 15, 22, totals.length].map((d) => (
        <text key={d} x={(d - 0.5) * bw} y={H + 14} textAnchor="middle" fontSize="9" fill="var(--faint)">
          {d}
        </text>
      ))}
    </svg>
  )
}

export function InsightsView({ profile, txns }: { profile: Profile; txns: Txn[] }) {
  const now = new Date()
  const month = txnsInMonth(txns, now)
  const spent = sum(month)
  const budget = dailyBudget(profile, now)
  const budgetSoFar = budget * now.getDate()
  const spendable = Math.max(0, profile.monthlyIncome - profile.fixedCosts)
  const cats = byCategory(month)
  const merchants = topMerchants(month)
  const subs = month.filter((t) => t.category === 'subscriptions')
  const projected = (spent / now.getDate()) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const ahead = budgetSoFar - spent

  return (
    <>
      <div className="card">
        <div className="eyebrow">Where did my money go?</div>
        <div className="verdict">
          {month.length === 0 ? (
            'Nothing tracked yet.'
          ) : ahead >= 0 ? (
            <>
              You're <span className="tone-good">{rupees(ahead)}</span> ahead this month.
            </>
          ) : (
            <>
              You're <span className="tone-bad">{rupees(-ahead)}</span> over pace.
            </>
          )}
        </div>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.5 }}>
          Spent {rupees(spent)} of {rupees(spendable)} this month. At this rate you'll end at{' '}
          <b style={{ color: projected > spendable ? 'var(--pink)' : 'var(--text)' }}>{rupees(projected)}</b>.
        </p>
      </div>

      <div className="section-title eyebrow">Every day this month</div>
      <div className="card">
        <DailyChart totals={dailyTotals(txns, now)} budget={budget} today={now.getDate()} />
      </div>

      <div className="section-title eyebrow">By category</div>
      <div className="card">
        {cats.length === 0 && <div className="empty">No spending yet.</div>}
        {cats.map(({ id, total }) => {
          const c = CATEGORIES[id]
          return (
            <div className="cat-row" key={id}>
              <span style={{ fontSize: 20 }} aria-hidden>
                {c.emoji}
              </span>
              <div>
                <div className="label">
                  {c.label} <span>{Math.round((total / spent) * 100)}%</span>
                </div>
                <div className="cat-bar">
                  <i style={{ width: `${(total / cats[0].total) * 100}%`, background: c.color }} />
                </div>
              </div>
              <span className="amt">{rupees(total)}</span>
            </div>
          )
        })}
      </div>

      <div className="section-title eyebrow">Top merchants</div>
      <div className="card" style={{ paddingTop: 8, paddingBottom: 8 }}>
        {merchants.length === 0 && <div className="empty">—</div>}
        {merchants.map((m) => (
          <div className="list-row" key={m.merchant}>
            <span>
              <b>{m.merchant}</b> <span className="muted">· {m.count}×</span>
            </span>
            <span className="neg">{rupees(m.total)}</span>
          </div>
        ))}
      </div>

      <div className="section-title eyebrow">Subscriptions</div>
      <div className="card" style={{ paddingTop: 8, paddingBottom: 8 }}>
        {subs.length === 0 && <div className="empty">No subscriptions found this month.</div>}
        {subs.map((t) => (
          <div className="list-row" key={t.id}>
            <span>
              <b>{t.merchant}</b>{' '}
              <span className="muted">· {new Date(t.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
            </span>
            <span className="neg">{rupees(t.amount)}</span>
          </div>
        ))}
        {subs.length > 0 && (
          <div className="list-row">
            <span className="muted">Per year</span>
            <b>{rupees(sum(subs) * 12)}</b>
          </div>
        )}
      </div>
    </>
  )
}

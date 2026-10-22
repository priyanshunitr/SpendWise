import { ArrowDownLeft, ArrowUpRight, Bell, LayoutGrid, X } from 'lucide-react'
import { dailyBudget, greeting, remainingTone, sum, txnsInMonth, txnsOnDay } from '../lib/budget'
import { daysInMonth, rupeeParts } from '../lib/format'
import type { Banner } from '../lib/notify'
import type { Profile, Txn } from '../lib/types'
import { AutoDetectSetup } from './AutoDetectSetup'
import { Money } from './Money'
import { TxnRow } from './TxnRow'

interface Props {
  profile: Profile
  txns: Txn[]
  banner: Banner | null
  onDismissBanner: () => void
  onShowReport: () => void
  onEdit: (t: Txn) => void
  onAdd: () => void
  onImport: () => void
  onSettings: () => void
  onSeeAll: () => void
}

function hoursLeftToday(now: Date) {
  const end = new Date(now)
  end.setHours(24, 0, 0, 0)
  const mins = Math.round((end.getTime() - now.getTime()) / 60000)
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

/** Whole rupees + muted paise for text inside the coloured cards. */
function CardAmount({ value }: { value: number }) {
  const [whole, frac] = rupeeParts(value)
  return (
    <div className="v">
      {whole}
      <span className="frac">{frac}</span>
    </div>
  )
}

export function TodayView(p: Props) {
  const { profile, txns, banner } = p
  const now = new Date()
  const budget = dailyBudget(profile, now)
  const today = txnsOnDay(txns, now)
  const spent = sum(today)
  const remaining = budget - spent
  const tone = remainingTone(remaining, budget)
  const pct = budget > 0 ? Math.max(0, Math.min(1, remaining / budget)) : 0

  const days = daysInMonth(now)
  const monthBudget = budget * days
  const monthSpent = sum(txnsInMonth(txns, now))
  const monthLeft = monthBudget - monthSpent
  const daysLeft = days - now.getDate()

  return (
    <>
      <header className="head">
        <div>
          <div className="hello">{greeting(now)},</div>
          <div className="name">{profile.name || 'there'}</div>
        </div>
        <button className="round-btn" onClick={p.onShowReport} aria-label="Tonight's report">
          <Bell size={20} />
          {remaining < 0 && <span className="dot" />}
        </button>
      </header>

      <AutoDetectSetup compact />

      {banner && (
        <div className={`notice ${banner.over ? 'coral' : banner.kind === 'morning' ? 'lavender' : 'lime'}`} role="status">
          <button className="close" onClick={p.onDismissBanner} aria-label="Dismiss">
            <X size={16} />
          </button>
          <div className="kicker">{banner.kind === 'morning' ? 'Morning briefing' : 'Night report'}</div>
          <h3>{banner.title}</h3>
          <p>{banner.body}</p>
        </div>
      )}

      <div className="label">{remaining < 0 ? 'Over budget today' : 'Left to spend today'}</div>
      <Money value={Math.abs(remaining)} className="money-xl" />

      <div className="actions">
        <button className="action" onClick={p.onAdd}>
          <span className="ico">
            <ArrowUpRight size={18} />
          </span>
          Add spend
        </button>
        <button className="action" onClick={p.onImport}>
          <span className="ico">
            <ArrowDownLeft size={18} />
          </span>
          Import SMS
        </button>
        <button className="action square" onClick={p.onSettings} aria-label="Settings">
          <LayoutGrid size={20} />
        </button>
      </div>

      <div className="section-head" style={{ marginTop: 0 }}>
        <h2>My Budgets</h2>
      </div>
      <div className="cards">
        <div className={`bcard ${tone === 'bad' ? 'coral' : 'lime'}`}>
          <div>
            <span className="tag">Today · Day {now.getDate()}</span>
            <div className="mid">
              {rupeeParts(budget)[0]} <small>/ day</small>
            </div>
            <div className="meter">
              <i style={{ width: `${pct * 100}%` }} />
            </div>
          </div>
          <div className="row">
            <div>
              <div className="k">Spent today</div>
              <CardAmount value={spent} />
            </div>
            <div className="side">
              <div className="k">Resets in</div>
              {hoursLeftToday(now)}
            </div>
          </div>
        </div>

        <div className="bcard lavender">
          <div>
            <span className="tag">{now.toLocaleDateString('en-IN', { month: 'long' })}</span>
            <div className="mid">
              {rupeeParts(monthBudget)[0]} <small>/ month</small>
            </div>
            <div className="meter">
              <i style={{ width: `${Math.max(0, Math.min(1, monthLeft / monthBudget)) * 100}%` }} />
            </div>
          </div>
          <div className="row">
            <div>
              <div className="k">{monthLeft < 0 ? 'Over by' : 'Left this month'}</div>
              <CardAmount value={Math.abs(monthLeft)} />
            </div>
            <div className="side">
              <div className="k">Days left</div>
              {daysLeft}
            </div>
          </div>
        </div>
      </div>

      <section className="paper">
        <div className="grabber" />
        <div className="section-head">
          <h2>Today's Transactions</h2>
          <button className="link" onClick={p.onSeeAll}>
            See all
          </button>
        </div>
        {today.length === 0 ? (
          <div className="empty">No spends yet today. Easy. 😌</div>
        ) : (
          today.map((t) => <TxnRow key={t.id} txn={t} onClick={() => p.onEdit(t)} />)
        )}
      </section>
    </>
  )
}

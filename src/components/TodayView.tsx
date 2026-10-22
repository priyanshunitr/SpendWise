import { dailyBudget, greeting, remainingTone, sum, txnsOnDay } from '../lib/budget'
import { rupees } from '../lib/format'
import type { Banner } from '../lib/notify'
import type { Profile, Txn } from '../lib/types'
import { TxnRow } from './TxnRow'
import { AutoDetectSetup } from './AutoDetectSetup'

interface Props {
  profile: Profile
  txns: Txn[]
  banner: Banner | null
  onDismissBanner: () => void
  onShowReport: () => void
  onEdit: (t: Txn) => void
  onImport: () => void
}

export function TodayView({ profile, txns, banner, onDismissBanner, onShowReport, onEdit, onImport }: Props) {
  const now = new Date()
  const budget = dailyBudget(profile, now)
  const today = txnsOnDay(txns, now)
  const spent = sum(today)
  const remaining = budget - spent
  const tone = remainingTone(remaining, budget)
  const pct = budget > 0 ? Math.max(0, Math.min(1, remaining / budget)) : 0

  return (
    <>
      {banner && (
        <div className={`card banner ${banner.kind} ${banner.over ? 'over' : ''}`} role="status">
          <button className="close" onClick={onDismissBanner} aria-label="Dismiss">
            ✕
          </button>
          <div className="eyebrow">{banner.kind === 'morning' ? 'Morning briefing' : 'Night report'}</div>
          <h3>{banner.title}</h3>
          <p>{banner.body}</p>
        </div>
      )}

      <AutoDetectSetup compact />

      {!banner && (
        <p className="muted" style={{ margin: '0 4px 12px', fontSize: 15 }}>
          {greeting(now)}
          {profile.name ? `, ${profile.name}` : ''}. Your daily income is <b style={{ color: 'var(--text)' }}>{rupees(budget)}</b>.
        </p>
      )}

      <div className="card budget-card">
        <div className="budget-head">
          <span className="eyebrow">{remaining < 0 ? 'Over budget by' : "Today's budget"}</span>
          <span className="pill">Day {now.getDate()}</span>
        </div>
        <div className="budget-row">
          <span className={`display budget-amount tone-${tone}`}>{rupees(Math.abs(remaining))}</span>
          <span className="budget-spent">
            Spent
            <b className={spent ? 'neg' : 'muted'}>{spent ? `−${rupees(spent)}` : '₹0'}</b>
          </span>
        </div>
        <div className={`bar bar-${tone}`} role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${pct * 100}%` }} />
        </div>
        <div className="budget-foot">
          <span>{rupees(budget)} daily</span>
          <span>
            {remaining >= 0 ? `${Math.round(pct * 100)}% left` : 'Tomorrow is a new day'}
          </span>
        </div>
      </div>

      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="eyebrow">Today's transactions</span>
        <button className="eyebrow" style={{ color: 'var(--lime)' }} onClick={onImport}>
          + Import SMS
        </button>
      </div>
      {today.length === 0 ? (
        <div className="card empty">No spends yet. Easy. 😌</div>
      ) : (
        today.map((t) => <TxnRow key={t.id} txn={t} onClick={() => onEdit(t)} />)
      )}

      <button className="btn btn-block" style={{ marginTop: 16 }} onClick={onShowReport}>
        🌙 Preview tonight's report
      </button>
    </>
  )
}

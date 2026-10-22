import { useEffect, useState } from 'react'
import { useAppState } from './lib/store'
import { nightReportFor, useDailyNotifications, useMinuteTick, type Banner } from './lib/notify'
import { scheduleDailyNotifications, useAutoDetect } from './lib/native'
import type { Txn } from './lib/types'
import { Onboarding } from './components/Onboarding'
import { TodayView } from './components/TodayView'
import { CalendarView } from './components/CalendarView'
import { InsightsView } from './components/InsightsView'
import { AddExpenseSheet } from './components/AddExpenseSheet'
import { ImportSheet } from './components/ImportSheet'
import { SettingsSheet } from './components/SettingsSheet'

type Tab = 'today' | 'month' | 'insights'
type Modal = { kind: 'add' } | { kind: 'edit'; txn: Txn } | { kind: 'import' } | { kind: 'settings' } | null

export default function App() {
  const { profile, txns } = useAppState()
  const [tab, setTab] = useState<Tab>('today')
  const [modal, setModal] = useState<Modal>(null)
  const [autoBanner, dismissAuto] = useDailyNotifications()
  const [manualBanner, setManualBanner] = useState<Banner | null>(null)
  const banner = manualBanner ?? autoBanner
  useMinuteTick()
  useAutoDetect()

  useEffect(() => {
    if (profile) scheduleDailyNotifications(profile, txns)
  }, [profile, txns])

  if (!profile) {
    return (
      <main className="app">
        <Onboarding />
      </main>
    )
  }

  const close = () => setModal(null)
  const edit = (txn: Txn) => setModal({ kind: 'edit', txn })

  return (
    <main className="app">
      <header className="topbar">
        <span className="brand">
          Spend<span>Wise</span>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="icon-btn" onClick={() => setModal({ kind: 'import' })} aria-label="Import bank SMS" title="Import bank SMS">
            📩
          </button>
          <button className="icon-btn" onClick={() => setModal({ kind: 'settings' })} aria-label="Settings" title="Settings">
            ⚙️
          </button>
        </div>
      </header>

      {tab === 'today' && (
        <TodayView
          profile={profile}
          txns={txns}
          banner={banner}
          onDismissBanner={() => {
            setManualBanner(null)
            dismissAuto()
          }}
          onShowReport={() => {
            setManualBanner(nightReportFor(profile, txns))
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onEdit={edit}
          onImport={() => setModal({ kind: 'import' })}
        />
      )}
      {tab === 'month' && <CalendarView profile={profile} txns={txns} onEdit={edit} />}
      {tab === 'insights' && <InsightsView profile={profile} txns={txns} />}

      <nav className="tabbar" aria-label="Sections">
        <button aria-current={tab === 'today' ? 'page' : undefined} onClick={() => setTab('today')}>
          <span className="ico">⚡</span>Today
        </button>
        <button aria-current={tab === 'month' ? 'page' : undefined} onClick={() => setTab('month')}>
          <span className="ico">📅</span>Month
        </button>
        <button className="fab" onClick={() => setModal({ kind: 'add' })} aria-label="Add expense">
          +
        </button>
        <button aria-current={tab === 'insights' ? 'page' : undefined} onClick={() => setTab('insights')}>
          <span className="ico">📊</span>Insights
        </button>
      </nav>

      {modal?.kind === 'add' && <AddExpenseSheet onClose={close} />}
      {modal?.kind === 'edit' && <AddExpenseSheet txn={modal.txn} onClose={close} />}
      {modal?.kind === 'import' && <ImportSheet onClose={close} />}
      {modal?.kind === 'settings' && <SettingsSheet profile={profile} txns={txns} onClose={close} />}
    </main>
  )
}

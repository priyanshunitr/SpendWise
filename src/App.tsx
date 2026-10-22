import { useEffect, useState } from 'react'
import { CalendarDays, ChartPie, House, Plus, UserRound } from 'lucide-react'
import { useAppState } from './lib/store'
import { nightReportFor, useDailyNotifications, useMinuteTick, type Banner } from './lib/notify'
import { App as CapApp } from '@capacitor/app'
import { isNative, scheduleDailyNotifications, useAutoDetect } from './lib/native'
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

  // Android back: close the open sheet, else go back to Home, else leave the app.
  useEffect(() => {
    if (!isNative) return
    const sub = CapApp.addListener('backButton', () => {
      if (modal) setModal(null)
      else if (tab !== 'today') setTab('today')
      else CapApp.minimizeApp()
    })
    return () => {
      sub.then((h) => h.remove())
    }
  }, [modal, tab])

  if (!profile) {
    return (
      <main className="app">
        <Onboarding />
      </main>
    )
  }

  const close = () => setModal(null)
  const edit = (txn: Txn) => setModal({ kind: 'edit', txn })

  const go = (t: Tab) => {
    setTab(t)
    window.scrollTo({ top: 0 })
  }

  return (
    <main className={`app ${tab === 'today' ? 'home' : ''}`}>
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
          onAdd={() => setModal({ kind: 'add' })}
          onImport={() => setModal({ kind: 'import' })}
          onSettings={() => setModal({ kind: 'settings' })}
          onSeeAll={() => go('insights')}
        />
      )}
      {tab === 'month' && <CalendarView profile={profile} txns={txns} onEdit={edit} />}
      {tab === 'insights' && <InsightsView profile={profile} txns={txns} onEdit={edit} onOpenMonth={() => go('month')} />}

      <nav className="nav" aria-label="Sections">
        <div className="nav-inner">
          <button className="nav-item" aria-current={tab === 'today' ? 'page' : undefined} onClick={() => go('today')}>
            <House size={22} />
            Home
          </button>
          <button className="nav-item" aria-current={tab === 'month' ? 'page' : undefined} onClick={() => go('month')}>
            <CalendarDays size={22} />
            Month
          </button>
          <div className="nav-fab-wrap">
            <button className="nav-fab" onClick={() => setModal({ kind: 'add' })} aria-label="Add expense">
              <Plus size={28} strokeWidth={2.4} />
            </button>
          </div>
          <button className="nav-item" aria-current={tab === 'insights' ? 'page' : undefined} onClick={() => go('insights')}>
            <ChartPie size={22} />
            Analytics
          </button>
          <button className="nav-item" onClick={() => setModal({ kind: 'settings' })}>
            <UserRound size={22} />
            Profile
          </button>
        </div>
      </nav>

      {modal?.kind === 'add' && <AddExpenseSheet onClose={close} />}
      {modal?.kind === 'edit' && <AddExpenseSheet txn={modal.txn} onClose={close} />}
      {modal?.kind === 'import' && <ImportSheet onClose={close} />}
      {modal?.kind === 'settings' && <SettingsSheet profile={profile} txns={txns} onClose={close} />}
    </main>
  )
}

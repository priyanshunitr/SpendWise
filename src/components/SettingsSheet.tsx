import { useState } from 'react'
import { Sheet } from './Sheet'
import { AutoDetectSetup } from './AutoDetectSetup'
import { actions } from '../lib/store'
import { demoTxns } from '../lib/demo'
import { requestNotificationPermission } from '../lib/notify'
import type { Profile, Txn } from '../lib/types'

export function SettingsSheet({ profile, txns, onClose }: { profile: Profile; txns: Txn[]; onClose: () => void }) {
  const [p, setP] = useState(profile)
  const hasDemo = txns.some((t) => t.source === 'demo')

  const save = () => {
    actions.saveProfile(p)
    onClose()
  }

  return (
    <Sheet onClose={onClose} label="Settings">
      <h2>Settings</h2>
      <p className="sub">Your data lives only in this browser.</p>

      <label className="field">
        <span>Name</span>
        <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Monthly income</span>
          <div className="input-rupee">
            <input
              className="input"
              inputMode="numeric"
              value={p.monthlyIncome || ''}
              onChange={(e) => setP({ ...p, monthlyIncome: Number(e.target.value.replace(/\D/g, '')) })}
            />
          </div>
        </label>
        <label className="field">
          <span>Fixed costs</span>
          <div className="input-rupee">
            <input
              className="input"
              inputMode="numeric"
              value={p.fixedCosts || ''}
              placeholder="0"
              onChange={(e) => setP({ ...p, fixedCosts: Number(e.target.value.replace(/\D/g, '')) })}
            />
          </div>
        </label>
        <label className="field">
          <span>Morning briefing</span>
          <input className="input" type="time" value={p.morningTime} onChange={(e) => setP({ ...p, morningTime: e.target.value })} />
        </label>
        <label className="field">
          <span>Night report</span>
          <input className="input" type="time" value={p.nightTime} onChange={(e) => setP({ ...p, nightTime: e.target.value })} />
        </label>
      </div>

      <label className="field" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          checked={p.notifications}
          onChange={async (e) => {
            const on = e.target.checked && (await requestNotificationPermission())
            setP({ ...p, notifications: on })
          }}
          style={{ width: 20, height: 20, accentColor: 'var(--lime)' }}
        />
        <span style={{ margin: 0, color: 'var(--text)', fontSize: 14 }}>System notifications (while the app is open)</span>
      </label>

      <button className="btn btn-primary btn-block" onClick={save} disabled={!p.monthlyIncome}>
        Save
      </button>

      <div style={{ marginTop: 20 }}>
        <AutoDetectSetup />
      </div>

      <div className="section-title eyebrow">Data</div>
      <div className="stack">
        {hasDemo ? (
          <button className="btn btn-block" onClick={() => actions.clearDemo()}>
            Remove demo transactions
          </button>
        ) : (
          <button className="btn btn-block" onClick={() => actions.addTxns(demoTxns())}>
            Load demo transactions
          </button>
        )}
        <button
          className="btn btn-block btn-danger"
          onClick={() => {
            if (confirm('Delete your profile and all transactions?')) {
              actions.reset()
              onClose()
            }
          }}
        >
          Reset everything
        </button>
      </div>
    </Sheet>
  )
}

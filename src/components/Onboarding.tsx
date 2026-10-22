import { useState } from 'react'
import { actions } from '../lib/store'
import { daysInMonth, rupees } from '../lib/format'
import { demoTxns } from '../lib/demo'
import { requestNotificationPermission } from '../lib/notify'

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [income, setIncome] = useState('100000')
  const [fixed, setFixed] = useState('')

  const incomeN = Number(income) || 0
  const fixedN = Number(fixed) || 0
  const days = daysInMonth(new Date())
  const perDay = Math.max(0, incomeN - fixedN) / days

  const finish = async (withDemo: boolean) => {
    const notifications = await requestNotificationPermission()
    actions.saveProfile({
      name: name.trim(),
      monthlyIncome: incomeN,
      fixedCosts: fixedN,
      morningTime: '08:00',
      nightTime: '21:30',
      notifications,
    })
    if (withDemo) actions.addTxns(demoTxns())
  }

  if (step === 0) {
    return (
      <div className="onboard">
        <h1 className="display hero-title">
          Where did my money <em>go?</em>
        </h1>
        <p className="muted" style={{ fontSize: 17, lineHeight: 1.5, margin: '0 0 32px' }}>
          SpendWise splits your salary into a <b style={{ color: 'var(--text)' }}>daily budget</b>. Every morning it tells
          you what you can spend. Every night it tells you how badly you did.
        </p>
        <label className="field">
          <span>What should we call you?</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" autoFocus />
        </label>
        <button className="btn btn-primary btn-block" onClick={() => setStep(1)}>
          Let's go →
        </button>
      </div>
    )
  }

  return (
    <div className="onboard">
      <div className="eyebrow" style={{ color: 'var(--lime)', textAlign: 'center' }}>
        Monthly income
      </div>
      <div className="ring-wrap">
        <svg viewBox="0 0 220 220" aria-hidden>
          <circle cx="110" cy="110" r="96" fill="none" stroke="#1d2030" strokeWidth="12" />
          <circle
            cx="110"
            cy="110"
            r="96"
            fill="none"
            stroke="var(--lime)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 96}
            strokeDashoffset={2 * Math.PI * 96 * (incomeN ? fixedN / incomeN : 0)}
            transform="rotate(-90 110 110)"
            style={{ transition: 'stroke-dashoffset .5s' }}
          />
        </svg>
        <span className="display">{rupees(incomeN)}</span>
      </div>

      <label className="field">
        <span>Take-home salary per month</span>
        <div className="input-rupee">
          <input
            className="input big-input"
            inputMode="numeric"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </label>
      <label className="field">
        <span>Fixed costs — rent, EMIs, SIPs (optional)</span>
        <div className="input-rupee">
          <input
            className="input"
            inputMode="numeric"
            value={fixed}
            placeholder="0"
            onChange={(e) => setFixed(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </label>

      <div className="per-day">
        <div className="eyebrow">That means</div>
        <div className="display tone-good" style={{ marginTop: 8 }}>
          {rupees(perDay)} <small>/ day</small>
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>
          every single day this month ({days} days).
        </div>
      </div>

      <div className="stack">
        <button className="btn btn-primary btn-block" disabled={!incomeN} onClick={() => finish(false)}>
          Start tracking
        </button>
        <button className="btn btn-block" disabled={!incomeN} onClick={() => finish(true)}>
          Start with demo data
        </button>
      </div>
    </div>
  )
}

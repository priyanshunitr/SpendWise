import { useCallback, useEffect, useState } from 'react'
import { App } from '@capacitor/app'
import { PaymentListener, backfillFromInbox, isNative } from '../lib/native'

interface Status {
  sms: boolean
  notifications: boolean
}

function useAutoDetectStatus(): [Status | null, () => void] {
  const [status, setStatus] = useState<Status | null>(null)
  const refresh = useCallback(async () => {
    if (!isNative) return
    try {
      const [{ sms }, { enabled }] = await Promise.all([PaymentListener.checkPermissions(), PaymentListener.notificationAccessStatus()])
      setStatus({ sms: sms === 'granted', notifications: enabled })
    } catch {
      setStatus(null)
    }
  }, [])
  useEffect(() => {
    refresh()
    if (!isNative) return
    // Notification access is granted in system settings, so re-check when the user comes back.
    const sub = App.addListener('resume', refresh)
    return () => {
      sub.then((h) => h.remove())
    }
  }, [refresh])
  return [status, refresh]
}

/** Permission checklist for automatic payment detection (Android only). */
export function AutoDetectSetup({ compact }: { compact?: boolean }) {
  const [status, refresh] = useAutoDetectStatus()
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  if (!isNative || !status) return null
  if (compact && status.sms) return null

  const allowSms = async () => {
    const { sms } = await PaymentListener.requestPermissions({ permissions: ['sms'] })
    await refresh()
    if (sms === 'granted') await scan()
    else setMsg('SMS access denied. You can allow it in Android Settings → Apps → SpendWise → Permissions.')
  }

  const scan = async () => {
    setBusy(true)
    try {
      const n = await backfillFromInbox(31)
      setMsg(n ? `Found ${n} payment${n === 1 ? '' : 's'} from the last month.` : 'No new payments found in your SMS.')
    } catch {
      setMsg("Couldn't read your SMS inbox.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`card ${compact ? 'banner morning' : ''}`} style={compact ? { marginBottom: 12 } : undefined}>
      <div className="eyebrow">Auto-detect payments</div>
      {compact && <h3>Stop typing expenses</h3>}
      <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: '6px 0 14px' }}>
        Pay at the shop → your bank texts you → SpendWise logs it and today's budget drops. Messages are read on this phone
        only and never uploaded.
      </p>

      <div className="list-row">
        <span>
          <b>Bank SMS</b>
          <span className="muted"> · main source</span>
        </span>
        {status.sms ? (
          <span className="tone-good" style={{ fontWeight: 700 }}>
            On ✓
          </span>
        ) : (
          <button className="chip" aria-pressed="true" onClick={allowSms}>
            Allow
          </button>
        )}
      </div>
      <div className="list-row">
        <span>
          <b>UPI app notifications</b>
          <span className="muted"> · backup</span>
        </span>
        {status.notifications ? (
          <span className="tone-good" style={{ fontWeight: 700 }}>
            On ✓
          </span>
        ) : (
          <button className="chip" onClick={() => PaymentListener.openNotificationAccessSettings()}>
            Open settings
          </button>
        )}
      </div>
      {!status.notifications && (
        <p className="note" style={{ marginTop: 6 }}>
          For GPay, PhonePe, Paytm and others: find SpendWise in the list and switch it on.
        </p>
      )}

      {status.sms && !compact && (
        <button className="btn btn-block" style={{ marginTop: 12 }} onClick={scan} disabled={busy}>
          {busy ? 'Scanning…' : 'Scan last month of SMS'}
        </button>
      )}
      {msg && <p className="note">{msg}</p>}
    </div>
  )
}

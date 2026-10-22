import { useMemo, useState } from 'react'
import { Sheet } from './Sheet'
import { TxnRow } from './TxnRow'
import { parseSmsBatch } from '../lib/sms'
import { actions } from '../lib/store'
import { rupees } from '../lib/format'
import { sum } from '../lib/budget'

const SAMPLE = `Rs.250.00 debited from A/c XX4821 on 22-10-26 to VPA bluetokai.coffee@ybl. UPI Ref 629118273611. Not you? Call 18002586161

INR 600.00 spent on HDFC Bank Card XX9012 at BLINKIT on 2026-10-22:13:04:11. Avl bal INR 41,200.00

Sent Rs.400.00 From HDFC Bank A/C *4821 To ZEPTO On 22/10/26 Ref 629194412233

Rs 5,000 credited to A/c XX4821 by NEFT from ACME PVT LTD`

export function ImportSheet({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState('')
  const parsed = useMemo(() => parseSmsBatch(text), [text])

  return (
    <Sheet onClose={onClose} label="Import bank SMS">
      <h2>Import bank SMS</h2>
      <p className="sub">
        Copy debit alerts from your bank or UPI app and paste them here. Credits, OTPs and balance messages are ignored.
      </p>
      <textarea
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste one or more SMS — separate messages with a blank line"
      />
      <div className="btn-row" style={{ margin: '10px 0 18px' }}>
        <button className="btn" onClick={() => setText(SAMPLE)}>
          Try a sample
        </button>
        <button className="btn" onClick={() => setText('')} disabled={!text}>
          Clear
        </button>
      </div>

      {text && (
        <>
          <div className="eyebrow" style={{ margin: '0 4px 10px' }}>
            Found {parsed.length} debit{parsed.length === 1 ? '' : 's'} · {rupees(sum(parsed))}
          </div>
          {parsed.length === 0 ? (
            <div className="empty">No debits recognised. Paste the full SMS text.</div>
          ) : (
            parsed.map((t) => <TxnRow key={t.id} txn={t} showDate />)
          )}
        </>
      )}

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 18 }}
        disabled={!parsed.length}
        onClick={() => {
          actions.addTxns(parsed)
          onClose()
        }}
      >
        Add {parsed.length || ''} transaction{parsed.length === 1 ? '' : 's'}
      </button>
      <p className="note">
        Everything stays on this device. Automatic bank sync needs India's Account Aggregator network (RBI-regulated) and is
        on the roadmap.
      </p>
    </Sheet>
  )
}

import { useState } from 'react'
import { Sheet } from './Sheet'
import { CATEGORY_LIST, QUICK_MERCHANTS, guessCategory } from '../lib/categories'
import { actions } from '../lib/store'
import { uid } from '../lib/format'
import type { CategoryId, Txn } from '../lib/types'

function toLocalInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

/** Adds a new expense, or edits `txn` when given. */
export function AddExpenseSheet({ txn, onClose }: { txn?: Txn; onClose: () => void }) {
  const [amount, setAmount] = useState(txn ? String(txn.amount) : '')
  const [merchant, setMerchant] = useState(txn?.merchant ?? '')
  const [category, setCategory] = useState<CategoryId | null>(txn?.category ?? null)
  const [method, setMethod] = useState(txn?.method ?? 'UPI')
  const [when, setWhen] = useState(toLocalInput(txn?.at ?? new Date().toISOString()))

  const cat = category ?? guessCategory(merchant)
  const amountN = Number(amount) || 0

  const save = () => {
    if (!amountN || !merchant.trim()) return
    const data = { amount: amountN, merchant: merchant.trim(), category: cat, method, at: new Date(when).toISOString() }
    if (txn) actions.updateTxn(txn.id, data)
    else actions.addTxns([{ id: uid(), source: 'manual', ...data }])
    onClose()
  }

  return (
    <Sheet onClose={onClose} label={txn ? 'Edit expense' : 'Add expense'}>
      <h2>{txn ? 'Edit expense' : 'Add expense'}</h2>
      <p className="sub">{txn ? 'Fix the details or delete it.' : 'Tap a usual suspect or type it in.'}</p>

      {!txn && (
        <div className="chips" style={{ marginBottom: 18 }}>
          {QUICK_MERCHANTS.map((q) => (
            <button
              key={q.merchant}
              className="chip"
              aria-pressed={merchant === q.merchant}
              onClick={() => {
                setMerchant(q.merchant)
                setAmount(String(q.amount))
                setCategory(null)
              }}
            >
              {q.merchant} · ₹{q.amount}
            </button>
          ))}
        </div>
      )}

      <label className="field">
        <span>Amount</span>
        <div className="input-rupee">
          <input
            className="input big-input"
            inputMode="decimal"
            value={amount}
            placeholder="0"
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
            autoFocus={!txn}
          />
        </div>
      </label>
      <label className="field">
        <span>Where</span>
        <input className="input" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Blinkit, Swiggy, chai…" />
      </label>

      <div className="field">
        <span>Category</span>
        <div className="chips">
          {CATEGORY_LIST.map((c) => (
            <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <label className="field">
          <span>Paid via</span>
          <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
            {['UPI', 'Card', 'Cash', 'Bank', 'ATM'].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>When</span>
          <input className="input" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
      </div>

      <div className="btn-row">
        {txn && (
          <button
            className="btn btn-danger"
            onClick={() => {
              actions.deleteTxn(txn.id)
              onClose()
            }}
          >
            Delete
          </button>
        )}
        <button className="btn btn-primary" disabled={!amountN || !merchant.trim()} onClick={save}>
          {txn ? 'Save' : 'Add expense'}
        </button>
      </div>
    </Sheet>
  )
}

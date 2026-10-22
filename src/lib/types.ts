export type CategoryId =
  | 'food'
  | 'groceries'
  | 'shopping'
  | 'transport'
  | 'subscriptions'
  | 'bills'
  | 'random'

/** sms = pasted by hand, auto = detected on the phone (SMS receiver / UPI notification). */
export type TxnSource = 'manual' | 'sms' | 'auto' | 'demo'

export interface Txn {
  id: string
  amount: number
  merchant: string
  category: CategoryId
  /** ISO timestamp */
  at: string
  method: string
  source: TxnSource
  /** Native id of the SMS / notification it came from, so it's never logged twice. */
  ref?: string
}

export interface Profile {
  name: string
  monthlyIncome: number
  /** Rent, EMIs etc. — taken out before the daily budget is calculated. */
  fixedCosts: number
  morningTime: string
  nightTime: string
  notifications: boolean
}

export interface AppState {
  profile: Profile | null
  txns: Txn[]
  /** yyyy-mm-dd of the last morning / night notification shown. */
  lastMorning?: string
  lastNight?: string
}

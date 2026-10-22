import { useSyncExternalStore } from 'react'
import type { AppState, Profile, Txn } from './types'

const KEY = 'spendwise:v1'

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as AppState
  } catch {
    /* private mode / corrupt data — start fresh */
  }
  return { profile: null, txns: [] }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function set(next: Partial<AppState>) {
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked — keep working in memory */
  }
  listeners.forEach((l) => l())
}

export function useAppState(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export const actions = {
  saveProfile: (profile: Profile) => set({ profile }),
  addTxns: (txns: Txn[]) => set({ txns: [...state.txns, ...txns] }),
  updateTxn: (id: string, patch: Partial<Txn>) =>
    set({ txns: state.txns.map((t) => (t.id === id ? { ...t, ...patch } : t)) }),
  deleteTxn: (id: string) => set({ txns: state.txns.filter((t) => t.id !== id) }),
  clearDemo: () => set({ txns: state.txns.filter((t) => t.source !== 'demo') }),
  markMorning: (day: string) => set({ lastMorning: day }),
  markNight: (day: string) => set({ lastNight: day }),
  reset: () => set({ profile: null, txns: [], lastMorning: undefined, lastNight: undefined }),
  getState: () => state,
}

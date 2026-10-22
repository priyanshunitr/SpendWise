import { useEffect } from 'react'
import { Capacitor, registerPlugin, type PermissionState, type PluginListenerHandle } from '@capacitor/core'
import { App } from '@capacitor/app'
import { LocalNotifications } from '@capacitor/local-notifications'
import { parseSms } from './sms'
import { actions } from './store'
import { dailyBudget, morningMessage, nightMessage, sum, txnsOnDay } from './budget'
import { dayKey, uid } from './format'
import type { Profile, Txn } from './types'

export const isNative = Capacitor.isNativePlatform()

/** A message the Android side flagged as a likely debit. */
interface PaymentItem {
  id: string
  source: 'sms' | 'notification'
  sender: string
  body: string
  ts: number
}

interface PaymentListenerPlugin {
  drainQueue(): Promise<{ items: PaymentItem[] }>
  readInbox(opts: { days: number }): Promise<{ items: PaymentItem[] }>
  notificationAccessStatus(): Promise<{ enabled: boolean }>
  openNotificationAccessSettings(): Promise<void>
  checkPermissions(): Promise<{ sms: PermissionState }>
  requestPermissions(opts?: { permissions: 'sms'[] }): Promise<{ sms: PermissionState }>
  addListener(event: 'payment', fn: () => void): Promise<PluginListenerHandle>
}

/** Implemented in android/app/src/main/java/com/spendwise/app/payments/. */
export const PaymentListener = registerPlugin<PaymentListenerPlugin>('PaymentListener')

/** Where a transaction came from: bank SMS (live or inbox scan), a UPI app notification, or typed in. */
function channel(t: Txn) {
  if (t.ref?.startsWith('ntf-')) return 'notification'
  return t.ref ? 'sms' : 'manual'
}

/**
 * Same amount, close in time:
 * - different channels within 15 min → the bank SMS and the GPay notification for one payment
 * - same channel within 2 min → the same SMS seen twice (live receiver + inbox scan)
 * Two genuine ₹250 coffees 10 minutes apart both stay.
 */
const CROSS_CHANNEL_MS = 15 * 60 * 1000
const SAME_CHANNEL_MS = 2 * 60 * 1000

function isDuplicate(t: Txn, existing: Txn[]) {
  const at = new Date(t.at).getTime()
  return existing.some((e) => {
    if (t.ref && e.ref === t.ref) return true
    if (e.source === 'demo' || e.amount !== t.amount) return false
    const gap = Math.abs(new Date(e.at).getTime() - at)
    return gap < (channel(e) === channel(t) ? SAME_CHANNEL_MS : CROSS_CHANNEL_MS)
  })
}

/** Runs detected messages through the same parser as "Import SMS". Returns how many were added. */
export function ingest(items: PaymentItem[]): number {
  const known = [...actions.getState().txns]
  const fresh: Txn[] = []
  for (const item of items) {
    const parsed = parseSms(item.body, new Date(item.ts))
    if (!parsed) continue
    // Notifications carry no date, and SMS dates have no time — the message timestamp is better than either.
    const txn: Txn = { ...parsed, at: new Date(item.ts).toISOString(), id: uid(), source: 'auto', ref: item.id }
    if (isDuplicate(txn, known)) continue
    known.push(txn)
    fresh.push(txn)
  }
  if (fresh.length) actions.addTxns(fresh)
  return fresh.length
}

async function drain() {
  try {
    const { items } = await PaymentListener.drainQueue()
    if (items.length) ingest(items)
  } catch {
    /* plugin unavailable */
  }
}

/** Pulls in payments detected while the app was closed, and listens for new ones. */
export function useAutoDetect() {
  useEffect(() => {
    if (!isNative) return
    const subs: Promise<PluginListenerHandle>[] = [
      PaymentListener.addListener('payment', drain),
      App.addListener('resume', drain),
    ]
    drain()
    return () => subs.forEach((s) => s.then((h) => h.remove()))
  }, [])
}

export async function backfillFromInbox(days = 31): Promise<number> {
  const { items } = await PaymentListener.readInbox({ days })
  return ingest(items)
}

// ---------- scheduled morning / night notifications ----------

const MORNING_ID = 1001
const NIGHT_ID = 1002

function nextAt(hhmm: string, from = new Date()) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(from)
  d.setHours(h, m, 0, 0)
  if (d <= from) d.setDate(d.getDate() + 1)
  return d
}

/**
 * Inexact on purpose: a few minutes' drift is fine, and exact alarms would send the user to a
 * scary "Alarms & reminders" settings page during onboarding.
 *
 * Real OS notifications, so they arrive with the app closed. Tonight's report is rebuilt
 * whenever spending changes, so it always quotes the latest total.
 */
export async function scheduleDailyNotifications(profile: Profile, txns: Txn[]) {
  if (!isNative || !profile.notifications) return
  try {
    await LocalNotifications.cancel({ notifications: [{ id: MORNING_ID }, { id: NIGHT_ID }] })
    const now = new Date()
    const morningAt = nextAt(profile.morningTime, now)
    const nightAt = nextAt(profile.nightTime, now)
    const nightIsToday = dayKey(nightAt) === dayKey(now)
    const budget = dailyBudget(profile, nightAt)
    const morning = morningMessage(profile.name, dailyBudget(profile, morningAt))
    const night = nightIsToday
      ? nightMessage(budget, sum(txnsOnDay(txns, now)), dayKey(now))
      : { title: "Tonight's report is ready 🌙", body: 'See how today went against your daily budget.' }
    await LocalNotifications.schedule({
      notifications: [
        { id: MORNING_ID, title: morning.title, body: morning.body, schedule: { at: morningAt, allowWhileIdle: true }, isExactNotification: false },
        { id: NIGHT_ID, title: night.title, body: night.body, schedule: { at: nightAt, allowWhileIdle: true }, isExactNotification: false },
      ],
    })
  } catch {
    /* notifications blocked */
  }
}

export async function requestNativeNotifications(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted'
  } catch {
    return false
  }
}

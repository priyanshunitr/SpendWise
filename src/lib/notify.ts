import { useEffect, useState } from 'react'
import { actions, useAppState } from './store'
import { dailyBudget, morningMessage, nightMessage, sum, txnsOnDay } from './budget'
import { dayKey } from './format'
import type { Profile, Txn } from './types'
import { isNative, requestNativeNotifications } from './native'

export interface Banner {
  kind: 'morning' | 'night'
  title: string
  body: string
  over?: boolean
}

function minutesOf(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function nightReportFor(profile: Profile, txns: Txn[]): Banner {
  const now = new Date()
  const msg = nightMessage(dailyBudget(profile, now), sum(txnsOnDay(txns, now)), dayKey(now))
  return { kind: 'night', ...msg }
}

/** Re-renders once a minute so "today" rolls over at midnight while the app is open. */
export function useMinuteTick() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (isNative) return requestNativeNotifications()
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}

function systemNotify(title: string, body: string) {
  // On Android the OS-scheduled notifications (native.ts) already cover this.
  if (isNative || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: title })
  } catch {
    /* some mobile browsers only allow notifications from a service worker */
  }
}

/**
 * While the app is open, fires the morning briefing and night report once a day
 * at the user's chosen times (or on first open after that time).
 */
export function useDailyNotifications(): [Banner | null, () => void] {
  const state = useAppState()
  const [banner, setBanner] = useState<Banner | null>(null)

  useEffect(() => {
    const check = () => {
      const { profile, txns, lastMorning, lastNight } = actions.getState()
      if (!profile) return
      const now = new Date()
      const today = dayKey(now)
      const mins = now.getHours() * 60 + now.getMinutes()
      const budget = dailyBudget(profile, now)

      if (mins >= minutesOf(profile.nightTime) && lastNight !== today) {
        const msg = nightMessage(budget, sum(txnsOnDay(txns, now)), today)
        actions.markNight(today)
        if (lastMorning !== today) actions.markMorning(today)
        setBanner({ kind: 'night', ...msg })
        if (profile.notifications) systemNotify(msg.title, msg.body)
      } else if (mins >= minutesOf(profile.morningTime) && mins < minutesOf(profile.nightTime) && lastMorning !== today) {
        const msg = morningMessage(profile.name, budget)
        actions.markMorning(today)
        setBanner({ kind: 'morning', ...msg })
        if (profile.notifications) systemNotify(msg.title, msg.body)
      }
    }
    check()
    const id = window.setInterval(check, 30_000)
    return () => window.clearInterval(id)
  }, [state.profile])

  return [banner, () => setBanner(null)]
}

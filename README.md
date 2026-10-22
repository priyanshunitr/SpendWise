# SpendWise

Your salary, split into a daily budget. Every morning it tells you what you can spend; every night it tells you how badly you did. On Android it reads your bank SMS and logs payments automatically.

React + Vite web app, wrapped as an Android app with Capacitor.

## How auto-detection works

```
Pay at the shop
  → bank sends a debit SMS           (or GPay/PhonePe shows "Paid ₹250 to …")
  → SmsReceiver / PaymentNotificationService catch it, even with the app closed
  → PaymentDetector keeps only real debits (skips OTPs, credits, balance alerts)
  → PaymentStore queues it on the phone
  → the web app drains the queue (instantly if open, otherwise on next open)
  → src/lib/sms.ts parses merchant + amount → today's budget drops
```

| Where | What |
| --- | --- |
| `android/app/src/main/java/com/spendwise/app/payments/` | Native side: SMS receiver, UPI notification listener, queue, JS bridge plugin |
| `src/lib/native.ts` | JS side: drains the queue, de-duplicates, schedules morning/night notifications |
| `src/components/AutoDetectSetup.tsx` | Permission setup card (Today screen + Settings) |
| `src/lib/sms.ts` | Bank / UPI message parser (shared with the manual "Import SMS" sheet) |

The same payment reported by both the bank SMS and a UPI app notification is logged once (same amount within 15 min across channels).

## Run it

```bash
npm install
npm run dev            # web version in the browser
npm run android:run    # build and launch on a connected phone / emulator
npm run android:open   # open in Android Studio
```

Capacitor 8 needs **JDK 21**. Android Studio's bundled JDK works: in Android Studio it's used automatically; from a terminal set
`JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`.

After changing web code, run `npm run android:sync` before building in Android Studio.

## Testing SMS on the emulator

```bash
adb emu sms send 5676766 "Rs.250.00 debited from A/c XX4821 on 22-10-26 to VPA bluetokai.coffee@ybl. UPI Ref 629118273611"
```

## Known limits

- **Play Store:** SMS permissions are restricted. Budgeting apps qualify under the "SMS-based money management" exception but need a Permissions Declaration Form. Sideloaded APKs have no restriction.
- **Force-stopped apps** (Settings → Force stop) don't receive SMS until opened again — an Android rule. Swiping it away from recents is fine.
- **Night notification** quotes the total known when it was scheduled. Payments detected while the app stays closed all evening are counted once you open it.
- iPhone can't read SMS; this is Android-only.

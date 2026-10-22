package com.spendwise.app.payments;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;
import java.util.LinkedHashMap;
import java.util.Map;

/** Registered in the manifest, so it fires even when SpendWise is closed. */
public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) return;
        SmsMessage[] parts = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (parts == null || parts.length == 0) return;

        // Long bank SMS arrive as several parts — stitch them back together per sender.
        Map<String, StringBuilder> bodies = new LinkedHashMap<>();
        long ts = System.currentTimeMillis();
        for (SmsMessage part : parts) {
            if (part == null) continue;
            String sender = part.getDisplayOriginatingAddress();
            if (sender == null) sender = "";
            StringBuilder sb = bodies.get(sender);
            if (sb == null) bodies.put(sender, sb = new StringBuilder());
            sb.append(part.getMessageBody());
            ts = part.getTimestampMillis();
        }

        for (Map.Entry<String, StringBuilder> e : bodies.entrySet()) {
            String body = e.getValue().toString();
            if (!PaymentDetector.isLikelyDebit(body)) continue;
            String id = "sms-" + Integer.toHexString((e.getKey() + body).hashCode()) + "-" + ts;
            if (PaymentStore.add(ctx, id, "sms", e.getKey(), body, ts)) {
                PaymentListenerPlugin.signal();
                PaymentAlert.show(ctx, body, id);
            }
        }
    }
}

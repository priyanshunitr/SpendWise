package com.spendwise.app.payments;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Backup for banks that don't send SMS: reads "Paid ₹250 to Zepto"-style notifications from
 * UPI apps. Only runs after the user grants Notification access in system settings.
 */
public class PaymentNotificationService extends NotificationListenerService {
    private static final Set<String> PAYMENT_APPS = new HashSet<>(
        Arrays.asList(
            "com.google.android.apps.nbu.paisa.user", // Google Pay
            "com.phonepe.app",
            "net.one97.paytm",
            "in.org.npci.upiapp", // BHIM
            "com.dreamplug.androidapp", // CRED
            "in.amazon.mShop.android.shopping", // Amazon Pay
            "com.mobikwik_new",
            "money.super.payments", // super.money
            "com.naviapp",
            "com.whatsapp" // WhatsApp Pay
        )
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !PAYMENT_APPS.contains(sbn.getPackageName())) return;
        Notification n = sbn.getNotification();
        if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;

        Bundle x = n.extras;
        String title = str(x.getCharSequence(Notification.EXTRA_TITLE));
        String big = str(x.getCharSequence(Notification.EXTRA_BIG_TEXT));
        String text = big.isEmpty() ? str(x.getCharSequence(Notification.EXTRA_TEXT)) : big;
        String body = (title + ". " + text).trim();
        if (!PaymentDetector.isLikelyDebit(body)) return;

        // Apps re-post the same notification on updates; key on content, not post time.
        String id = "ntf-" + sbn.getPackageName() + "-" + Integer.toHexString(body.hashCode());
        if (PaymentStore.add(this, id, "notification", sbn.getPackageName(), body, sbn.getPostTime())) {
            PaymentListenerPlugin.signal();
        }
    }

    private static String str(CharSequence cs) {
        return cs == null ? "" : cs.toString();
    }
}

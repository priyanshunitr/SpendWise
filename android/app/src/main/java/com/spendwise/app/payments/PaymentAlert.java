package com.spendwise.app.payments;

import android.Manifest;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.spendwise.app.MainActivity;
import com.spendwise.app.R;

/** Heads-up "payment detected" notification shown while SpendWise isn't on screen. */
final class PaymentAlert {
    private static final String CHANNEL = "payments";

    private PaymentAlert() {}

    static void show(Context ctx, String text, String id) {
        if (PaymentListenerPlugin.isInForeground()) return;
        if (
            Build.VERSION.SDK_INT >= 33 &&
            ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) return;

        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "Detected payments", NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Shown when SpendWise logs a payment from an SMS or UPI app");
            nm.createNotificationChannel(ch);
        }

        Intent open = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        String amount = PaymentDetector.amountLabel(text);

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_spendwise)
            .setColor(0xFFB6FF3B)
            .setContentTitle(amount != null ? "−" + amount + " spent" : "Payment detected")
            .setContentText("Logged to today's budget. Tap to see what's left.")
            .setContentIntent(pi)
            .setAutoCancel(true);
        try {
            NotificationManagerCompat.from(ctx).notify(id.hashCode(), b.build());
        } catch (SecurityException ignored) {}
    }
}

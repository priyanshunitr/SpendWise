package com.spendwise.app.payments;

import android.Manifest;
import android.content.ComponentName;
import android.content.Intent;
import android.database.Cursor;
import android.provider.Settings;
import android.provider.Telephony;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.lang.ref.WeakReference;
import org.json.JSONArray;

/** JS bridge: `registerPlugin('PaymentListener')` in src/lib/native.ts. */
@CapacitorPlugin(
    name = "PaymentListener",
    permissions = { @Permission(alias = "sms", strings = { Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS }) }
)
public class PaymentListenerPlugin extends Plugin {
    private static WeakReference<PaymentListenerPlugin> instance = new WeakReference<>(null);
    private static volatile boolean foreground = false;

    @Override
    public void load() {
        instance = new WeakReference<>(this);
    }

    @Override
    protected void handleOnResume() {
        foreground = true;
    }

    @Override
    protected void handleOnPause() {
        foreground = false;
    }

    static boolean isInForeground() {
        return foreground;
    }

    /** Tells a running web app there is something new to drain. */
    static void signal() {
        PaymentListenerPlugin p = instance.get();
        if (p != null) p.notifyListeners("payment", new JSObject());
    }

    @PluginMethod
    public void drainQueue(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("items", toJSArray(PaymentStore.drain(getContext())));
        call.resolve(ret);
    }

    /** Past debit SMS from the inbox, for back-filling the month. */
    @PluginMethod
    public void readInbox(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            call.reject("SMS permission not granted");
            return;
        }
        int days = call.getInt("days", 30);
        long since = System.currentTimeMillis() - days * 86_400_000L;
        JSArray items = new JSArray();
        String[] cols = { Telephony.Sms._ID, Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE };
        try (
            Cursor c = getContext()
                .getContentResolver()
                .query(Telephony.Sms.Inbox.CONTENT_URI, cols, Telephony.Sms.DATE + " >= ?", new String[] { String.valueOf(since) }, Telephony.Sms.DATE + " ASC")
        ) {
            if (c != null) {
                while (c.moveToNext()) {
                    String body = c.getString(2);
                    if (!PaymentDetector.isLikelyDebit(body)) continue;
                    JSObject o = new JSObject();
                    o.put("id", "inbox-" + c.getLong(0));
                    o.put("source", "sms");
                    o.put("sender", c.getString(1));
                    o.put("body", body);
                    o.put("ts", c.getLong(3));
                    items.put(o);
                }
            }
        } catch (Exception e) {
            call.reject("Could not read SMS inbox", e);
            return;
        }
        JSObject ret = new JSObject();
        ret.put("items", items);
        call.resolve(ret);
    }

    @PluginMethod
    public void notificationAccessStatus(PluginCall call) {
        String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        String me = new ComponentName(getContext(), PaymentNotificationService.class).flattenToString();
        JSObject ret = new JSObject();
        ret.put("enabled", flat != null && flat.contains(me));
        call.resolve(ret);
    }

    @PluginMethod
    public void openNotificationAccessSettings(PluginCall call) {
        Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    private static JSArray toJSArray(JSONArray arr) {
        JSArray out = new JSArray();
        for (int i = 0; i < arr.length(); i++) out.put(arr.opt(i));
        return out;
    }
}

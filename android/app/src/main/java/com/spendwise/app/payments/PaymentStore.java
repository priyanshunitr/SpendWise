package com.spendwise.app.payments;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Detected payments wait here until the web app drains them. Survives the app being killed,
 * so an SMS that arrives while SpendWise is closed is logged the next time it opens.
 */
public final class PaymentStore {
    private static final String PREFS = "spendwise_payments";
    private static final String QUEUE = "queue";
    private static final String SEEN = "seen";
    private static final int MAX_SEEN = 300;

    private PaymentStore() {}

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Queues a payment. Returns false if this id was already seen (e.g. a notification re-posted). */
    public static synchronized boolean add(Context ctx, String id, String source, String sender, String body, long ts) {
        SharedPreferences p = prefs(ctx);
        try {
            JSONArray seen = new JSONArray(p.getString(SEEN, "[]"));
            for (int i = 0; i < seen.length(); i++) if (id.equals(seen.optString(i))) return false;
            seen.put(id);
            while (seen.length() > MAX_SEEN) seen.remove(0);

            JSONArray queue = new JSONArray(p.getString(QUEUE, "[]"));
            JSONObject item = new JSONObject();
            item.put("id", id);
            item.put("source", source);
            item.put("sender", sender);
            item.put("body", body);
            item.put("ts", ts);
            queue.put(item);

            p.edit().putString(QUEUE, queue.toString()).putString(SEEN, seen.toString()).apply();
            return true;
        } catch (JSONException e) {
            return false;
        }
    }

    public static synchronized JSONArray drain(Context ctx) {
        SharedPreferences p = prefs(ctx);
        JSONArray queue;
        try {
            queue = new JSONArray(p.getString(QUEUE, "[]"));
        } catch (JSONException e) {
            queue = new JSONArray();
        }
        p.edit().putString(QUEUE, "[]").apply();
        return queue;
    }
}

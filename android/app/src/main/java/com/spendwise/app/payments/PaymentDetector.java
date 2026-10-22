package com.spendwise.app.payments;

import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Cheap native pre-filter so we only queue messages that look like money leaving the account.
 * The real parsing (merchant, category, date) happens in JS — see src/lib/sms.ts.
 */
public final class PaymentDetector {
    private static final Pattern AMOUNT = Pattern.compile("(?:rs\\.?|inr|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE);
    private static final Pattern DEBIT = Pattern.compile(
        "\\b(debited|spent|sent|paid|purchase|withdrawn|debit|dr\\.?|txn of)\\b",
        Pattern.CASE_INSENSITIVE
    );
    private static final Pattern CREDIT_ONLY = Pattern.compile("\\b(credited|received|refund|cashback)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern NOISE = Pattern.compile(
        "\\b(otp|one time password|minimum due|statement|requested|request of|will be debited|due on|auto-?pay set)\\b",
        Pattern.CASE_INSENSITIVE
    );

    private PaymentDetector() {}

    public static boolean isLikelyDebit(String text) {
        if (text == null || text.isEmpty()) return false;
        if (NOISE.matcher(text).find()) return false;
        if (!AMOUNT.matcher(text).find()) return false;
        if (!DEBIT.matcher(text).find()) return false;
        return !(CREDIT_ONLY.matcher(text).find() && !text.toLowerCase(Locale.ROOT).contains("debited"));
    }

    /** "₹250" for the heads-up notification, or null. */
    public static String amountLabel(String text) {
        Matcher m = AMOUNT.matcher(text);
        return m.find() ? "₹" + m.group(1).replaceAll("\\.00$", "") : null;
    }
}

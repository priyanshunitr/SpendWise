package com.spendwise.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.spendwise.app.payments.PaymentListenerPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PaymentListenerPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

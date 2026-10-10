package com.heatbudget.alert;

public record NotificationResult(String provider, String messageId, boolean delivered) {
}

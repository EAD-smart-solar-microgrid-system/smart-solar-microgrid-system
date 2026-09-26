package com.example.smartsolarmicrogridtradingsystem.feature.prosumeraccount.ui

import android.util.Patterns

fun validateRequired(value: String, label: String): String? {
    return if (value.trim().isBlank()) "$label is required." else null
}

fun validateEmail(value: String): String? {
    return if (!Patterns.EMAIL_ADDRESS.matcher(value.trim()).matches()) {
        "Enter a valid email address."
    } else null
}

fun displayAccountStatus(status: String): String = when (status) {
    "PendingActivation" -> "Pending Activation"
    "DeactivationRequested" -> "Deactivation Requested"
    "Deactivated" -> "Deactivated"
    "Active" -> "Active"
    else -> status.ifBlank { "Unknown" }
}

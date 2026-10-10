package com.heatbudget.alert;

import jakarta.validation.constraints.NotBlank;

public record RestNudge(@NotBlank String targetPhoneNumber, @NotBlank String language, @NotBlank String message) {
}

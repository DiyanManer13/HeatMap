package com.heatbudget.rider;

import jakarta.validation.constraints.NotBlank;

public record StartShiftRequest(@NotBlank String anonymousReference, boolean consentAccepted) {
}

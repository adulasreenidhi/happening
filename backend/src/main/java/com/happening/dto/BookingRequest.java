package com.happening.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BookingRequest(
        @NotNull @Positive Long eventId,
        @NotNull @Positive Integer quantity) {
}

package com.happening.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import com.happening.entity.EventStatus;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record EventRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotNull @Positive Long categoryId,
        @NotNull @Positive Long cityId,
        @NotNull @Positive Long organizerId,
        @NotBlank String venue,
        @NotNull LocalDate date,
        @NotNull LocalTime time,
        @NotNull @PositiveOrZero BigDecimal price,
        @NotNull @Min(1) Integer capacity,
        @PositiveOrZero Integer availableSeats,
        String imageUrl,
        EventStatus status) {
}

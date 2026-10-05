package com.happening.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AssistantFilters(
        String city,
        String category,
        LocalDate fromDate,
        LocalDate toDate,
        BigDecimal maximumPrice,
        Boolean availableOnly) {
}

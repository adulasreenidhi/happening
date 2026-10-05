package com.happening.ai;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.happening.dto.AssistantFilters;

public record AssistantQueryConstraints(
        Long cityId,
        String city,
        Long categoryId,
        String category,
        LocalDate fromDate,
        LocalDate toDate,
        BigDecimal maximumPrice,
        Boolean availableOnly) {
    public AssistantFilters toResponse() {
        return new AssistantFilters(
                city,
                category,
                fromDate,
                toDate,
                maximumPrice,
                availableOnly);
    }
}

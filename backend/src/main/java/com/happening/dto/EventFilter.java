package com.happening.dto;

import java.time.LocalDate;

public record EventFilter(
        String search,
        Long cityId,
        Long categoryId,
        LocalDate date,
        LocalDate fromDate,
        LocalDate toDate,
        Boolean free,
        Boolean available) {
}

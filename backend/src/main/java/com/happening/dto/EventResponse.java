package com.happening.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import com.happening.entity.Event;
import com.happening.entity.EventStatus;

public record EventResponse(
        Long id,
        String title,
        String description,
        Long categoryId,
        Long cityId,
        Long organizerId,
        String venue,
        LocalDate date,
        LocalTime time,
        BigDecimal price,
        Integer capacity,
        Integer availableSeats,
        String imageUrl,
        EventStatus status,
        LocalDateTime createdAt) {

    public static EventResponse from(Event event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getCategory().getId(),
                event.getCity().getId(),
                event.getOrganizer().getId(),
                event.getVenue(),
                event.getDate(),
                event.getTime(),
                event.getPrice(),
                event.getCapacity(),
                event.getAvailableSeats(),
                event.getImageUrl(),
                event.getStatus(),
                event.getCreatedAt());
    }
}

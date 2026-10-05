package com.happening.dto;

import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import com.happening.entity.Favorite;

public record FavoriteResponse(
        Long id,
        Long eventId,
        String eventTitle,
        String cityName,
        String categoryName,
        LocalDate date,
        LocalTime time,
        String venue,
        BigDecimal price,
        Integer availableSeats,
        String imageUrl,
        LocalDateTime createdAt) {

    public static FavoriteResponse from(Favorite favorite) {
        return new FavoriteResponse(
                favorite.getId(),
                favorite.getEvent().getId(),
                favorite.getEvent().getTitle(),
                favorite.getEvent().getCity().getName(),
                favorite.getEvent().getCategory().getName(),
                favorite.getEvent().getDate(),
                favorite.getEvent().getTime(),
                favorite.getEvent().getVenue(),
                favorite.getEvent().getPrice(),
                favorite.getEvent().getAvailableSeats(),
                favorite.getEvent().getImageUrl(),
                favorite.getCreatedAt());
    }
}

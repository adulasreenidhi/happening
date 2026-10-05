package com.happening.dto;

import java.time.LocalDateTime;
import com.happening.entity.Review;

public record ReviewResponse(
        Long id,
        Long eventId,
        String userName,
        Integer rating,
        String comment,
        LocalDateTime createdAt) {

    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getEvent().getId(),
                review.getUser().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt());
    }
}

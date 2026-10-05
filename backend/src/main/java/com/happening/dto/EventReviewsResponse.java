package com.happening.dto;

import java.util.List;

public record EventReviewsResponse(
        Double averageRating,
        long ratingCount,
        List<ReviewResponse> reviews) {
}

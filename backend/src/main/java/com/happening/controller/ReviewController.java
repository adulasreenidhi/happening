package com.happening.controller;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.EventReviewsResponse;
import com.happening.dto.ReviewRequest;
import com.happening.dto.ReviewResponse;
import com.happening.service.ReviewService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/events/{eventId}/reviews")
public class ReviewController {
    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping
    public EventReviewsResponse getReviews(@PathVariable Long eventId) {
        return reviewService.getEventReviews(eventId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('USER')")
    public ReviewResponse create(
            @PathVariable Long eventId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return reviewService.create(eventId, request, user.getUsername());
    }
}

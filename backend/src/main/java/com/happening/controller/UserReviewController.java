package com.happening.controller;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.ReviewResponse;
import com.happening.service.ReviewService;

@RestController
@RequestMapping("/api/reviews")
@PreAuthorize("hasRole('USER')")
public class UserReviewController {
    private final ReviewService reviewService;

    public UserReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @GetMapping("/me")
    public List<ReviewResponse> myReviews(@AuthenticationPrincipal UserDetails user) {
        return reviewService.getMyReviews(user.getUsername());
    }
}

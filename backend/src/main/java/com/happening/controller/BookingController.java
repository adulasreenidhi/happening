package com.happening.controller;

import java.util.List;
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
import com.happening.dto.BookingRequest;
import com.happening.dto.BookingResponse;
import com.happening.service.BookingService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/bookings")
@PreAuthorize("hasRole('USER')")
public class BookingController {
    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookingResponse book(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return bookingService.book(request, user.getUsername());
    }

    @GetMapping("/me")
    public List<BookingResponse> myBookings(@AuthenticationPrincipal UserDetails user) {
        return bookingService.myBookings(user.getUsername());
    }

    @PostMapping("/{id}/cancel")
    public BookingResponse cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails user) {
        return bookingService.cancel(id, user.getUsername());
    }
}

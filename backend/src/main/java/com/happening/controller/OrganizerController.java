package com.happening.controller;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.BookingResponse;
import com.happening.dto.EventResponse;
import com.happening.dto.OrganizerDashboardResponse;
import com.happening.service.BookingService;
import com.happening.service.EventService;
import com.happening.service.OrganizerService;

@RestController
@RequestMapping("/api/organizer")
@PreAuthorize("hasAnyRole('ORGANIZER', 'ADMIN')")
public class OrganizerController {
    private final OrganizerService organizerService;
    private final EventService eventService;
    private final BookingService bookingService;

    public OrganizerController(
            OrganizerService organizerService,
            EventService eventService,
            BookingService bookingService) {
        this.organizerService = organizerService;
        this.eventService = eventService;
        this.bookingService = bookingService;
    }

    @GetMapping("/dashboard")
    public OrganizerDashboardResponse dashboard(@AuthenticationPrincipal UserDetails user) {
        return organizerService.dashboard(user.getUsername());
    }

    @GetMapping("/events")
    public List<EventResponse> events(@AuthenticationPrincipal UserDetails user) {
        return eventService.getOrganizerEvents(user.getUsername());
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings(@AuthenticationPrincipal UserDetails user) {
        return bookingService.organizerBookings(user.getUsername());
    }
}

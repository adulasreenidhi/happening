package com.happening.dto;

public record OrganizerDashboardResponse(
        long totalEvents,
        long upcomingEvents,
        long registrations,
        long availableSeats) {
}

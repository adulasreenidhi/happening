package com.happening.dto;

public record AdminDashboardResponse(
        long users,
        long organizers,
        long events,
        long pendingEvents,
        long bookings) {
}

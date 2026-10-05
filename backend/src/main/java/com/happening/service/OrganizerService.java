package com.happening.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.happening.dto.OrganizerDashboardResponse;
import com.happening.entity.BookingStatus;
import com.happening.repository.BookingRepository;
import com.happening.repository.EventRepository;

@Service
public class OrganizerService {
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;

    public OrganizerService(EventRepository eventRepository, BookingRepository bookingRepository) {
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public OrganizerDashboardResponse dashboard(String email) {
        var events = eventRepository.findByOrganizerEmailIgnoreCaseOrderByCreatedAtDesc(email);
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        long upcomingEvents = events.stream()
                .filter(event -> java.time.LocalDateTime.of(event.getDate(), event.getTime()).isAfter(now))
                .count();
        long availableSeats = events.stream().mapToLong(event -> event.getAvailableSeats()).sum();
        return new OrganizerDashboardResponse(
                events.size(),
                upcomingEvents,
                bookingRepository.countByEventOrganizerEmailIgnoreCaseAndBookingStatus(
                        email, BookingStatus.CONFIRMED),
                availableSeats);
    }
}

package com.happening.service;

import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.happening.dto.BookingRequest;
import com.happening.dto.BookingResponse;
import com.happening.entity.Booking;
import com.happening.entity.BookingStatus;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.User;
import com.happening.exception.ForbiddenOperationException;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.BookingRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.UserRepository;

@Service
public class BookingService {
    private static final Logger LOGGER = LoggerFactory.getLogger(BookingService.class);
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public BookingService(
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public BookingResponse book(BookingRequest request, String email) {
        Event event = eventRepository.findByIdForUpdate(request.eventId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", request.eventId()));
        if (event.getStatus() != EventStatus.APPROVED) {
            throw new IllegalArgumentException("Only approved events can be booked");
        }
        LocalDateTime startsAt = LocalDateTime.of(event.getDate(), event.getTime());
        if (!startsAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("This event has already started");
        }
        if (request.quantity() > event.getAvailableSeats()) {
            throw new IllegalArgumentException("Requested tickets exceed available seats");
        }
        User user = findUser(email);
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEvent(event);
        booking.setQuantity(request.quantity());
        booking.setTotalAmount(event.getPrice().multiply(java.math.BigDecimal.valueOf(request.quantity()))
                .setScale(2, RoundingMode.HALF_UP));
        booking.setBookingStatus(BookingStatus.CONFIRMED);
        event.setAvailableSeats(event.getAvailableSeats() - request.quantity());
        eventRepository.save(event);
        BookingResponse response = BookingResponse.from(bookingRepository.save(booking));
        LOGGER.info("Booking created bookingId={} eventId={} userId={} quantity={}",
                response.id(), event.getId(), user.getId(), request.quantity());
        return response;
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> myBookings(String email) {
        return bookingRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream().map(BookingResponse::from).toList();
    }

    @Transactional
    public BookingResponse cancel(Long bookingId, String email) {
        Booking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking", bookingId));
        if (!booking.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new ForbiddenOperationException();
        }
        if (booking.getBookingStatus() != BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException("Only confirmed bookings can be cancelled");
        }
        Event event = eventRepository.findByIdForUpdate(booking.getEvent().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Event", booking.getEvent().getId()));
        LocalDateTime startsAt = LocalDateTime.of(event.getDate(), event.getTime());
        if (!startsAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Bookings can only be cancelled before the event starts");
        }
        event.setAvailableSeats(event.getAvailableSeats() + booking.getQuantity());
        booking.setBookingStatus(BookingStatus.CANCELLED);
        LOGGER.info("Booking cancelled bookingId={} eventId={} userId={}",
                booking.getId(), event.getId(), booking.getUser().getId());
        return BookingResponse.from(booking);
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> organizerBookings(String email) {
        return bookingRepository.findByEventOrganizerEmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream().map(BookingResponse::from).toList();
    }

    private User findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user account no longer exists"));
    }
}

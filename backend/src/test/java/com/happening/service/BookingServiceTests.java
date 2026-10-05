package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.happening.dto.BookingRequest;
import com.happening.dto.BookingResponse;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.User;
import com.happening.repository.BookingRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class BookingServiceTests {
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;

    private BookingService service;
    private Event event;
    private User user;

    @BeforeEach
    void setUp() {
        service = new BookingService(bookingRepository, eventRepository, userRepository);
        event = new Event();
        event.setId(19L);
        event.setStatus(EventStatus.APPROVED);
        event.setDate(LocalDate.now().plusDays(10));
        event.setTime(LocalTime.NOON);
        event.setPrice(new BigDecimal("12.50"));
        event.setAvailableSeats(4);
        user = new User();
        user.setId(7L);
        user.setName("Attendee");
        user.setEmail("user@example.com");
    }

    @Test
    void calculatesTheAuthoritativeTotalAndDecrementsSeats() {
        when(eventRepository.findByIdForUpdate(19L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        BookingResponse result = service.book(new BookingRequest(19L, 3), "user@example.com");

        assertEquals(new BigDecimal("37.50"), result.totalAmount());
        assertEquals(1, event.getAvailableSeats());
        assertEquals(3, result.quantity());
        verify(eventRepository).save(event);
    }

    @Test
    void rejectsQuantityAboveTheLockedAvailableSeatCount() {
        when(eventRepository.findByIdForUpdate(19L)).thenReturn(Optional.of(event));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.book(new BookingRequest(19L, 5), "user@example.com"));

        assertEquals(4, event.getAvailableSeats());
        verify(bookingRepository, never()).save(any());
        verify(userRepository, never()).findByEmailIgnoreCase(any());
    }

    @Test
    void rejectsBookingAnUnapprovedEvent() {
        event.setStatus(EventStatus.PENDING);
        when(eventRepository.findByIdForUpdate(19L)).thenReturn(Optional.of(event));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.book(new BookingRequest(19L, 1), "user@example.com"));

        verify(bookingRepository, never()).save(any());
    }
}

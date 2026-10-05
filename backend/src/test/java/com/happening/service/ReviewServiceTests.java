package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.happening.dto.ReviewRequest;
import com.happening.dto.ReviewResponse;
import com.happening.entity.BookingStatus;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.Review;
import com.happening.entity.User;
import com.happening.exception.DuplicateReviewException;
import com.happening.repository.BookingRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.ReviewRepository;
import com.happening.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class ReviewServiceTests {
    @Mock
    private ReviewRepository reviewRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    private ReviewService service;
    private Event event;
    private User user;

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviewRepository, bookingRepository, eventRepository, userRepository);
        event = new Event();
        event.setId(8L);
        event.setTitle("Past event");
        event.setStatus(EventStatus.APPROVED);
        event.setDate(LocalDate.now().minusDays(1));
        event.setTime(LocalTime.NOON);
        user = new User();
        user.setId(3L);
        user.setName("Attendee");
        user.setEmail("user@example.com");
    }

    @Test
    void onlyAConfirmedAttendeeCanCreateOneReviewAfterAnEvent() {
        when(eventRepository.findById(8L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.existsByUserIdAndEventIdAndBookingStatus(
                3L, 8L, BookingStatus.CONFIRMED)).thenReturn(true);
        when(reviewRepository.findByUserIdAndEventId(3L, 8L)).thenReturn(Optional.empty());
        when(reviewRepository.saveAndFlush(any(Review.class))).thenAnswer(invocation -> {
            Review review = invocation.getArgument(0);
            review.setId(11L);
            return review;
        });

        ReviewResponse response = service.create(8L, new ReviewRequest(5, "Great event"), "user@example.com");

        assertEquals(5, response.rating());
        assertEquals("Attendee", response.userName());
    }

    @Test
    void rejectsDuplicateReviews() {
        when(eventRepository.findById(8L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.existsByUserIdAndEventIdAndBookingStatus(
                3L, 8L, BookingStatus.CONFIRMED)).thenReturn(true);
        when(reviewRepository.findByUserIdAndEventId(3L, 8L))
                .thenReturn(Optional.of(new Review()));

        assertThrows(
                DuplicateReviewException.class,
                () -> service.create(8L, new ReviewRequest(5, null), "user@example.com"));
        verify(reviewRepository, never()).saveAndFlush(any(Review.class));
    }

    @Test
    void rejectsReviewsWithoutAConfirmedBooking() {
        when(eventRepository.findById(8L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(bookingRepository.existsByUserIdAndEventIdAndBookingStatus(
                3L, 8L, BookingStatus.CONFIRMED)).thenReturn(false);

        assertThrows(
                IllegalArgumentException.class,
                () -> service.create(8L, new ReviewRequest(4, null), "user@example.com"));
        verify(reviewRepository, never()).saveAndFlush(any(Review.class));
    }
}

package com.happening.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.happening.dto.EventReviewsResponse;
import com.happening.dto.ReviewRequest;
import com.happening.dto.ReviewResponse;
import com.happening.entity.BookingStatus;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.Review;
import com.happening.entity.User;
import com.happening.exception.DuplicateReviewException;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.BookingRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.ReviewRepository;
import com.happening.repository.UserRepository;

@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public ReviewService(
            ReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public EventReviewsResponse getEventReviews(Long eventId) {
        Event event = findPublicEvent(eventId);
        List<ReviewResponse> reviews = reviewRepository.findByEventIdOrderByCreatedAtDesc(event.getId())
                .stream().map(ReviewResponse::from).toList();
        Double average = reviewRepository.averageRating(eventId);
        return new EventReviewsResponse(average == null ? 0.0 : average, reviews.size(), reviews);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(String email) {
        return reviewRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream().map(ReviewResponse::from).toList();
    }

    @Transactional
    public ReviewResponse create(Long eventId, ReviewRequest request, String email) {
        Event event = findPublicEvent(eventId);
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user account no longer exists"));
        if (!LocalDateTime.of(event.getDate(), event.getTime()).isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reviews are available after the event has ended");
        }
        if (!bookingRepository.existsByUserIdAndEventIdAndBookingStatus(
                user.getId(), eventId, BookingStatus.CONFIRMED)) {
            throw new IllegalArgumentException("A confirmed booking is required to review this event");
        }
        if (reviewRepository.findByUserIdAndEventId(user.getId(), eventId).isPresent()) {
            throw new DuplicateReviewException();
        }
        Review review = new Review();
        review.setEvent(event);
        review.setUser(user);
        review.setRating(request.rating());
        review.setComment(request.comment() == null ? null : request.comment().trim());
        try {
            return ReviewResponse.from(reviewRepository.saveAndFlush(review));
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateReviewException();
        }
    }

    private Event findPublicEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
        if (event.getStatus() != EventStatus.APPROVED) {
            throw new ResourceNotFoundException("Event", id);
        }
        return event;
    }
}

package com.happening.service;

import java.util.List;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.happening.ai.EventChangedEvent;
import com.happening.dto.EventRequest;
import com.happening.dto.EventResponse;
import com.happening.dto.EventFilter;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.User;
import com.happening.exception.ForbiddenOperationException;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.CategoryRepository;
import com.happening.repository.CityRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.UserRepository;

@Service
@Transactional
public class EventService {
    private static final Logger LOGGER = LoggerFactory.getLogger(EventService.class);

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Autowired
    public EventService(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            CityRepository cityRepository,
            UserRepository userRepository,
            ApplicationEventPublisher eventPublisher) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
    }

    public EventService(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            CityRepository cityRepository,
            UserRepository userRepository) {
        this(eventRepository, categoryRepository, cityRepository, userRepository, event -> {});
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        Event event = findEvent(id);
        if (event.getStatus() != EventStatus.APPROVED) {
            throw new ResourceNotFoundException("Event", id);
        }
        return EventResponse.from(event);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> searchPublicEvents(EventFilter filter, Pageable pageable) {
        validateDateRange(filter.fromDate(), filter.toDate());
        Specification<Event> specification = (root, query, builder) ->
                builder.equal(root.get("status"), EventStatus.APPROVED);
        if (filter.search() != null && !filter.search().isBlank()) {
            String search = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
            specification = specification.and((root, query, builder) -> builder.or(
                    builder.like(builder.lower(root.get("title")), search),
                    builder.like(builder.lower(root.get("description")), search)));
        }
        if (filter.cityId() != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("city").get("id"), filter.cityId()));
        }
        if (filter.categoryId() != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("category").get("id"), filter.categoryId()));
        }
        if (filter.date() != null) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("date"), filter.date()));
        }
        if (filter.fromDate() != null) {
            specification = specification.and((root, query, builder) ->
                    builder.greaterThanOrEqualTo(root.get("date"), filter.fromDate()));
        }
        if (filter.toDate() != null) {
            specification = specification.and((root, query, builder) ->
                    builder.lessThanOrEqualTo(root.get("date"), filter.toDate()));
        }
        if (Boolean.TRUE.equals(filter.free())) {
            specification = specification.and((root, query, builder) ->
                    builder.equal(root.get("price"), java.math.BigDecimal.ZERO));
        } else if (Boolean.FALSE.equals(filter.free())) {
            specification = specification.and((root, query, builder) ->
                    builder.greaterThan(root.get("price"), java.math.BigDecimal.ZERO));
        }
        if (Boolean.TRUE.equals(filter.available())) {
            specification = specification.and((root, query, builder) ->
                    builder.greaterThan(root.get("availableSeats"), 0));
        } else if (Boolean.FALSE.equals(filter.available())) {
            specification = specification.and((root, query, builder) ->
                    builder.lessThanOrEqualTo(root.get("availableSeats"), 0));
        }
        return eventRepository.findAll(specification, pageable).map(EventResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> getAdminEvents(EventStatus status, Pageable pageable) {
        Specification<Event> specification = status == null
                ? Specification.unrestricted()
                : (root, query, builder) -> builder.equal(root.get("status"), status);
        return eventRepository.findAll(specification, pageable).map(EventResponse::from);
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getOrganizerEvents(String email) {
        return eventRepository.findByOrganizerEmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream().map(EventResponse::from).toList();
    }

    public EventResponse moderateEvent(Long id, EventStatus status) {
        if (status != EventStatus.APPROVED && status != EventStatus.REJECTED) {
            throw new IllegalArgumentException("Events can only be approved or rejected here");
        }
        Event event = findEvent(id);
        event.setStatus(status);
        Event saved = eventRepository.save(event);
        eventPublisher.publishEvent(new EventChangedEvent(saved.getId()));
        LOGGER.info("Event moderated eventId={} status={}", saved.getId(), status);
        return EventResponse.from(saved);
    }

    public EventResponse createEvent(EventRequest request, String username, boolean admin) {
        Event event = new Event();
        applyRequest(event, request);
        User organizer = admin ? findOrganizer(request.organizerId()) : findUser(username);
        event.setOrganizer(organizer);
        if (admin && request.status() != null) {
            event.setStatus(request.status());
        }
        if (event.getStatus() == null) {
            event.setStatus(EventStatus.PENDING);
        }
        if (event.getAvailableSeats() == null) {
            event.setAvailableSeats(event.getCapacity());
        }
        validateAvailableSeats(event);
        Event saved = eventRepository.save(event);
        eventPublisher.publishEvent(new EventChangedEvent(saved.getId()));
        LOGGER.info("Event created eventId={} organizerId={} status={}",
                saved.getId(), saved.getOrganizer().getId(), saved.getStatus());
        return EventResponse.from(saved);
    }

    public EventResponse updateEvent(Long id, EventRequest request, String username, boolean admin) {
        Event event = findEvent(id);
        if (!admin && !event.getOrganizer().getEmail().equalsIgnoreCase(username)) {
            throw new ForbiddenOperationException();
        }
        applyRequest(event, request);
        if (admin && request.organizerId() != null) {
            event.setOrganizer(findOrganizer(request.organizerId()));
            if (request.status() != null) {
                event.setStatus(request.status());
            }
        }
        validateAvailableSeats(event);
        Event saved = eventRepository.save(event);
        eventPublisher.publishEvent(new EventChangedEvent(saved.getId()));
        LOGGER.info("Event updated eventId={} status={}", saved.getId(), saved.getStatus());
        return EventResponse.from(saved);
    }

    public void deleteEvent(Long id, String username, boolean admin) {
        Event event = findEvent(id);
        if (!admin && !event.getOrganizer().getEmail().equalsIgnoreCase(username)) {
            throw new ForbiddenOperationException();
        }
        eventPublisher.publishEvent(new EventChangedEvent(event.getId()));
        eventRepository.delete(event);
        LOGGER.info("Event deleted eventId={}", id);
    }

    private Event findEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
    }

    private void applyRequest(Event event, EventRequest request) {
        Integer previousCapacity = event.getCapacity();
        Integer previousAvailable = event.getAvailableSeats();
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setCategory(findCategory(request.categoryId()));
        event.setCity(findCity(request.cityId()));
        event.setVenue(request.venue());
        event.setDate(request.date());
        event.setTime(request.time());
        event.setPrice(request.price());
        event.setCapacity(request.capacity());
        if (previousCapacity == null || previousAvailable == null) {
            event.setAvailableSeats(request.capacity());
        } else {
            int bookedSeats = previousCapacity - previousAvailable;
            if (request.capacity() < bookedSeats) {
                throw new IllegalArgumentException("Capacity cannot be lower than already booked seats");
            }
            event.setAvailableSeats(request.capacity() - bookedSeats);
        }
        event.setImageUrl(request.imageUrl());
    }

    private User findUser(String username) {
        return userRepository.findByEmailIgnoreCase(username)
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated organizer account no longer exists"));
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    }

    private City findCity(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City", id));
    }

    private User findOrganizer(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Organizer", id));
    }

    private void validateAvailableSeats(Event event) {
        if (event.getAvailableSeats() > event.getCapacity()) {
            throw new IllegalArgumentException("Available seats cannot exceed event capacity");
        }
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("Start date must not be after end date");
        }
    }
}

package com.happening.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.happening.dto.EventRequest;
import com.happening.dto.EventResponse;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.User;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.CategoryRepository;
import com.happening.repository.CityRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.UserRepository;

@Service
@Transactional
public class EventService {

    private final EventRepository eventRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;
    private final UserRepository userRepository;

    public EventService(
            EventRepository eventRepository,
            CategoryRepository categoryRepository,
            CityRepository cityRepository,
            UserRepository userRepository) {
        this.eventRepository = eventRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getAllEvents() {
        return eventRepository.findAll().stream()
                .map(EventResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id) {
        return EventResponse.from(findEvent(id));
    }

    public EventResponse createEvent(EventRequest request) {
        Event event = new Event();
        applyRequest(event, request);
        if (event.getStatus() == null) {
            event.setStatus(EventStatus.PENDING);
        }
        if (event.getAvailableSeats() == null) {
            event.setAvailableSeats(event.getCapacity());
        }
        validateAvailableSeats(event);
        return EventResponse.from(eventRepository.save(event));
    }

    public EventResponse updateEvent(Long id, EventRequest request) {
        Event event = findEvent(id);
        applyRequest(event, request);
        validateAvailableSeats(event);
        return EventResponse.from(eventRepository.save(event));
    }

    public void deleteEvent(Long id) {
        eventRepository.delete(findEvent(id));
    }

    private Event findEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", id));
    }

    private void applyRequest(Event event, EventRequest request) {
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setCategory(findCategory(request.categoryId()));
        event.setCity(findCity(request.cityId()));
        event.setOrganizer(findOrganizer(request.organizerId()));
        event.setVenue(request.venue());
        event.setDate(request.date());
        event.setTime(request.time());
        event.setPrice(request.price());
        event.setCapacity(request.capacity());
        if (request.availableSeats() != null) {
            event.setAvailableSeats(request.availableSeats());
        }
        event.setImageUrl(request.imageUrl());
        if (request.status() != null) {
            event.setStatus(request.status());
        }
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
}

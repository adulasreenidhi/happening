package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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

@ExtendWith(MockitoExtension.class)
class EventServiceTests {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private CityRepository cityRepository;
    @Mock
    private UserRepository userRepository;

    private EventService eventService;
    private Category category;
    private City city;
    private User organizer;

    @BeforeEach
    void setUp() {
        eventService = new EventService(
                eventRepository, categoryRepository, cityRepository, userRepository);
        category = new Category();
        category.setId(3L);
        city = new City();
        city.setId(4L);
        organizer = new User();
        organizer.setId(5L);
    }

    @Test
    void createsEventWithDevelopmentDefaults() {
        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));
        when(cityRepository.findById(4L)).thenReturn(Optional.of(city));
        when(userRepository.findById(5L)).thenReturn(Optional.of(organizer));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event event = invocation.getArgument(0);
            event.setId(12L);
            return event;
        });

        EventResponse created = eventService.createEvent(request(null, null));

        assertEquals(12L, created.id());
        assertEquals(300, created.availableSeats());
        assertEquals(EventStatus.PENDING, created.status());
        assertEquals(3L, created.categoryId());
    }

    @Test
    void rejectsAvailableSeatsAboveCapacity() {
        when(categoryRepository.findById(3L)).thenReturn(Optional.of(category));
        when(cityRepository.findById(4L)).thenReturn(Optional.of(city));
        when(userRepository.findById(5L)).thenReturn(Optional.of(organizer));

        assertThrows(
                IllegalArgumentException.class,
                () -> eventService.createEvent(request(301, null)));
    }

    @Test
    void missingEventIsReportedAsNotFoundForDelete() {
        when(eventRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> eventService.deleteEvent(99L));
        verify(eventRepository).findById(99L);
    }

    private EventRequest request(Integer availableSeats, EventStatus status) {
        return new EventRequest(
                "City Festival",
                "An outdoor event",
                3L,
                4L,
                5L,
                "Central Park",
                LocalDate.of(2026, 11, 15),
                LocalTime.of(10, 0),
                new BigDecimal("25.00"),
                300,
                availableSeats,
                null,
                status);
    }
}

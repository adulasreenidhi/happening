package com.happening.backend;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.happening.controller.EventController;
import com.happening.dto.EventResponse;
import com.happening.entity.EventStatus;
import com.happening.exception.GlobalExceptionHandler;
import com.happening.exception.ResourceNotFoundException;
import com.happening.service.EventService;

@ExtendWith(MockitoExtension.class)
class BackendApplicationTests {

    @Mock
    private EventService eventService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new EventController(eventService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void listsEvents() throws Exception {
        when(eventService.getAllEvents()).thenReturn(List.of(event()));

        mockMvc.perform(get("/api/events"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(12))
                .andExpect(jsonPath("$[0].categoryId").value(3));
    }

    @Test
    void retrievesEvent() throws Exception {
        when(eventService.getEventById(12L)).thenReturn(event());

        mockMvc.perform(get("/api/events/12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("City Festival"));
    }

    @Test
    void missingEventReturnsJsonNotFound() throws Exception {
        when(eventService.getEventById(99L))
                .thenThrow(new ResourceNotFoundException("Event", 99L));

        mockMvc.perform(get("/api/events/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Event with id 99 was not found"));
    }

    @Test
    void createsEvent() throws Exception {
        when(eventService.createEvent(any())).thenReturn(event());

        mockMvc.perform(post("/api/events")
                        .contentType("application/json")
                        .content(validEventRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(12))
                .andExpect(jsonPath("$.status").value("PENDING"));

        verify(eventService).createEvent(any());
    }

    @Test
    void updatesEvent() throws Exception {
        when(eventService.updateEvent(org.mockito.ArgumentMatchers.eq(12L), any()))
                .thenReturn(event());

        mockMvc.perform(put("/api/events/12")
                        .contentType("application/json")
                        .content(validEventRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(12));
    }

    @Test
    void deletesEvent() throws Exception {
        mockMvc.perform(delete("/api/events/12"))
                .andExpect(status().isNoContent());

        verify(eventService).deleteEvent(12L);
    }

    @Test
    void invalidEventRequestReturnsValidationDetails() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType("application/json")
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.details.title").exists());
    }

    private EventResponse event() {
        return new EventResponse(
                12L,
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
                300,
                null,
                EventStatus.PENDING,
                LocalDateTime.of(2026, 10, 5, 9, 0));
    }

    private String validEventRequest() {
        return """
                {
                  "title": "City Festival",
                  "description": "An outdoor event",
                  "categoryId": 3,
                  "cityId": 4,
                  "organizerId": 5,
                  "venue": "Central Park",
                  "date": "2026-11-15",
                  "time": "10:00:00",
                  "price": 25.00,
                  "capacity": 300,
                  "availableSeats": 300,
                  "status": "PENDING"
                }
                """;
    }
}

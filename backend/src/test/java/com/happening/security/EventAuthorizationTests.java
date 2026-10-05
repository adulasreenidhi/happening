package com.happening.security;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import com.happening.controller.EventController;
import com.happening.service.EventService;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = EventAuthorizationTests.MethodSecurityConfiguration.class)
class EventAuthorizationTests {

    @Autowired
    private EventController eventController;
    @Autowired
    private EventService eventService;

    @BeforeEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void userCannotDeleteEvent() {
        authenticateAs("USER");

        assertThrows(
                AccessDeniedException.class,
                () -> eventController.deleteEvent(1L, principal("USER")));
    }

    @Test
    void organizerCanDeleteEvent() {
        authenticateAs("ORGANIZER");

        eventController.deleteEvent(1L, principal("ORGANIZER"));

        verify(eventService).deleteEvent(1L, "test@example.com", false);
    }

    @Test
    void adminCanDeleteEvent() {
        authenticateAs("ADMIN");

        eventController.deleteEvent(2L, principal("ADMIN"));

        verify(eventService).deleteEvent(2L, "test@example.com", true);
    }

    private void authenticateAs(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal(role), "not-used", List.of(
                        new SimpleGrantedAuthority("ROLE_" + role))));
    }

    private UserDetails principal(String role) {
        return org.springframework.security.core.userdetails.User
                .withUsername("test@example.com")
                .password("not-used")
                .roles(role)
                .build();
    }

    @Configuration
    @EnableMethodSecurity
    static class MethodSecurityConfiguration {

        @Bean
        EventService eventService() {
            return org.mockito.Mockito.mock(EventService.class);
        }

        @Bean
        EventController eventController(EventService eventService) {
            return new EventController(eventService);
        }
    }
}

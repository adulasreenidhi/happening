package com.happening.security;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

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
import com.happening.controller.AdminController;
import com.happening.controller.BookingController;
import com.happening.controller.FavoriteController;
import com.happening.controller.ReviewController;
import com.happening.service.AdminService;
import com.happening.service.BookingService;
import com.happening.service.EventService;
import com.happening.service.FavoriteService;
import com.happening.service.ReviewService;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = PlatformAuthorizationTests.MethodSecurityConfiguration.class)
class PlatformAuthorizationTests {
    @Autowired
    private AdminController adminController;
    @Autowired
    private BookingController bookingController;
    @Autowired
    private FavoriteController favoriteController;
    @Autowired
    private ReviewController reviewController;

    @BeforeEach
    void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void cleanUp() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void regularUserCannotAccessAdministrativeApis() {
        authenticateAs("USER");

        assertThrows(AccessDeniedException.class, () -> adminController.dashboard());
        assertThrows(AccessDeniedException.class, () -> adminController.categories());
    }

    @Test
    void organizerCannotBookFavoriteOrReviewAsAttendee() {
        authenticateAs("ORGANIZER");
        UserDetails user = principal("ORGANIZER");

        assertThrows(
                AccessDeniedException.class,
                () -> bookingController.myBookings(user));
        assertThrows(
                AccessDeniedException.class,
                () -> favoriteController.mine(user));
        assertThrows(
                AccessDeniedException.class,
                () -> reviewController.create(1L, null, user));
    }

    @Test
    void adminCannotUseUserBookingEndpoints() {
        authenticateAs("ADMIN");

        assertThrows(
                AccessDeniedException.class,
                () -> bookingController.myBookings(principal("ADMIN")));
    }

    private void authenticateAs(String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal(role),
                        "not-used",
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))));
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
        AdminService adminService() {
            return mock(AdminService.class);
        }

        @Bean
        EventService eventService() {
            return mock(EventService.class);
        }

        @Bean
        BookingService bookingService() {
            return mock(BookingService.class);
        }

        @Bean
        FavoriteService favoriteService() {
            return mock(FavoriteService.class);
        }

        @Bean
        ReviewService reviewService() {
            return mock(ReviewService.class);
        }

        @Bean
        AdminController adminController(AdminService adminService, EventService eventService) {
            return new AdminController(adminService, eventService);
        }

        @Bean
        BookingController bookingController(BookingService bookingService) {
            return new BookingController(bookingService);
        }

        @Bean
        FavoriteController favoriteController(FavoriteService favoriteService) {
            return new FavoriteController(favoriteService);
        }

        @Bean
        ReviewController reviewController(ReviewService reviewService) {
            return new ReviewController(reviewService);
        }
    }
}

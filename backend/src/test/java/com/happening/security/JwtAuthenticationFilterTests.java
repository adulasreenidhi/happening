package com.happening.security;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Base64;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.AuthenticationEntryPoint;

import com.happening.service.CustomUserDetailsService;

class JwtAuthenticationFilterTests {

    private static final String TEST_SECRET = Base64.getEncoder()
            .encodeToString("filter-test-key-at-least-32-bytes!".getBytes());

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void validBearerTokenPopulatesSecurityContext() throws Exception {
        JwtService jwtService = new JwtService(TEST_SECRET, 60_000);
        var user = User.withUsername("person@example.com")
                .password("hash")
                .roles("ORGANIZER")
                .build();
        CustomUserDetailsService userDetailsService = org.mockito.Mockito.mock(
                CustomUserDetailsService.class);
        when(userDetailsService.loadUserByUsername("person@example.com")).thenReturn(user);
        AuthenticationEntryPoint entryPoint = org.mockito.Mockito.mock(AuthenticationEntryPoint.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService, userDetailsService, entryPoint);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + jwtService.generateToken(user));
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        verify(entryPoint, never()).commence(any(), any(), any());
    }

    @Test
    void invalidBearerTokenIsRejectedBeforeTheRequestContinues() throws Exception {
        JwtService jwtService = new JwtService(TEST_SECRET, 60_000);
        CustomUserDetailsService userDetailsService = org.mockito.Mockito.mock(
                CustomUserDetailsService.class);
        AuthenticationEntryPoint entryPoint = org.mockito.Mockito.mock(AuthenticationEntryPoint.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(
                jwtService, userDetailsService, entryPoint);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer not.a.valid.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilter(request, response, chain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(entryPoint).commence(any(), any(), any());
        assertNull(chain.getRequest());
    }
}

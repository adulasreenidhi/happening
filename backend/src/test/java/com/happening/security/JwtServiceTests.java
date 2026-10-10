package com.happening.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Base64;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;

class JwtServiceTests {

    private static final String TEST_SECRET = Base64.getEncoder()
            .encodeToString("test-only-signing-key-at-least-32-bytes".getBytes());

    @Test
    void signsAndValidatesUserToken() {
        JwtService service = new JwtService(TEST_SECRET, 60_000);
        var user = User.withUsername("person@example.com")
                .password("not-used")
                .roles("USER")
                .build();

        String token = service.generateToken(user);

        assertEquals("person@example.com", service.extractUsername(token));
        org.junit.jupiter.api.Assertions.assertTrue(service.isTokenValid(token, user));
    }

    @Test
    void rejectsTamperedToken() {
        JwtService service = new JwtService(TEST_SECRET, 60_000);
        var user = User.withUsername("person@example.com")
                .password("not-used")
                .roles("USER")
                .build();

        String token = service.generateToken(user);

        String[] tokenParts = token.split("\\.");
        tokenParts[2] = (tokenParts[2].startsWith("A") ? "B" : "A") + tokenParts[2].substring(1);
        String tamperedToken = String.join(".", tokenParts);

        assertThrows(
                io.jsonwebtoken.JwtException.class,
                () -> service.extractUsername(tamperedToken));
    }

    @Test
    void rejectsExpiredToken() throws InterruptedException {
        JwtService service = new JwtService(TEST_SECRET, 1);
        var user = User.withUsername("person@example.com")
                .password("not-used")
                .roles("USER")
                .build();
        String token = service.generateToken(user);
        Thread.sleep(25);

        assertThrows(
                io.jsonwebtoken.ExpiredJwtException.class,
                () -> service.extractUsername(token));
    }

    @Test
    void requiresStrongBase64Secret() {
        assertThrows(IllegalStateException.class, () -> new JwtService("short", 60_000));
    }

    @Test
    void rejectsBase64SecretShorterThan32DecodedBytes() {
        String shortSecret = Base64.getEncoder().encodeToString(new byte[31]);

        assertThrows(IllegalStateException.class, () -> new JwtService(shortSecret, 60_000));
    }
}

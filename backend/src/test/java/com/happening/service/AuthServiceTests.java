package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.happening.dto.LoginRequestDTO;
import com.happening.dto.LoginResponseDTO;
import com.happening.dto.UserRegistrationDTO;
import com.happening.dto.UserResponseDTO;
import com.happening.entity.Role;
import com.happening.entity.User;
import com.happening.exception.DuplicateEmailException;
import com.happening.repository.UserRepository;
import com.happening.security.JwtService;

@ExtendWith(MockitoExtension.class)
class AuthServiceTests {

    @Mock
    private UserRepository userRepository;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;

    private BCryptPasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userRepository, passwordEncoder, authenticationManager, jwtService);
    }

    @Test
    void registrationHashesPasswordAndAssignsOnlyUserRole() {
        when(userRepository.existsByEmailIgnoreCase("person@example.com")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(7L);
            return user;
        });

        UserResponseDTO response = authService.register(registration());

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCaptor.capture());
        User persisted = userCaptor.getValue();
        assertNotEquals("CorrectHorseBattery", persisted.getPassword());
        assertEquals(Role.USER, persisted.getRole());
        assertEquals("person@example.com", persisted.getEmail());
        assertTrue(passwordEncoder.matches("CorrectHorseBattery", persisted.getPassword()));
        assertEquals(Role.USER, response.role());
    }

    @Test
    void registrationRejectsDuplicateEmail() {
        when(userRepository.existsByEmailIgnoreCase("person@example.com")).thenReturn(true);

        assertThrows(DuplicateEmailException.class, () -> authService.register(registration()));
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    void loginReturnsBearerTokenAndSafeUserDto() {
        UserDetails principal = org.springframework.security.core.userdetails.User
                .withUsername("person@example.com")
                .password(passwordEncoder.encode("CorrectHorseBattery"))
                .roles("USER")
                .build();
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(authentication);
        User user = new User();
        user.setId(7L);
        user.setName("Test Person");
        user.setEmail("person@example.com");
        user.setRole(Role.USER);
        when(userRepository.findByEmailIgnoreCase("person@example.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken(principal)).thenReturn("signed-token");
        when(jwtService.getExpirationMs()).thenReturn(3_600_000L);

        LoginResponseDTO response = authService.login(
                new LoginRequestDTO(" Person@Example.com ", "CorrectHorseBattery"));

        assertEquals("Bearer", response.tokenType());
        assertEquals("signed-token", response.accessToken());
        assertEquals(3600, response.expiresIn());
        assertEquals(Role.USER, response.user().role());
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void loginRejectsInvalidCredentials() {
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("bad credentials"));

        assertThrows(
                BadCredentialsException.class,
                () -> authService.login(new LoginRequestDTO("person@example.com", "wrong")));
        verify(userRepository, never()).findByEmailIgnoreCase(any());
    }

    private UserRegistrationDTO registration() {
        return new UserRegistrationDTO(
                "Test Person",
                " Person@Example.com ",
                "+1 555 123 4567",
                "CorrectHorseBattery");
    }
}

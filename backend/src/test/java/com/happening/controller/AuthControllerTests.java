package com.happening.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import com.happening.dto.LoginResponseDTO;
import com.happening.dto.UserResponseDTO;
import com.happening.entity.Role;
import com.happening.exception.DuplicateEmailException;
import com.happening.exception.GlobalExceptionHandler;
import com.happening.service.AuthService;

@ExtendWith(MockitoExtension.class)
class AuthControllerTests {

    @Mock
    private AuthService authService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void registrationReturnsSafeUserResponse() throws Exception {
        when(authService.register(any())).thenReturn(
                new UserResponseDTO(4L, "Test Person", "person@example.com", "+15551234567", Role.USER));

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "Test Person",
                                  "email": "person@example.com",
                                  "phone": "+15551234567",
                                  "password": "CorrectHorseBattery"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(4))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void invalidRegistrationReturnsFieldErrors() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content("""
                                {
                                  "name": "",
                                  "email": "not-an-email",
                                  "phone": "1",
                                  "password": "short"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.details.name").exists())
                .andExpect(jsonPath("$.details.email").exists())
                .andExpect(jsonPath("$.details.password").exists());
    }

    @Test
    void duplicateRegistrationReturnsConflict() throws Exception {
        when(authService.register(any())).thenThrow(new DuplicateEmailException());

        mockMvc.perform(post("/api/auth/register")
                        .contentType("application/json")
                        .content(validRegistration()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists"));
    }

    @Test
    void loginReturnsJwtAndSafeUserData() throws Exception {
        when(authService.login(any())).thenReturn(new LoginResponseDTO(
                "Bearer",
                "signed-token",
                3600,
                new UserResponseDTO(4L, "Test Person", "person@example.com", null, Role.USER)));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "person@example.com",
                                  "password": "CorrectHorseBattery"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.accessToken").value("signed-token"))
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void invalidLoginReturnsGenericUnauthorizedError() throws Exception {
        when(authService.login(any())).thenThrow(new BadCredentialsException("hidden"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {
                                  "email": "person@example.com",
                                  "password": "incorrect"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    private String validRegistration() {
        return """
                {
                  "name": "Test Person",
                  "email": "person@example.com",
                  "phone": "+15551234567",
                  "password": "CorrectHorseBattery"
                }
                """;
    }
}

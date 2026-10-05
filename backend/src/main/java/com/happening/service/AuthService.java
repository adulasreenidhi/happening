package com.happening.service;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.happening.dto.LoginRequestDTO;
import com.happening.dto.LoginResponseDTO;
import com.happening.dto.UserRegistrationDTO;
import com.happening.dto.UserResponseDTO;
import com.happening.entity.Role;
import com.happening.entity.User;
import com.happening.exception.DuplicateEmailException;
import com.happening.repository.UserRepository;
import com.happening.security.JwtService;

@Service
public class AuthService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public UserResponseDTO register(UserRegistrationDTO request) {
        String email = normalizeEmail(request.email());
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("Password must be at most 72 UTF-8 bytes");
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new DuplicateEmailException();
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPhone(request.phone().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.USER);
        try {
            UserResponseDTO response = UserResponseDTO.from(userRepository.saveAndFlush(user));
            LOGGER.info("User registered userId={} role={}", response.id(), response.role());
            return response;
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateEmailException();
        }
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        String email = normalizeEmail(request.email());
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password()));
        } catch (AuthenticationException exception) {
            LOGGER.warn("Login failed for supplied credentials");
            throw exception;
        }
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByEmailIgnoreCase(userDetails.getUsername())
                .orElseThrow(() -> new IllegalStateException(
                        "Authenticated user disappeared before token issuance"));
        LoginResponseDTO response = new LoginResponseDTO(
                "Bearer",
                jwtService.generateToken(userDetails),
                jwtService.getExpirationMs() / 1000,
                UserResponseDTO.from(user));
        LOGGER.info("User login succeeded userId={} role={}", response.user().id(), response.user().role());
        return response;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}

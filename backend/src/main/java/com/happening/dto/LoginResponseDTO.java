package com.happening.dto;

public record LoginResponseDTO(
        String tokenType,
        String accessToken,
        long expiresIn,
        UserResponseDTO user) {
}

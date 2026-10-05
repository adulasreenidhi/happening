package com.happening.dto;

import com.happening.entity.Role;
import com.happening.entity.User;

public record UserResponseDTO(
        Long id,
        String name,
        String email,
        String phone,
        Role role) {

    public static UserResponseDTO from(User user) {
        return new UserResponseDTO(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole());
    }
}

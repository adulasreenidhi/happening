package com.happening.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AssistantChatRequest(
        @NotBlank @Size(max = 1000) String message,
        @Size(max = 10) List<@Valid ConversationTurn> history) {
    public record ConversationTurn(
            @NotBlank @Pattern(regexp = "user|assistant") String role,
            @NotBlank @Size(max = 1000) String content) {
    }
}

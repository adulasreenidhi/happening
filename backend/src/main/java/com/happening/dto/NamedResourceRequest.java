package com.happening.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NamedResourceRequest(@NotBlank @Size(max = 100) String name) {
}

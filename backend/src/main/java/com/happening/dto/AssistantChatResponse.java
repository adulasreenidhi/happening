package com.happening.dto;

import java.util.List;

public record AssistantChatResponse(
        String answer,
        List<EventResponse> databaseEvents,
        AssistantFilters filtersApplied,
        boolean semanticSearchUsed) {
}

package com.happening.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import com.happening.ai.MySqlEventVectorStore;
import com.happening.ai.OpenAiClient;
import com.happening.ai.StructuredEventRetrievalService;
import com.happening.dto.AssistantChatRequest;
import com.happening.dto.AssistantChatResponse;
import com.happening.dto.EventResponse;
import com.happening.exception.AiAssistantException;

@Service
public class AiAssistantService {
    private static final Logger LOGGER = LoggerFactory.getLogger(AiAssistantService.class);
    private static final int MAX_RESPONSE_EVENTS = 8;

    private final OpenAiClient openAiClient;
    private final MySqlEventVectorStore vectorStore;
    private final StructuredEventRetrievalService retrievalService;

    public AiAssistantService(
            OpenAiClient openAiClient,
            MySqlEventVectorStore vectorStore,
            StructuredEventRetrievalService retrievalService) {
        this.openAiClient = openAiClient;
        this.vectorStore = vectorStore;
        this.retrievalService = retrievalService;
    }

    public AssistantChatResponse chat(AssistantChatRequest request) {
        StructuredEventRetrievalService.StructuredResults structured;
        try {
            structured = retrievalService.search(request.message().trim());
        } catch (DataAccessException exception) {
            throw new AiAssistantException(
                    "Event recommendations are temporarily unavailable. Please try again.", 503);
        }
        List<EventResponse> recommendations = structured.events();
        boolean semanticSearchUsed = false;

        if (openAiClient.isConfigured()) {
            try {
                LOGGER.debug("Starting semantic retrieval for assistant request");
                List<Double> queryVector = openAiClient.embed(request.message().trim());
                List<Long> similarIds = vectorStore.search(queryVector, 20);
                List<EventResponse> similarEvents = retrievalService.getApprovedEventsByIds(
                        similarIds, structured.constraints());
                recommendations = merge(similarEvents, recommendations);
                semanticSearchUsed = !similarEvents.isEmpty();
                LOGGER.info("Semantic retrieval completed matchedEvents={}", similarEvents.size());
            } catch (AiAssistantException | DataAccessException exception) {
                LOGGER.warn("Semantic event retrieval failed; using structured search: {}",
                        exception.getMessage());
            }
        }

        List<EventResponse> selected = recommendations.stream().limit(MAX_RESPONSE_EVENTS).toList();
        if (selected.isEmpty()) {
            return new AssistantChatResponse(
                    "I couldn't find approved events matching those preferences. Try a different city, date, or budget.",
                    List.of(),
                    structured.constraints().toResponse(),
                    semanticSearchUsed);
        }

        String answer = openAiClient.answer(
                request.message().trim(),
                request.history(),
                selected);
        LOGGER.info("Assistant response generated groundedEventCount={}", selected.size());
        return new AssistantChatResponse(
                answer,
                selected,
                structured.constraints().toResponse(),
                semanticSearchUsed);
    }

    private List<EventResponse> merge(
            List<EventResponse> semantic,
            List<EventResponse> structured) {
        Map<Long, EventResponse> ordered = new LinkedHashMap<>();
        semantic.forEach(event -> ordered.putIfAbsent(event.id(), event));
        structured.forEach(event -> ordered.putIfAbsent(event.id(), event));
        return new ArrayList<>(ordered.values());
    }
}

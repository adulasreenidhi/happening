package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import com.happening.ai.AssistantQueryConstraints;
import com.happening.ai.MySqlEventVectorStore;
import com.happening.ai.OpenAiClient;
import com.happening.ai.StructuredEventRetrievalService;
import com.happening.dto.AssistantChatRequest;
import com.happening.dto.AssistantChatResponse;
import com.happening.dto.EventResponse;
import com.happening.entity.EventStatus;
import com.happening.exception.AiAssistantException;

@ExtendWith(MockitoExtension.class)
class AiAssistantServiceTests {
    @Mock
    private OpenAiClient openAiClient;
    @Mock
    private MySqlEventVectorStore vectorStore;
    @Mock
    private StructuredEventRetrievalService retrievalService;

    private AiAssistantService service;
    private AssistantQueryConstraints noConstraints;
    private EventResponse event;

    @BeforeEach
    void setUp() {
        service = new AiAssistantService(openAiClient, vectorStore, retrievalService);
        noConstraints = new AssistantQueryConstraints(null, null, null, null, null, null, null, null);
        event = new EventResponse(
                12L, "Live Music Night", "Indie concert in the city", 3L, "Music",
                4L, "Pune", 8L, "Central Hall", LocalDate.now().plusDays(7),
                LocalTime.of(19, 0), new BigDecimal("25.00"), 80, 72, null,
                EventStatus.APPROVED, LocalDateTime.now(), 0.0, 0);
    }

    @Test
    void emptyStructuredRetrievalAvoidsUnnecessaryProviderCalls() {
        when(retrievalService.search("no matching concert")).thenReturn(
                new StructuredEventRetrievalService.StructuredResults(noConstraints, List.of()));
        when(openAiClient.isConfigured()).thenReturn(false);

        AssistantChatResponse response = service.chat(
                new AssistantChatRequest("no matching concert", List.of()));

        assertTrue(response.databaseEvents().isEmpty());
        assertFalse(response.semanticSearchUsed());
        assertTrue(response.answer().contains("couldn't find approved events"));
        verify(openAiClient, never()).answer(org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyList());
    }

    @Test
    void embeddingProviderFailureFallsBackToStructuredEvents() {
        when(retrievalService.search("music in Pune")).thenReturn(
                new StructuredEventRetrievalService.StructuredResults(noConstraints, List.of(event)));
        when(openAiClient.isConfigured()).thenReturn(true);
        when(openAiClient.embed("music in Pune"))
                .thenThrow(new AiAssistantException("provider unavailable", 503));
        when(openAiClient.answer("music in Pune", List.of(), List.of(event)))
                .thenReturn("Here is a matching approved event.");

        AssistantChatResponse response = service.chat(
                new AssistantChatRequest("music in Pune", List.of()));

        assertEquals("Here is a matching approved event.", response.answer());
        assertEquals(12L, response.databaseEvents().get(0).id());
        assertFalse(response.semanticSearchUsed());
        verify(vectorStore, never()).search(org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void vectorStoreFailureFallsBackToStructuredEvents() {
        when(retrievalService.search("music")).thenReturn(
                new StructuredEventRetrievalService.StructuredResults(noConstraints, List.of(event)));
        when(openAiClient.isConfigured()).thenReturn(true);
        when(openAiClient.embed("music")).thenReturn(List.of(0.1, 0.2));
        when(vectorStore.search(List.of(0.1, 0.2), 20))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));
        when(openAiClient.answer("music", List.of(), List.of(event)))
                .thenReturn("These listings may suit you.");

        AssistantChatResponse response = service.chat(new AssistantChatRequest("music", List.of()));

        assertEquals(1, response.databaseEvents().size());
        assertFalse(response.semanticSearchUsed());
    }

    @Test
    void semanticMatchesAreIncludedAlongsideStructuredDatabaseResults() {
        when(retrievalService.search("an indie gig")).thenReturn(
                new StructuredEventRetrievalService.StructuredResults(noConstraints, List.of()));
        when(openAiClient.isConfigured()).thenReturn(true);
        when(openAiClient.embed("an indie gig")).thenReturn(List.of(0.1, 0.2));
        when(vectorStore.search(List.of(0.1, 0.2), 20)).thenReturn(List.of(12L));
        when(retrievalService.getApprovedEventsByIds(List.of(12L), noConstraints))
                .thenReturn(List.of(event));
        when(openAiClient.answer("an indie gig", List.of(), List.of(event)))
                .thenReturn("A relevant listing is available.");

        AssistantChatResponse response = service.chat(new AssistantChatRequest("an indie gig", List.of()));

        assertEquals(12L, response.databaseEvents().get(0).id());
        assertTrue(response.semanticSearchUsed());
    }

    @Test
    void chatProviderFailureIsReturnedAsSanitizedAssistantFailure() {
        when(retrievalService.search("music")).thenReturn(
                new StructuredEventRetrievalService.StructuredResults(noConstraints, List.of(event)));
        when(openAiClient.isConfigured()).thenReturn(false);
        when(openAiClient.answer("music", List.of(), List.of(event)))
                .thenThrow(new AiAssistantException("provider unavailable", 503));

        org.junit.jupiter.api.Assertions.assertThrows(
                AiAssistantException.class,
                () -> service.chat(new AssistantChatRequest("music", List.of())));
    }
}

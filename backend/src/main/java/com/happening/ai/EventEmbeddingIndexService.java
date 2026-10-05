package com.happening.ai;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happening.entity.Event;
import com.happening.entity.EventEmbedding;
import com.happening.entity.EventStatus;
import com.happening.exception.AiAssistantException;
import com.happening.repository.EventEmbeddingRepository;
import com.happening.repository.EventRepository;

@Service
public class EventEmbeddingIndexService {
    private final EventRepository eventRepository;
    private final EventEmbeddingRepository embeddingRepository;
    private final OpenAiClient openAiClient;
    private final ObjectMapper objectMapper;

    public EventEmbeddingIndexService(
            EventRepository eventRepository,
            EventEmbeddingRepository embeddingRepository,
            OpenAiClient openAiClient,
            ObjectMapper objectMapper) {
        this.eventRepository = eventRepository;
        this.embeddingRepository = embeddingRepository;
        this.openAiClient = openAiClient;
        this.objectMapper = objectMapper;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void synchronize(Long eventId) {
        Optional<Event> event = eventRepository.findById(eventId);
        if (event.isEmpty() || event.get().getStatus() != EventStatus.APPROVED) {
            embeddingRepository.deleteById(eventId);
            return;
        }
        if (!openAiClient.isConfigured()) {
            return;
        }

        Event approvedEvent = event.get();
        List<Double> vector = openAiClient.embed(embeddingContent(approvedEvent));
        EventEmbedding embedding = embeddingRepository.findById(eventId)
                .orElseGet(EventEmbedding::new);
        embedding.setEventId(eventId);
        embedding.setModel(openAiClient.getEmbeddingModel());
        try {
            embedding.setEmbedding(objectMapper.writeValueAsString(vector));
        } catch (JsonProcessingException exception) {
            throw new AiAssistantException("Event indexing is temporarily unavailable.", 503);
        }
        embedding.setUpdatedAt(LocalDateTime.now());
        embeddingRepository.save(embedding);
    }

    private String embeddingContent(Event event) {
        return "Event: " + event.getTitle()
                + "\nDescription: " + event.getDescription()
                + "\nCategory: " + event.getCategory().getName()
                + "\nCity: " + event.getCity().getName()
                + "\nVenue: " + event.getVenue()
                + "\nDate: " + event.getDate()
                + "\nTime: " + event.getTime()
                + "\nPrice: " + event.getPrice();
    }
}

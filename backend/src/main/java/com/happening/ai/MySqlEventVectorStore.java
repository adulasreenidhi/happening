package com.happening.ai;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happening.entity.EventEmbedding;
import com.happening.exception.AiAssistantException;
import com.happening.repository.EventEmbeddingRepository;

@Service
public class MySqlEventVectorStore {
    private static final double MINIMUM_COSINE_SIMILARITY = 0.15;

    private final EventEmbeddingRepository repository;
    private final ObjectMapper objectMapper;
    private final OpenAiClient openAiClient;

    public MySqlEventVectorStore(
            EventEmbeddingRepository repository,
            ObjectMapper objectMapper,
            OpenAiClient openAiClient) {
        this.repository = repository;
        this.objectMapper = objectMapper;
        this.openAiClient = openAiClient;
    }

    public List<Long> search(List<Double> queryVector, int limit) {
        return repository.findAllByModel(openAiClient.getEmbeddingModel()).stream()
                .map(embedding -> new ScoredEvent(
                        embedding.getEventId(),
                        cosineSimilarity(queryVector, decode(embedding.getEmbedding()))))
                .filter(result -> result.score() >= MINIMUM_COSINE_SIMILARITY)
                .sorted(Comparator.comparingDouble(ScoredEvent::score).reversed())
                .limit(limit)
                .map(ScoredEvent::eventId)
                .toList();
    }

    private List<Double> decode(String vector) {
        try {
            return objectMapper.readValue(vector, new TypeReference<>() {});
        } catch (IOException exception) {
            throw new AiAssistantException(
                    "Stored event vectors are temporarily unavailable.", 503);
        }
    }

    private double cosineSimilarity(List<Double> left, List<Double> right) {
        if (left.size() != right.size() || left.isEmpty()) {
            return -1.0;
        }
        double dot = 0;
        double leftMagnitude = 0;
        double rightMagnitude = 0;
        for (int index = 0; index < left.size(); index++) {
            double leftValue = left.get(index);
            double rightValue = right.get(index);
            dot += leftValue * rightValue;
            leftMagnitude += leftValue * leftValue;
            rightMagnitude += rightValue * rightValue;
        }
        if (leftMagnitude == 0 || rightMagnitude == 0) {
            return -1.0;
        }
        return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
    }

    private record ScoredEvent(Long eventId, double score) {
    }
}

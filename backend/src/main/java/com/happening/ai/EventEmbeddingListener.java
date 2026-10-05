package com.happening.ai;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Async;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.happening.exception.AiAssistantException;

@Component
public class EventEmbeddingListener {
    private static final Logger LOGGER = LoggerFactory.getLogger(EventEmbeddingListener.class);

    private final EventEmbeddingIndexService indexService;

    public EventEmbeddingListener(EventEmbeddingIndexService indexService) {
        this.indexService = indexService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onEventChanged(EventChangedEvent event) {
        LOGGER.info("Embedding task started for eventId={}", event.eventId());
        try {
            indexService.synchronize(event.eventId());
            LOGGER.info("Embedding task completed for eventId={}", event.eventId());
        } catch (AiAssistantException | DataAccessException exception) {
            LOGGER.warn("Event {} embedding synchronization failed: {}",
                    event.eventId(), exception.getMessage());
        }
    }
}

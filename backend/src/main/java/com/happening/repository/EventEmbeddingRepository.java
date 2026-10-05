package com.happening.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.happening.entity.EventEmbedding;

public interface EventEmbeddingRepository extends JpaRepository<EventEmbedding, Long> {
    List<EventEmbedding> findAllByModel(String model);
}

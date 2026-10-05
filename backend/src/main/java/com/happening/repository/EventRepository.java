package com.happening.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.happening.entity.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
}
package com.happening.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.happening.entity.Review;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Review> findByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<Review> findByUserIdAndEventId(Long userId, Long eventId);

    @Query("select avg(r.rating) from Review r where r.event.id = :eventId")
    Double averageRating(@Param("eventId") Long eventId);
}

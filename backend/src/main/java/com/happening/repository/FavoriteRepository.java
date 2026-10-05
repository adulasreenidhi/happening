package com.happening.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.happening.entity.Favorite;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    Optional<Favorite> findByUserIdAndEventId(Long userId, Long eventId);
}

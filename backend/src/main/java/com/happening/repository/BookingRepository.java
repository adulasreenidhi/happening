package com.happening.repository;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.happening.entity.Booking;
import com.happening.entity.BookingStatus;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Booking> findByEventOrganizerEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    long countByEventOrganizerEmailIgnoreCaseAndBookingStatus(String email, BookingStatus status);

    long countByBookingStatus(BookingStatus status);

    boolean existsByUserIdAndEventIdAndBookingStatus(Long userId, Long eventId, BookingStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Booking b where b.id = :id")
    Optional<Booking> findByIdForUpdate(@Param("id") Long id);
}

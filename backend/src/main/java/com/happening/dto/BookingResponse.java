package com.happening.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import com.happening.entity.Booking;
import com.happening.entity.BookingStatus;
import com.happening.entity.PaymentStatus;

public record BookingResponse(
        Long id,
        Long eventId,
        String eventTitle,
        String attendeeName,
        LocalDate eventDate,
        LocalTime eventTime,
        String venue,
        Integer quantity,
        BigDecimal totalAmount,
        BookingStatus bookingStatus,
        PaymentStatus paymentStatus,
        LocalDateTime createdAt) {

    public static BookingResponse from(Booking booking) {
        return new BookingResponse(
                booking.getId(),
                booking.getEvent().getId(),
                booking.getEvent().getTitle(),
                booking.getUser().getName(),
                booking.getEvent().getDate(),
                booking.getEvent().getTime(),
                booking.getEvent().getVenue(),
                booking.getQuantity(),
                booking.getTotalAmount(),
                booking.getBookingStatus(),
                booking.getPaymentStatus(),
                booking.getCreatedAt());
    }
}

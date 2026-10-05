package com.happening.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.happening.dto.FavoriteResponse;
import com.happening.entity.Event;
import com.happening.entity.Favorite;
import com.happening.entity.User;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.EventRepository;
import com.happening.repository.FavoriteRepository;
import com.happening.repository.UserRepository;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    public FavoriteService(
            FavoriteRepository favoriteRepository,
            EventRepository eventRepository,
            UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.eventRepository = eventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> getMine(String email) {
        return favoriteRepository.findByUserEmailIgnoreCaseOrderByCreatedAtDesc(email)
                .stream().filter(favorite -> favorite.getEvent().getStatus()
                        == com.happening.entity.EventStatus.APPROVED)
                .map(FavoriteResponse::from).toList();
    }

    @Transactional
    public FavoriteResponse add(Long eventId, String email) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event", eventId));
        if (event.getStatus() != com.happening.entity.EventStatus.APPROVED) {
            throw new ResourceNotFoundException("Event", eventId);
        }
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user account no longer exists"));
        return favoriteRepository.findByUserIdAndEventId(user.getId(), eventId)
                .map(FavoriteResponse::from)
                .orElseGet(() -> {
                    Favorite favorite = new Favorite();
                    favorite.setEvent(event);
                    favorite.setUser(user);
                    return FavoriteResponse.from(favoriteRepository.save(favorite));
                });
    }

    @Transactional
    public void remove(Long eventId, String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user account no longer exists"));
        favoriteRepository.findByUserIdAndEventId(user.getId(), eventId)
                .ifPresent(favoriteRepository::delete);
    }
}

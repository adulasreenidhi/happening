package com.happening.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.happening.dto.FavoriteResponse;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.entity.Favorite;
import com.happening.entity.User;
import com.happening.repository.EventRepository;
import com.happening.repository.FavoriteRepository;
import com.happening.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class FavoriteServiceTests {
    @Mock
    private FavoriteRepository favoriteRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private UserRepository userRepository;
    private FavoriteService service;
    private Event event;
    private User user;
    private Favorite favorite;

    @BeforeEach
    void setUp() {
        service = new FavoriteService(favoriteRepository, eventRepository, userRepository);
        Category category = new Category();
        category.setId(2L);
        category.setName("Music");
        City city = new City();
        city.setId(3L);
        city.setName("Pune");
        event = new Event();
        event.setId(4L);
        event.setTitle("Live show");
        event.setCategory(category);
        event.setCity(city);
        event.setStatus(EventStatus.APPROVED);
        user = new User();
        user.setId(5L);
        user.setEmail("user@example.com");
        favorite = new Favorite();
        favorite.setId(6L);
        favorite.setEvent(event);
        favorite.setUser(user);
    }

    @Test
    void addingAnExistingFavoriteDoesNotCreateADuplicate() {
        when(eventRepository.findById(4L)).thenReturn(Optional.of(event));
        when(userRepository.findByEmailIgnoreCase("user@example.com")).thenReturn(Optional.of(user));
        when(favoriteRepository.findByUserIdAndEventId(5L, 4L)).thenReturn(Optional.of(favorite));

        FavoriteResponse response = service.add(4L, "user@example.com");

        assertEquals(4L, response.eventId());
        assertEquals("Pune", response.cityName());
        verify(favoriteRepository, never()).save(favorite);
    }
}

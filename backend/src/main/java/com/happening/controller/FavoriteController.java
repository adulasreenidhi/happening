package com.happening.controller;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.FavoriteResponse;
import com.happening.service.FavoriteService;

@RestController
@RequestMapping("/api/favorites")
@PreAuthorize("hasRole('USER')")
public class FavoriteController {
    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public List<FavoriteResponse> mine(@AuthenticationPrincipal UserDetails user) {
        return favoriteService.getMine(user.getUsername());
    }

    @PostMapping("/{eventId}")
    public FavoriteResponse add(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserDetails user) {
        return favoriteService.add(eventId, user.getUsername());
    }

    @DeleteMapping("/{eventId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @PathVariable Long eventId,
            @AuthenticationPrincipal UserDetails user) {
        favoriteService.remove(eventId, user.getUsername());
    }
}

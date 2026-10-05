package com.happening.controller;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import com.happening.dto.AdminDashboardResponse;
import com.happening.dto.BookingResponse;
import com.happening.dto.EventResponse;
import com.happening.dto.NamedResourceRequest;
import com.happening.dto.NamedResourceResponse;
import com.happening.dto.RoleUpdateRequest;
import com.happening.dto.UserResponseDTO;
import com.happening.entity.EventStatus;
import com.happening.entity.Role;
import com.happening.service.AdminService;
import com.happening.service.EventService;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService adminService;
    private final EventService eventService;

    public AdminController(AdminService adminService, EventService eventService) {
        this.adminService = adminService;
        this.eventService = eventService;
    }

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return adminService.dashboard();
    }

    @GetMapping("/bookings")
    public List<BookingResponse> bookings() {
        return adminService.bookings();
    }

    @GetMapping("/users")
    public List<UserResponseDTO> users(@RequestParam(required = false) Role role) {
        return adminService.users(role);
    }

    @PatchMapping("/users/{id}/role")
    public UserResponseDTO changeRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request,
            @AuthenticationPrincipal UserDetails user) {
        return adminService.changeRole(id, request, user.getUsername());
    }

    @GetMapping("/events")
    public Page<EventResponse> events(
            @RequestParam(required = false) EventStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
                    Pageable pageable) {
        if (pageable.getPageSize() > 100) {
            throw new IllegalArgumentException("Page size cannot exceed 100");
        }
        return eventService.getAdminEvents(status, pageable);
    }

    @PatchMapping("/events/{id}/approve")
    public EventResponse approve(@PathVariable Long id) {
        return eventService.moderateEvent(id, EventStatus.APPROVED);
    }

    @PatchMapping("/events/{id}/reject")
    public EventResponse reject(@PathVariable Long id) {
        return eventService.moderateEvent(id, EventStatus.REJECTED);
    }

    @GetMapping("/categories")
    public List<NamedResourceResponse> categories() {
        return adminService.categories();
    }

    @PostMapping("/categories")
    @ResponseStatus(HttpStatus.CREATED)
    public NamedResourceResponse createCategory(@Valid @RequestBody NamedResourceRequest request) {
        return adminService.createCategory(request);
    }

    @PutMapping("/categories/{id}")
    public NamedResourceResponse updateCategory(
            @PathVariable Long id, @Valid @RequestBody NamedResourceRequest request) {
        return adminService.updateCategory(id, request);
    }

    @DeleteMapping("/categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
    }

    @GetMapping("/cities")
    public List<NamedResourceResponse> cities() {
        return adminService.cities();
    }

    @PostMapping("/cities")
    @ResponseStatus(HttpStatus.CREATED)
    public NamedResourceResponse createCity(@Valid @RequestBody NamedResourceRequest request) {
        return adminService.createCity(request);
    }

    @PutMapping("/cities/{id}")
    public NamedResourceResponse updateCity(
            @PathVariable Long id, @Valid @RequestBody NamedResourceRequest request) {
        return adminService.updateCity(id, request);
    }

    @DeleteMapping("/cities/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCity(@PathVariable Long id) {
        adminService.deleteCity(id);
    }
}

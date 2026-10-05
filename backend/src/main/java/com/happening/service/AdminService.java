package com.happening.service;

import java.util.List;

import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.happening.dto.AdminDashboardResponse;
import com.happening.dto.BookingResponse;
import com.happening.dto.NamedResourceRequest;
import com.happening.dto.NamedResourceResponse;
import com.happening.dto.RoleUpdateRequest;
import com.happening.dto.UserResponseDTO;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.EventStatus;
import com.happening.entity.Role;
import com.happening.entity.User;
import com.happening.exception.ForbiddenOperationException;
import com.happening.exception.ResourceNotFoundException;
import com.happening.repository.BookingRepository;
import com.happening.repository.CategoryRepository;
import com.happening.repository.CityRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.UserRepository;

@Service
public class AdminService {
    private static final org.slf4j.Logger LOGGER = LoggerFactory.getLogger(AdminService.class);
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final CategoryRepository categoryRepository;
    private final CityRepository cityRepository;

    public AdminService(
            UserRepository userRepository,
            EventRepository eventRepository,
            BookingRepository bookingRepository,
            CategoryRepository categoryRepository,
            CityRepository cityRepository) {
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.bookingRepository = bookingRepository;
        this.categoryRepository = categoryRepository;
        this.cityRepository = cityRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard() {
        return new AdminDashboardResponse(
                userRepository.count(),
                userRepository.countByRole(Role.ORGANIZER),
                eventRepository.count(),
                eventRepository.countByStatus(EventStatus.PENDING),
                bookingRepository.count());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> bookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(BookingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> users(Role role) {
        List<User> users = role == null
                ? userRepository.findAllByOrderByNameAsc()
                : userRepository.findByRoleOrderByNameAsc(role);
        return users.stream().map(UserResponseDTO::from).toList();
    }

    @Transactional
    public UserResponseDTO changeRole(Long userId, RoleUpdateRequest request, String actorEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        if (user.getEmail().equalsIgnoreCase(actorEmail)) {
            throw new ForbiddenOperationException("Administrators cannot change their own role");
        }
        user.setRole(request.role());
        return UserResponseDTO.from(user);
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "categories", key = "'all'")
    public List<NamedResourceResponse> categories() {
        return categoryRepository.findAllByOrderByNameAsc().stream()
                .map(item -> new NamedResourceResponse(item.getId(), item.getName())).toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(cacheNames = "cities", key = "'all'")
    public List<NamedResourceResponse> cities() {
        return cityRepository.findAllByOrderByNameAsc().stream()
                .map(item -> new NamedResourceResponse(item.getId(), item.getName())).toList();
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", allEntries = true)
    public NamedResourceResponse createCategory(NamedResourceRequest request) {
        Category category = new Category();
        category.setName(normalizeName(request.name()));
        Category saved = categoryRepository.save(category);
        LOGGER.info("Created category id={}", saved.getId());
        return new NamedResourceResponse(saved.getId(), saved.getName());
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", allEntries = true)
    public NamedResourceResponse updateCategory(Long id, NamedResourceRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        category.setName(normalizeName(request.name()));
        return new NamedResourceResponse(category.getId(), category.getName());
    }

    @Transactional
    @CacheEvict(cacheNames = "categories", allEntries = true)
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", id));
        categoryRepository.delete(category);
    }

    @Transactional
    @CacheEvict(cacheNames = "cities", allEntries = true)
    public NamedResourceResponse createCity(NamedResourceRequest request) {
        City city = new City();
        city.setName(normalizeName(request.name()));
        City saved = cityRepository.save(city);
        LOGGER.info("Created city id={}", saved.getId());
        return new NamedResourceResponse(saved.getId(), saved.getName());
    }

    @Transactional
    @CacheEvict(cacheNames = "cities", allEntries = true)
    public NamedResourceResponse updateCity(Long id, NamedResourceRequest request) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City", id));
        city.setName(normalizeName(request.name()));
        return new NamedResourceResponse(city.getId(), city.getName());
    }

    @Transactional
    @CacheEvict(cacheNames = "cities", allEntries = true)
    public void deleteCity(Long id) {
        City city = cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City", id));
        cityRepository.delete(city);
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }
}

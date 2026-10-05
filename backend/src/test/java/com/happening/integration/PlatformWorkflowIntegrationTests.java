package com.happening.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.PATCH;
import static org.springframework.http.HttpMethod.POST;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.happening.dto.NamedResourceRequest;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.Role;
import com.happening.entity.User;
import com.happening.repository.BookingRepository;
import com.happening.repository.CategoryRepository;
import com.happening.repository.CityRepository;
import com.happening.repository.EventEmbeddingRepository;
import com.happening.repository.EventRepository;
import com.happening.repository.FavoriteRepository;
import com.happening.repository.ReviewRepository;
import com.happening.repository.UserRepository;
import com.happening.service.AdminService;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class PlatformWorkflowIntegrationTests {
    private static final String PASSWORD = "ReliablePassword123";
    private static final String TEST_JWT_SECRET = createTestJwtSecret();

    @DynamicPropertySource
    static void configureTestJwtSecret(DynamicPropertyRegistry registry) {
        registry.add("app.jwt.secret", () -> TEST_JWT_SECRET);
    }

    @LocalServerPort
    private int port;
    private final HttpClient httpClient = HttpClient.newHttpClient();
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CategoryRepository categoryRepository;
    @Autowired
    private CityRepository cityRepository;
    @Autowired
    private EventRepository eventRepository;
    @Autowired
    private BookingRepository bookingRepository;
    @Autowired
    private FavoriteRepository favoriteRepository;
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private EventEmbeddingRepository embeddingRepository;
    @Autowired
    private AdminService adminService;
    @Autowired
    private CacheManager cacheManager;

    private Category category;
    private City city;

    @BeforeEach
    void cleanDatabaseAndSeedCatalogs() {
        bookingRepository.deleteAll();
        favoriteRepository.deleteAll();
        reviewRepository.deleteAll();
        embeddingRepository.deleteAll();
        eventRepository.deleteAll();
        userRepository.deleteAll();
        categoryRepository.deleteAll();
        cityRepository.deleteAll();
        cacheManager.getCache("categories").clear();
        cacheManager.getCache("cities").clear();

        category = new Category();
        category.setName("Music");
        category = categoryRepository.save(category);
        city = new City();
        city.setName("Pune");
        city = cityRepository.save(city);
    }

    @Test
    void registrationLoginEventApprovalAndBookingPersistThroughHttpWorkflow() throws Exception {
        HttpResult register = request(
                "/api/auth/register", "POST", registration("organizer@example.com"), null);
        assertEquals(201, register.status());
        assertEquals("USER", register.body().path("role").asText());

        User organizer = userRepository.findByEmailIgnoreCase("organizer@example.com").orElseThrow();
        organizer.setRole(Role.ORGANIZER);
        userRepository.saveAndFlush(organizer);
        String organizerToken = login("organizer@example.com");

        HttpResult eventCreated = request(
                "/api/events", "POST", eventRequest(), organizerToken);
        assertEquals(201, eventCreated.status());
        long eventId = eventCreated.body().path("id").asLong();
        assertEquals("PENDING", eventCreated.body().path("status").asText());
        assertEquals(5, eventCreated.body().path("availableSeats").asInt());

        User admin = new User();
        admin.setName("Platform Admin");
        admin.setEmail("admin@example.com");
        admin.setPhone("+15550000000");
        admin.setPassword(passwordEncoder.encode(PASSWORD));
        admin.setRole(Role.ADMIN);
        userRepository.saveAndFlush(admin);
        String adminToken = login("admin@example.com");
        HttpResult approval = request(
                "/api/admin/events/" + eventId + "/approve",
                "PATCH",
                null,
                adminToken);
        assertEquals(200, approval.status());
        assertEquals("APPROVED", approval.body().path("status").asText());

        HttpResult attendeeRegistration = request(
                "/api/auth/register", "POST", registration("attendee@example.com"), null);
        assertEquals(201, attendeeRegistration.status());
        String attendeeToken = login("attendee@example.com");

        HttpResult publicEvents = request(
                "/api/events?cityId=" + city.getId() + "&categoryId=" + category.getId(),
                "GET",
                null,
                attendeeToken);
        assertEquals(200, publicEvents.status());
        assertEquals(eventId, publicEvents.body().path("content").path(0).path("id").asLong());

        HttpResult booking = request(
                "/api/bookings",
                "POST",
                Map.of("eventId", eventId, "quantity", 2),
                attendeeToken);
        assertEquals(201, booking.status());
        assertEquals(
                0,
                new BigDecimal("50.00").compareTo(booking.body().path("totalAmount").decimalValue()));

        assertEquals(3, eventRepository.findById(eventId).orElseThrow().getAvailableSeats());
        assertEquals(200, request("/api/reviews/me", "GET", null, attendeeToken).status());
        assertEquals(403, request("/api/reviews/me", "GET", null, adminToken).status());
        assertEquals(403, request("/api/admin/bookings", "GET", null, attendeeToken).status());
        HttpResult adminBookings = request("/api/admin/bookings", "GET", null, adminToken);
        assertEquals(200, adminBookings.status());
        assertEquals(1, adminBookings.body().size());

        HttpResult forbiddenEventCreate = request(
                "/api/events", "POST", eventRequest(), attendeeToken);
        assertEquals(403, forbiddenEventCreate.status());
        HttpResult userMetrics = request("/actuator/metrics", "GET", null, attendeeToken);
        assertEquals(403, userMetrics.status());
    }

    @Test
    void registrationRejectsInvalidAndDuplicateEmailsOverHttp() throws Exception {
        HttpResult invalid = request(
                "/api/auth/register",
                "POST",
                Map.of("name", "", "email", "not-an-email", "phone", "", "password", "short"),
                null);
        assertEquals(400, invalid.status());

        HttpResult first = request(
                "/api/auth/register", "POST", registration("duplicate@example.com"), null);
        HttpResult duplicate = request(
                "/api/auth/register", "POST", registration("duplicate@example.com"), null);

        assertEquals(201, first.status());
        assertEquals(409, duplicate.status());
    }

    @Test
    void categoryCacheAvoidsRepeatedReadsAndMutationEvictsItsEntry() {
        assertEquals("Music", adminService.categories().get(0).name());
        assertNotNull(cacheManager.getCache("categories").get("all"));

        category.setName("Changed outside service");
        categoryRepository.saveAndFlush(category);
        adminService.categories();
        assertEquals("Music", adminService.categories().get(0).name());

        adminService.updateCategory(category.getId(), new NamedResourceRequest("Live Music"));

        assertEquals("Live Music", adminService.categories().get(0).name());
    }

    @Test
    void actuatorHealthIsPublicWhileMetricsRequireAdministrator() throws Exception {
        HttpResult publicHealth = request("/actuator/health", "GET", null, null);
        assertEquals(200, publicHealth.status());
        assertEquals("UP", publicHealth.body().path("status").asText());

        HttpResult anonymousMetrics = request("/actuator/metrics", "GET", null, null);
        assertEquals(401, anonymousMetrics.status());

        User admin = new User();
        admin.setName("Platform Admin");
        admin.setEmail("monitor@example.com");
        admin.setPhone("+15550000000");
        admin.setPassword(passwordEncoder.encode(PASSWORD));
        admin.setRole(Role.ADMIN);
        userRepository.saveAndFlush(admin);
        HttpResult adminMetrics = request(
                "/actuator/metrics", "GET", null, login("monitor@example.com"));
        assertEquals(200, adminMetrics.status());
    }

    private Map<String, String> registration(String email) {
        return Map.of(
                "name", "Test Person",
                "email", email,
                "phone", "+15551234567",
                "password", PASSWORD);
    }

    private String login(String email) throws Exception {
        HttpResult response = request(
                "/api/auth/login", "POST", Map.of("email", email, "password", PASSWORD), null);
        assertEquals(200, response.status());
        String token = response.body().path("accessToken").asText();
        assertNotNull(token);
        return token;
    }

    private HttpResult request(String path, String method, Object body, String token) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Accept", MediaType.APPLICATION_JSON_VALUE);
        if (body != null) {
            builder.header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                    .method(method, HttpRequest.BodyPublishers.ofString(
                            objectMapper.writeValueAsString(body)));
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        HttpResponse<String> response = httpClient.send(
                builder.build(), HttpResponse.BodyHandlers.ofString());
        JsonNode responseBody = response.body().isBlank()
                ? objectMapper.createObjectNode()
                : objectMapper.readTree(response.body());
        return new HttpResult(response.statusCode(), responseBody);
    }

    private Map<String, Object> eventRequest() {
        return Map.ofEntries(
                Map.entry("title", "Live Music Night"),
                Map.entry("description", "A live indie music performance and community gathering."),
                Map.entry("categoryId", category.getId()),
                Map.entry("cityId", city.getId()),
                Map.entry("venue", "Central Hall"),
                Map.entry("date", LocalDate.now().plusDays(15).toString()),
                Map.entry("time", LocalTime.of(19, 0).toString()),
                Map.entry("price", new BigDecimal("25.00")),
                Map.entry("capacity", 5));
    }

    private record HttpResult(int status, JsonNode body) {
    }

    private static String createTestJwtSecret() {
        byte[] key = new byte[32];
        new SecureRandom().nextBytes(key);
        return Base64.getEncoder().encodeToString(key);
    }
}

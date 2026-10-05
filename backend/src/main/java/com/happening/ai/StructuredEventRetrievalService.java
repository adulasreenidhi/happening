package com.happening.ai;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.happening.dto.EventResponse;
import com.happening.entity.Category;
import com.happening.entity.City;
import com.happening.entity.Event;
import com.happening.entity.EventStatus;
import com.happening.repository.CategoryRepository;
import com.happening.repository.CityRepository;
import com.happening.repository.EventRepository;

@Service
public class StructuredEventRetrievalService {
    private static final int MAX_STRUCTURED_EVENTS = 50;
    private static final Pattern ISO_DATE = Pattern.compile("\\b(\\d{4}-\\d{2}-\\d{2})\\b");
    private static final Pattern BUDGET = Pattern.compile(
            "(?:under|below|less than|up to|upto|within|budget(?: of)?|maximum(?: of)?)"
                    + "\\s*(?:₹|rs\\.?|inr|\\$)?\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)",
            Pattern.CASE_INSENSITIVE);
    private static final Set<String> STOP_WORDS = Set.of(
            "find", "show", "recommend", "recommendation", "event", "events", "happening",
            "happenings", "near", "around", "with", "that", "this", "what", "where",
            "when", "for", "and", "the", "are", "some", "please", "want", "looking");

    private final EventRepository eventRepository;
    private final CityRepository cityRepository;
    private final CategoryRepository categoryRepository;

    public StructuredEventRetrievalService(
            EventRepository eventRepository,
            CityRepository cityRepository,
            CategoryRepository categoryRepository) {
        this.eventRepository = eventRepository;
        this.cityRepository = cityRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public StructuredResults search(String query) {
        AssistantQueryConstraints constraints = parseConstraints(query);
        Specification<Event> specification = filterSpecification(constraints);
        List<Event> events = eventRepository.findAll(
                        specification,
                        PageRequest.of(0, MAX_STRUCTURED_EVENTS, Sort.by("date").ascending()))
                .getContent();
        List<String> keywords = keywords(query, constraints);
        boolean prioritizeLowerPrices = query.toLowerCase(Locale.ROOT)
                .matches("(?s).*(\\baffordable\\b|\\bcheap(?:er)?\\b|\\blow[- ]cost\\b).*");
        Comparator<Event> eventOrder = Comparator
                .comparingInt((Event event) -> textScore(event, keywords)).reversed()
                .thenComparing(Event::getDate)
                .thenComparing(Event::getTime);
        if (prioritizeLowerPrices) {
            eventOrder = Comparator.comparing(Event::getPrice).thenComparing(eventOrder);
        }
        events = events.stream()
                .sorted(eventOrder)
                .toList();
        return new StructuredResults(
                constraints,
                events.stream().map(EventResponse::from).toList());
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getApprovedEventsByIds(
            List<Long> ids,
            AssistantQueryConstraints constraints) {
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, Event> events = eventRepository.findAllById(ids).stream()
                .filter(event -> matches(event, constraints))
                .collect(Collectors.toMap(Event::getId, event -> event));
        return ids.stream()
                .map(events::get)
                .filter(event -> event != null)
                .map(EventResponse::from)
                .toList();
    }

    private AssistantQueryConstraints parseConstraints(String query) {
        String normalized = query.toLowerCase(Locale.ROOT);
        City city = cityRepository.findAll().stream()
                .filter(item -> normalized.contains(item.getName().toLowerCase(Locale.ROOT)))
                .max(Comparator.comparingInt(item -> item.getName().length()))
                .orElse(null);
        Category category = categoryRepository.findAll().stream()
                .filter(item -> normalized.contains(item.getName().toLowerCase(Locale.ROOT)))
                .max(Comparator.comparingInt(item -> item.getName().length()))
                .orElse(null);

        DateRange dateRange = dateRange(normalized);
        BigDecimal maximumPrice = maximumPrice(query);
        Boolean available = normalized.matches(
                "(?s).*\\b(unavailable|sold out|no seats|fully booked)\\b.*")
                ? Boolean.FALSE
                : normalized.matches("(?s).*\\b(available|availability|seats? left|bookable)\\b.*")
                        ? Boolean.TRUE
                        : null;
        return new AssistantQueryConstraints(
                city == null ? null : city.getId(),
                city == null ? null : city.getName(),
                category == null ? null : category.getId(),
                category == null ? null : category.getName(),
                dateRange.from(),
                dateRange.to(),
                maximumPrice,
                available);
    }

    private DateRange dateRange(String query) {
        LocalDate today = LocalDate.now();
        if (query.matches("(?s).*\\b(today|tonight)\\b.*")) {
            return new DateRange(today, today);
        }
        if (query.matches("(?s).*\\btomorrow\\b.*")) {
            LocalDate tomorrow = today.plusDays(1);
            return new DateRange(tomorrow, tomorrow);
        }
        if (query.matches("(?s).*\\bthis weekend\\b.*")) {
            LocalDate saturday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));
            if (today.getDayOfWeek() == DayOfWeek.SUNDAY) {
                saturday = today.minusDays(1);
            }
            return new DateRange(saturday, saturday.plusDays(1));
        }
        if (query.matches("(?s).*\\bnext week\\b.*")) {
            LocalDate monday = today.with(TemporalAdjusters.next(DayOfWeek.MONDAY));
            return new DateRange(monday, monday.plusDays(6));
        }
        Matcher matcher = ISO_DATE.matcher(query);
        List<LocalDate> dates = matcher.results()
                .map(result -> parseDate(result.group(1)))
                .filter(date -> date != null)
                .limit(2)
                .toList();
        if (dates.size() == 2) {
            return dates.get(0).isAfter(dates.get(1))
                    ? new DateRange(dates.get(1), dates.get(0))
                    : new DateRange(dates.get(0), dates.get(1));
        }
        if (dates.size() == 1) {
            return new DateRange(dates.get(0), dates.get(0));
        }
        return new DateRange(null, null);
    }

    private LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            return null;
        }
    }

    private BigDecimal maximumPrice(String query) {
        if (query.toLowerCase(Locale.ROOT).matches("(?s).*\\bfree\\b.*")) {
            return BigDecimal.ZERO;
        }
        Matcher matcher = BUDGET.matcher(query);
        if (!matcher.find()) {
            return null;
        }
        try {
            return new BigDecimal(matcher.group(1).replace(",", ""));
        } catch (NumberFormatException exception) {
            return null;
        }
    }

    private Specification<Event> filterSpecification(AssistantQueryConstraints constraints) {
        return (root, query, builder) -> {
            var predicate = builder.equal(root.get("status"), EventStatus.APPROVED);
            LocalDate minimumDate = constraints.fromDate() == null
                    ? LocalDate.now()
                    : constraints.fromDate();
            predicate = builder.and(predicate, builder.greaterThanOrEqualTo(
                    root.get("date"), minimumDate));
            if (constraints.cityId() != null) {
                predicate = builder.and(predicate, builder.equal(
                        root.get("city").get("id"), constraints.cityId()));
            }
            if (constraints.categoryId() != null) {
                predicate = builder.and(predicate, builder.equal(
                        root.get("category").get("id"), constraints.categoryId()));
            }
            if (constraints.toDate() != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(
                        root.get("date"), constraints.toDate()));
            }
            if (constraints.maximumPrice() != null) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(
                        root.get("price"), constraints.maximumPrice()));
            }
            if (Boolean.TRUE.equals(constraints.availableOnly())) {
                predicate = builder.and(predicate, builder.greaterThan(
                        root.get("availableSeats"), 0));
            } else if (Boolean.FALSE.equals(constraints.availableOnly())) {
                predicate = builder.and(predicate, builder.lessThanOrEqualTo(
                        root.get("availableSeats"), 0));
            }
            return predicate;
        };
    }

    private boolean matches(Event event, AssistantQueryConstraints constraints) {
        if (event.getStatus() != EventStatus.APPROVED
                || event.getDate().isBefore(constraints.fromDate() == null
                        ? LocalDate.now()
                        : constraints.fromDate())) {
            return false;
        }
        if (constraints.cityId() != null
                && !constraints.cityId().equals(event.getCity().getId())) {
            return false;
        }
        if (constraints.categoryId() != null
                && !constraints.categoryId().equals(event.getCategory().getId())) {
            return false;
        }
        if (constraints.toDate() != null && event.getDate().isAfter(constraints.toDate())) {
            return false;
        }
        if (constraints.maximumPrice() != null
                && event.getPrice().compareTo(constraints.maximumPrice()) > 0) {
            return false;
        }
        return !Boolean.TRUE.equals(constraints.availableOnly()) || event.getAvailableSeats() > 0;
    }

    private List<String> keywords(String query, AssistantQueryConstraints constraints) {
        String withoutKnownFilters = query.toLowerCase(Locale.ROOT);
        if (constraints.city() != null) {
            withoutKnownFilters = withoutKnownFilters.replace(
                    constraints.city().toLowerCase(Locale.ROOT), " ");
        }
        if (constraints.category() != null) {
            withoutKnownFilters = withoutKnownFilters.replace(
                    constraints.category().toLowerCase(Locale.ROOT), " ");
        }
        return List.of(withoutKnownFilters.split("[^\\p{L}\\p{N}]+")).stream()
                .filter(word -> word.length() > 2 && !STOP_WORDS.contains(word))
                .distinct()
                .toList();
    }

    private int textScore(Event event, List<String> keywords) {
        String searchable = (event.getTitle() + " " + event.getDescription() + " "
                + event.getCategory().getName() + " " + event.getCity().getName())
                .toLowerCase(Locale.ROOT);
        return (int) keywords.stream().filter(searchable::contains).count();
    }

    public record StructuredResults(
            AssistantQueryConstraints constraints,
            List<EventResponse> events) {
    }

    private record DateRange(LocalDate from, LocalDate to) {
    }
}

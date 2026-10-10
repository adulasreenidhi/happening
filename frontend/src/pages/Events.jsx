import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getCategories, getCities, getEvents } from "../services/events";

const PAGE_SIZE = 9;

function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState({ content: [], number: 0, totalPages: 0, totalElements: 0 });
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedQuery, setLoadedQuery] = useState("");
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const search = searchParams.get("search") ?? "";
  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const date = searchParams.get("date") ?? "";
  const fromDate = searchParams.get("fromDate") ?? "";
  const toDate = searchParams.get("toDate") ?? "";
  const free = searchParams.get("free") ?? "";
  const available = searchParams.get("available") ?? "";
  const currentPage = Math.max(0, Number(searchParams.get("page") ?? 0));
  const sort = searchParams.get("sort") ?? "date,asc";
  const queryKey = searchParams.toString();

  const activeFilters = [
    { key: "search", label: `Search: “${search}”`, active: Boolean(search) },
    { key: "city", label: `City: ${city}`, active: Boolean(city) },
    { key: "category", label: `Category: ${category}`, active: Boolean(category) },
    { key: "date", label: `On: ${date}`, active: Boolean(date) },
    { key: "fromDate", label: `From: ${fromDate}`, active: Boolean(fromDate) },
    { key: "toDate", label: `To: ${toDate}`, active: Boolean(toDate) },
    { key: "free", label: free === "true" ? "Free events" : "Paid events", active: Boolean(free) },
    { key: "available", label: available === "true" ? "Seats available" : "Sold out", active: Boolean(available) },
  ].filter((f) => f.active);

  const activeFilterCount = activeFilters.length;

  useEffect(() => {
    let active = true;
    Promise.all([getCategories(), getCities()])
      .then(([categoryResult, cityResult]) => {
        if (active) {
          setCategories(categoryResult.data);
          setCities(cityResult.data);
          setCatalogsLoaded(true);
        }
      })
      .catch(() => {
        if (active) {
          setError("Event filters could not be loaded. Please try again.");
          setCatalogsLoaded(true);
        }
      });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    let active = true;
    const cityMatch = cities.find((item) => item.name.toLowerCase() === city.trim().toLowerCase());
    const categoryMatch = categories.find((item) => item.name.toLowerCase() === category.trim().toLowerCase());

    const params = {
      search: search.trim() || undefined,
      cityId: city ? cityMatch?.id : undefined,
      categoryId: category ? categoryMatch?.id : undefined,
      date: searchParams.get("date") || undefined,
      fromDate: searchParams.get("fromDate") || undefined,
      toDate: searchParams.get("toDate") || undefined,
      free: searchParams.has("free") ? searchParams.get("free") : undefined,
      available: searchParams.has("available") ? searchParams.get("available") : undefined,
      page: currentPage,
      size: PAGE_SIZE,
      sort,
    };

    if ((city && !cityMatch) || (category && !categoryMatch)) {
      return undefined;
    }

    getEvents(params)
      .then(({ data }) => {
        if (active) setPage(data);
      })
      .catch(() => {
        if (active) setError("We couldn’t load events. Check your connection and try again.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadedQuery(queryKey);
        }
      });

    return () => {
      active = false;
    };
  }, [search, city, category, searchParams, currentPage, sort, categories, cities, retry, queryKey]);

  const invalidFilter = catalogsLoaded && (
    (city && !cities.some((item) => item.name.toLowerCase() === city.trim().toLowerCase())) ||
    (category && !categories.some((item) => item.name.toLowerCase() === category.trim().toLowerCase()))
  );

  const isLoading = !invalidFilter && (loading || loadedQuery !== queryKey);
  const visiblePage = invalidFilter ? { ...page, content: [], totalElements: 0 } : page;

  function updateFilter(key, value) {
    setError("");
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function clearAllFilters() {
    setError("");
    setSearchParams({}, { replace: true });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 0) next.delete("page");
    else next.set("page", String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="events-discovery-page container">
      {/* Page Header */}
      <div className="discovery-header">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          CITY DISCOVERY
        </span>
        <h1>Events worth <em>showing up for.</em></h1>
        <p>Explore live music, art exhibitions, tech meetups, and workshops in your city.</p>
      </div>

      {/* Primary Discovery Bar */}
      <div className="discovery-controls-card">
        <div className="discovery-primary-row">
          {/* Main search bar */}
          <div className="discovery-search-input">
            <span className="search-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              aria-label="Search events"
              placeholder="Search by event title, artist or keyword..."
              value={search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-input-btn"
                aria-label="Clear search"
                onClick={() => updateFilter("search", "")}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick city selector */}
          <div className="quick-select-wrapper">
            <select
              aria-label="Filter by city"
              value={city}
              onChange={(e) => updateFilter("city", e.target.value)}
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Quick category selector */}
          <div className="quick-select-wrapper">
            <select
              aria-label="Filter by category"
              value={category}
              onChange={(e) => updateFilter("category", e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Filter toggle trigger */}
          <button
            type="button"
            className={`button ${filtersOpen || activeFilterCount > 0 ? "button-dark" : "button-light"} filter-toggle-btn`}
            onClick={() => setFiltersOpen((open) => !open)}
            aria-expanded={filtersOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="filter-count-badge">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Expandable Advanced Filters Drawer / Panel */}
        {filtersOpen && (
          <div className="advanced-filter-panel">
            <div className="filter-grid">
              <label className="filter-field">
                <span>Specific date</span>
                <input
                  type="date"
                  aria-label="Filter by exact date"
                  value={date}
                  onChange={(e) => updateFilter("date", e.target.value)}
                />
              </label>

              <label className="filter-field">
                <span>From date</span>
                <input
                  type="date"
                  aria-label="Filter from date"
                  value={fromDate}
                  onChange={(e) => updateFilter("fromDate", e.target.value)}
                />
              </label>

              <label className="filter-field">
                <span>To date</span>
                <input
                  type="date"
                  aria-label="Filter to date"
                  value={toDate}
                  onChange={(e) => updateFilter("toDate", e.target.value)}
                />
              </label>

              <label className="filter-field">
                <span>Admission / Price</span>
                <select
                  aria-label="Filter by price"
                  value={free}
                  onChange={(e) => updateFilter("free", e.target.value)}
                >
                  <option value="">Any price</option>
                  <option value="true">Free events only</option>
                  <option value="false">Paid admission only</option>
                </select>
              </label>

              <label className="filter-field">
                <span>Seat availability</span>
                <select
                  aria-label="Filter by availability"
                  value={available}
                  onChange={(e) => updateFilter("available", e.target.value)}
                >
                  <option value="">Any status</option>
                  <option value="true">Available seats only</option>
                  <option value="false">Sold out only</option>
                </select>
              </label>

              <label className="filter-field">
                <span>Sort by</span>
                <select
                  aria-label="Sort events"
                  value={sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                >
                  <option value="date,asc">Soonest date</option>
                  <option value="date,desc">Latest date</option>
                  <option value="price,asc">Price: Low to High</option>
                  <option value="price,desc">Price: High to Low</option>
                  <option value="createdAt,desc">Recently added</option>
                </select>
              </label>
            </div>

            <div className="filter-panel-footer">
              <button
                type="button"
                className="button button-light btn-sm"
                onClick={clearAllFilters}
                disabled={activeFilterCount === 0}
              >
                Clear all filters
              </button>
              <button
                type="button"
                className="button button-dark btn-sm"
                onClick={() => setFiltersOpen(false)}
              >
                Apply & close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="active-filter-chips-row">
          <span className="chips-label">Active filters:</span>
          {activeFilters.map((f) => (
            <button
              key={f.key}
              type="button"
              className="filter-chip"
              onClick={() => updateFilter(f.key, "")}
              title={`Remove ${f.label}`}
            >
              <span>{f.label}</span>
              <span className="chip-remove" aria-hidden="true">✕</span>
            </button>
          ))}
          <button
            type="button"
            className="clear-all-link"
            onClick={clearAllFilters}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Status & Count */}
      <div className="discovery-results-meta">
        <span className="results-count">
          {isLoading ? (
            "Finding events..."
          ) : (
            `${visiblePage.totalElements} ${visiblePage.totalElements === 1 ? "event" : "events"} found`
          )}
        </span>
      </div>

      {/* Main Results Content */}
      {isLoading ? (
        <div className="discovery-loading-wrapper">
          <p className="state-message" role="status">Finding what’s happening…</p>
        </div>
      ) : error ? (
        <div className="state-panel error-message" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button button-dark btn-sm"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((r) => r + 1);
            }}
          >
            Try again
          </button>
        </div>
      ) : visiblePage.content.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⌕</div>
          <h2>No matching events found.</h2>
          <p>We couldn’t find any events matching your current search and filter criteria.</p>
          <button
            type="button"
            className="button button-dark"
            onClick={clearAllFilters}
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <>
          <div className="events-grid">
            {visiblePage.content.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>

          {/* Clean Pagination Bar */}
          {visiblePage.totalPages > 1 && (
            <nav className="pagination" aria-label="Events pagination">
              <button
                type="button"
                disabled={visiblePage.first}
                onClick={() => changePage(currentPage - 1)}
                aria-label="Previous page"
              >
                ← Prev
              </button>

              {Array.from({ length: visiblePage.totalPages }, (_, i) => i).map((pageNum) => (
                <button
                  type="button"
                  key={pageNum}
                  aria-current={visiblePage.number === pageNum ? "page" : undefined}
                  onClick={() => changePage(pageNum)}
                >
                  {pageNum + 1}
                </button>
              ))}

              <button
                type="button"
                disabled={visiblePage.last}
                onClick={() => changePage(currentPage + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </nav>
          )}
        </>
      )}

      <div className="discovery-footer-nav">
        <Link className="text-link" to="/">← Back to home</Link>
      </div>
    </div>
  );
}

export default Events;

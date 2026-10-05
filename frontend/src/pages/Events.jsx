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
  const search = searchParams.get("search") ?? "";
  const city = searchParams.get("city") ?? "";
  const category = searchParams.get("category") ?? "";
  const currentPage = Math.max(0, Number(searchParams.get("page") ?? 0));
  const sort = searchParams.get("sort") ?? "date,asc";
  const queryKey = searchParams.toString();

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

  const invalidFilter = catalogsLoaded && ((city && !cities.some(
    (item) => item.name.toLowerCase() === city.trim().toLowerCase(),
  )) || (category && !categories.some(
    (item) => item.name.toLowerCase() === category.trim().toLowerCase(),
  )));
  const isLoading = !invalidFilter && (loading || loadedQuery !== queryKey);
  const visiblePage = invalidFilter
    ? { ...page, content: [], totalElements: 0 }
    : page;

  function updateFilter(key, value) {
    setError("");
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next, { replace: true });
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 0) next.delete("page");
    else next.set("page", String(nextPage));
    setSearchParams(next);
  }

  return (
    <section className="section events-page">
      <div className="page-heading">
        <span className="eyebrow">GET OUT THERE</span>
        <h1>Events worth <em>showing up for.</em></h1>
        <p>Find something good happening around you.</p>
      </div>
      <div className="events-filter">
        <label>
          <span>Search</span>
          <input aria-label="Search events" placeholder="Title or description" value={search} onChange={(event) => updateFilter("search", event.target.value)} />
        </label>
        <label>
          <span>City</span>
          <select aria-label="Filter by city" value={city} onChange={(event) => updateFilter("city", event.target.value)}>
            <option value="">All cities</option>
            {cities.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span>Category</span>
          <select aria-label="Filter by category" value={category} onChange={(event) => updateFilter("category", event.target.value)}>
            <option value="">All categories</option>
            {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </select>
        </label>
        <label>
          <span>On date</span>
          <input aria-label="Filter by date" type="date" value={searchParams.get("date") ?? ""} onChange={(event) => updateFilter("date", event.target.value)} />
        </label>
        <label>
          <span>From</span>
          <input aria-label="Filter from date" type="date" value={searchParams.get("fromDate") ?? ""} onChange={(event) => updateFilter("fromDate", event.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input aria-label="Filter to date" type="date" value={searchParams.get("toDate") ?? ""} onChange={(event) => updateFilter("toDate", event.target.value)} />
        </label>
        <label>
          <span>Price</span>
          <select aria-label="Filter by price" value={searchParams.get("free") ?? ""} onChange={(event) => updateFilter("free", event.target.value)}>
            <option value="">Any price</option><option value="true">Free</option><option value="false">Paid</option>
          </select>
        </label>
        <label>
          <span>Availability</span>
          <select aria-label="Filter by availability" value={searchParams.get("available") ?? ""} onChange={(event) => updateFilter("available", event.target.value)}>
            <option value="">Any availability</option><option value="true">Seats available</option><option value="false">Sold out</option>
          </select>
        </label>
        <label>
          <span>Sort by</span>
          <select aria-label="Sort events" value={sort} onChange={(event) => updateFilter("sort", event.target.value)}>
            <option value="date,asc">Soonest date</option>
            <option value="date,desc">Latest date</option>
            <option value="price,asc">Price: low to high</option>
            <option value="price,desc">Price: high to low</option>
            <option value="createdAt,desc">Recently added</option>
          </select>
        </label>
      </div>
      {isLoading ? (
        <p className="state-message" role="status">Finding what’s happening…</p>
      ) : error ? (
        <div className="state-panel error-message" role="alert">
          <p>{error}</p>
          <button className="button button-dark" onClick={() => { setLoading(true); setError(""); setRetry((value) => value + 1); }}>Try again</button>
        </div>
      ) : visiblePage.content.length === 0 ? (
        <div className="empty-state"><span>✳</span><h2>No events found.</h2><p>Try a different search or clear some filters.</p><button className="text-link clear-filters" onClick={() => setSearchParams({})}>Clear filters</button></div>
      ) : (
        <>
          <p className="results-count">{visiblePage.totalElements} {visiblePage.totalElements === 1 ? "event" : "events"} to explore</p>
          <div className="events-grid">
            {visiblePage.content.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
          <nav className="pagination" aria-label="Events pages">
            <button type="button" disabled={page.first} onClick={() => changePage(currentPage - 1)}>Previous</button>
            {Array.from({ length: page.totalPages }, (_, index) => index).map((number) => (
              <button type="button" key={number} aria-current={page.number === number ? "page" : undefined} onClick={() => changePage(number)}>{number + 1}</button>
            ))}
            <button type="button" disabled={page.last} onClick={() => changePage(currentPage + 1)}>Next</button>
          </nav>
        </>
      )}
      <p className="events-back"><Link to="/">← Back to discovering</Link></p>
    </section>
  );
}

export default Events;

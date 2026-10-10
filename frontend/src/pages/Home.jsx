import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getCategories, getEvents } from "../services/events";

const DEFAULT_CATEGORIES = [
  { name: "Music", mark: "01" },
  { name: "Arts", mark: "02" },
  { name: "Technology", mark: "03" },
  { name: "Culture", mark: "04" },
  { name: "Workshops", mark: "05" },
  { name: "Community", mark: "06" },
  { name: "Corporate", mark: "07" },
  { name: "Sports", mark: "08" },
];

function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      getEvents({ size: 7, sort: "date,asc" }),
      getCategories(),
    ]).then(([eventsRes, categoriesRes]) => {
      if (!active) return;

      if (eventsRes.status === "fulfilled") {
        setEvents(eventsRes.value.data.content ?? []);
      } else {
        setError("We couldn’t load events right now. Please try again.");
      }

      if (categoriesRes.status === "fulfilled" && categoriesRes.value.data?.length > 0) {
        setCategories(
          categoriesRes.value.data.map((cat, idx) => ({
            id: cat.id,
            name: cat.name,
            mark: String(idx + 1).padStart(2, "0"),
          }))
        );
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    if (date.trim()) params.set("date", date.trim());
    navigate(`/events${params.size ? `?${params}` : ""}`);
  }

  // Filter out past events
  const validUpcomingEvents = events
    .filter((event) => !event.date || new Date(`${event.date}T${event.time || "00:00:00"}`) >= new Date())
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));

  const featuredEvent = validUpcomingEvents[0] || events[0] || null;
  const remainingEvents = featuredEvent
    ? validUpcomingEvents.filter((ev) => ev.id !== featuredEvent.id).slice(0, 6)
    : [];

  const featuredDate = featuredEvent?.date
    ? new Date(`${featuredEvent.date}T${featuredEvent.time || "00:00:00"}`)
    : null;

  return (
    <div className="home-page">
      {/* 1. HERO SECTION */}
      <section className="hero-editorial">
        <div className="hero-editorial-inner container">
          <div className="hero-content">
            <span className="eyebrow">
              <span className="eyebrow-dot" />
              HAPPENING IN YOUR CITY
            </span>

            <h1 className="hero-title">
              Discover something<br />
              <em>worth showing up for.</em>
            </h1>

            <p className="hero-description">
              Good things happen when people come together. Browse curated city concerts,
              workshops, exhibitions, and gatherings across your neighborhood.
            </p>

            {/* Editorial Discovery Search */}
            <form className="hero-search-bar" onSubmit={handleSearch}>
              <div className="hero-search-input-group">
                <span className="search-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  aria-label="Search events"
                  placeholder="Events, artists, workshops..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="hero-search-divider" />

              <div className="hero-search-input-group city-group">
                <span className="search-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </span>
                <input
                  type="text"
                  aria-label="Filter by city"
                  placeholder="Any city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="hero-search-divider" />

              <div className="hero-search-input-group date-group">
                <input
                  type="date"
                  aria-label="Filter by date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <button type="submit" className="button button-dark hero-search-submit">
                <span>Explore</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </form>

            <div className="hero-quick-meta">
              <span>Popular:</span>
              <Link to="/events?category=Music">Music</Link>
              <Link to="/events?category=Arts">Arts</Link>
              <Link to="/events?category=Technology">Technology</Link>
              <Link to="/events?free=true">Free events</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED / THIS WEEKEND HIGHLIGHT */}
      {featuredEvent && (
        <section className="section featured-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">THIS WEEKEND’S PICK</span>
              <h2>Featured <em>experience.</em></h2>
            </div>
            <Link className="text-link" to="/events">
              All events <span>↗</span>
            </Link>
          </div>

          <article className="featured-marquee-card">
            <div className="featured-media">
              {featuredEvent.imageUrl ? (
                <img src={featuredEvent.imageUrl} alt={featuredEvent.title} />
              ) : (
                <div className="featured-fallback-art">
                  <span>{featuredEvent.categoryName || "FEATURED"}</span>
                  <p>{featuredEvent.cityName || "CITY EXPERIENCE"}</p>
                </div>
              )}
              {featuredDate && (
                <div className="featured-date-badge">
                  <strong>{featuredDate.toLocaleDateString(undefined, { day: "2-digit" })}</strong>
                  <span>{featuredDate.toLocaleDateString(undefined, { month: "short" })}</span>
                </div>
              )}
            </div>

            <div className="featured-content">
              <div className="featured-tag-row">
                <span className="category-tag">{featuredEvent.categoryName || "City Event"}</span>
                {featuredEvent.cityName && (
                  <span className="badge badge-neutral">{featuredEvent.cityName}</span>
                )}
                <span className="featured-seats-indicator">
                  {featuredEvent.availableSeats === 0
                    ? "Sold out"
                    : `${featuredEvent.availableSeats} seats left`}
                </span>
              </div>

              <h3 className="featured-title">
                <Link to={`/events/${featuredEvent.id}`}>{featuredEvent.title}</Link>
              </h3>

              <p className="featured-desc">{featuredEvent.description}</p>

              <div className="featured-details-row">
                <div className="detail-item">
                  <span className="detail-label">When</span>
                  <strong>
                    {featuredDate ? featuredDate.toLocaleDateString(undefined, { dateStyle: "medium" }) : "Upcoming"}
                    {featuredEvent.time ? ` at ${featuredEvent.time.slice(0, 5)}` : ""}
                  </strong>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Where</span>
                  <strong>{featuredEvent.venue}</strong>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Admission</span>
                  <strong>
                    {Number(featuredEvent.price) === 0 ? "Free" : `₹${featuredEvent.price}`}
                  </strong>
                </div>
              </div>

              <div className="featured-actions">
                <Link className="button button-dark btn-lg" to={`/events/${featuredEvent.id}`}>
                  View event & tickets
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </article>
        </section>
      )}

      {/* 3. EXPLORE BY INTEREST */}
      <section className="section interest-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">EXPLORE BY INTEREST</span>
            <h2>Find what <em>moves you.</em></h2>
          </div>
          <Link className="text-link" to="/categories">
            View all categories <span>↗</span>
          </Link>
        </div>

        <div className="interest-grid">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id || cat.name}
              className="interest-card"
              to={`/events?category=${encodeURIComponent(cat.name)}`}
            >
              <span className="interest-num">{cat.mark}</span>
              <div className="interest-content">
                <strong>{cat.name}</strong>
                <span className="interest-arrow" aria-hidden="true">↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. HAPPENING NEAR YOU GRID */}
      <section className="section upcoming-events-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">HAPPENING NEAR YOU</span>
            <h2>Upcoming <em>gatherings.</em></h2>
          </div>
          <Link className="text-link" to="/events">
            See all events ({validUpcomingEvents.length}) <span>↗</span>
          </Link>
        </div>

        {loading ? (
          <p className="state-message" role="status">Finding what’s happening in your city…</p>
        ) : error ? (
          <div className="state-panel error-message" role="alert">
            <p>{error}</p>
            <Link className="text-link" to="/events">Browse all events</Link>
          </div>
        ) : remainingEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✦</div>
            <h3>Your next plan is waiting to unfold.</h3>
            <p>New events are being published and reviewed regularly.</p>
            <Link className="button button-dark" to="/events">Explore all listings</Link>
          </div>
        ) : (
          <div className="events-grid">
            {remainingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* 5. EDITORIAL DISCOVER CALLOUT */}
      <section className="home-editorial-callout">
        <div className="container-narrow home-callout-inner">
          <span className="eyebrow">YOUR CITY IS WAITING</span>
          <h2>Ready to step out into something memorable?</h2>
          <p>
            From quiet acoustic evenings to bustling tech hackathons, find events designed for people who show up.
          </p>
          <div className="callout-actions">
            <Link className="button button-dark btn-lg" to="/events">
              Explore all events <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-light btn-lg" to="/categories">
              Browse categories
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;

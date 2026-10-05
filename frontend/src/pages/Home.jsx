import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/events";

const categories = [
  { name: "Technology", mark: "01" },
  { name: "Corporate", mark: "02" },
  { name: "Music", mark: "03" },
  { name: "Arts", mark: "04" },
  { name: "Dance", mark: "05" },
  { name: "Culture", mark: "06" },
  { name: "Workshops", mark: "07" },
  { name: "Sports", mark: "08" },
];

function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    let active = true;
    getEvents({ size: 3, sort: "date,asc" })
      .then(({ data }) => {
        if (active) setEvents(data.content ?? []);
      })
      .catch(() => {
        if (active) setError("We couldn’t load events right now. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const upcomingEvents = [...events]
    .filter((event) => !event.date || new Date(`${event.date}T${event.time || "00:00:00"}`) >= new Date())
    .sort((first, second) => `${first.date}T${first.time}`.localeCompare(`${second.date}T${second.time}`))
    .slice(0, 3);

  function discover(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (city.trim()) params.set("city", city.trim());
    navigate(`/events${params.size ? `?${params}` : ""}`);
  }

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> YOUR CITY, YOUR MOMENT</span>
          <h1>Discover What’s<br />Happening<span className="hero-period">.</span></h1>
          <p>Good things happen when you show up. Find the events, people and moments that make your city feel alive.</p>
          <form className="discovery-search" onSubmit={discover}>
            <label className="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                aria-label="Search events"
                placeholder="Event, artist or interest"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <span className="search-divider" />
            <label className="search-field city-field">
              <span aria-hidden="true">⌖</span>
              <input
                aria-label="Search by city"
                placeholder="Your city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </label>
            <button type="submit" aria-label="Find events">Find events <span aria-hidden="true">↗</span></button>
          </form>
          <div className="hero-note"><span>✳</span> Find your kind of happening.</div>
        </div>
        <div className="hero-art" role="img" aria-label="A lively city event at sunset">
          <div className="hero-art-top"><span>MAKE ROOM FOR</span><strong>the unexpected.</strong></div>
          <span className="hero-art-stamp">GO<br />OUT<br />THERE <b>↗</b></span>
          <div className="hero-art-caption"><span>01 — 08</span><span>EVERY CITY HAS A STORY</span></div>
        </div>
        <div className="hero-bottom"><span>SCROLL TO EXPLORE</span><span className="hero-bottom-line" /><span>18° 31′ N — 73° 51′ E</span></div>
      </section>

      <section className="section category-section">
        <div className="section-heading">
          <div><span className="eyebrow">A LITTLE BIT OF EVERYTHING</span><h2>Find your <em>thing.</em></h2></div>
          <Link className="text-link" to="/events">Explore all events <span>↗</span></Link>
        </div>
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-tile"
              key={category.name}
              to={`/events?category=${encodeURIComponent(category.name)}`}
            >
              <span>{category.mark}</span><strong>{category.name}</strong><span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section upcoming-section">
        <div className="section-heading">
          <div><span className="eyebrow">MAKE A DATE OF IT</span><h2>Coming <em>up.</em></h2></div>
          <Link className="text-link" to="/events">See all events <span>↗</span></Link>
        </div>
        {loading ? (
          <p className="state-message" role="status">Finding what’s happening…</p>
        ) : error ? (
          <p className="state-message error-message" role="alert">{error} <Link to="/events">Browse events</Link></p>
        ) : upcomingEvents.length === 0 ? (
          <div className="empty-state"><span>✳</span><h3>Your next great plan is waiting.</h3><p>There aren’t any upcoming events here just yet.</p><Link className="text-link" to="/events">Explore events <span>↗</span></Link></div>
        ) : (
          <div className="events-grid">
            {upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}
          </div>
        )}
      </section>

      <section className="home-cta">
        <span className="eyebrow">LESS SCROLLING. MORE LIVING.</span>
        <h2>Your city is calling.</h2>
        <Link className="button button-dark" to="/events">Answer the call <span>↗</span></Link>
      </section>
    </div>
  );
}

export default Home;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCategories, getCities } from "../services/events";

function Catalog({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isCategories = type === "categories";
  const label = isCategories ? "categories" : "cities";

  useEffect(() => {
    let active = true;
    const load = isCategories ? getCategories : getCities;
    load()
      .then(({ data }) => {
        if (active) setItems(data);
      })
      .catch(() => {
        if (active) setError(`We couldn’t load ${label}. Please try again.`);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isCategories, label]);

  return (
    <div className="catalog-index-page container">
      <div className="page-heading">
        <span className="eyebrow">
          <span className="eyebrow-dot" />
          {isCategories ? "INTEREST DIRECTORY" : "CITY DIRECTORY"}
        </span>
        <h1>
          {isCategories ? "Discover by " : "Explore events in your "}
          <em>{isCategories ? "interest." : "city."}</em>
        </h1>
        <p>
          {isCategories
            ? "Browse cultural categories, musical genres, and educational workshops bringing people together."
            : "See what’s happening in urban hubs across the country."}
        </p>
      </div>

      {loading ? (
        <p className="state-message" role="status">Loading {label}…</p>
      ) : error ? (
        <div className="state-panel error-message" role="alert">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✦</div>
          <h2>No {label} to show right now.</h2>
          <p>Check back shortly as new listings and destinations are added to HAPPENING.</p>
          <Link className="button button-dark" to="/events">
            Browse all events →
          </Link>
        </div>
      ) : (
        <div className="catalog-directory-grid">
          {items.map((item, index) => (
            <Link
              key={item.id}
              className="catalog-index-tile"
              to={`/events?${isCategories ? "category" : "city"}=${encodeURIComponent(item.name)}`}
            >
              <span className="tile-index-num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="tile-title-wrap">
                <strong className="tile-name">{item.name}</strong>
                <span className="tile-sublabel">
                  {isCategories ? "Browse category" : "Explore city"}
                </span>
              </div>
              <span className="tile-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}

      <div className="catalog-footer-nav">
        <Link className="text-link" to="/events">
          ← View full event directory
        </Link>
      </div>
    </div>
  );
}

export default Catalog;

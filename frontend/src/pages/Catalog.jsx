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
    <section className="section catalog-page">
      <div className="page-heading">
        <span className="eyebrow">EXPLORE HAPPENING</span>
        <h1>{isCategories ? "Find your kind of " : "Explore events by "}<em>{isCategories ? "event." : "city."}</em></h1>
        <p>{isCategories ? "Browse the interests and experiences bringing people together." : "See what’s on in the places you love."}</p>
      </div>
      {loading ? (
        <p className="state-message" role="status">Loading {label}…</p>
      ) : error ? (
        <p className="error-message" role="alert">{error}</p>
      ) : items.length === 0 ? (
        <div className="empty-state"><h2>No {label} to show yet.</h2><p>Check back soon as HAPPENING grows.</p></div>
      ) : (
        <div className="category-grid">
          {items.map((item, index) => (
            <Link
              className="category-tile"
              key={item.id}
              to={`/events?${isCategories ? "category" : "city"}=${encodeURIComponent(item.name)}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{item.name}</strong>
              <span className="category-arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export default Catalog;

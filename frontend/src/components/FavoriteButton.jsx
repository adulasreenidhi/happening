import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useFavorites } from "../context/useFavorites";

function FavoriteButton({ eventId }) {
  const { isAuthenticated, user } = useAuth();
  const { favoriteIds, toggle, error: loadError } = useFavorites();
  const [error, setError] = useState("");

  if (!isAuthenticated) {
    return (
      <span className="favorite-control">
        <Link
          className="favorite-button"
          to="/login"
          aria-label="Sign in to save this event"
          title="Sign in to save"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </Link>
      </span>
    );
  }

  // Non-attendees (Organizers/Admins) do not favorite events
  if (user?.role !== "USER") return null;

  const isFavorite = favoriteIds.includes(eventId);

  async function handleToggle(e) {
    e.preventDefault();
    e.stopPropagation();
    setError("");
    try {
      await toggle(eventId);
    } catch {
      setError("Could not update saved events.");
    }
  }

  return (
    <span className="favorite-control">
      <button
        className={`favorite-button${isFavorite ? " is-favorite" : ""}`}
        type="button"
        aria-label={isFavorite ? "Remove from saved events" : "Save this event"}
        aria-pressed={isFavorite}
        title={isFavorite ? "Saved" : "Save event"}
        onClick={handleToggle}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
      {(error || loadError) && (
        <span className="favorite-error" role="alert">
          {error || loadError}
        </span>
      )}
    </span>
  );
}

export default FavoriteButton;

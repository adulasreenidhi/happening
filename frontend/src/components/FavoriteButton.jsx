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
        <Link className="favorite-button" to="/login" aria-label="Sign in to save this event">♡</Link>
      </span>
    );
  }
  if (user?.role !== "USER") return null;

  const isFavorite = favoriteIds.includes(eventId);

  async function handleToggle() {
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
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={isFavorite}
        onClick={handleToggle}
      >
        {isFavorite ? "♥" : "♡"}
      </button>
      {(error || loadError) && <span className="favorite-error" role="alert">{error || loadError}</span>}
    </span>
  );
}

export default FavoriteButton;

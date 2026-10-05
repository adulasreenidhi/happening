import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { FavoriteContext } from "./favoriteContext";
import { addFavorite, getMyFavorites, removeFavorite } from "../services/platform";

export function FavoriteProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    getMyFavorites()
      .then(({ data }) => {
        if (active) {
          setFavoriteIds(data.map((favorite) => favorite.eventId));
          setError("");
        }
      })
      .catch(() => {
        if (active) setError("Favorites could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const toggle = useCallback(async (eventId) => {
    const isFavorite = favoriteIds.includes(eventId);
    if (isFavorite) {
      await removeFavorite(eventId);
      setFavoriteIds((current) => current.filter((id) => id !== eventId));
    } else {
      await addFavorite(eventId);
      setFavoriteIds((current) => current.includes(eventId) ? current : [...current, eventId]);
    }
  }, [favoriteIds]);

  const value = useMemo(
    () => ({ favoriteIds, error, toggle }),
    [favoriteIds, error, toggle],
  );

  return <FavoriteContext.Provider value={value}>{children}</FavoriteContext.Provider>;
}

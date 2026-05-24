"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const FAVORITES_STORAGE_KEY = "shopfy-favorites";

type FavoritesContextValue = {
  favoriteIds: string[];
  favoriteIdSet: Set<string>;
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const savedFavorites = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

      if (!savedFavorites) {
        setIsReady(true);
        return;
      }

      try {
        const parsedFavorites = JSON.parse(savedFavorites);

        if (Array.isArray(parsedFavorites)) {
          setFavoriteIds(parsedFavorites.filter((item): item is string => typeof item === "string"));
        }
      } catch {
        setFavoriteIds([]);
      }

      setIsReady(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, isReady]);

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIdSet.has(productId),
    [favoriteIdSet],
  );

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds((currentFavoriteIds) => (
      currentFavoriteIds.includes(productId)
        ? currentFavoriteIds.filter((id) => id !== productId)
        : [...currentFavoriteIds, productId]
    ));
  }, []);

  const contextValue = useMemo(
    () => ({
      favoriteIds,
      favoriteIdSet,
      isFavorite,
      toggleFavorite,
    }),
    [favoriteIdSet, favoriteIds, isFavorite, toggleFavorite],
  );

  return (
    <FavoritesContext.Provider value={contextValue}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used inside FavoritesProvider");
  }

  return context;
}

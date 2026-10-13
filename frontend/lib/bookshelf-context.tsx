"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { getLibrary, getWishlist, type GameOut, type LibraryItem, type WishlistItem } from "@/lib/api";

type Side = "left" | "right";

interface LastAdded {
  side: Side;
  gameId: number;
}

interface BookshelfContextValue {
  library: LibraryItem[];
  wishlist: WishlistItem[];
  lastAdded: LastAdded | null;
  // Optimistic local update so the shelf (and its "just added" pop
  // animation) react immediately on a successful save/mark-played,
  // instead of waiting on a refetch round-trip - see GameActions.tsx.
  noteAdded: (side: Side, game: GameOut) => void;
  noteRemoved: (side: Side, gameId: number) => void;
  // For bulk changes an optimistic update can't express (Steam import
  // adds an unknown set of games in one call - see SteamImport.tsx).
  refetch: () => void;
}

const BookshelfContext = createContext<BookshelfContextValue | null>(null);

// Lives once at the root layout (see app/layout.tsx) - NOT per-page - so
// the data survives navigating between pages that render the margin
// shelves (BookshelfMargins.tsx decides which routes actually show them;
// this provider itself doesn't care) without a refetch or flash of
// empty shelves each time.
export function BookshelfProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);

  const fetchAll = useCallback(async () => {
    if (!isSignedIn) {
      setLibrary([]);
      setWishlist([]);
      return;
    }
    try {
      const token = await getToken();
      const [libraryItems, wishlistItems] = await Promise.all([getLibrary(token), getWishlist(token)]);
      setLibrary(libraryItems);
      setWishlist(wishlistItems);
    } catch {
      // Bookshelves are decorative - if this fails, the margins just stay
      // empty rather than surfacing an error over the main page.
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const noteAdded = useCallback((side: Side, game: GameOut) => {
    const item = { game, added_at: new Date().toISOString() };
    if (side === "left") {
      setLibrary((prev) => (prev.some((i) => i.game.id === game.id) ? prev : [item, ...prev]));
    } else {
      setWishlist((prev) => (prev.some((i) => i.game.id === game.id) ? prev : [item, ...prev]));
    }
    setLastAdded({ side, gameId: game.id });
    // Clears the "just added" flag once the shelf's pop animation has had
    // time to play - without this it would just linger on that id forever.
    window.setTimeout(() => setLastAdded((cur) => (cur?.gameId === game.id ? null : cur)), 700);
  }, []);

  const noteRemoved = useCallback((side: Side, gameId: number) => {
    if (side === "left") setLibrary((prev) => prev.filter((i) => i.game.id !== gameId));
    else setWishlist((prev) => prev.filter((i) => i.game.id !== gameId));
  }, []);

  return (
    <BookshelfContext.Provider value={{ library, wishlist, lastAdded, noteAdded, noteRemoved, refetch: fetchAll }}>
      {children}
    </BookshelfContext.Provider>
  );
}

export function useBookshelf(): BookshelfContextValue {
  const ctx = useContext(BookshelfContext);
  if (!ctx) throw new Error("useBookshelf must be used within BookshelfProvider");
  return ctx;
}

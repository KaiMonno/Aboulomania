"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { addToWishlist, getLibrary, getWishlist, markAsPlayed, type GameOut, type LibraryItem, type WishlistItem } from "@/lib/api";
import { addAnonItem, clearAnonProgress, getAnonProgress, removeAnonItem } from "@/lib/anonProgress";

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
      // Signed out: the shelves reflect local-only progress (see
      // lib/anonProgress.ts) - there's no account yet to fetch from.
      const anon = getAnonProgress();
      setLibrary(anon.library);
      setWishlist(anon.wishlist);
      return;
    }
    try {
      const token = await getToken();

      // Push any progress made before signing in into the now-real account
      // first, so it isn't lost - addToWishlist/markAsPlayed are both
      // idempotent no-ops on a game already saved server-side (confirmed in
      // routers/wishlist.py and profile.py), so this is safe to run even if
      // some of these already exist there. Best-effort (allSettled, not
      // Promise.all) to match this provider's existing "decorative, never
      // block the shelf" error handling below - one failed sync item
      // shouldn't stop the rest or the fetch that follows.
      const anon = getAnonProgress();
      if (anon.library.length > 0 || anon.wishlist.length > 0) {
        await Promise.allSettled([
          ...anon.library.map((item) => markAsPlayed(token, item.game.id)),
          ...anon.wishlist.map((item) => addToWishlist(token, item.game.id)),
        ]);
        clearAnonProgress();
      }

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
    // Signed-out visitors have no account to save this to - persist it
    // locally (see lib/anonProgress.ts) so it survives a reload and gets
    // pushed into their real account the moment they sign in (fetchAll
    // above). Signed-in callers already hit the real backend themselves
    // before calling noteAdded (see GameActions.tsx) - nothing more to do.
    if (!isSignedIn) addAnonItem(side, game);
    setLastAdded({ side, gameId: game.id });
    // Clears the "just added" flag once the shelf's pop animation has had
    // time to play - without this it would just linger on that id forever.
    // Checks `side` too, not just gameId: the same game can be noteAdded
    // on both shelves within 700ms (e.g. wishlisted then marked played in
    // quick succession) - without the side check, the first call's timeout
    // would clear the second call's highlight early, cutting its
    // animation short even though it's a different shelf's entry.
    window.setTimeout(
      () => setLastAdded((cur) => (cur?.gameId === game.id && cur?.side === side ? null : cur)),
      700
    );
  }, [isSignedIn]);

  const noteRemoved = useCallback(
    (side: Side, gameId: number) => {
      if (side === "left") setLibrary((prev) => prev.filter((i) => i.game.id !== gameId));
      else setWishlist((prev) => prev.filter((i) => i.game.id !== gameId));
      // Mirrors noteAdded above - keep local storage in sync for signed-out
      // visitors (e.g. undoing "already played" before ever signing in).
      if (!isSignedIn) removeAnonItem(side, gameId);
    },
    [isSignedIn]
  );

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

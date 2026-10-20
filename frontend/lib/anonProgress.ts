import type { GameOut, LibraryItem, WishlistItem } from "@/lib/api";

// A signed-out visitor's wishlist/played-game picks, kept client-side until
// they sign in (see lib/bookshelf-context.tsx, which pushes these into the
// real account and clears this the moment isSignedIn flips true). localStorage,
// not sessionStorage (unlike resultsCache.ts's cache) - this needs to survive
// closing the tab and coming back later to actually sign in, not just one
// browser session.
const STORAGE_KEY = "gametaste:anonProgress";

type Side = "left" | "right";

interface AnonProgress {
  library: LibraryItem[];
  wishlist: WishlistItem[];
}

const EMPTY: AnonProgress = { library: [], wishlist: [] };

export function getAnonProgress(): AnonProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { library: parsed.library ?? [], wishlist: parsed.wishlist ?? [] };
  } catch {
    return EMPTY;
  }
}

function save(progress: AnonProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Best-effort - if localStorage is unavailable (private browsing, quota),
    // the save/mark-played action still updates in-memory state for this
    // page view, it just won't survive a reload before sign-in. Not worth
    // surfacing an error for a decorative feature.
  }
}

export function addAnonItem(side: Side, game: GameOut): void {
  const progress = getAnonProgress();
  const item = { game, added_at: new Date().toISOString() };
  if (side === "left") {
    if (progress.library.some((i) => i.game.id === game.id)) return;
    save({ ...progress, library: [item, ...progress.library] });
  } else {
    if (progress.wishlist.some((i) => i.game.id === game.id)) return;
    save({ ...progress, wishlist: [item, ...progress.wishlist] });
  }
}

export function removeAnonItem(side: Side, gameId: number): void {
  const progress = getAnonProgress();
  if (side === "left") {
    save({ ...progress, library: progress.library.filter((i) => i.game.id !== gameId) });
  } else {
    save({ ...progress, wishlist: progress.wishlist.filter((i) => i.game.id !== gameId) });
  }
}

export function clearAnonProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort, same as above.
  }
}

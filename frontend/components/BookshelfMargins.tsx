"use client";

import { usePathname } from "next/navigation";
import Bookshelf from "@/components/Bookshelf";
import { useBookshelf } from "@/lib/bookshelf-context";

// Lives in the root layout (always mounted, see app/layout.tsx) so the
// shelves' data survives navigating from "/" into a game's detail page
// instead of refetching/flashing empty - but only actually render on the
// routes where they make sense (browsing results and looking at a single
// game), not e.g. the dedicated /wishlist or /profile pages where a
// margin shelf would be redundant with the page's own content.
const VISIBLE_PREFIXES = ["/", "/games/"];

export default function BookshelfMargins() {
  const pathname = usePathname();
  const { library, wishlist, lastAdded } = useBookshelf();

  const visible = VISIBLE_PREFIXES.some((prefix) => (prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)));
  if (!visible) return null;

  return (
    <>
      <Bookshelf
        side="left"
        label="Owned"
        items={library}
        highlightGameId={lastAdded?.side === "left" ? lastAdded.gameId : null}
      />
      <Bookshelf
        side="right"
        label="Wishlist"
        items={wishlist}
        highlightGameId={lastAdded?.side === "right" ? lastAdded.gameId : null}
      />
    </>
  );
}

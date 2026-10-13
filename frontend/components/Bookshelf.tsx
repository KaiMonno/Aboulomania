"use client";

import Link from "next/link";
import { Book, BookOpen } from "lucide-react";
import type { GameOut } from "@/lib/api";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------
// PLACEHOLDER ASSETS - replace here when you have real book/shelf art.
//
// 1. The shelf "frame" itself is pure CSS below (the <aside>'s border +
//    bg-muted/40 className) - no image file. To use a real shelf
//    background image instead, replace that className with something
//    like `bg-[url('/bookshelf-frame.png')] bg-cover` (drop the image in
//    frontend/public/ first) and drop the border/bg-muted utilities.
// 2. Each "book" is a lucide-react icon (<Book>/<BookOpen> below), tinted
//    via the SPINE_COLORS palette (frontend/app/globals.css, the
//    --spine-1..5 custom properties - also used for fallback game covers
//    in ResultsList.tsx and games/[id]/page.tsx). To use real art, swap
//    the <Book>/<BookOpen> pair for an <img> (e.g. per-genre or per-color
//    spine sprites in frontend/public/) - keep the closed/open pair so
//    the hover "opens the book" effect still works, or replace with
//    whatever your own hover treatment ends up being.
// ---------------------------------------------------------------------
const SPINE_COLORS = ["--spine-1", "--spine-2", "--spine-3", "--spine-4", "--spine-5"] as const;

interface BookshelfProps {
  items: { game: GameOut }[];
  side: "left" | "right";
  label: string;
  // The game id that was just added (if any) - see lib/bookshelf-context.tsx
  // noteAdded - gets a one-shot "pop" entrance animation instead of
  // appearing on the shelf with no transition.
  highlightGameId?: number | null;
}

export default function Bookshelf({ items, side, label, highlightGameId }: BookshelfProps) {
  if (items.length === 0) return null;

  // Tooltips open away from the shelf, into the open page, rather than
  // the default "top" - found live that "top" could render a tooltip
  // overlapping a neighboring spine one row up in a tightly-packed shelf.
  const tooltipSide = side === "left" ? "right" : "left";

  return (
    <aside
      aria-label={label}
      className={cn(
        // Fixed, not in the document flow - can't disturb the existing
        // centered page content. Needs real room to not feel cramped
        // against the max-w-2xl column, so it only shows at xl: and up.
        "fixed top-20 bottom-4 z-10 hidden w-36 flex-col overflow-y-auto rounded-md border bg-muted/40 p-2 xl:flex",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      <p className="mb-2 text-center text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {/* A real bookshelf's spines sit packed edge to edge, wrapping onto
          a new "shelf row" once one fills - flex-wrap gets that for free
          instead of one book per line. */}
      <div className="flex flex-wrap content-start gap-1">
        {items.map(({ game }, index) => (
          <Link key={game.id} href={`/games/${game.id}`} className="group/book shrink-0">
            <Tooltip content={game.name} side={tooltipSide}>
              {/* Closed spine by default; hovering "opens" it (closed ->
                  open book icon swap) alongside the tooltip's title box -
                  stacked + opacity-crossfaded so there's no layout shift. */}
              <span
                className={cn(
                  "relative grid size-7 place-items-center",
                  highlightGameId === game.id && "animate-in zoom-in-50 duration-500"
                )}
              >
                <Book
                  className="col-start-1 row-start-1 size-6 transition-opacity group-hover/book:opacity-0"
                  style={{ color: `var(${SPINE_COLORS[index % SPINE_COLORS.length]})` }}
                  aria-hidden="true"
                />
                <BookOpen
                  className="col-start-1 row-start-1 size-6 opacity-0 transition-opacity group-hover/book:opacity-100"
                  style={{ color: `var(${SPINE_COLORS[index % SPINE_COLORS.length]})` }}
                  aria-hidden="true"
                />
              </span>
            </Tooltip>
          </Link>
        ))}
      </div>
    </aside>
  );
}

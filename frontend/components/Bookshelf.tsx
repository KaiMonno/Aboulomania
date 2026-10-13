"use client";

import Link from "next/link";
import { Book, BookOpen } from "lucide-react";
import type { GameOut } from "@/lib/api";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Same decorative palette ResultsList/the detail page use for fallback
// covers - reusing it here (rather than inventing a second one) is what
// makes this a cheap placeholder: swapping in real book art later is just
// replacing the <Book>/<BookOpen> icons below, nothing structural.
const SPINE_COLORS = ["--spine-1", "--spine-2", "--spine-3", "--spine-4", "--spine-5"] as const;

interface BookshelfProps {
  items: { game: GameOut }[];
  side: "left" | "right";
  label: string;
}

export default function Bookshelf({ items, side, label }: BookshelfProps) {
  if (items.length === 0) return null;

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
      {/* A real bookshelf's spines sit packed edge to edge, wrapping onto a
          new "shelf row" once one fills - flex-wrap gets that for free
          instead of one book per line. */}
      <div className="flex flex-wrap content-start gap-1">
        {items.map(({ game }, index) => (
          <Link key={game.id} href={`/games/${game.id}`} className="group/book shrink-0">
            <Tooltip content={game.name}>
              {/* Closed spine by default; hovering "opens" it (closed ->
                  open book icon swap) alongside the tooltip's title box -
                  stacked + opacity-crossfaded so there's no layout shift. */}
              <span className="relative grid size-7 place-items-center">
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

"use client";

import Link from "next/link";
import { Book } from "lucide-react";
import type { GameOut } from "@/lib/api";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Same decorative palette ResultsList/the detail page use for fallback
// covers - reusing it here (rather than inventing a second one) is what
// makes this a cheap placeholder: swapping in real book art later is just
// replacing the <Book> icon below, nothing structural.
const SPINE_COLORS = ["--spine-1", "--spine-2", "--spine-3", "--spine-4", "--spine-5"] as const;

interface BookshelfProps {
  items: { game: GameOut }[];
  side: "left" | "right";
}

export default function Bookshelf({ items, side }: BookshelfProps) {
  if (items.length === 0) return null;

  return (
    <aside
      aria-label={side === "left" ? "Owned games" : "Wishlisted games"}
      className={cn(
        // Fixed, not in the document flow - can't disturb the existing
        // centered page content. Needs real room to not feel cramped
        // against the max-w-2xl column, so it only shows at xl: and up.
        "fixed top-20 bottom-4 z-10 hidden w-14 flex-col items-center gap-2 overflow-y-auto xl:flex",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      {items.map(({ game }, index) => (
        <Link key={game.id} href={`/games/${game.id}`} className="shrink-0">
          <Tooltip content={game.name}>
            <Book
              className="size-7 transition-transform hover:scale-110"
              style={{ color: `var(${SPINE_COLORS[index % SPINE_COLORS.length]})` }}
              aria-hidden="true"
            />
          </Tooltip>
        </Link>
      ))}
    </aside>
  );
}

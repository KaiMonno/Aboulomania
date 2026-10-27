"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { GameOut } from "@/lib/api";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Shelf frame is now hand-authored pixel art (frontend/public/library/
// shelf-cap.png / shelf-cavity.png / shelf-base.png), not reverse-engineered
// from the "Tiny Library Assets" sheet - four CSS-background-math attempts
// against sheet crops all drifted from the pack's own reference image in
// some way that looked right on paper but not live. These three files are
// pre-trimmed to their real content (verified: Image.getbbox() == the full
// canvas on all three, no transparent margin to miscalculate around) and
// all exactly NATIVE_WIDTH wide, with the wood posts baked directly into
// the art at matching x-offsets in all three pieces (confirmed by sampling
// pixels across shelf-cavity.png, not assumed) - so unlike every earlier
// version, there's no separate flat-color CSS border standing in for a
// post, and no per-piece width that can drift out of sync with another.
//
// shelf-cavity.png is one full shelf level - rail line, dark cavity floor,
// posts on both edges - already proportioned with the right headroom above
// a book (16px tall vs. a 14px-tall spine, 2px of native headroom), not an
// arbitrary multiplier guessed at this end. SCALE is shared by the frame
// and the books specifically so a cavity tile's height always lines up
// exactly with one row of books at any display size, not just by
// coincidence at one particular scale.
const NATIVE_WIDTH = 38;
const NATIVE_POST_WIDTH = 3; // sampled from shelf-cavity.png's post pixels
const NATIVE_CAVITY_HEIGHT = 16;
const NATIVE_SPINE_WIDTH = 6;
const NATIVE_SPINE_HEIGHT = 14;

const SCALE = 4;
const FRAME_WIDTH = NATIVE_WIDTH * SCALE; // 152 - matches the <aside>'s inline width below
const POST_PAD = NATIVE_POST_WIDTH * SCALE; // content inset so books clear the baked-in posts
const ROW_HEIGHT = NATIVE_CAVITY_HEIGHT * SCALE;
const SPINE_WIDTH = NATIVE_SPINE_WIDTH * SCALE;
const SPINE_HEIGHT = NATIVE_SPINE_HEIGHT * SCALE;
const BOOKS_PER_ROW = Math.floor((FRAME_WIDTH - 2 * POST_PAD) / SPINE_WIDTH);

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

// 100% 100% is an exact fit, not a stretch - ROW_HEIGHT is NATIVE_CAVITY_HEIGHT
// * SCALE by construction, so the background box is always precisely one
// native cavity tile at this scale, never distorted.
const CAVITY_ROW_BACKGROUND: CSSProperties = {
  backgroundImage: "url('/library/shelf-cavity.png')",
  backgroundSize: "100% 100%",
  imageRendering: "pixelated",
};

// 15 spine styles (5 colors x 3 cover-pattern variants), each paired with
// the sheet's open-book art for the same row - a real book's *spine* is
// the thin edge that actually faces outward on a shelf, which is what
// "the spine assets" in the sheet means (sheet columns 7/8, ~6x14px native)
// vs. the wider front-cover icons (sheet column 0-3) this used at first.
// Both are trimmed to their tight content bbox before export, so packing
// them with zero gap actually touches - the sheet's own 18x18 tile grid
// has transparent padding baked in, which left gaps even with the flex
// gap itself removed.
const BOOK_SPRITES = Array.from({ length: 15 }, (_, i) => ({
  closed: `/library/spine-${i}.png`,
  open: `/library/open-${i}.png`,
}));

// A stable, well-mixed hash (not Math.random()) - the same game must
// always land on the same spine across re-renders (e.g. a sibling book
// being added shouldn't make every existing spine flicker to a different
// color), while still landing on an effectively unpredictable index
// instead of visibly cycling 0,1,2...14,0,1,2... in id order.
function spineIndexForGame(gameId: number): number {
  let h = gameId;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = (h >> 16) ^ h;
  return Math.abs(h) % BOOK_SPRITES.length;
}

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
  const rows = chunk(items, BOOKS_PER_ROW);

  return (
    <aside
      aria-label={label}
      style={{ width: FRAME_WIDTH }}
      className={cn(
        // Fixed, not in the document flow - can't disturb the existing
        // centered page content. Needs real room to not feel cramped
        // against the max-w-2xl column, so it only shows at xl: and up.
        // Width comes from FRAME_WIDTH (inline style, not a Tailwind
        // class) so it can never drift out of sync with the inner shelf
        // div's own width the way a hardcoded w-44 did after the shelf
        // art's real dimensions changed.
        "fixed top-20 z-10 hidden flex-col xl:flex",
        side === "left" ? "left-4" : "right-4"
      )}
    >
      {/* Plain label above the frame, not layered over the cap art - an
          earlier version put this text inside the shelf-background box
          itself and it sat awkwardly on top of the roof graphic. */}
      <p className="mb-1 text-center text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div className="max-h-[calc(100vh-7rem)] overflow-y-auto" style={{ width: FRAME_WIDTH }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
        <img
          src="/library/shelf-cap.png"
          alt=""
          aria-hidden="true"
          className="block w-full"
          style={{ height: "auto", imageRendering: "pixelated" }}
        />
        {/* Each row is its own fixed-height div with one cavity tile as its
            background (posts included, baked into the art) - padding
            insets the books clear of those posts without drawing anything
            itself, so a row's floor sits directly under its books with no
            separate "reserved space" calculation to drift out of sync with
            the art the way earlier versions did. */}
        <div>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              style={{ ...CAVITY_ROW_BACKGROUND, height: ROW_HEIGHT, paddingLeft: POST_PAD, paddingRight: POST_PAD }}
              className="flex items-end justify-center"
            >
              {row.map(({ game }) => {
                const sprite = BOOK_SPRITES[spineIndexForGame(game.id)];
                return (
                  <Link key={game.id} href={`/games/${game.id}`} className="group/book shrink-0">
                    <Tooltip content={game.name} side={tooltipSide}>
                      {/* Spine sized to fill this span (sets the flex
                          item's real box, so neighbors pack flush against
                          it); the open-book art is intrinsically wider, so
                          it's an absolutely positioned overlay instead of
                          sharing the spine's box - on hover it pops out
                          over neighboring spines rather than pushing them
                          apart, same "open off the shelf" read a real
                          shelf gives when you pull a book partway out. */}
                      <span
                        className={cn(
                          "relative block",
                          highlightGameId === game.id && "animate-in zoom-in-50 duration-500"
                        )}
                        style={{ width: SPINE_WIDTH, height: SPINE_HEIGHT }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
                        <img
                          src={sprite.closed}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 h-full w-full transition-opacity group-hover/book:opacity-0"
                          style={{ imageRendering: "pixelated" }}
                        />
                        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
                        <img
                          src={sprite.open}
                          alt=""
                          aria-hidden="true"
                          // max-w-none: Tailwind's base reset sets img {
                          // max-width: 100% }, which resolves against this
                          // absolutely positioned image's nearest positioned
                          // ancestor (the 18px-wide span above) - without
                          // overriding it, the open art got clamped down to
                          // spine-width or smaller regardless of the
                          // explicit width set below, since max-width always
                          // wins over width in CSS.
                          className="absolute bottom-0 left-1/2 z-10 max-w-none -translate-x-1/2 opacity-0 transition-opacity group-hover/book:opacity-100"
                          style={{ imageRendering: "pixelated", width: 16 * SCALE, height: "auto" }}
                        />
                      </span>
                    </Tooltip>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- local pixel art, no next/image config needed */}
        <img
          src="/library/shelf-base.png"
          alt=""
          aria-hidden="true"
          className="block w-full"
          style={{ height: "auto", imageRendering: "pixelated" }}
        />
      </div>
    </aside>
  );
}

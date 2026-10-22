"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { BookOpen } from "lucide-react";
import type { RecommendationResult } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import ReflectiveCard from "@/components/ReflectiveCard";

// Decorative-only "book cover" colors cycled per result, independent of
// the semantic theme tokens - same palette the detail page's fallback
// cover uses, so a game with no real box art still looks intentional
// rather than like a broken image.
const SPINE_COLORS = ["--spine-1", "--spine-2", "--spine-3", "--spine-4", "--spine-5"] as const;

function matchBadgeVariant(score: number): "default" | "secondary" | "outline" {
  if (score >= 85) return "default";
  if (score >= 60) return "secondary";
  return "outline";
}

function FallbackCover({ name, spineVar }: { name: string; spineVar: string }) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center"
      style={{ backgroundColor: spineVar }}
    >
      <BookOpen className="size-6 text-white/80" aria-hidden="true" />
      <span className="line-clamp-4 text-xs font-medium text-white/90">{name}</span>
    </div>
  );
}

export default function ResultsList({ results }: { results: RecommendationResult[] }) {
  if (results.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {results.map((r, index) => {
        const spineVar = `var(${SPINE_COLORS[index % SPINE_COLORS.length]})`;
        return (
          <li key={r.game.id}>
            <Link href={`/games/${r.game.id}`} className="block">
              {/* aspect-[3/4] on a plain wrapper, not ReflectiveCard itself -
                  the component needs an explicit width/height (not an
                  intrinsic aspect-ratio), so it's given width="100%"
                  height="100%" of this already-sized box instead. The title
                  lives outside the card (not as a child) so the card's own
                  padded interior is dedicated entirely to cover art instead
                  of splitting it with a text row. */}
              <div className="aspect-[3/4]">
                <ReflectiveCard
                  width="100%"
                  height="100%"
                  radius={16}
                  tint="#ffffff"
                  metalness={1}
                  roughness={0.3}
                  blurStrength={6}
                  shine={1}
                  glare={0.5}
                  grayscale={1}
                  warp={0.6}
                  warpScale={1}
                  bevel={3}
                  tiltStrength={10}
                  enableTilt
                  intro
                  className="h-full w-full"
                  style={{ "--rc-pad": "6px" } as CSSProperties}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
                    {r.game.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external IGDB CDN image, no next/image remote-pattern config needed for a plain <img>
                      <img
                        src={r.game.cover_url}
                        alt={r.game.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FallbackCover name={r.game.name} spineVar={spineVar} />
                    )}
                    <Badge variant={matchBadgeVariant(r.match_score)} className="absolute right-1.5 top-1.5 shadow">
                      {r.match_score}%
                    </Badge>
                  </div>
                </ReflectiveCard>
              </div>
              <p className="line-clamp-2 pt-2 text-sm font-medium">{r.game.name}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

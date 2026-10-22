"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useAuth, SignedIn, SignedOut } from "@clerk/nextjs";
import { getWishlist, removeFromWishlist, type WishlistItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bookmark, BookOpen, X } from "lucide-react";
import { useBookshelf } from "@/lib/bookshelf-context";
import ReflectiveCard from "@/components/ReflectiveCard";

// Same decorative "book cover" palette and fallback treatment as
// ResultsList.tsx, so a wishlist tile with no real box art looks
// consistent with the results grid rather than like a broken image.
const SPINE_COLORS = ["--spine-1", "--spine-2", "--spine-3", "--spine-4", "--spine-5"] as const;

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

function WishlistContent() {
  const { getToken } = useAuth();
  const { noteRemoved } = useBookshelf();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        setItems(await getWishlist(token));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load wishlist");
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  async function handleRemove(gameId: number) {
    const token = await getToken();
    await removeFromWishlist(token, gameId);
    setItems((prev) => prev.filter((item) => item.game.id !== gameId));
    // Keeps the homepage/detail-page margin shelf (lib/bookshelf-context.tsx)
    // in sync - it's a separate global list, not derived from this page's
    // own fetch, so it wouldn't otherwise learn about a removal made here.
    noteRemoved("right", gameId);
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (items.length === 0)
    return <p className="text-sm text-muted-foreground">Nothing saved yet - save a game from your results.</p>;

  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {items.map(({ game }, index) => {
        const spineVar = `var(${SPINE_COLORS[index % SPINE_COLORS.length]})`;
        return (
          <li key={game.id}>
            <Link href={`/games/${game.id}`} className="block">
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
                  intro={false}
                  className="h-full w-full"
                  style={{ "--rc-pad": "6px" } as CSSProperties}
                >
                  <div className="relative h-full w-full overflow-hidden rounded-lg bg-muted">
                    {game.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- external IGDB CDN image, no next/image remote-pattern config needed for a plain <img>
                      <img
                        src={game.cover_url}
                        alt={game.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FallbackCover name={game.name} spineVar={spineVar} />
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      onClick={(e) => {
                        // The tile itself is a Link to the game page - a
                        // nested Remove button needs to stop that
                        // navigation from firing too, or clicking Remove
                        // would both delete the item and route to a detail
                        // page for a game that was just removed.
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(game.id);
                      }}
                      aria-label={`Remove ${game.name} from wishlist`}
                      className="absolute right-1.5 top-1.5 size-7 shadow"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </ReflectiveCard>
              </div>
              <p className="line-clamp-2 pt-2 text-sm font-medium">{game.name}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function WishlistPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="flex items-center gap-2 font-heading text-2xl font-semibold tracking-tight">
        <Bookmark className="size-6 text-primary" aria-hidden="true" />
        Your wishlist
      </h1>

      <div className="mt-8">
        <SignedIn>
          <WishlistContent />
        </SignedIn>
        <SignedOut>
          <p className="text-sm text-muted-foreground">Sign in to see games you&apos;ve saved.</p>
        </SignedOut>
      </div>
    </main>
  );
}

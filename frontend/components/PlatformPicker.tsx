"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ShinyText from "@/components/ShinyText";

// ShinyText clips the glyphs to a CSS gradient (-webkit-text-fill-color:
// transparent), so unlike FuzzyText (a canvas effect that could just read
// currentColor off the button via getComputedStyle), it needs each state's
// real color as a hex string up front - passing color="currentColor" would
// silently fail (canvas 2D's fillStyle setter doesn't resolve that CSS
// keyword with no element to inherit from) and render black. These are
// --foreground/--primary/--primary-foreground/--destructive from
// globals.css, converted via the same canvas fillStyle/getImageData
// technique already used for MagicBento's glowColor and ReflectiveCard's
// tint, not estimated.
const TEXT_FOREGROUND = "#f2ecf5";
const TEXT_PRIMARY = "#b563d4";
const TEXT_PRIMARY_FOREGROUND = "#fbf6fd";
const TEXT_DESTRUCTIVE = "#e64343";

// Shown by default - current-gen consoles + Switch + the PC ecosystem, plus
// a run of older consoles that have pixel-art badges (see PLATFORM_ART_SLUG
// below) - what most players are actually asking about, or recognize on
// sight. Exact strings must match IGDB's platform names (see GET
// /games/facets) - "PC (Microsoft Windows)", not "PC". Everything else
// (handhelds beyond DS, VR headsets, ...) is real but far more niche, and
// sits behind "View more platforms" instead of cluttering the default view.
// Exported so a parent can decide whether to auto-expand (e.g. a saved
// selection includes a niche platform) - this component doesn't do that
// itself, since tying auto-expand to `selected` here would re-expand the
// moment a parent re-renders with that same selection, fighting a user who
// just collapsed it on purpose.
export const PRIMARY_PLATFORMS = [
  "PC (Microsoft Windows)",
  "Mac",
  "PlayStation 5",
  "PlayStation 4",
  "PlayStation 3",
  "PlayStation 2",
  "PlayStation",
  "Xbox One",
  "Xbox 360",
  "Nintendo Switch",
  "Nintendo DS",
  "Nintendo 64",
  "Nintendo GameCube",
  "Wii",
];

// Maps a primary platform's exact IGDB name to its pixel-art badge at
// public/platforms/<slug>.png - not a derived kebab-case transform, since
// several of these names (parens, pipes) don't kebab-case cleanly.
const PLATFORM_ART_SLUG: Record<string, string> = {
  "PC (Microsoft Windows)": "pc",
  Mac: "mac",
  "PlayStation 5": "ps5",
  "PlayStation 4": "ps4",
  "PlayStation 3": "ps3",
  "PlayStation 2": "ps2",
  PlayStation: "ps1",
  "Xbox One": "xbox-one",
  "Xbox 360": "xbox-360",
  "Nintendo Switch": "switch",
  "Nintendo DS": "ds",
  "Nintendo 64": "n64",
  "Nintendo GameCube": "gamecube",
  Wii: "wii",
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Every platform (primary or secondary/niche) renders as the same selector
// - no per-tile icon or art, just a label rendered through ShinyText (same
// treatment as GenreToggleGroup's labels below). A primary platform's real
// pixel-art photo instead shows up centered behind the whole "Where will
// you play?" card while this tile is hovered/focused (see PlatformPicker's
// onHoverSlugChange, consumed by FilterForm) - reported via slug here,
// undefined for secondary/niche platforms which have no art.
// onHoverSlugChange is optional - only FilterForm's home-page card wants
// the background art; OwnedPlatforms (profile page) doesn't pass it, so
// there's no hover background there at all rather than a wired-up callback
// with nothing to show for it.
function PlatformCard({
  label,
  slug,
  active,
  onToggle,
  onHoverSlugChange,
}: {
  label: string;
  slug?: string;
  active: boolean;
  onToggle: () => void;
  onHoverSlugChange?: (slug: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => onHoverSlugChange?.(slug ?? null)}
      onMouseLeave={() => onHoverSlugChange?.(null)}
      onFocus={() => onHoverSlugChange?.(slug ?? null)}
      onBlur={() => onHoverSlugChange?.(null)}
      aria-pressed={active}
      className={cn(
        // A clear "pop" on hover/focus via border/shadow/scale and a
        // translucent (not solid) primary tint - a fully opaque fill made
        // the hovered tile the only thing visible, blocking the console
        // photo behind the rest of the card instead of sitting on top of it.
        "rounded-lg border bg-card/70 px-3 py-1.5 font-mono text-sm font-medium transition-all duration-150",
        active
          ? "border-primary bg-primary/30 text-primary shadow-md shadow-primary/20"
          : "border-input text-foreground hover:scale-105 hover:border-primary hover:bg-primary/35 hover:text-primary hover:shadow-lg hover:shadow-primary/30 focus-visible:scale-105 focus-visible:border-primary focus-visible:bg-primary/35 focus-visible:text-primary"
      )}
    >
      <ShinyText color={active ? TEXT_PRIMARY : TEXT_FOREGROUND} shineColor="#ffffff" glow={0.85} shineWidth={57} trigger="hover">
        {label}
      </ShinyText>
    </button>
  );
}

// 3-state cycle (neutral -> include -> exclude -> neutral), back to the
// original plain pill (the bookmark-shaped reskin didn't land well) - the
// only change from that original is the label itself rendering through
// ShinyText (reactbits.dev "Shiny Text") instead of as plain text, for a
// hover sheen. Unlike the FuzzyText this replaced, ShinyText can't just
// inherit whatever color Tailwind set on the button (see the TEXT_* consts
// above), so each state's color is passed explicitly, matching what the
// className below sets for that same state. The `line-through` on the
// excluded state still renders correctly in --destructive even though the
// glyph fill itself is transparent underneath - text-decoration color comes
// from the button's own `color`, not the inner span's overridden fill.
export function GenreToggleGroup({
  options,
  included,
  excluded,
  onChange,
}: {
  options: string[];
  included: string[];
  excluded: string[];
  onChange: (next: { included: string[]; excluded: string[] }) => void;
}) {
  function cycle(option: string) {
    if (included.includes(option)) {
      onChange({ included: included.filter((g) => g !== option), excluded: [...excluded, option] });
    } else if (excluded.includes(option)) {
      onChange({ included, excluded: excluded.filter((g) => g !== option) });
    } else {
      onChange({ included: [...included, option], excluded });
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isIncluded = included.includes(option);
        const isExcluded = excluded.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => cycle(option)}
            aria-pressed={isIncluded}
            className={cn(
              // Same box shape as the platform tiles (PlatformCard above) -
              // rounded-lg, not rounded-full - but tighter padding: most
              // genre names are a single short word, so the platform tiles'
              // own px-3 padding left noticeably more empty space per row
              // here than it does there, where longer platform names fill
              // it out naturally.
              "rounded-lg border px-2 py-1 font-mono text-sm font-medium transition-all duration-150",
              isIncluded && "border-primary bg-primary text-primary-foreground",
              isExcluded && "border-destructive/60 text-destructive line-through",
              !isIncluded &&
                !isExcluded &&
                "border-input bg-card/70 text-foreground hover:scale-105 hover:border-primary hover:bg-muted"
            )}
          >
            <ShinyText
              color={isIncluded ? TEXT_PRIMARY_FOREGROUND : isExcluded ? TEXT_DESTRUCTIVE : TEXT_FOREGROUND}
              shineColor="#ffffff"
              glow={0.85}
              shineWidth={57}
              trigger="hover"
            >
              {(isIncluded ? "+ " : isExcluded ? "− " : "") + option}
            </ShinyText>
          </button>
        );
      })}
    </div>
  );
}

export default function PlatformPicker({
  options,
  selected,
  onChange,
  showAll,
  onToggleShowAll,
  onHoverSlugChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  showAll: boolean;
  onToggleShowAll: () => void;
  // Reports which primary platform's art slug is currently hovered/focused
  // (null when none is) - the picker itself has no art of its own anymore,
  // the parent (FilterForm) uses this to paint it across the whole "Where
  // will you play?" card, not just this one tile. Optional - OwnedPlatforms
  // doesn't pass it, since the profile page's own card has no hover art.
  onHoverSlugChange?: (slug: string | null) => void;
}) {
  const primary = PRIMARY_PLATFORMS.filter((p) => options.includes(p));
  const secondary = options.filter((p) => !PRIMARY_PLATFORMS.includes(p));

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {primary.map((option) => (
          <PlatformCard
            key={option}
            label={option}
            slug={PLATFORM_ART_SLUG[option]}
            active={selected.includes(option)}
            onToggle={() => onChange(toggle(selected, option))}
            onHoverSlugChange={onHoverSlugChange}
          />
        ))}
      </div>
      {secondary.length > 0 && (
        <>
          {showAll && (
            <div className="mt-2 flex flex-wrap gap-2">
              {secondary.map((option) => (
                <PlatformCard
                  key={option}
                  label={option}
                  active={selected.includes(option)}
                  onToggle={() => onChange(toggle(selected, option))}
                  onHoverSlugChange={onHoverSlugChange}
                />
              ))}
            </div>
          )}
          <Button type="button" variant="link" size="sm" onClick={onToggleShowAll} className="mt-2 h-auto p-0 font-mono text-xs text-muted-foreground">
            {showAll ? "View fewer platforms" : "View more platforms"}
          </Button>
        </>
      )}
    </>
  );
}

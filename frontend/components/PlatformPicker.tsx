"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import FuzzyText from "@/components/FuzzyText";

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
  "Super Nintendo Entertainment System",
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
  "Super Nintendo Entertainment System": "snes",
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Every platform (primary or secondary/niche) renders as the same selector
// - no per-tile icon or art, just a label rendered through FuzzyText (same
// treatment as GenreToggleGroup's labels below). A primary platform's real
// pixel-art photo instead shows up centered behind the whole "Where will
// you play?" card while this tile is hovered/focused (see PlatformPicker's
// onHoverSlugChange, consumed by FilterForm) - reported via slug here,
// undefined for secondary/niche platforms which have no art.
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
  onHoverSlugChange: (slug: string | null) => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      onMouseEnter={() => onHoverSlugChange(slug ?? null)}
      onMouseLeave={() => onHoverSlugChange(null)}
      onFocus={() => onHoverSlugChange(slug ?? null)}
      onBlur={() => onHoverSlugChange(null)}
      aria-pressed={active}
      className={cn(
        // A clear "pop" on hover/focus via border/shadow/scale and a
        // translucent (not solid) primary tint - a fully opaque fill made
        // the hovered tile the only thing visible, blocking the console
        // photo behind the rest of the card instead of sitting on top of it.
        "rounded-lg border bg-card/70 px-3 py-1.5 text-sm font-medium transition-all duration-150",
        active
          ? "border-primary bg-primary/30 text-primary shadow-md shadow-primary/20"
          : "border-input text-foreground hover:scale-105 hover:border-primary hover:bg-primary/35 hover:text-primary hover:shadow-lg hover:shadow-primary/30 focus-visible:scale-105 focus-visible:border-primary focus-visible:bg-primary/35 focus-visible:text-primary"
      )}
    >
      <FuzzyText
        fontSize="14px"
        fontWeight={500}
        fuzzRange={4}
        baseIntensity={0.5}
        hoverIntensity={1.4}
        trigger="hover"
        intro={false}
      >
        {label}
      </FuzzyText>
    </button>
  );
}

// 3-state cycle (neutral -> include -> exclude -> neutral), back to the
// original plain pill (the bookmark-shaped reskin didn't land well) - the
// only change from that original is the label itself rendering through
// FuzzyText (reactbits.dev "Fuzzy Text") instead of as plain text, for a
// glitchy hover effect. color="currentColor" (FuzzyText's default) is what
// makes it pick up the exact text color each state below already sets via
// Tailwind, via getComputedStyle - no change needed there.
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
              "rounded-lg border px-2 py-1 text-sm font-medium transition-all duration-150",
              isIncluded && "border-primary bg-primary text-primary-foreground",
              isExcluded && "border-destructive/60 text-destructive line-through",
              !isIncluded &&
                !isExcluded &&
                "border-input bg-card/70 text-foreground hover:scale-105 hover:border-primary hover:bg-muted"
            )}
          >
            <FuzzyText
              fontSize="14px"
              fontWeight={500}
              fuzzRange={4}
              baseIntensity={0.5}
              hoverIntensity={1.4}
              trigger="hover"
              intro={false}
            >
              {(isIncluded ? "+ " : isExcluded ? "− " : "") + option}
            </FuzzyText>
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
  // will you play?" card, not just this one tile.
  onHoverSlugChange: (slug: string | null) => void;
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
          <Button type="button" variant="link" size="sm" onClick={onToggleShowAll} className="mt-2 h-auto p-0 text-xs text-muted-foreground">
            {showAll ? "View fewer platforms" : "View more platforms"}
          </Button>
        </>
      )}
    </>
  );
}

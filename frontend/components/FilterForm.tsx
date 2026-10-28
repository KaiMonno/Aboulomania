"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getFacets, type HardFilters, type SoftPreferences } from "@/lib/api";
import PlatformPicker, { GenreToggleGroup, PRIMARY_PLATFORMS } from "@/components/PlatformPicker";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import PlaytimeClockSlider from "@/components/PlaytimeClockSlider";
import PixelBookFlip from "@/components/PixelBookFlip";
import {
  PixelClock,
  PixelScale,
  PixelController,
  PixelTag,
  PixelUsers,
  PixelSparkle,
  PixelBookmark,
} from "@/components/PixelIcons";
import MagicBento from "@/components/MagicBento";

// Our theme's --primary, resolved to hex (MagicBento's own color parsing
// only understands hex/rgb(), not oklch() - unlike the canvas-based
// effects elsewhere in this app, which parse oklch() natively via
// fillStyle).
const BENTO_GLOW = "#b563d4";

// One MagicBento instance per existing card, columns=1, in the same spot
// each Card used to occupy - a mechanical swap of the chrome (border glow,
// click ripple) around each card's real, unchanged content, not a redesign
// of the page's layout. rowHeight is just a floor (gridAutoRows resolves to
// minmax(rowHeight, auto) at columns=1) so variable-height content (the
// genre list especially) still grows naturally. Tilt/magnetism are off -
// nudging or tilting a card while someone is dragging a slider or tapping a
// toggle inside it would fight the interaction rather than decorate it.
// enableSpotlight is off too - the mouse-follow highlight inside the card;
// spotlightRadius is kept anyway since enableBorderGlow's own glow ring
// still sizes itself off it (--mb-border-size derives from spotlightRadius
// in MagicBento.jsx), not just the spotlight it was originally named for.
function BentoCard({ children, background, className }: { children: ReactNode; background?: ReactNode; className?: string }) {
  return (
    <MagicBento
      items={[{ content: children, background }]}
      columns={1}
      rowHeight={60}
      gap={0}
      radius={0}
      glowColor={BENTO_GLOW}
      enableBorderGlow
      enableSpotlight={false}
      spotlightRadius={220}
      clickEffect
      enableStars={false}
      enableTilt={false}
      enableMagnetism={false}
      intro
      className={className}
    />
  );
}

const MIN_LENGTH_HOURS = 1;
const MAX_LENGTH_HOURS = 100;
const DEFAULT_LENGTH_HOURS = 10;

// The slider itself only ever shows 0-10 (coarser, easier to drag than 101
// discrete stops) - the backend's target_story_gameplay_ratio is still a
// 0-100 scale (matches game.story_gameplay_ratio's enrichment range, see
// services/scoring.py), so every UI value is multiplied by 10 on the way
// out and divided by 10 when a saved default comes back in.
const MAX_STORY_GAMEPLAY_UI = 10;
const DEFAULT_STORY_GAMEPLAY_UI = 5;

// Niche genres collapsed behind "View more genres" by default, same pattern
// as PlatformPicker's primary/secondary split - unlike platforms (a fixed,
// known set where PRIMARY_PLATFORMS lists what stays visible), genres come
// from the live catalog (GET /games/facets), so this is a short deny-list
// of the ones to hide rather than an allow-list of everything else.
const SECONDARY_GENRES = ["Music", "Pinball", "Quiz/Trivia", "Racing", "Simulator", "Sport", "Roguelite"];

interface Props {
  onSubmit: (hardFilters: HardFilters, softPreferences: SoftPreferences) => void;
  loading: boolean;
  // Phase 5: a signed-in user's saved defaults, loaded async by the parent
  // page from GET /profile/preferences - undefined while that load is in
  // flight (or the user is signed out), so the form keeps its own blank
  // defaults rather than flashing saved values in after the fact.
  initialHardFilters?: HardFilters;
  initialSoftPreferences?: SoftPreferences;
  onSaveDefaults?: (hardFilters: HardFilters, softPreferences: SoftPreferences) => void;
  saveDefaultsState?: "idle" | "saving" | "saved" | "error";
}

export default function FilterForm({
  onSubmit,
  loading,
  initialHardFilters,
  initialSoftPreferences,
  onSaveDefaults,
  saveDefaultsState = "idle",
}: Props) {
  const [platformOptions, setPlatformOptions] = useState<string[]>([]);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [facetsError, setFacetsError] = useState<string | null>(null);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [showAllGenres, setShowAllGenres] = useState(false);
  // Which primary platform's art to show across the whole "Where will you
  // play?" card's background - set by PlatformPicker on tile hover/focus,
  // null when none is hovered. Lives here (not in PlatformPicker) because
  // the card it paints includes the heading row above PlatformPicker's own
  // content, not just the tile grid.
  const [hoveredPlatformSlug, setHoveredPlatformSlug] = useState<string | null>(null);
  // Mirrors hoveredPlatformSlug but never goes back to null - only used for
  // the <img>'s src below, kept separate from the opacity-driving state so
  // that src is never removed once a platform's been hovered once. Chrome
  // (not Firefox/Safari) paints a "broken image" placeholder icon in the
  // img's top-left corner when a sized-but-src-less <img> briefly exists,
  // which is exactly what `src={slug ? ... : undefined}` produced on every
  // mouse-leave - visible during the opacity fade-out before it reached 0.
  const [lastPlatformSlug, setLastPlatformSlug] = useState<string | null>(null);

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [excludedGenres, setExcludedGenres] = useState<string[]>([]);
  const [requireMultiplayer, setRequireMultiplayer] = useState(false);
  const [lengthEnabled, setLengthEnabled] = useState(false);
  const [targetLengthHours, setTargetLengthHours] = useState<number>(DEFAULT_LENGTH_HOURS);
  const [storyGameplayEnabled, setStoryGameplayEnabled] = useState(false);
  const [storyGameplayUi, setStoryGameplayUi] = useState<number>(DEFAULT_STORY_GAMEPLAY_UI);

  // Tracks edits made after the last "Saved as default" - without this, the
  // button would keep reading "Saved as default" even once it no longer
  // reflects what's in the form. Reset on every new saveDefaultsState from
  // the parent (a fresh save cycle), set on any field change in between.
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  useEffect(() => {
    setDirtySinceSave(false);
  }, [saveDefaultsState]);

  useEffect(() => {
    getFacets()
      .then((facets) => {
        setPlatformOptions(facets.platforms);
        setGenreOptions(facets.genres);
      })
      .catch((err) => setFacetsError(err instanceof Error ? err.message : "Failed to load filter options"));
  }, []);

  // Pre-fill once saved defaults arrive from the parent - keyed so this only
  // fires the first time they show up, not on every parent re-render (which
  // would otherwise stomp on whatever the user has since typed/toggled).
  useEffect(() => {
    if (!initialHardFilters || !initialSoftPreferences) return;
    setGenres(initialHardFilters.include_genres);
    setExcludedGenres(initialHardFilters.exclude_genres);
    setPlatforms(initialHardFilters.platforms);
    // If a saved default selected a niche platform, expand the "View more"
    // section so that selection is actually visible rather than silently
    // applied but hidden.
    if (initialHardFilters.platforms.some((p) => !PRIMARY_PLATFORMS.includes(p))) {
      setShowAllPlatforms(true);
    }
    // Same reasoning as the platform expansion above, for genres - either
    // direction (included or excluded) counts, both would otherwise be
    // silently hidden behind "View more genres".
    if (
      initialHardFilters.include_genres.some((g) => SECONDARY_GENRES.includes(g)) ||
      initialHardFilters.exclude_genres.some((g) => SECONDARY_GENRES.includes(g))
    ) {
      setShowAllGenres(true);
    }
    setRequireMultiplayer(initialHardFilters.require_multiplayer);
    if (initialSoftPreferences.target_length_hours != null) {
      setLengthEnabled(true);
      setTargetLengthHours(
        Math.min(MAX_LENGTH_HOURS, Math.max(MIN_LENGTH_HOURS, initialSoftPreferences.target_length_hours))
      );
    }
    if (initialSoftPreferences.target_story_gameplay_ratio != null) {
      setStoryGameplayEnabled(true);
      setStoryGameplayUi(Math.round(initialSoftPreferences.target_story_gameplay_ratio / 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHardFilters, initialSoftPreferences]);

  function currentValues(): [HardFilters, SoftPreferences] {
    return [
      { include_genres: genres, exclude_genres: excludedGenres, platforms, require_multiplayer: requireMultiplayer },
      {
        target_length_hours: lengthEnabled ? targetLengthHours : null,
        target_story_gameplay_ratio: storyGameplayEnabled ? storyGameplayUi * 10 : null,
        similar_to_game_id: null,
      },
    ];
  }

  function handleSaveDefaults() {
    if (!onSaveDefaults) return;
    const [hardFilters, softPreferences] = currentValues();
    onSaveDefaults(hardFilters, softPreferences);
  }

  const displaySaveState = dirtySinceSave && saveDefaultsState === "saved" ? "idle" : saveDefaultsState;

  const primaryGenres = genreOptions.filter((g) => !SECONDARY_GENRES.includes(g));
  const secondaryGenres = genreOptions.filter((g) => SECONDARY_GENRES.includes(g));

  function handleGenreChange(next: { included: string[]; excluded: string[] }) {
    setGenres(next.included);
    setExcludedGenres(next.excluded);
    setDirtySinceSave(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [hardFilters, softPreferences] = currentValues();
    onSubmit(hardFilters, softPreferences);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {facetsError && (
        <Alert variant="destructive">
          <AlertDescription>{facetsError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <BentoCard>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-heading text-lg font-medium">
              <PixelClock className="size-4 text-primary" aria-hidden="true" />
              How much time do you have?
            </span>
            <Switch
              size="sm"
              checked={lengthEnabled}
              onCheckedChange={(checked) => {
                setLengthEnabled(checked);
                setDirtySinceSave(true);
              }}
              aria-label="Set a target length"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label className="text-muted-foreground">Target length</Label>
              {lengthEnabled && (
                <span className="font-mono text-sm text-muted-foreground">
                  {targetLengthHours >= MAX_LENGTH_HOURS ? `${MAX_LENGTH_HOURS}+ hours` : `${targetLengthHours} hours`}
                </span>
              )}
            </div>
            <div className="flex justify-center py-1">
              <PlaytimeClockSlider
                aria-label="Target length"
                disabled={!lengthEnabled}
                min={MIN_LENGTH_HOURS}
                max={MAX_LENGTH_HOURS}
                step={1}
                value={targetLengthHours}
                onValueChange={(next) => {
                  setTargetLengthHours(next);
                  setDirtySinceSave(true);
                }}
              />
            </div>
          </div>
        </BentoCard>

        <BentoCard>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-heading text-lg font-medium">
              <PixelScale className="size-4 text-primary" aria-hidden="true" />
              Gameplay or Story
            </span>
            <Switch
              size="sm"
              checked={storyGameplayEnabled}
              onCheckedChange={(checked) => {
                setStoryGameplayEnabled(checked);
                setDirtySinceSave(true);
              }}
              aria-label="Set a story vs. gameplay focus"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="targetStoryGameplayRatio" className="text-muted-foreground">
                Story vs. gameplay focus
              </Label>
              {storyGameplayEnabled && (
                <span className="font-mono text-sm text-muted-foreground">
                  {storyGameplayUi}/{MAX_STORY_GAMEPLAY_UI}
                </span>
              )}
            </div>
            <div className={cn("flex justify-center py-1", !storyGameplayEnabled && "opacity-50")}>
              <PixelBookFlip tick={storyGameplayUi} />
            </div>
            <Slider
              id="targetStoryGameplayRatio"
              disabled={!storyGameplayEnabled}
              min={0}
              max={MAX_STORY_GAMEPLAY_UI}
              step={1}
              value={storyGameplayUi}
              onValueChange={(value) => {
                setStoryGameplayUi(Array.isArray(value) ? value[0] : value);
                setDirtySinceSave(true);
              }}
            />
            <p className="font-mono text-xs text-muted-foreground">
              0 = all gameplay, {MAX_STORY_GAMEPLAY_UI} = all story. AI-estimated per game.
            </p>
          </div>
        </BentoCard>
      </div>

      <BentoCard
        background={
          <>
            {/* The hovered platform's art as a background for the whole
                card (header included), not just the tile that's hovered -
                MagicBento's own card is already position:relative;
                overflow:hidden, so this bleeds to the full card the same
                way it did as a direct Card child. object-cover - fills the
                card edge-to-edge (cropped as needed). These source photos
                aren't all well-framed for that yet; better crops are
                coming later. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- local dithered photo, no next/image config needed */}
            <img
              src={lastPlatformSlug ? `/platforms/${lastPlatformSlug}.png` : undefined}
              alt=""
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
                hoveredPlatformSlug ? "opacity-100" : "opacity-0"
              )}
            />
            {/* CRT-style scanlines/vignette, then a scrim - together these
                read as stylized retro-monitor background art behind the
                selectable pills rather than a plain photo competing with
                their text. Both stay at opacity-0 until something is
                actually hovered, so the card looks completely untouched
                (same as every other card on the page) at rest - a static
                scrim here previously looked subtly lighter than normal
                even with nothing hovered. */}
            <div
              className={cn(
                "crt-overlay pointer-events-none absolute inset-0 transition-opacity duration-300",
                hoveredPlatformSlug ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-card/80 transition-opacity duration-300",
                hoveredPlatformSlug ? "opacity-100" : "opacity-0"
              )}
              aria-hidden="true"
            />
          </>
        }
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-heading text-lg font-medium">
            <PixelController className="size-4 text-primary" aria-hidden="true" />
            Where will you play?
          </span>
          <span className="font-mono text-xs font-normal text-muted-foreground">None selected = everything</span>
        </div>
        {platformOptions.length > 0 ? (
          <PlatformPicker
            options={platformOptions}
            selected={platforms}
            onChange={(next) => {
              setPlatforms(next);
              setDirtySinceSave(true);
            }}
            showAll={showAllPlatforms}
            onToggleShowAll={() => setShowAllPlatforms((prev) => !prev)}
            onHoverSlugChange={(slug) => {
              setHoveredPlatformSlug(slug);
              if (slug) setLastPlatformSlug(slug);
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Loading platforms...</p>
        )}
      </BentoCard>

      <BentoCard>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 font-heading text-lg font-medium">
            <PixelTag className="size-4 text-primary" aria-hidden="true" />
            Genres
          </span>
          <span className="font-mono text-xs font-normal text-muted-foreground">Tap once to include, twice to exclude</span>
        </div>
        {genreOptions.length > 0 ? (
          <>
            <GenreToggleGroup
              options={primaryGenres}
              included={genres}
              excluded={excludedGenres}
              onChange={handleGenreChange}
            />
            {secondaryGenres.length > 0 && (
              <>
                {showAllGenres && (
                  <div className="mt-2">
                    <GenreToggleGroup
                      options={secondaryGenres}
                      included={genres}
                      excluded={excludedGenres}
                      onChange={handleGenreChange}
                    />
                  </div>
                )}
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setShowAllGenres((prev) => !prev)}
                  className="mt-2 h-auto p-0 font-mono text-xs text-muted-foreground"
                >
                  {showAllGenres ? "View fewer genres" : "View more genres"}
                </Button>
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading genres...</p>
        )}
      </BentoCard>

      <BentoCard>
        <div className="flex items-center gap-2">
          <PixelUsers className="size-4 text-primary" aria-hidden="true" />
          <Label htmlFor="requireMultiplayer" className="flex-1">
            Must have multiplayer
          </Label>
          <Switch
            id="requireMultiplayer"
            checked={requireMultiplayer}
            onCheckedChange={(checked) => {
              setRequireMultiplayer(checked);
              setDirtySinceSave(true);
            }}
          />
        </div>
      </BentoCard>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        {onSaveDefaults && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDefaults}
            disabled={displaySaveState === "saving"}
            size="lg"
            className="gap-1.5"
          >
            <PixelBookmark className="size-4" aria-hidden="true" />
            {displaySaveState === "saved"
              ? "Saved as default"
              : displaySaveState === "saving"
                ? "Saving..."
                : displaySaveState === "error"
                  ? "Couldn't save - try again"
                  : "Save as my default filters"}
          </Button>
        )}
        <Button type="submit" disabled={loading} size="lg" className="gap-1.5">
          <PixelSparkle className="size-4" aria-hidden="true" />
          {loading ? "Finding games..." : "Find my games"}
        </Button>
      </div>
    </form>
  );
}

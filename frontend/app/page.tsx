"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Bookshelf from "@/components/Bookshelf";
import FilterForm from "@/components/FilterForm";
import ResultsList from "@/components/ResultsList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  getLibrary,
  getPreferences,
  getRecommendations,
  getWishlist,
  savePreferences,
  type HardFilters,
  type LibraryItem,
  type RecommendationResult,
  type SoftPreferences,
  type WishlistItem,
} from "@/lib/api";
import { getLastResults, saveLastResults } from "@/lib/resultsCache";

export default function Home() {
  const { isSignedIn, getToken } = useAuth();
  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [initialHardFilters, setInitialHardFilters] = useState<HardFilters | undefined>(undefined);
  const [initialSoftPreferences, setInitialSoftPreferences] = useState<SoftPreferences | undefined>(undefined);
  const [saveDefaultsState, setSaveDefaultsState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  // Bookshelf margins (owned games on the left, wishlist on the right) -
  // signed-out users have neither, so both stay empty and Bookshelf
  // renders nothing (see its own early return).
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    if (!isSignedIn) {
      setLibrary([]);
      setWishlist([]);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const [libraryItems, wishlistItems] = await Promise.all([getLibrary(token), getWishlist(token)]);
        setLibrary(libraryItems);
        setWishlist(wishlistItems);
      } catch {
        // Bookshelves are decorative - if this fails, the margins just
        // stay empty rather than surfacing an error over the main flow.
      }
    })();
  }, [isSignedIn, getToken]);

  // Restores the last search's results on mount - a plain <Link href="/">
  // back from the game detail page remounts this component with fresh
  // state, which otherwise threw away the whole batch just for clicking
  // into one game.
  useEffect(() => {
    const cached = getLastResults();
    if (cached.length > 0) setResults(cached);
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const saved = await getPreferences(token);
        if (saved) {
          setInitialHardFilters(saved.hard_filters);
          setInitialSoftPreferences(saved.soft_preferences);
        }
      } catch {
        // Saved defaults are a convenience, not required - the form's own
        // blank defaults are a fine fallback if this fails.
      }
    })();
  }, [isSignedIn, getToken]);

  async function handleSubmit(hardFilters: HardFilters, softPreferences: SoftPreferences) {
    setLoading(true);
    setError(null);
    try {
      const token = isSignedIn ? await getToken() : null;
      const data = await getRecommendations(hardFilters, softPreferences, token);
      setResults(data);
      saveLastResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDefaults(hardFilters: HardFilters, softPreferences: SoftPreferences) {
    setSaveDefaultsState("saving");
    try {
      const token = await getToken();
      await savePreferences(token, hardFilters, softPreferences);
      setSaveDefaultsState("saved");
    } catch {
      setSaveDefaultsState("error");
    }
  }

  return (
    <>
      <Bookshelf side="left" items={library} label="Owned" />
      <Bookshelf side="right" items={wishlist} label="Wishlist" />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">GameKeep</h1>
        <p className="mt-1 text-muted-foreground">Tell us what you want, we&apos;ll find the game.</p>

        <div className="mt-8">
          <FilterForm
            onSubmit={handleSubmit}
            loading={loading}
            initialHardFilters={initialHardFilters}
            initialSoftPreferences={initialSoftPreferences}
            onSaveDefaults={isSignedIn ? handleSaveDefaults : undefined}
            saveDefaultsState={saveDefaultsState}
          />
        </div>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-8">
          <ResultsList results={results} />
        </div>
      </main>
    </>
  );
}

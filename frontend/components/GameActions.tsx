"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Bookmark, BookOpenCheck, BookMarked } from "lucide-react";
import { addToWishlist, markAsPlayed, unmarkAsPlayed, type GameOut } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useBookshelf } from "@/lib/bookshelf-context";

// Shared between the game detail page and (previously) the results list -
// kept as their own component since both "save to wishlist" and "mark
// played" are self-contained bits of state (idle/saving/saved/error) that
// don't need to know anything about where they're rendered.

export function SaveButton({ game }: { game: GameOut }) {
  const { getToken } = useAuth();
  const { noteAdded } = useBookshelf();
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleClick() {
    setState("saving");
    try {
      const token = await getToken();
      await addToWishlist(token, game.id);
      setState("saved");
      noteAdded("right", game);
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <span className="inline-flex animate-in zoom-in-75 items-center gap-1 text-sm text-muted-foreground duration-300">
        <BookMarked className="size-3.5" aria-hidden="true" />
        Saved to wishlist
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={state === "saving"}
      className="gap-1.5"
    >
      <Bookmark className="size-3.5" aria-hidden="true" />
      {state === "error" ? "Couldn't save - try again" : state === "saving" ? "Saving..." : "Save to wishlist"}
    </Button>
  );
}

export function PlayedButton({ game }: { game: GameOut }) {
  const { getToken } = useAuth();
  const { noteAdded, noteRemoved } = useBookshelf();
  const [state, setState] = useState<"idle" | "marking" | "marked" | "error">("idle");

  async function handleClick() {
    setState("marking");
    try {
      const token = await getToken();
      await markAsPlayed(token, game.id);
      setState("marked");
      noteAdded("left", game);
    } catch {
      setState("error");
    }
  }

  async function handleUndo() {
    try {
      const token = await getToken();
      await unmarkAsPlayed(token, game.id);
      setState("idle");
      noteRemoved("left", game.id);
    } catch {
      // Leave it marked if undo fails - understating is safer than
      // silently dropping an exclusion the user thinks is still in place.
    }
  }

  if (state === "marked") {
    return (
      <span className="inline-flex animate-in zoom-in-75 items-center gap-1 text-sm text-muted-foreground duration-300">
        <BookOpenCheck className="size-3.5" aria-hidden="true" />
        Won&apos;t be recommended again -{" "}
        <button type="button" onClick={handleUndo} className="underline hover:text-foreground">
          undo
        </button>
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={state === "marking"}
      className="gap-1.5"
    >
      <BookOpenCheck className="size-3.5" aria-hidden="true" />
      {state === "error" ? "Couldn't mark - try again" : state === "marking" ? "Marking..." : "Already played"}
    </Button>
  );
}

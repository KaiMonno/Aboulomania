import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

// Minimal wrapper, no variant system (unlike button.tsx/badge.tsx) - a
// tooltip only ever needs one look. Each instance owns its own Root
// rather than sharing an app-level Tooltip.Provider - fine for the one
// place this is used so far (Bookshelf.tsx); add a Provider higher up if
// shared delay/timing config is ever needed across many tooltips.
function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: string;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={<span>{children}</span>} />
      <TooltipPrimitive.Portal>
        {/* z-[100]: well above the bookshelf frame (z-10) and packed rows
            of other spines.
            collisionAvoidance={side:"none"}: base-ui's default collision
            boundary is "clipping-ancestors" - for a book inside
            Bookshelf.tsx's narrow overflow-y-auto shelf, that boundary is
            the shelf's own ~144px-wide box, not the viewport, even though
            the popup itself is portaled out to <body>. With the default
            "flip" behavior, the requested `side` (deliberately pointed
            away from the shelf, into the open page) almost always
            "doesn't fit" that narrow boundary, so it silently flipped
            back toward the shelf - landing on top of a neighboring spine,
            which is exactly the overlap this was meant to avoid. Pinning
            side avoidance to "none" makes it always honor the requested
            side instead of auto-correcting against the wrong boundary. */}
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={8}
          collisionPadding={8}
          collisionAvoidance={{ side: "none", align: "none" }}
        >
          <TooltipPrimitive.Popup
            className={cn(
              "z-[100] rounded-md border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
            )}
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

export { Tooltip };

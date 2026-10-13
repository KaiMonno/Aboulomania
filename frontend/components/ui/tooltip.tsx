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
            of other spines - found live that the default "top" placement
            could render a tooltip overlapping a neighboring spine one row
            up in a tightly-packed shelf, see Bookshelf.tsx's side prop. */}
        <TooltipPrimitive.Positioner side={side} sideOffset={8} collisionPadding={8}>
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

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { cn } from "cn";

// Minimal wrapper, no variant system (unlike button.tsx/badge.tsx) - a
// tooltip only ever needs one look. Each instance owns its own Root
// rather than sharing an app-level Tooltip.Provider - fine for the one
// place this is used so far (Bookshelf.tsx); add a Provider higher up if
// shared delay/timing config is ever needed across many tooltips.
function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger render={<span>{children}</span>} />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner sideOffset={6}>
          <TooltipPrimitive.Popup
            className={cn(
              "z-50 rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md"
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// The header's Info/Wishlist/Profile links (see layout.tsx) rendered no
// differently whichever page you were actually on - same ghost-button
// look active or not, so there was nothing to tell you which tab you were
// already looking at. This needs usePathname(), which forces it into its
// own client component rather than living inline in the (server) layout -
// same reasoning BookshelfMargins is already split out for.
export default function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      variant="ghost"
      size="sm"
      render={
        <Link
          href={href}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "nav-hop",
            // !important, not a plain override - confirmed live that cn()
            // (this project's tailwind-merge-style helper) does NOT
            // actually dedupe these against the ghost variant's own
            // hover:bg-muted/hover:text-foreground (components/ui/
            // button.tsx) the way it does for e.g. PlatformPicker's
            // active/inactive border swaps elsewhere in this app - both
            // classes were still present in the rendered output, leaving
            // it down to Tailwind's generated CSS source order (not the
            // class-attribute order) to pick a winner. Forcing !important
            // here removes that ambiguity instead of hoping source order
            // keeps cooperating.
            isActive && "!bg-primary/15 font-semibold !text-primary hover:!bg-primary/20"
          )}
        >
          {children}
        </Link>
      }
    />
  );
}

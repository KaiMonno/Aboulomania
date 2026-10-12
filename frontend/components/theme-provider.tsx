"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// Thin wrapper only so this can be a client component imported into the
// (server) root layout - next-themes itself handles the actual hard part
// correctly (no flash of the wrong theme on load, via a blocking inline
// script it injects before hydration) rather than this project hand-
// rolling that, which is a well-known App Router footgun to get right.
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

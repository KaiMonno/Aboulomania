import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeToggle from "@/components/ThemeToggle";

// Serif display face for the "reading room" theme - used only for headings
// (--font-heading, see globals.css), body/UI text stays on GeistSans for
// readability. Fraunces has a warm, literary old-style personality without
// tipping into a novelty/script font that would hurt legibility at small
// sizes (card titles, nav).
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "GameTaste",
  description: "AI-powered game recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {/* suppressHydrationWarning only on <html> - next-themes sets the
          class/style there before React hydrates (via a blocking script it
          injects) to avoid a flash of the wrong theme, which would
          otherwise make React's hydration warn about a mismatch it didn't
          cause. Nothing else needs it. */}
      <html lang="en" className={cn("font-sans", GeistSans.variable, fraunces.variable)} suppressHydrationWarning>
        <body className="bg-background text-foreground">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny pixel-art logo; next/image's resampling would blur it, image-rendering:pixelated keeps it crisp */}
                <img
                  src="/logo.png"
                  alt="GameTaste"
                  className="size-6"
                  style={{ imageRendering: "pixelated" }}
                />
                GameTaste
              </Link>
              <div className="flex items-center gap-2">
                <SignedIn>
                  <Button variant="ghost" size="sm" render={<Link href="/wishlist">Wishlist</Link>} />
                  <Button variant="ghost" size="sm" render={<Link href="/profile">Profile</Link>} />
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="sm">Sign in</Button>
                  </SignInButton>
                </SignedOut>
                <ThemeToggle />
              </div>
            </header>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

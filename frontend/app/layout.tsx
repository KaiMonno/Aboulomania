import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BookshelfMargins from "@/components/BookshelfMargins";
import { BookshelfProvider } from "@/lib/bookshelf-context";
import CrtFrame from "@/components/CrtFrame";

// BoldPixels by Yuki Pixels (1001fonts.com, FFC license - free for
// commercial use, no attribution required). Used for every text in the
// app (--font-sans AND --font-heading, see globals.css) - checked
// empirically first (a rendered size grid from 36px down to 12px, a full
// paragraph at 13-14px, and an O0/Il1/S5/B8/Z2/G6 ambiguous-character
// sample) and it stayed legible at every size actually used in the app,
// unlike an earlier ASCII-art text effect this project tried and fully
// reverted for being illegible at UI scale. Replaces the previous
// Fraunces/GeistSans split - Fraunces is gone, and GeistSans turned out to
// already be dead weight (its .variable was applied but nothing actually
// referenced --font-geist-sans, so body text was silently rendering the
// browser's default system-ui stack the whole time).
const boldPixels = localFont({
  src: "./fonts/BoldPixels.ttf",
  variable: "--font-pixel",
  display: "swap",
});

// IBM Plex Mono - tags, microcopy, slider hints, and form labels (anything
// that isn't a heading) switch to this monospace face instead of the
// display pixel font, which reads fine at large sizes but gets cramped and
// harder to scan in small UI text. next/font/google downloads and
// self-hosts this at build time (same no-runtime-request guarantee as
// localFont above), it just isn't a font this project ships its own copy
// of the way BoldPixels is.
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aboulomania",
  description: "AI-powered game recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("font-sans", boldPixels.variable, ibmPlexMono.variable)}>
        <body className="bg-background text-foreground">
          <CrtFrame />
          <BookshelfProvider>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur-sm">
              <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny pixel-art logo; next/image's resampling would blur it, image-rendering:pixelated keeps it crisp */}
                <img
                  src="/logo.png"
                  alt="Aboulomania"
                  className="size-6"
                  style={{ imageRendering: "pixelated" }}
                />
                Aboulomania
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" render={<Link href="/info">Info</Link>} />
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
              </div>
            </header>
            <BookshelfMargins />
            {children}
          </BookshelfProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

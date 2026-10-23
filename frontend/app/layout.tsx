import type { Metadata } from "next";
import Link from "next/link";
import localFont from "next/font/local";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import BookshelfMargins from "@/components/BookshelfMargins";
import { BookshelfProvider } from "@/lib/bookshelf-context";
import Cubes from "@/components/Cubes";

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

export const metadata: Metadata = {
  title: "Aboulomania",
  description: "AI-powered game recommendations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={cn("font-sans", boldPixels.variable)}>
        <body className="bg-background text-foreground">
          {/* Whole-app WebGL background. Needs an explicit negative z-index
              here, not just DOM order - unlike PlatformPicker's hover art
              earlier (a nested case where a negative z-index escaped its
              own Card and painted behind the page instead), position:fixed
              makes this a "positioned element", which CSS paints above all
              normal static-flow content regardless of DOM order - without
              -z-10 it rendered on top of every Card that doesn't itself set
              an explicit position (i.e. every Card except PlatformPicker's,
              which happens to have its own "relative" from that same
              earlier work). This is a direct child of body (the root
              stacking context), so -z-10 here can't escape anywhere the
              way it did when nested. Colors are literal oklch() strings
              matching globals.css's theme tokens (--background for the
              faces, --primary for the edges, --accent for the ripple) -
              canvas fillStyle parses oklch() directly in current browsers,
              so these track the real theme values without a separate hex
              conversion. */}
          <Cubes
            className="fixed inset-0 -z-10"
            gridSize={10}
            faceColor="oklch(0.1 0.025 316)"
            edgeColor="oklch(0.64 0.18 316)"
            rippleColor="oklch(0.68 0.17 273)"
            maxAngle={45}
            radius={3}
            gap={0.18}
            edgeStyle="solid"
            edgeWidth={1}
            faceOpacity={1}
            shading={0.6}
            perspective={0}
            speed={1}
            bounce={0.4}
            brush={1}
            rippleSpeed={1}
            autoAnimate
            rippleOnClick
            intro
            dpr={undefined}
          />
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

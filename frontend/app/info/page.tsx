import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Info - Aboulomania",
};

export default function InfoPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to search
      </Link>

      <div className="mt-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="size-5 text-primary" aria-hidden="true" />
              Why are some games missing?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              You might be wondering why certain games might be missing from this website. The
              makers of this site want to ensure that users are able to find games they might not
              know exist. We want to encourage easy exploration for people who want to dive deeper
              into the hobby. This is why we have excluded games that might be known to the average
              user.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Book flip animation: &ldquo;Pixel Book (Animated)&rdquo; by Gokhan Solak, sourced from{" "}
              <a
                href="https://opengameart.org/content/pixel-book-animated"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                OpenGameArt.org
              </a>
              , licensed under{" "}
              <a
                href="http://creativecommons.org/licenses/by/3.0/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                CC BY 3.0
              </a>
              .
            </p>
            <p>Library bookshelf art: &ldquo;Tiny Library Assets&rdquo; by Blubrry.</p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

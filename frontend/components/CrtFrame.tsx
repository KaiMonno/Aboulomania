import CrtMouseStatic from "@/components/CrtMouseStatic";

// Replaces the old WebGL Cubes grid as the whole-app background (see
// layout.tsx) - a static dark CRT monitor treatment instead of an animated
// one. Lives entirely at -z-10, the same slot Cubes used to occupy, behind
// every real UI surface in the app (MagicBento's card background, the
// bookshelf's shelf-cavity/shelf-cap art, shadcn's Card are all fully
// opaque) - so none of this can ever touch card text or wash out the
// bookshelf's colors, it only shows in genuine empty space (page margins,
// the gaps around and between cards, the area outside the centered content
// column on a wide screen). See the git history on this file for the
// earlier attempts that put some of this in FRONT of content instead and
// had to be reworked because of exactly that - CrtMouseStatic (the
// cursor-following noise patch) inherits that same protection for free by
// living in this same layer, not a new one.
//
// Tinted with this app's own --primary purple (hue 316, matching
// globals.css), not a generic phosphor green/amber - this briefly went
// cyan/cyber-deck for a punchier "hacker terminal" look, but that was a
// different hue family than the rest of the app's theme and read as
// disconnected from it rather than as a variant of it.
export default function CrtFrame() {
  return (
    <div
      className="crt-flicker fixed inset-0 -z-10"
      aria-hidden="true"
      style={{
        backgroundColor: "oklch(0.05 0.02 316)",
        backgroundImage: [
          "repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.45) 0px, rgba(0, 0, 0, 0.45) 1px, transparent 1px, transparent 3px)",
          "radial-gradient(ellipse at center, oklch(0.6 0.16 316 / 14%) 0%, transparent 60%)",
          "radial-gradient(circle at center, transparent 45%, rgba(0, 0, 0, 0.8) 100%)",
        ].join(", "),
      }}
    >
      {/* A soft highlight band drifting top-to-bottom and looping - the
          "terminal sweep" read. crt-scan-sweep's keyframes live in
          globals.css, gated on prefers-reduced-motion there (same as
          crt-flicker above) so both are a no-op for anyone who's asked for
          less motion, same as every other animated effect in this app. */}
      <div
        className="crt-scan-sweep absolute inset-x-0 h-[18vh]"
        style={{
          top: "-20%",
          backgroundImage: "linear-gradient(to bottom, transparent, oklch(0.75 0.14 316 / 10%), transparent)",
        }}
      />
      <CrtMouseStatic />
    </div>
  );
}

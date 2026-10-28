import type { SVGProps } from "react";

// Chunky 8x8 "1-bit" pixel-art glyphs, dropped in wherever this app used a
// thin lucide-react stroke icon in a card header - same currentColor fill
// and className="size-4 text-primary" usage, just drawn as a grid of solid
// 1x1 cells instead of a smooth stroked path. shapeRendering="crispEdges"
// keeps the cell edges sharp at any display size (a plain SVG would
// anti-alias the rect edges and blur the pixel look back out).
type Grid = string[]; // 8 rows of 8 chars each - "#" = filled cell, anything else = empty

function cellsFrom(grid: Grid) {
  const cells: { x: number; y: number }[] = [];
  grid.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      if (char === "#") cells.push({ x, y });
    });
  });
  return cells;
}

function PixelGlyph({ grid, ...props }: { grid: Grid } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" fill="currentColor" {...props}>
      {cellsFrom(grid).map(({ x, y }) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} />
      ))}
    </svg>
  );
}

const CLOCK: Grid = [
  "..####..",
  ".#....#.",
  "#...#..#",
  "#...####",
  "#...#..#",
  "#......#",
  ".#....#.",
  "..####..",
];

const SCALE: Grid = [
  "...##...",
  "...##...",
  ".######.",
  "#......#",
  "#......#",
  ".#....#.",
  "..####..",
  "...##...",
];

const CONTROLLER: Grid = [
  "..####..",
  ".######.",
  "########",
  "#.#..#.#",
  "########",
  "##....##",
  "........",
  "........",
];

const TAG: Grid = [
  "........",
  "..#####.",
  ".#.....#",
  "#.##...#",
  "#.##...#",
  ".#.....#",
  "..#####.",
  "........",
];

const USERS: Grid = [
  ".#...#..",
  ".#...#..",
  "###.###.",
  "###.###.",
  "###.###.",
  "###.###.",
  "###.###.",
  "........",
];

const SPARKLE: Grid = [
  "...##...",
  "...##...",
  "..####..",
  "########",
  "########",
  "..####..",
  "...##...",
  "...##...",
];

const BOOKMARK: Grid = [
  ".######.",
  ".#....#.",
  ".#....#.",
  ".#....#.",
  ".#....#.",
  ".#....#.",
  ".##..##.",
  "...##...",
];

export const PixelClock = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={CLOCK} {...props} />;
export const PixelScale = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={SCALE} {...props} />;
export const PixelController = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={CONTROLLER} {...props} />;
export const PixelTag = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={TAG} {...props} />;
export const PixelUsers = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={USERS} {...props} />;
export const PixelSparkle = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={SPARKLE} {...props} />;
export const PixelBookmark = (props: SVGProps<SVGSVGElement>) => <PixelGlyph grid={BOOKMARK} {...props} />;

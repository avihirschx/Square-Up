// Convert a filled square + category names (from the Builder) into a puzzle
// config that derivePuzzle() can consume. Works for both modes:
//   • "4x4" — 12 ring words.
//   • "3x3" — 8 ring words + 1 "odd one out" word in the center.

import { geoForMode, GRID_CORNERS, PALETTE } from "./geometry.js";
import { derivePuzzle } from "./engine.js";

export function parseSquareToPuzzle(grid, names, mode = "4x4", odd = null) {
  const geo = geoForMode(mode);
  const at = (r, c) => (grid[r]?.[c] || "").trim();

  for (const [r, c] of geo.OUTER_CELLS) {
    if (!at(r, c)) return { ok: false, error: `Fill in all ${geo.OUTER_CELLS.length} squares.` };
  }
  const catList = [names.top, names.right, names.bottom, names.left].map((s) => (s || "").trim());
  if (catList.some((n) => !n)) return { ok: false, error: "Name all four categories." };
  if (new Set(catList).size !== 4) return { ok: false, error: "Category names must all be different." };

  const oddWord = mode === "3x3" ? (odd || "").trim() : null;
  if (mode === "3x3" && !oddWord) return { ok: false, error: "Add the odd-one-out word in the center." };

  const ring = geo.OUTER_CELLS.map(([r, c]) => at(r, c));
  const allWords = oddWord ? [...ring, oddWord] : ring;
  if (new Set(allWords.map((w) => w.toLowerCase())).size !== allWords.length)
    return { ok: false, error: "All words must be different." };

  const nameOfSide = { top: catList[0], right: catList[1], bottom: catList[2], left: catList[3] };

  const edgeWords = {};
  for (const side of ["top", "right", "bottom", "left"]) {
    const cornerKeys = new Set(geo.SIDE_CORNERS[side]);
    const edgeCells = geo.SIDE_CELLS[side].map(([r, c]) => `${r},${c}`).filter((k) => !cornerKeys.has(k));
    edgeWords[nameOfSide[side]] = edgeCells.map((k) => { const [r, c] = k.split(",").map(Number); return at(r, c); });
  }

  const cw = (key) => { const [r, c] = key.split(",").map(Number); return at(r, c); };
  const corners = [
    { word: cw(geo.SIDE_PAIR_CORNER["top+right"]),    cats: [nameOfSide.top, nameOfSide.right] },
    { word: cw(geo.SIDE_PAIR_CORNER["right+bottom"]), cats: [nameOfSide.right, nameOfSide.bottom] },
    { word: cw(geo.SIDE_PAIR_CORNER["bottom+left"]),  cats: [nameOfSide.bottom, nameOfSide.left] },
    { word: cw(geo.SIDE_PAIR_CORNER["left+top"]),     cats: [nameOfSide.left, nameOfSide.top] },
  ];

  const colors = {};
  [nameOfSide.top, nameOfSide.right, nameOfSide.bottom, nameOfSide.left].forEach((n, i) => { colors[n] = PALETTE[i]; });

  return { ok: true, puzzle: derivePuzzle({ edgeWords, corners, colors, mode, odd: oddWord }) };
}

// ── Source <-> grid helpers ──
// A "source" stores: { mode, title, names, cells (ring words, OUTER order),
// odd (center word, 3x3 only) } — the minimal data to save or share a puzzle.

export function sourceToGrid(source) {
  const geo = geoForMode(source.mode);
  const g = Array(geo.N).fill(null).map(() => Array(geo.N).fill(""));
  geo.OUTER_CELLS.forEach(([r, c], i) => { g[r][c] = source.cells[i] ?? ""; });
  if (source.mode === "3x3" && geo.CENTER_CELLS.length === 1) {
    const [r, c] = geo.CENTER_CELLS[0];
    g[r][c] = source.odd ?? "";
  }
  return g;
}

export function gridToCells(grid, mode = "4x4") {
  return geoForMode(mode).OUTER_CELLS.map(([r, c]) => (grid[r][c] || "").trim());
}

// Compile a saved/shared source into a playable puzzle.
export function compileSource(source) {
  return parseSquareToPuzzle(sourceToGrid(source), source.names, source.mode || "4x4", source.odd || null);
}

export { GRID_CORNERS };

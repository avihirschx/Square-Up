// Convert a filled 4×4 square + 4 category names (from the Builder screen)
// into a puzzle config that derivePuzzle() can consume.

import { OUTER_CELLS, SIDE_CELLS, SIDE_CORNERS, GRID_CORNERS, PALETTE } from "./geometry.js";
import { derivePuzzle } from "./engine.js";

export function parseSquareToPuzzle(grid4x4, names) {
  const g = grid4x4;
  const at = (r, c) => (g[r][c] || "").trim();

  for (const [r, c] of OUTER_CELLS) {
    if (!at(r, c)) return { ok: false, error: "Fill in all 12 squares." };
  }
  const catList = [names.top, names.right, names.bottom, names.left].map((s) => (s || "").trim());
  if (catList.some((n) => !n)) return { ok: false, error: "Name all four categories." };
  if (new Set(catList).size !== 4) return { ok: false, error: "Category names must all be different." };

  const all = OUTER_CELLS.map(([r, c]) => at(r, c));
  if (new Set(all.map((w) => w.toLowerCase())).size !== 12)
    return { ok: false, error: "All 12 words must be different." };

  const nameOfSide = { top: catList[0], right: catList[1], bottom: catList[2], left: catList[3] };

  const edgeWords = {};
  for (const side of ["top", "right", "bottom", "left"]) {
    const cornerKeysOfSide = SIDE_CORNERS[side];
    const edgeCells = SIDE_CELLS[side]
      .map(([r, c]) => `${r},${c}`)
      .filter((k) => !cornerKeysOfSide.includes(k));
    edgeWords[nameOfSide[side]] = edgeCells.map((k) => {
      const [r, c] = k.split(",").map(Number);
      return at(r, c);
    });
  }

  const cw = (key) => { const [r, c] = key.split(",").map(Number); return at(r, c); };
  const corners = [
    { word: cw("0,3"), cats: [nameOfSide.top, nameOfSide.right] },
    { word: cw("3,3"), cats: [nameOfSide.right, nameOfSide.bottom] },
    { word: cw("3,0"), cats: [nameOfSide.bottom, nameOfSide.left] },
    { word: cw("0,0"), cats: [nameOfSide.left, nameOfSide.top] },
  ];

  const colors = {};
  [nameOfSide.top, nameOfSide.right, nameOfSide.bottom, nameOfSide.left].forEach((n, i) => {
    colors[n] = PALETTE[i];
  });

  return { ok: true, puzzle: derivePuzzle({ edgeWords, corners, colors }) };
}

// ── Source <-> grid helpers ──
// A "source" stores the 12 outer words (OUTER_CELLS order) + names + title —
// the minimal data to save or share a user puzzle.

export function sourceToGrid(source) {
  const g = Array(4).fill(null).map(() => Array(4).fill(""));
  OUTER_CELLS.forEach(([r, c], i) => { g[r][c] = source.cells[i] ?? ""; });
  return g;
}

export function gridToCells(grid) {
  return OUTER_CELLS.map(([r, c]) => (grid[r][c] || "").trim());
}

// Compile a saved/shared source into a playable puzzle. Returns the same
// shape as parseSquareToPuzzle: { ok, puzzle } or { ok:false, error }.
export function compileSource(source) {
  return parseSquareToPuzzle(sourceToGrid(source), source.names);
}

export { GRID_CORNERS };

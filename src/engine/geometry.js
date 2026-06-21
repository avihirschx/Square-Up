// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Board geometry, parameterized by ring size N (3 or 4).
//
// The board is an N×N grid. The OUTER ring holds the words; each SIDE of the
// square is one category of N words, and the 4 CORNER cells are shared by the
// two sides they touch.
//   • N = 4 → 12 ring cells, sides of 4 (2 edges + 2 corners), inner 2×2 is
//     the "Check" area (classic mode).
//   • N = 3 → 8 ring cells, sides of 3 (1 edge + 2 corners), the single center
//     cell holds the "odd one out" word.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function makeGeometry(N) {
  const last = N - 1;
  const k = (r, c) => `${r},${c}`;

  const SIDE_CELLS = {
    top:    Array.from({ length: N }, (_, c) => [0, c]),
    right:  Array.from({ length: N }, (_, r) => [r, last]),
    bottom: Array.from({ length: N }, (_, c) => [last, last - c]),
    left:   Array.from({ length: N }, (_, r) => [last - r, 0]),
  };

  const CORNER_SIDES = {
    [k(0, 0)]:       ["top", "left"],
    [k(0, last)]:    ["top", "right"],
    [k(last, last)]: ["right", "bottom"],
    [k(last, 0)]:    ["bottom", "left"],
  };
  const GRID_CORNERS = new Set(Object.keys(CORNER_SIDES));

  const SIDE_CORNERS = {
    top:    [k(0, 0), k(0, last)],
    right:  [k(0, last), k(last, last)],
    bottom: [k(last, last), k(last, 0)],
    left:   [k(last, 0), k(0, 0)],
  };

  const SIDE_PAIR_CORNER = {
    "top+right":    k(0, last),
    "right+bottom": k(last, last),
    "bottom+left":  k(last, 0),
    "left+top":     k(0, 0),
  };

  // Ring cells, clockwise from top-left (no repeats).
  const OUTER_CELLS = [];
  for (let c = 0; c < N; c++) OUTER_CELLS.push([0, c]);          // top
  for (let r = 1; r < N; r++) OUTER_CELLS.push([r, last]);       // right
  for (let c = N - 2; c >= 0; c--) OUTER_CELLS.push([last, c]);  // bottom
  for (let r = N - 2; r >= 1; r--) OUTER_CELLS.push([r, 0]);     // left

  const CELL_SIDE = {};
  for (const [side, cells] of Object.entries(SIDE_CELLS)) {
    for (const [r, c] of cells) {
      const key = k(r, c);
      if (!GRID_CORNERS.has(key)) CELL_SIDE[key] = side;
    }
  }

  // The non-ring cells (inner block for N=4; the single middle for N=3).
  const ring = new Set(OUTER_CELLS.map(([r, c]) => k(r, c)));
  const CENTER_CELLS = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (!ring.has(k(r, c))) CENTER_CELLS.push([r, c]);
  }
  const INNER_CELLS = new Set(CENTER_CELLS.map(([r, c]) => k(r, c)));

  return {
    N, OUTER_CELLS, INNER_CELLS, CENTER_CELLS,
    SIDE_CELLS, CORNER_SIDES, GRID_CORNERS, SIDE_CORNERS, SIDE_PAIR_CORNER, CELL_SIDE,
  };
}

export const GEO4 = makeGeometry(4);
export const GEO3 = makeGeometry(3);
export const geoForMode = (mode) => (mode === "3x3" ? GEO3 : GEO4);

// ── Backward-compatible 4×4 named exports (classic mode) ──
export const OUTER_CELLS = GEO4.OUTER_CELLS;
export const INNER_CELLS = GEO4.INNER_CELLS;
export const SIDE_CELLS = GEO4.SIDE_CELLS;
export const CORNER_SIDES = GEO4.CORNER_SIDES;
export const GRID_CORNERS = GEO4.GRID_CORNERS;
export const SIDE_CORNERS = GEO4.SIDE_CORNERS;
export const SIDE_PAIR_CORNER = GEO4.SIDE_PAIR_CORNER;
export const CELL_SIDE = GEO4.CELL_SIDE;

// Category colors, by side position (top, right, bottom, left).
export const PALETTE = [
  { bg: "#F5C518", text: "#1a1a1a" }, // yellow
  { bg: "#E8433A", text: "#ffffff" }, // red
  { bg: "#2EA84E", text: "#ffffff" }, // green
  { bg: "#2A7AE4", text: "#ffffff" }, // blue
];

// Tile sizing (px).
export const CELL = 82;
export const GAP = 7;

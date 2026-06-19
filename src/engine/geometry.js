// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fixed board geometry (never changes between puzzles).
//
// The board is a 4×4 grid. The 12 OUTER cells hold the words; the
// inner 2×2 is the "Check" button. Each SIDE of the square is one
// category of 4 words, and the 4 CORNER cells are shared by the two
// sides they touch.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// The 12 outer cells, clockwise from top-left.
export const OUTER_CELLS = [
  [0, 0], [0, 1], [0, 2], [0, 3],
  [1, 3], [2, 3], [3, 3], [3, 2],
  [3, 1], [3, 0], [2, 0], [1, 0],
];

export const INNER_CELLS = new Set(["1,1", "1,2", "2,1", "2,2"]);

export const SIDE_CELLS = {
  top:    [[0, 0], [0, 1], [0, 2], [0, 3]],
  right:  [[0, 3], [1, 3], [2, 3], [3, 3]],
  bottom: [[3, 3], [3, 2], [3, 1], [3, 0]],
  left:   [[3, 0], [2, 0], [1, 0], [0, 0]],
};

export const CORNER_SIDES = {
  "0,0": ["top", "left"],
  "0,3": ["top", "right"],
  "3,3": ["right", "bottom"],
  "3,0": ["bottom", "left"],
};

export const GRID_CORNERS = new Set(Object.keys(CORNER_SIDES));

export const SIDE_CORNERS = {
  top:    ["0,0", "0,3"],
  right:  ["0,3", "3,3"],
  bottom: ["3,3", "3,0"],
  left:   ["3,0", "0,0"],
};

export const SIDE_PAIR_CORNER = {
  "top+right": "0,3",
  "right+bottom": "3,3",
  "bottom+left": "3,0",
  "left+top": "0,0",
};

// Map every non-corner edge cell to the side it belongs to.
export const CELL_SIDE = {};
for (const [side, cells] of Object.entries(SIDE_CELLS)) {
  for (const [r, c] of cells) {
    const key = `${r},${c}`;
    if (!GRID_CORNERS.has(key)) CELL_SIDE[key] = side;
  }
}

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

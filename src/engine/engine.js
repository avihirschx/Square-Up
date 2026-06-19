// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pure puzzle engine — no React, no DOM. Everything the game needs to
// derive, validate, solve, and shuffle a puzzle lives here so it can be
// unit-tested and run from Node (see scripts/validate-puzzles.mjs).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import {
  OUTER_CELLS, GRID_CORNERS, SIDE_CELLS, SIDE_CORNERS,
  SIDE_PAIR_CORNER, CELL_SIDE,
} from "./geometry.js";

// Turn a puzzle config { edgeWords, corners, colors } into all the
// derived lookup data the board needs.
export function derivePuzzle({ edgeWords, corners, colors }) {
  const catNames = Object.keys(edgeWords);

  const cornerWordColors = {};
  for (const { word, cats } of corners)
    cornerWordColors[word] = { bg1: colors[cats[0]].bg, bg2: colors[cats[1]].bg };

  const categoryWords = {};
  for (const cat of catNames) {
    const cw = corners.filter((c) => c.cats.includes(cat)).map((c) => c.word);
    categoryWords[cat] = [...edgeWords[cat], ...cw];
  }

  const categoryCornerWords = {};
  for (const cat of catNames)
    categoryCornerWords[cat] = corners.filter((c) => c.cats.includes(cat)).map((c) => c.word);

  const words = [...new Set(catNames.flatMap((c) => categoryWords[c]))];

  const validAdjacent = {};
  for (const { cats } of corners) {
    validAdjacent[`${cats[0]}+${cats[1]}`] = true;
    validAdjacent[`${cats[1]}+${cats[0]}`] = true;
  }

  const catSorted = {};
  for (const cat of catNames)
    catSorted[cat] = [...categoryWords[cat]].sort().join(",");

  const fallbackGrid = buildSolvedGrid(catNames, corners, categoryWords);

  return {
    edgeWords, corners, colors, catNames,
    cornerWordColors, categoryWords, categoryCornerWords,
    words, validAdjacent, catSorted, fallbackGrid,
  };
}

// Build ONE valid solved 4×4 grid for a puzzle (used for the
// reveal-on-give-up, and as a structural-validity proof by the validator).
export function buildSolvedGrid(catNames, corners, categoryWords) {
  const sharedBetween = (a, b) =>
    corners.find((c) => c.cats.includes(a) && c.cats.includes(b))?.word ?? null;

  const ring = [catNames[0]];
  while (ring.length < 4) {
    const last = ring[ring.length - 1];
    const next = catNames.find((c) => !ring.includes(c) && sharedBetween(last, c));
    if (!next) break;
    ring.push(next);
  }
  if (ring.length < 4) return null;

  const [topCat, rightCat, bottomCat, leftCat] = ring;
  const cornerTR = sharedBetween(topCat, rightCat);
  const cornerBR = sharedBetween(rightCat, bottomCat);
  const cornerBL = sharedBetween(bottomCat, leftCat);
  const cornerTL = sharedBetween(leftCat, topCat);
  if (!cornerTR || !cornerBR || !cornerBL || !cornerTL) return null;

  const edgeOnly = (cat) =>
    categoryWords[cat].filter((w) => ![cornerTR, cornerBR, cornerBL, cornerTL].includes(w));
  const [t1, t2] = edgeOnly(topCat);
  const [r1, r2] = edgeOnly(rightCat);
  const [b1, b2] = edgeOnly(bottomCat);
  const [l1, l2] = edgeOnly(leftCat);
  // A well-formed puzzle has exactly 2 edge-only words per side.
  if ([t1, t2, r1, r2, b1, b2, l1, l2].some((w) => w === undefined)) return null;

  const g = Array(4).fill(null).map(() => Array(4).fill(null));
  g[0][0] = cornerTL; g[0][1] = t1; g[0][2] = t2; g[0][3] = cornerTR;
  g[1][3] = r1;       g[2][3] = r2; g[3][3] = cornerBR;
  g[3][2] = b1;       g[3][1] = b2; g[3][0] = cornerBL;
  g[2][0] = l1;       g[1][0] = l2;
  return g;
}

// ── Runtime engine functions (all take `puzzle`) ──

export function isLockedEdge(key, correctSideMap) {
  if (!correctSideMap?.size) return false;
  if (GRID_CORNERS.has(key)) return false;
  return correctSideMap.has(CELL_SIDE[key]);
}

export function resolveSide(puzzle, grid, side) {
  const words = SIDE_CELLS[side].map(([r, c]) => grid[r][c]);
  if (words.some((w) => !w)) return null;
  const sorted = [...words].sort().join(",");
  return puzzle.catNames.find((cat) => puzzle.catSorted[cat] === sorted) ?? null;
}

export function sharedWord(puzzle, catA, catB) {
  return puzzle.corners.find((c) => c.cats.includes(catA) && c.cats.includes(catB))?.word ?? null;
}

export function validateGrid(puzzle, grid) {
  const sideCat = {};
  for (const side of Object.keys(SIDE_CELLS)) {
    const cat = resolveSide(puzzle, grid, side);
    if (!cat) return null;
    sideCat[side] = cat;
  }
  if (new Set(Object.values(sideCat)).size !== 4) return null;
  const adj = [["top", "right"], ["right", "bottom"], ["bottom", "left"], ["left", "top"]];
  for (const [s1, s2] of adj) {
    const [c1, c2] = [sideCat[s1], sideCat[s2]];
    if (!puzzle.validAdjacent[`${c1}+${c2}`]) return null;
    const sw = sharedWord(puzzle, c1, c2);
    const [cr, co] = SIDE_PAIR_CORNER[`${s1}+${s2}`].split(",").map(Number);
    if (grid[cr][co] !== sw) return null;
  }
  return { sideCategories: sideCat };
}

// Which sides are fully correct (right category set AND right corner words),
// so the board can lock them in as a hint.
export function getCorrectSideMap(puzzle, grid) {
  const result = new Map();
  for (const side of Object.keys(SIDE_CELLS)) {
    const cat = resolveSide(puzzle, grid, side);
    if (!cat) continue;
    const cw = puzzle.categoryCornerWords[cat];
    const ok = SIDE_CORNERS[side].every((key) => {
      const [r, c] = key.split(",").map(Number);
      return cw.includes(grid[r][c]);
    });
    if (ok) result.set(side, cat);
  }
  return result;
}

// Fisher-Yates shuffle (unbiased).
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function shuffleIntoGrid(words) {
  const g = Array(4).fill(null).map(() => Array(4).fill(null));
  OUTER_CELLS.forEach(([r, c], i) => { g[r][c] = words[i]; });
  return g;
}

// Shuffle the 12 words into the board, avoiding the (rare) case where the
// initial deal is already a valid solution.
export function dealPuzzle(puzzle) {
  let grid = shuffleIntoGrid(shuffled(puzzle.words));
  for (let tries = 0; tries < 20 && validateGrid(puzzle, grid); tries++) {
    grid = shuffleIntoGrid(shuffled(puzzle.words));
  }
  return grid;
}

export function shuffleKeepingLocked(grid, lockedKeys) {
  const freeKeys = OUTER_CELLS
    .map(([r, c]) => `${r},${c}`)
    .filter((key) => !lockedKeys.has(key));
  const freeWords = shuffled(freeKeys.map((key) => {
    const [r, c] = key.split(",").map(Number);
    return grid[r][c];
  }));
  const g = grid.map((row) => [...row]);
  freeKeys.forEach((key, i) => {
    const [r, c] = key.split(",").map(Number);
    g[r][c] = freeWords[i];
  });
  return g;
}

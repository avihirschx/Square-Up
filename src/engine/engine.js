// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pure puzzle engine — no React, no DOM. Geometry-aware: works for the classic
// 4×4 board and the 3×3 "odd one out" board. Each puzzle carries its own
// geometry (puzzle.geo) so all the helpers stay size-agnostic.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { geoForMode } from "./geometry.js";

// Turn a puzzle config into all the derived lookup data the board needs.
// mode: "4x4" (classic) | "3x3" (odd one out). odd: the extra center word (3x3).
export function derivePuzzle({ edgeWords, corners, colors, mode = "4x4", odd = null }) {
  const geo = geoForMode(mode);
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

  // Cells the player fills, and the words that go in them. In 3×3 mode the
  // center cell holds the odd-one-out word; in 4×4 the center is the UI.
  const useOdd = mode === "3x3" && !!odd;
  const placeCells = useOdd ? [...geo.OUTER_CELLS, ...geo.CENTER_CELLS] : geo.OUTER_CELLS;
  const allWords = useOdd ? [...words, odd] : words;

  const fallbackGrid = buildSolvedGrid(geo, catNames, corners, categoryWords, useOdd ? odd : null);

  return {
    geo, mode, odd: useOdd ? odd : null,
    edgeWords, corners, colors, catNames,
    cornerWordColors, categoryWords, categoryCornerWords,
    words, allWords, placeCells, validAdjacent, catSorted, fallbackGrid,
  };
}

// Build ONE valid solved grid (reveal-on-give-up + structural-validity proof).
export function buildSolvedGrid(geo, catNames, corners, categoryWords, odd) {
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
  const sideCat = { top: topCat, right: rightCat, bottom: bottomCat, left: leftCat };
  const cornerByPair = {
    "top+right": sharedBetween(topCat, rightCat),
    "right+bottom": sharedBetween(rightCat, bottomCat),
    "bottom+left": sharedBetween(bottomCat, leftCat),
    "left+top": sharedBetween(leftCat, topCat),
  };
  if (Object.values(cornerByPair).some((w) => !w)) return null;
  const allCorners = Object.values(cornerByPair);

  const g = Array(geo.N).fill(null).map(() => Array(geo.N).fill(null));

  for (const [pair, word] of Object.entries(cornerByPair)) {
    const [r, c] = geo.SIDE_PAIR_CORNER[pair].split(",").map(Number);
    g[r][c] = word;
  }
  for (const side of ["top", "right", "bottom", "left"]) {
    const edges = categoryWords[sideCat[side]].filter((w) => !allCorners.includes(w));
    const cornerKeys = new Set(geo.SIDE_CORNERS[side]);
    const edgeCells = geo.SIDE_CELLS[side].filter(([r, c]) => !cornerKeys.has(`${r},${c}`));
    if (edges.length !== edgeCells.length) return null; // malformed
    edgeCells.forEach(([r, c], i) => { g[r][c] = edges[i]; });
  }
  if (odd && geo.CENTER_CELLS.length === 1) {
    const [r, c] = geo.CENTER_CELLS[0];
    g[r][c] = odd;
  }
  return g;
}

// ── Runtime engine functions (all take `puzzle`, which carries geo) ──

export function isLockedEdge(geo, key, correctSideMap) {
  if (!correctSideMap?.size) return false;
  if (geo.GRID_CORNERS.has(key)) return false;
  return correctSideMap.has(geo.CELL_SIDE[key]);
}

export function resolveSide(puzzle, grid, side) {
  const words = puzzle.geo.SIDE_CELLS[side].map(([r, c]) => grid[r][c]);
  if (words.some((w) => !w)) return null;
  const sorted = [...words].sort().join(",");
  return puzzle.catNames.find((cat) => puzzle.catSorted[cat] === sorted) ?? null;
}

export function sharedWord(puzzle, catA, catB) {
  return puzzle.corners.find((c) => c.cats.includes(catA) && c.cats.includes(catB))?.word ?? null;
}

export function validateGrid(puzzle, grid) {
  const geo = puzzle.geo;
  const sideCat = {};
  for (const side of Object.keys(geo.SIDE_CELLS)) {
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
    const [cr, co] = geo.SIDE_PAIR_CORNER[`${s1}+${s2}`].split(",").map(Number);
    if (grid[cr][co] !== sw) return null;
  }
  return { sideCategories: sideCat };
}

// Which sides are fully correct (right category set AND right corner words).
export function getCorrectSideMap(puzzle, grid) {
  const geo = puzzle.geo;
  const result = new Map();
  for (const side of Object.keys(geo.SIDE_CELLS)) {
    const cat = resolveSide(puzzle, grid, side);
    if (!cat) continue;
    const cw = puzzle.categoryCornerWords[cat];
    const ok = geo.SIDE_CORNERS[side].every((key) => {
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

export function placeIntoGrid(puzzle, words) {
  const g = Array(puzzle.geo.N).fill(null).map(() => Array(puzzle.geo.N).fill(null));
  puzzle.placeCells.forEach(([r, c], i) => { g[r][c] = words[i]; });
  return g;
}

// Shuffle the words into the board, avoiding the (rare) already-solved deal.
export function dealPuzzle(puzzle) {
  let grid = placeIntoGrid(puzzle, shuffled(puzzle.allWords));
  for (let tries = 0; tries < 20 && validateGrid(puzzle, grid); tries++) {
    grid = placeIntoGrid(puzzle, shuffled(puzzle.allWords));
  }
  return grid;
}

export function shuffleKeepingLocked(puzzle, grid, lockedKeys) {
  const freeKeys = puzzle.placeCells
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

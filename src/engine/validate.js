// Shared puzzle validator — "attacks" a compiled puzzle and reports whether
// it's fit to play. Used both by the Builder (live, on your own puzzles) and by
// scripts/validate-puzzles.mjs (CI, on the built-in collection). Size-aware:
// works for the 4×4 board and the 3×3 odd-one-out board.

import { validateGrid } from "./engine.js";

// Heap's algorithm — every permutation of an array (used for the 24 ways to
// assign 4 categories to the 4 sides).
function* permutations(arr) {
  const a = [...arr];
  const c = new Array(a.length).fill(0);
  yield a.slice();
  let i = 0;
  while (i < a.length) {
    if (c[i] < i) {
      const j = i % 2 === 0 ? 0 : c[i];
      [a[i], a[j]] = [a[j], a[i]];
      yield a.slice();
      c[i]++; i = 0;
    } else { c[i] = 0; i++; }
  }
}

// Fingerprint of a solution as the CYCLIC ORDER of its four side word-sets,
// canonicalized under the board's 8 symmetries (4 rotations × reflection). Two
// solutions collapse to the same fingerprint iff they're the same puzzle up to
// rotating/flipping the board; a genuinely different ring order (real
// ambiguity) yields a different fingerprint.
function signature(puzzle, grid) {
  const geo = puzzle.geo;
  const sides = ["top", "right", "bottom", "left"]
    .map((side) => geo.SIDE_CELLS[side].map(([r, c]) => grid[r][c]).sort().join("|"));
  const forms = [];
  for (const seq of [sides, [...sides].reverse()]) {
    for (let i = 0; i < 4; i++) forms.push(seq.map((_, j) => seq[(i + j) % 4]).join("  ||  "));
  }
  return forms.sort()[0];
}

// Assemble a grid for one category-per-side assignment, honoring the rule that
// each side's two corner cells hold the words shared with its neighbours.
// Returns a grid or null if that assignment is impossible.
export function assembleBySides(puzzle, sideCat) {
  const geo = puzzle.geo;
  const need = (a, b) => puzzle.corners.find((c) => c.cats.includes(a) && c.cats.includes(b))?.word ?? null;
  const cornerByPair = {
    "top+right":    need(sideCat.top, sideCat.right),
    "right+bottom": need(sideCat.right, sideCat.bottom),
    "bottom+left":  need(sideCat.bottom, sideCat.left),
    "left+top":     need(sideCat.left, sideCat.top),
  };
  if (Object.values(cornerByPair).some((w) => !w)) return null;
  const allCorners = Object.values(cornerByPair);

  const g = Array(geo.N).fill(null).map(() => Array(geo.N).fill(null));
  for (const [pair, word] of Object.entries(cornerByPair)) {
    const [r, c] = geo.SIDE_PAIR_CORNER[pair].split(",").map(Number);
    g[r][c] = word;
  }
  for (const side of ["top", "right", "bottom", "left"]) {
    const edges = puzzle.categoryWords[sideCat[side]].filter((w) => !allCorners.includes(w));
    const cornerKeys = new Set(geo.SIDE_CORNERS[side]);
    const edgeCells = geo.SIDE_CELLS[side].filter(([r, c]) => !cornerKeys.has(`${r},${c}`));
    if (edges.length !== edgeCells.length) return null;
    edgeCells.forEach(([r, c], i) => { g[r][c] = edges[i]; });
  }
  if (puzzle.odd && geo.CENTER_CELLS.length === 1) {
    const [r, c] = geo.CENTER_CELLS[0];
    g[r][c] = puzzle.odd;
  }
  return g;
}

// Validate a compiled puzzle. Returns { ok, issues[], warnings[] }.
//   issues   — hard problems that make the puzzle broken/unfair (block it).
//   warnings — worth flagging but still playable.
export function validatePuzzle(puzzle) {
  const issues = [];
  const warnings = [];
  const geo = puzzle.geo;
  const wordsPerSide = geo.N; // a side of N cells = (N-2) edges + 2 corners = N words

  // 1. STRUCTURE
  if (puzzle.catNames.length !== 4) issues.push(`expected 4 categories, got ${puzzle.catNames.length}`);
  for (const cat of puzzle.catNames) {
    const ws = puzzle.categoryWords[cat] || [];
    if (ws.length !== wordsPerSide) issues.push(`category “${cat}” has ${ws.length} words (needs ${wordsPerSide})`);
    if ((puzzle.categoryCornerWords[cat] || []).length !== 2) issues.push(`category “${cat}” must touch exactly 2 corners`);
  }

  // 2. SOLVABLE (round-trip the engine's own solved grid)
  if (!puzzle.fallbackGrid) {
    issues.push("no solution — the corner words don’t form a closed ring of four categories");
  } else if (!validateGrid(puzzle, puzzle.fallbackGrid)) {
    issues.push("the engine’s solved grid is rejected by the checker (internal inconsistency)");
  }

  // 3. UNAMBIGUOUS — only the 24 category-per-side assignments can ever validate
  // (the checker only accepts sides that are exact category sets), so enumerate
  // those and confirm they all describe the same puzzle up to symmetry.
  if (issues.length === 0) {
    const sigs = new Set();
    for (const [t, r, b, l] of permutations(puzzle.catNames)) {
      const grid = assembleBySides(puzzle, { top: t, right: r, bottom: b, left: l });
      if (grid && validateGrid(puzzle, grid)) sigs.add(signature(puzzle, grid));
    }
    if (sigs.size === 0) issues.push("no arrangement validates (unexpected)");
    else if (sigs.size > 1) issues.push(`ambiguous — ${sigs.size} genuinely different solutions exist`);
  }

  return { ok: issues.length === 0, issues, warnings };
}

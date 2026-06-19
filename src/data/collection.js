// Compiles the human-authored PUZZLE_DEFS (see puzzles.js) into runtime
// puzzle objects, and handles daily / random selection. Keep the *data* in
// puzzles.js easy to read; keep the *logic* here.

import { PALETTE } from "../engine/geometry.js";
import { derivePuzzle } from "../engine/engine.js";
import { PUZZLE_DEFS } from "./puzzles.js";

const SIDE_ORDER = ["top", "right", "bottom", "left"];
const CORNER_SIDES = {
  "top-right": ["top", "right"],
  "right-bottom": ["right", "bottom"],
  "bottom-left": ["bottom", "left"],
  "left-top": ["left", "top"],
};

// Ring-format def -> { id, title, source, puzzle } using the same
// derivePuzzle the rest of the engine speaks.
export function compileDef(def) {
  const colors = {};
  const edgeWords = {};
  SIDE_ORDER.forEach((side, i) => {
    const { cat, edges } = def.sides[side];
    colors[cat] = PALETTE[i];
    edgeWords[cat] = edges;
  });
  const corners = Object.entries(def.corners).map(([adj, word]) => {
    const [s1, s2] = CORNER_SIDES[adj];
    return { word, cats: [def.sides[s1].cat, def.sides[s2].cat] };
  });
  return {
    id: def.id,
    title: def.title,
    source: def.source,
    puzzle: derivePuzzle({ edgeWords, corners, colors }),
  };
}

export const PUZZLES = PUZZLE_DEFS.map(compileDef);

export function puzzleById(id) {
  return PUZZLES.find((p) => p.id === id) ?? null;
}

// ── Daily puzzle ──────────────────────────────────────────────────────
// Deterministic by UTC date, so everyone gets the same puzzle each day.
const LAUNCH_EPOCH_UTC = Date.UTC(2025, 0, 1); // 2025-01-01

export function dayNumber(date = new Date()) {
  const todayUTC = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((todayUTC - LAUNCH_EPOCH_UTC) / 86400000);
}

export function dailyPuzzle(date = new Date()) {
  const n = dayNumber(date);
  const idx = ((n % PUZZLES.length) + PUZZLES.length) % PUZZLES.length;
  return { ...PUZZLES[idx], dayNumber: n };
}

export function formatPuzzleDate(date = new Date()) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Compiles the human-authored PUZZLE_DEFS (see puzzles.js) into runtime puzzle
// objects. Keep the *data* in puzzles.js easy to read; keep the *logic* here.
// (Currently used by the puzzle validator; the app itself plays user-built
// puzzles, so there is no daily selection here.)

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Puzzle validator — "attacks" every puzzle in the collection through the
// real game engine and reports whether each one is fit to ship.
//
//   node scripts/validate-puzzles.mjs      (or: npm run validate)
//
// For each puzzle it checks:
//   1. STRUCTURE   — 4 categories, 12 distinct words, 2 edges + 2 corners each.
//   2. SOLVABLE    — the engine can build a solved grid AND validateGrid()
//                    accepts it (round-trip proof).
//   3. UNAMBIGUOUS — brute-forces ALL distinct arrangements of the 12 words
//                    and confirms every accepted solution is the same puzzle
//                    up to symmetry (no second, unintended answer).
//
// Exit code is non-zero if any puzzle fails, so CI/commits can gate on it.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { validatePuzzle } from "../src/engine/validate.js";
import { PUZZLES } from "../src/data/collection.js";

const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function checkPuzzle(entry) {
  const { puzzle } = entry;
  const { issues } = validatePuzzle(puzzle);
  return { issues, solved: puzzle.fallbackGrid };
}

function gridToAscii(grid) {
  const w = Math.max(...grid.flat().filter(Boolean).map((s) => s.length), 4);
  const cell = (s) => (s ?? "").padEnd(w).slice(0, w);
  return grid
    .map((row) => "  " + row.map((c) => (c == null ? cell("·") : cell(c))).join(" "))
    .join("\n");
}

// ── Run ──
console.log(C.bold(`\nValidating ${PUZZLES.length} puzzle(s)\n`));
let failed = 0;
for (const entry of PUZZLES) {
  const { issues, solved } = checkPuzzle(entry);
  const tag = entry.source === "original" ? C.dim("[original]") : C.yellow(`[${entry.source}]`);
  if (issues.length === 0) {
    console.log(`${C.green("✓ PASS")}  ${C.bold(entry.title)} ${C.dim("(" + entry.id + ")")} ${tag}`);
  } else {
    failed++;
    console.log(`${C.red("✗ FAIL")}  ${C.bold(entry.title)} ${C.dim("(" + entry.id + ")")} ${tag}`);
    for (const i of issues) console.log(`         ${C.red("•")} ${i}`);
    if (solved) console.log(C.dim(gridToAscii(solved)));
  }
}

console.log();
if (failed) {
  console.log(C.red(C.bold(`${failed} puzzle(s) failed validation.`)));
  process.exit(1);
} else {
  console.log(C.green(C.bold(`All ${PUZZLES.length} puzzles passed. Ship it. 🟩`)));
}

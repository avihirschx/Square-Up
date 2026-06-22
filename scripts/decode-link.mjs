// Decode a Square Up share link (or a bare #p= code) into a readable puzzle —
// handy for inspecting a link before featuring/saving it.
//
//   node scripts/decode-link.mjs "<share-link-or-code>"
//
// Accepts a full URL (…#p=… or …?p=…) or just the encoded payload. Works for
// both 4x4 and 3x3 links; validation is shown when the validator is available.

import { decodeSource } from "../src/lib/puzzleCodec.js";
import { compileSource } from "../src/engine/builder.js";

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/decode-link.mjs "<share-link-or-code>"');
  process.exit(1);
}

// Pull the payload out of a full URL, or accept a bare code.
const m = arg.match(/[#&?]p=([^&\s]+)/);
const code = (m ? m[1] : arg).trim();

const src = decodeSource(code);
if (!src) {
  console.error("Could not decode — is this a valid Square Up link?");
  process.exit(1);
}

console.log("");
console.log("  mode  :", src.mode || "4x4");
console.log("  title :", src.title ? JSON.stringify(src.title) : "(none — shows as “Square Up”)");
console.log("  sides :");
for (const side of ["top", "right", "bottom", "left"]) {
  console.log(`            ${side.padEnd(6)} ${src.names[side]}`);
}
if (src.mode === "3x3" && src.odd != null) console.log("  odd   :", src.odd);
console.log("  cells :", JSON.stringify(src.cells));

const res = compileSource(src);
console.log("  solves:", res.ok);
if (res.ok && res.puzzle.fallbackGrid) {
  console.log("  one solution:");
  for (const row of res.puzzle.fallbackGrid) console.log("    " + row.map((w) => w || "·").join(" | "));
}

// The validator only exists on branches that have it — degrade gracefully.
try {
  const { validatePuzzle } = await import("../src/engine/validate.js");
  if (res.ok) {
    const v = validatePuzzle(res.puzzle);
    console.log("  valid :", v.ok ? "yes — solvable & unique" : "NO — " + v.issues.join("; "));
  }
} catch { /* validate.js not on this branch; skip */ }
console.log("");
console.log("-- JSON Output --")

const pretty = JSON.stringify(src, null, 2);

// find the cells array in the original object (safe re-serialization)
const cellsInline = `"cells": ${JSON.stringify(src.cells)}`;

// replace the multiline version of cells
const out = pretty.replace(
  /"cells": \[\s*[\s\S]*?\s*\]/,
  cellsInline
);

console.log(out);
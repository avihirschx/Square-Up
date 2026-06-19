// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THE BUILT-IN PUZZLE COLLECTION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//
// Each puzzle is a ring of 4 categories: top → right → bottom → left.
//   • Each side names a category and gives its 2 unique EDGE words.
//   • Each corner word is SHARED by the two sides it touches — so it must
//     genuinely belong to BOTH categories. That double-meaning IS the puzzle.
//
// Anatomy of one side (4 cells):  [corner] [edge] [edge] [corner]
// 12 words total = 4 corners + 4 sides × 2 edges.
//
// These are the curated, shipped-with-the-app puzzles. User-created puzzles
// are handled separately (see the Builder + saved-puzzle storage).
//
// To add a built-in: copy the TEMPLATE at the bottom, fill it in, then run
//   npm run validate
// which proves it's solvable and flags any accidental cross-category words.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const PUZZLE_DEFS = [
  // ─────────────────────────────────────────────────────────────────────
  {
    id: "tech-nature",
    title: "Founding Four",
    source: "original",
    sides: {
      top:    { cat: "Programming languages", edges: ["Java", "Ruby"] },
      right:  { cat: "Snakes",                edges: ["Adder", "Mamba"] },
      bottom: { cat: "Car models",            edges: ["Beetle", "Civic"] },
      left:   { cat: "Birds",                 edges: ["Finch", "Wren"] },
    },
    corners: {
      "top-right":    "Python", // language + snake
      "right-bottom": "Viper",  // snake + Dodge car
      "bottom-left":  "Falcon", // car + bird
      "left-top":     "Swift",  // bird + language
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  // TEMPLATE — copy this, fill it in, delete this comment, run `npm run validate`.
  // {
  //   id: "kebab-case-unique-id",
  //   title: "Display Name",
  //   source: "avihi",
  //   sides: {
  //     top:    { cat: "Category A", edges: ["wordA1", "wordA2"] },
  //     right:  { cat: "Category B", edges: ["wordB1", "wordB2"] },
  //     bottom: { cat: "Category C", edges: ["wordC1", "wordC2"] },
  //     left:   { cat: "Category D", edges: ["wordD1", "wordD2"] },
  //   },
  //   corners: {
  //     "top-right":    "sharedAB", // belongs to A AND B
  //     "right-bottom": "sharedBC", // belongs to B AND C
  //     "bottom-left":  "sharedCD", // belongs to C AND D
  //     "left-top":     "sharedDA", // belongs to D AND A
  //   },
  // },
];

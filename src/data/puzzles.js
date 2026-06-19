// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// THE PUZZLE COLLECTION
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
// ─ HOW TO REJECT A PUZZLE ─────────────────────────────────────────────
//   Just delete its { ... } block below. Nothing else depends on it.
//
// ─ HOW TO ADD A PUZZLE ────────────────────────────────────────────────
//   Copy the TEMPLATE at the bottom, fill it in, then run:
//       npm run validate
//   The validator runs it through the real game engine and FAILS LOUDLY if
//   it's unsolvable, malformed, or has a word that accidentally fits more
//   than one category. A puzzle only belongs here once it passes.
//
// `source`:  'original' = the founding puzzle · 'claude' = AI-drafted
//            candidate (easy to spot and cull). Set your own to 'avihi'.
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
  {
    id: "snakes-cars-horses-guns",
    title: "Loaded",
    source: "claude",
    sides: {
      top:    { cat: "Snakes",   edges: ["Mamba", "Adder"] },
      right:  { cat: "Cars",     edges: ["Civic", "Camry"] },
      bottom: { cat: "Horses",   edges: ["Stallion", "Mare"] },
      left:   { cat: "Handguns", edges: ["Glock", "Luger"] },
    },
    corners: {
      "top-right":    "Viper",   // snake + Dodge car
      "right-bottom": "Mustang", // Ford car + horse
      "bottom-left":  "Colt",    // young horse + Colt firearms
      "left-top":     "Python",  // Colt Python revolver + snake
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: "fish-music-body-shoe",
    title: "Sole Music",
    source: "claude",
    sides: {
      top:    { cat: "Fish",        edges: ["Trout", "Cod"] },
      right:  { cat: "Music terms", edges: ["Tempo", "Treble"] },
      bottom: { cat: "Body parts",  edges: ["Liver", "Elbow"] },
      left:   { cat: "Shoe parts",  edges: ["Lace", "Welt"] },
    },
    corners: {
      "top-right":    "Bass",   // fish + low music
      "right-bottom": "Organ",  // instrument + body organ
      "bottom-left":  "Tongue", // body + shoe tongue
      "left-top":     "Sole",   // shoe sole + the fish
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: "cards-tools-weapons-body",
    title: "Suit Up",
    source: "claude",
    sides: {
      top:    { cat: "Card suits",       edges: ["Club", "Diamond"] },
      right:  { cat: "Garden tools",     edges: ["Rake", "Hoe"] },
      bottom: { cat: "Medieval weapons", edges: ["Sword", "Mace"] },
      left:   { cat: "Body parts",       edges: ["Shin", "Rib"] },
    },
    corners: {
      "top-right":    "Spade", // card suit + garden spade
      "right-bottom": "Axe",   // tool + weapon
      "bottom-left":  "Arm",   // arms (weapons) + body arm
      "left-top":     "Heart", // body organ + card suit
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: "singers-royalty-chess-birds",
    title: "Court & Stage",
    source: "claude",
    sides: {
      top:    { cat: "Singers",      edges: ["Adele", "Bono"] },
      right:  { cat: "Royalty",      edges: ["Duke", "Baron"] },
      bottom: { cat: "Chess pieces", edges: ["Pawn", "Bishop"] },
      left:   { cat: "Birds",        edges: ["Finch", "Wren"] },
    },
    corners: {
      "top-right":    "Prince", // the artist + royalty
      "right-bottom": "King",   // royalty + chess piece
      "bottom-left":  "Rook",   // chess piece + the bird
      "left-top":     "Swift",  // the bird + Taylor Swift
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: "money-baking-baseball-bowling",
    title: "Strike It Rich",
    source: "claude",
    sides: {
      top:    { cat: "Money slang",   edges: ["Cash", "Loot"] },
      right:  { cat: "Baking",        edges: ["Flour", "Yeast"] },
      bottom: { cat: "Baseball",      edges: ["Bunt", "Inning"] },
      left:   { cat: "Bowling",       edges: ["Gutter", "Lane"] },
    },
    corners: {
      "top-right":    "Dough",   // money slang + bread dough
      "right-bottom": "Batter",  // cake batter + the hitter
      "bottom-left":  "Strike",  // baseball strike + bowling strike
      "left-top":     "Spare",   // bowling spare + spare change
    },
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: "cars-cats-brands-myth",
    title: "Wild Brands",
    source: "claude",
    sides: {
      top:    { cat: "Cars",            edges: ["Corolla", "Camry"] },
      right:  { cat: "Big cats",        edges: ["Cheetah", "Leopard"] },
      bottom: { cat: "Athletic brands", edges: ["Reebok", "Asics"] },
      left:   { cat: "Mythology",       edges: ["Zeus", "Athena"] },
    },
    corners: {
      "top-right":    "Jaguar",  // car brand + big cat
      "right-bottom": "Puma",    // big cat + sportswear
      "bottom-left":  "Nike",    // sportswear + Greek goddess
      "left-top":     "Mercury", // Roman god + Mercury cars
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

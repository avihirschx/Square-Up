// The featured puzzle, shown by default when you open the base URL.
//
// Stored as a "source" (the same shape a saved/shared puzzle uses): the 12
// outer words in geometry.OUTER_CELLS order + the four side category names.
// To change the featured puzzle, build one, hit "Copy share link", and decode
// it with `node scripts/decode-link.mjs <link>` — then paste the fields here.
//
// title is optional: leave it "" and the play screen just shows "Square Up".
// An easy, everyday-words puzzle makes a friendlier first impression.

export const FEATURED_SOURCE = {
  title: "",
  names: {
    top: "Types of Awards",
    right: "Sewing materials",
    bottom: "Pointy items",
    left: "Found on a table",
  },
  cells: [
    "Cup", "Medal", "Statue", "Ribbon",   // top row
    "Lace", "Thread",                       // right edge
    "Needle", "Cactus", "Trident", "Fork",  // bottom row (BR→BL)
    "Plate", "Glass",                       // left edge (BL→TL)
  ],
};

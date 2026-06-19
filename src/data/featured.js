// The featured puzzle, shown by default when you open the base URL.
//
// Stored as a "source" (the same shape a saved/shared puzzle uses): the 12
// outer words in geometry.OUTER_CELLS order + the four side category names.
// To change the featured puzzle, build one, hit "Copy share link", and paste
// the decoded title / names / cells here — or just edit these by hand.

export const FEATURED_SOURCE = {
  title: "Cube's Square",
  names: {
    top: "Things in a bedroom",
    right: "Work__",
    bottom: "Parts of a Novel",
    left: "Encompass",
  },
  cells: [
    "Blanket", "Pillow", "Duvet", "Sheet",  // top row
    "Around", "Flow",                        // right edge
    "Book", "Spine", "Title", "Cover",       // bottom row (BR→BL)
    "Surround", "Envelop",                   // left edge (BL→TL)
  ],
};

// Encode/decode a user puzzle into a compact, URL-safe string so a whole
// puzzle can travel inside a share link — no server required. lz-string
// compresses the payload (~60% smaller than plain base64).
//
// A "source" is the minimal thing needed to rebuild a puzzle:
//   { title, names: {top,right,bottom,left}, cells: [12 outer words] }
// The 12 cells are in geometry.OUTER_CELLS order (clockwise from top-left).

import LZString from "lz-string";

const VERSION = 1;

export function encodeSource(source) {
  // Positional array (no JSON keys) keeps the payload tiny.
  const arr = [
    VERSION,
    source.title || "",
    [source.names.top, source.names.right, source.names.bottom, source.names.left],
    source.cells,
  ];
  return LZString.compressToEncodedURIComponent(JSON.stringify(arr));
}

export function decodeSource(code) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code);
    if (!json) return null;
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr[0] !== VERSION) return null;
    const [, title, names, cells] = arr;
    if (!Array.isArray(names) || names.length !== 4) return null;
    if (!Array.isArray(cells) || cells.length !== 12) return null;
    const [top, right, bottom, left] = names.map((s) => String(s ?? ""));
    return {
      title: String(title || "Untitled puzzle"),
      names: { top, right, bottom, left },
      cells: cells.map((s) => String(s ?? "")),
    };
  } catch {
    return null;
  }
}

// Full share URL for a puzzle. Uses the hash fragment, so the payload never
// hits a server and works on any static host / repo path.
export function buildShareUrl(source) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#p=${encodeSource(source)}`;
}

// If the page was opened from a share link, pull the puzzle out of the URL.
export function readSharedFromUrl() {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const m = hash.match(/[#&]p=([^&]+)/);
  return m ? decodeSource(m[1]) : null;
}

// Remove the ?p=/#p= payload from the address bar (after we've consumed it),
// so a refresh doesn't reopen the shared puzzle and the URL looks clean.
export function clearShareHash() {
  if (typeof window === "undefined") return;
  if (window.location.hash.includes("p=")) {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}

// Encode/decode a user puzzle into a compact, URL-safe string so a whole
// puzzle can travel inside a share link — no server required. lz-string
// compresses the payload (~60% smaller than plain base64).
//
// A "source" is the minimal thing needed to rebuild a puzzle:
//   { mode, title, names: {top,right,bottom,left}, cells: [ring words], odd }
// cells are in geometry.OUTER_CELLS order (clockwise from top-left): 12 for
// 4×4, 8 for 3×3. `mode`/`odd` are trailing fields so old 4×4 links still read.

import LZString from "lz-string";

const VERSION = 1;

export function encodeSource(source) {
  // Positional array (no JSON keys) keeps the payload tiny. Trailing
  // mode/odd are omitted for classic 4×4 puzzles to keep their links short.
  const arr = [
    VERSION,
    source.title || "",
    [source.names.top, source.names.right, source.names.bottom, source.names.left],
    source.cells,
  ];
  if (source.mode === "3x3") arr.push("3x3", source.odd || "");
  return LZString.compressToEncodedURIComponent(JSON.stringify(arr));
}

export function decodeSource(code) {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code);
    if (!json) return null;
    const arr = JSON.parse(json);
    if (!Array.isArray(arr) || arr[0] !== VERSION) return null;
    const [, title, names, cells, mode, odd] = arr;
    if (!Array.isArray(names) || names.length !== 4) return null;
    if (!Array.isArray(cells)) return null;
    const m = mode === "3x3" ? "3x3" : "4x4";
    const need = m === "3x3" ? 8 : 12;
    if (cells.length !== need) return null;
    const [top, right, bottom, left] = names.map((s) => String(s ?? ""));
    return {
      mode: m,
      title: String(title || "Untitled puzzle"),
      names: { top, right, bottom, left },
      cells: cells.map((s) => String(s ?? "")),
      odd: m === "3x3" ? String(odd ?? "") : null,
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

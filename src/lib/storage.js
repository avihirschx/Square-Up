// "My Puzzles" — a per-device list of user-created puzzles, persisted in
// localStorage. (Sharing between people happens via the share link, which
// carries the whole puzzle; see puzzleCodec.js.)

const KEY = "squareup.puzzles.v1";

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // private mode / quota — caller can surface this
  }
}

export function listSaved() {
  return readAll();
}

export function countSaved() {
  return readAll().length;
}

// Content fingerprint of a puzzle (names + words), so we can detect when an
// opened puzzle is already saved and avoid duplicates.
export function sourceSignature(source) {
  const names = ["top", "right", "bottom", "left"]
    .map((s) => (source.names[s] || "").trim().toLowerCase()).join("");
  const cells = (source.cells || []).map((w) => (w || "").trim().toLowerCase()).join("");
  return names + "" + cells;
}

export function findSaved(source) {
  const sig = sourceSignature(source);
  return readAll().find((rec) => sourceSignature(rec) === sig) || null;
}

export function isSaved(source) {
  return !!findSaved(source);
}

// Save a source ({ title, names, cells }). If an identical puzzle is already
// saved, returns the existing record instead of creating a duplicate.
// origin: "created" (built here, editable) | "saved" (imported, view-only).
export function saveSource(source, origin = "saved") {
  const existing = findSaved(source);
  if (existing) return existing;
  const list = readAll();
  const rec = {
    id: "u" + Math.random().toString(36).slice(2, 9),
    title: source.title || "",
    names: source.names,
    cells: source.cells,
    origin,
    createdAt: Date.now(),
  };
  list.unshift(rec);
  return writeAll(list) ? rec : null;
}

// Update an existing saved puzzle (used by the edit flow). Falls back to a
// fresh save if the id is gone.
export function updateSource(id, source) {
  const list = readAll();
  const i = list.findIndex((p) => p.id === id);
  if (i < 0) return saveSource(source);
  list[i] = { ...list[i], title: source.title, names: source.names, cells: source.cells };
  return writeAll(list) ? list[i] : null;
}

export function deleteSaved(id) {
  writeAll(readAll().filter((p) => p.id !== id));
}

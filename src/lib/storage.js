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

// Save a source ({ title, names, cells }). Returns the stored record, or null
// if storage is unavailable.
export function saveSource(source) {
  const list = readAll();
  const rec = {
    id: "u" + Math.random().toString(36).slice(2, 9),
    title: source.title || "Untitled puzzle",
    names: source.names,
    cells: source.cells,
    createdAt: Date.now(),
  };
  list.unshift(rec);
  return writeAll(list) ? rec : null;
}

export function deleteSaved(id) {
  writeAll(readAll().filter((p) => p.id !== id));
}

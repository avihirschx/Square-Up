// Picks a featured puzzle from featured_list.json based on the current date at midnight in America/New_York.
// START_DAY maps puzzles[0] to 2026-06-22 (America/New_York).
// Falls back to an empty source if the list is empty.
import puzzles from "./puzzle_list.json";

function getNewYorkDayIndex(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const year = Number(parts.find(p => p.type === "year").value);
  const month = Number(parts.find(p => p.type === "month").value);
  const day = Number(parts.find(p => p.type === "day").value);
  const utcMidnightMs = Date.UTC(year, month - 1, day);
  return Math.floor(utcMidnightMs / 86400000);
}

const dayIndex = getNewYorkDayIndex();
// START_DAY set so puzzles[0] corresponds to 2026-06-21 in America/New_York.
const START_DAY = Math.floor(Date.UTC(2026, 5, 21) / 86400000);

const offsetIndex = ((dayIndex - START_DAY) % puzzles.length + puzzles.length) % puzzles.length;

export const FEATURED_SOURCE = (puzzles && puzzles.length)
  ? puzzles[offsetIndex]
  : { title: "", names: {}, cells: [] };

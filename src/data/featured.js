// Picks a featured puzzle from PUZZLES based on the current date at midnight in America/New_York.
// Falls back to a sensible default if the list is empty.
import { PUZZLES } from "./collection.js";

function getNewYorkDayIndex(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
n  const year = Number(parts.find(p => p.type === "year").value);
  const month = Number(parts.find(p => p.type === "month").value);
  const day = Number(parts.find(p => p.type === "day").value);
n  const utcMidnightMs = Date.UTC(year, month - 1, day);
  return Math.floor(utcMidnightMs / 86400000);
}

const dayIndex = getNewYorkDayIndex();
export const FEATURED_SOURCE = (PUZZLES && PUZZLES.length)
  ? PUZZLES[dayIndex % PUZZLES.length]
  : { title: "", names: {}, cells: [] };

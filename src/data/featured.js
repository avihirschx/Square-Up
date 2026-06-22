// Picks a featured puzzle from puzzles.json based on the current date at midnight in America/New_York.
// Falls back to the first built-in puzzle if the list is empty.
import puzzles from "./puzzles.json";
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
export const FEATURED_SOURCE = (puzzles && puzzles.length)
  ? puzzles[dayIndex % puzzles.length]
  : { title: "", names: {}, cells: [] };

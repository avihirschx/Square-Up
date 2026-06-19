// Build the Wordle-style share text for a finished game. Spoiler-free: it
// shows how your sides came together over your attempts, never the words.
//
// Each attempt is one row of four squares in side order (top, right, bottom,
// left): a colored square if that side was a complete category on that check,
// ⬛ if not. The colors are fixed for every puzzle, so they give nothing away.

const SIDE_EMOJI = ["🟨", "🟥", "🟩", "🟦"]; // top, right, bottom, left
const MISS = "⬛";

function gridFromHistory(history) {
  return (history || [])
    .map((row) => row.map((on, i) => (on ? SIDE_EMOJI[i] : MISS)).join(""))
    .join("\n");
}

export function buildShareText({ name, dayNumber, revealed, history }) {
  const heading =
    dayNumber != null ? `Square Up #${dayNumber}` : name ? `Square Up — ${name}` : "Square Up";

  const tries = (history || []).length;
  const grid = gridFromHistory(history);
  const result = revealed
    ? "Gave up 🏳️"
    : `Solved in ${tries}/4 ✅`;

  const url =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";

  return [heading, grid, result, url].filter(Boolean).join("\n");
}

// Copy to clipboard, preferring the native share sheet on mobile.
// Returns "shared" | "copied" | "failed".
export async function shareResult(text) {
  try {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      await navigator.share({ text });
      return "shared";
    }
  } catch {
    // user canceled the share sheet — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

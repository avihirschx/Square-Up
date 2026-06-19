// Build the Wordle-style share text for a finished game. Spoiler-free:
// it reveals the result, never the words.

const SQUARE_LOGO = "🟨🟥\n🟦🟩"; // top·right / left·bottom — the four side colors

export function buildShareText({ name, dayNumber, guesses, revealed }) {
  const heading =
    dayNumber != null ? `Square Up #${dayNumber}` : name ? `Square Up — ${name}` : "Square Up";

  let result;
  if (revealed) {
    result = `Gave up 🏳️`;
  } else {
    const tries = `${guesses} ${guesses === 1 ? "guess" : "guesses"}`;
    result = `Solved in ${tries} ✅`;
  }

  const url =
    typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "";

  return [heading, SQUARE_LOGO, result, url].filter(Boolean).join("\n");
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
    // user cancelled the share sheet — fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

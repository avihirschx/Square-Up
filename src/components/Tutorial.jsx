// Brief "how to play" pop-up: a sample square + steps. Shown on first play and
// from the "How to play" button. Adapts to the puzzle's mode (4×4 / 3×3).

const Y = "#F5C518", R = "#E8433A", G = "#2EA84E", B = "#2A7AE4";
const SOLID = { top: Y, right: R, bottom: G, left: B };

function cornerGrad(top, right, bottom, left) {
  if (top && left)    return `linear-gradient(45deg, ${B} 50%, ${Y} 50%)`;
  if (top && right)   return `linear-gradient(135deg, ${Y} 50%, ${R} 50%)`;
  if (bottom && left) return `linear-gradient(135deg, ${B} 50%, ${G} 50%)`;
  return `linear-gradient(45deg, ${G} 50%, ${R} 50%)`; // bottom + right
}

function MiniBoard({ mode }) {
  const N = mode === "3x3" ? 3 : 4;
  const last = N - 1;
  const cell = mode === "3x3" ? 32 : 26, gap = 4;
  const sideOf = (r, c) => (r === 0 ? "top" : r === last ? "bottom" : c === 0 ? "left" : "right");

  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${N},${cell}px)`,
      gridTemplateRows: `repeat(${N},${cell}px)`, gap: `${gap}px`, margin: "0 auto",
    }}>
      {Array.from({ length: N }, (_, r) =>
        Array.from({ length: N }, (_, c) => {
          const key = `${r},${c}`;
          const interior = r > 0 && r < last && c > 0 && c < last;
          const top = r === 0, bottom = r === last, left = c === 0, right = c === last;
          const corner = (top || bottom) && (left || right);

          if (mode === "4x4" && interior) {
            // The 2×2 hole holds the check button.
            if (r === 1 && c === 1) {
              return (
                <div key="ctr" style={{
                  gridColumn: "2/4", gridRow: "2/4", borderRadius: "6px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: G, fontSize: "20px", fontWeight: 800,
                }}>✓</div>
              );
            }
            return null;
          }
          if (mode === "3x3" && r === 1 && c === 1) {
            // The center is the odd one out — belongs to no side.
            return (
              <div key="odd" style={{
                width: cell, height: cell, borderRadius: "5px",
                background: "#2a2a3c", border: "1px dashed #6b6b86",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#8a8aa6", fontSize: "16px", fontWeight: 800,
              }}>?</div>
            );
          }
          const bg = corner ? cornerGrad(top, right, bottom, left) : SOLID[sideOf(r, c)];
          return <div key={key} style={{ width: cell, height: cell, borderRadius: "5px", background: bg }} />;
        })
      )}
    </div>
  );
}

export default function Tutorial({ onClose, mode = "4x4" }) {
  const odd = mode === "3x3";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px", zIndex: 2000,
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#15151f", border: "1px solid #2a2a3a", borderRadius: "16px",
          padding: "24px 22px", maxWidth: "360px", width: "100%",
          fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#eee",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}>
        <h2 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 800, textAlign: "center" }}>
          How to play
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#888", textAlign: "center" }}>
          {odd ? "Odd one out — a word-square with a twist" : "Square Up — a word-square puzzle"}
        </p>

        <MiniBoard mode={mode} />

        <ol style={{ margin: "18px 0 4px", paddingLeft: "20px", fontSize: "13.5px", color: "#bbb", lineHeight: 1.7 }}>
          <li>Every <strong style={{ color: "#eee" }}>side</strong> of the square is one category.</li>
          <li>Each <strong style={{ color: "#eee" }}>corner</strong> belongs to <em>both</em> sides it touches — that's why it's two colors.</li>
          {odd && (
            <li>One word is the <strong style={{ color: "#8a8aa6" }}>odd one out</strong> — it fits no category.
              Figure out which, and leave it in the <strong style={{ color: "#eee" }}>center</strong>.</li>
          )}
          <li>
            <strong style={{ color: "#eee" }}>Swap</strong> tiles (tap or drag) until all four sides are categories
            {odd ? " and the odd word is in the middle" : ""}, then tap{" "}
            <strong style={{ color: "#2EA84E" }}>✓</strong>. You get 4 tries.
          </li>
        </ol>

        <button onClick={onClose} style={{
          marginTop: "18px", width: "100%", padding: "12px", borderRadius: "10px",
          background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "15px",
          border: "none", cursor: "pointer",
        }}>Got it</button>
      </div>
    </div>
  );
}

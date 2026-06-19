// Brief "how to play" pop-up: a sample square + three steps. Shown on first
// play and from the "How to play" button.

const Y = "#F5C518", R = "#E8433A", G = "#2EA84E", B = "#2A7AE4";

// Mini sample board. Corner splits use the same edge-aligned orientation as
// the real board, so colors flow continuously into their sides.
const CORNER_GRAD = {
  "0,0": `linear-gradient(45deg, ${B} 50%, ${Y} 50%)`,   // left/top
  "0,3": `linear-gradient(135deg, ${Y} 50%, ${R} 50%)`,  // top/right
  "3,0": `linear-gradient(135deg, ${B} 50%, ${G} 50%)`,  // left/bottom
  "3,3": `linear-gradient(45deg, ${G} 50%, ${R} 50%)`,   // bottom/right
};
const SOLID = { top: Y, right: R, bottom: G, left: B };
const CORNERS = new Set(["0,0", "0,3", "3,3", "3,0"]);
const INNER = new Set(["1,1", "1,2", "2,1", "2,2"]);
const sideOf = (r, c) => (r === 0 ? "top" : r === 3 ? "bottom" : c === 0 ? "left" : "right");

function MiniBoard() {
  const cell = 26, gap = 4;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(4,${cell}px)`, gridTemplateRows: `repeat(4,${cell}px)`,
      gap: `${gap}px`, margin: "0 auto",
    }}>
      {Array.from({ length: 4 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => {
          const key = `${r},${c}`;
          if (INNER.has(key)) {
            if (r === 1 && c === 1) {
              return (
                <div key="ctr" style={{
                  gridColumn: "2/4", gridRow: "2/4", borderRadius: "6px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#2EA84E", fontSize: "20px", fontWeight: 800,
                }}>✓</div>
              );
            }
            return null;
          }
          const bg = CORNERS.has(key) ? CORNER_GRAD[key] : SOLID[sideOf(r, c)];
          return <div key={key} style={{ width: cell, height: cell, borderRadius: "5px", background: bg }} />;
        })
      )}
    </div>
  );
}

export default function Tutorial({ onClose }) {
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
          Square Up — a word-square puzzle
        </p>

        <MiniBoard />

        <ol style={{ margin: "18px 0 4px", paddingLeft: "20px", fontSize: "13.5px", color: "#bbb", lineHeight: 1.7 }}>
          <li>Every <strong style={{ color: "#eee" }}>side</strong> of the square is one category.</li>
          <li>Each <strong style={{ color: "#eee" }}>corner</strong> belongs to <em>both</em> sides it touches — that's why it's two colors.</li>
          <li><strong style={{ color: "#eee" }}>Swap</strong> tiles (tap or drag) until all four sides are categories, then tap <strong style={{ color: "#2EA84E" }}>✓</strong>. You get 4 tries.</li>
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

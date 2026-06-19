import { useState } from "react";
import { INNER_CELLS, GRID_CORNERS, CELL, GAP } from "../engine/geometry.js";
import { parseSquareToPuzzle } from "../engine/builder.js";

export default function BuilderScreen({ onBuild, onBack }) {
  // 4×4 grid of strings; only the 12 outer cells are editable.
  const [cells, setCells] = useState(() => Array(4).fill(null).map(() => Array(4).fill("")));
  const [names, setNames] = useState({ top: "", right: "", bottom: "", left: "" });
  const [error, setError] = useState("");

  const setCell = (r, c, v) => {
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = v;
      return next;
    });
    setError("");
  };
  const setName = (side, v) => { setNames((prev) => ({ ...prev, [side]: v })); setError(""); };

  function tryBuild() {
    const res = parseSquareToPuzzle(cells, names);
    if (!res.ok) { setError(res.error); return; }
    onBuild(res.puzzle);
  }

  function loadExample() {
    const ex = [
      ["Swift", "Java", "Ruby", "Python"],
      ["", "", "", "Adder"],
      ["", "", "", "Mamba"],
      ["Falcon", "Civic", "Beetle", "Viper"],
    ];
    ex[2][0] = "Wren"; ex[1][0] = "Finch";
    setCells(ex.map((row) => [...row]));
    setNames({ top: "Programming languages", right: "Snakes", bottom: "Car models", left: "Birds" });
    setError("");
  }

  const inputStyle = {
    width: `${CELL}px`, height: `${CELL - 16}px`, boxSizing: "border-box",
    borderRadius: "10px", border: "1px solid #2c2c40", background: "#1a1a28",
    color: "#f0f0f0", textAlign: "center", fontSize: "12px", fontWeight: 700,
    padding: "2px", outline: "none",
  };
  const cornerStyle = { ...inputStyle, border: "1px solid #4a4a70", background: "#20203a" };
  const nameInput = {
    background: "#15151f", border: "1px solid #2c2c40", borderRadius: "8px",
    color: "#eee", fontSize: "12px", fontWeight: 700, padding: "6px 8px", outline: "none",
    textAlign: "center",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "22px 16px 48px",
      fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
    }}>
      <div style={{ width: `${4 * CELL + 3 * GAP + 80}px`, maxWidth: "100%", display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #252535", borderRadius: "6px",
          color: "#888", fontSize: "12px", padding: "5px 12px", cursor: "pointer",
        }}>← Menu</button>
      </div>

      <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 2px" }}>
        Build a puzzle
      </h1>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 4px", textAlign: "center", maxWidth: "440px" }}>
        Fill the square. Each <strong>side</strong> is one category (name it on that edge).
        The four <strong>corner</strong> tiles are shared by the two sides they touch — so a
        corner word must belong to <em>both</em> neighbouring categories.
      </p>
      <button onClick={loadExample} style={{
        background: "none", border: "1px solid #252535", borderRadius: "6px",
        color: "#777", fontSize: "12px", padding: "4px 12px", cursor: "pointer", margin: "6px 0 18px",
      }}>Load example</button>

      <input value={names.top} onChange={(e) => setName("top", e.target.value)}
        placeholder="Top category"
        style={{ ...nameInput, width: `${4 * CELL + 3 * GAP}px`, marginBottom: "6px" }} />

      <div style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
        <textarea value={names.left} onChange={(e) => setName("left", e.target.value)}
          placeholder="Left"
          style={{ ...nameInput, width: "26px", resize: "none", writingMode: "vertical-rl",
            transform: "rotate(180deg)", lineHeight: 1.1, paddingTop: "8px" }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(4,${CELL}px)`,
          gridTemplateRows: `repeat(4,${CELL - 16}px)`,
          gap: `${GAP}px`,
        }}>
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => {
              const key = `${r},${c}`;
              if (INNER_CELLS.has(key)) {
                if (r === 1 && c === 1) {
                  return (
                    <div key="mid" style={{
                      gridColumn: "2/4", gridRow: "2/4", borderRadius: "12px",
                      border: "1px dashed #2c2c40", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      color: "#3a3a4a", fontSize: "11px", textAlign: "center", padding: "6px",
                    }}>
                      sides = categories<br />corners = shared
                    </div>
                  );
                }
                return null;
              }
              const isCorner = GRID_CORNERS.has(key);
              return (
                <input
                  key={key}
                  value={cells[r][c]}
                  onChange={(e) => setCell(r, c, e.target.value)}
                  placeholder={isCorner ? "corner" : ""}
                  style={isCorner ? cornerStyle : inputStyle}
                />
              );
            })
          )}
        </div>

        <textarea value={names.right} onChange={(e) => setName("right", e.target.value)}
          placeholder="Right"
          style={{ ...nameInput, width: "26px", resize: "none", writingMode: "vertical-rl",
            lineHeight: 1.1, paddingTop: "8px" }} />
      </div>

      <input value={names.bottom} onChange={(e) => setName("bottom", e.target.value)}
        placeholder="Bottom category"
        style={{ ...nameInput, width: `${4 * CELL + 3 * GAP}px`, marginTop: "6px" }} />

      {error && (
        <div style={{
          marginTop: "16px", padding: "10px 16px", borderRadius: "10px",
          background: "#2a0a0a", border: "1px solid #5a1a1a",
          color: "#ff8080", fontSize: "13px", fontWeight: 600, maxWidth: "420px", textAlign: "center",
        }}>
          {error}
        </div>
      )}

      <button onClick={tryBuild} style={{
        marginTop: "22px", padding: "12px 32px", borderRadius: "10px",
        background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "15px",
        border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(42,122,228,0.35)",
      }}>Play this puzzle →</button>

      <p style={{ color: "#444", fontSize: "11px", marginTop: "16px", maxWidth: "420px", textAlign: "center", lineHeight: 1.6 }}>
        Tip: the corner tiles (highlighted) sit between two sides. Read clockwise — the
        top-right corner belongs to both the top and right categories, and so on.
      </p>
    </div>
  );
}

import { PUZZLES } from "../data/collection.js";
import { PALETTE } from "../engine/geometry.js";

// A spoiler-free swatch: the four side colors, never the categories.
function Swatch() {
  const c = PALETTE.map((p) => p.bg);
  return (
    <div style={{
      width: "34px", height: "34px", borderRadius: "7px", overflow: "hidden",
      display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", flexShrink: 0,
    }}>
      <div style={{ background: c[0] }} />
      <div style={{ background: c[1] }} />
      <div style={{ background: c[3] }} />
      <div style={{ background: c[2] }} />
    </div>
  );
}

export default function PuzzleSelect({ onPick, onBack }) {
  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "22px 16px 48px",
      fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
    }}>
      <div style={{ width: "100%", maxWidth: "420px", display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #252535", borderRadius: "6px",
          color: "#888", fontSize: "12px", padding: "5px 12px", cursor: "pointer",
        }}>← Menu</button>
      </div>

      <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
        All puzzles
      </h1>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 22px", textAlign: "center" }}>
        {PUZZLES.length} to play · no spoilers
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "420px" }}>
        {PUZZLES.map((p, i) => (
          <button key={p.id} onClick={() => onPick(p)} style={{
            display: "flex", alignItems: "center", gap: "14px",
            padding: "12px 16px", borderRadius: "12px",
            background: "#131320", border: "1px solid #222232",
            color: "#eee", cursor: "pointer", textAlign: "left", width: "100%",
          }}>
            <Swatch />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "15px" }}>{p.title}</div>
              <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
                Puzzle {i + 1}
              </div>
            </div>
            <span style={{ color: "#444", fontSize: "20px" }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState } from "react";
import { geoForMode, CELL, GAP } from "../engine/geometry.js";
import { parseSquareToPuzzle, gridToCells, sourceToGrid } from "../engine/builder.js";
import { validatePuzzle } from "../engine/validate.js";
import { buildShareUrl } from "../lib/puzzleCodec.js";
import { shareResult } from "../lib/share.js";

const emptyGrid = (n) => Array(n).fill(null).map(() => Array(n).fill(""));

export default function BuilderScreen({ onPlay, onSave, onBack, initial, editing }) {
  const [mode, setMode] = useState(() => initial?.mode || "4x4");
  const [cells, setCells] = useState(() =>
    initial ? sourceToGrid(initial) : emptyGrid(geoForMode(initial?.mode || "4x4").N));
  const [odd, setOdd] = useState(() => initial?.odd || "");
  const [names, setNames] = useState(() =>
    initial ? { ...initial.names } : { top: "", right: "", bottom: "", left: "" });
  const [title, setTitle] = useState(() => (initial ? initial.title : ""));
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const geo = geoForMode(mode);
  const N = geo.N;
  const ROW_W = N * CELL + (N - 1) * GAP;

  function switchMode(m) {
    if (m === mode) return;
    setMode(m);
    setCells(emptyGrid(geoForMode(m).N));
    setOdd("");
    setError("");
  }

  const setCell = (r, c, v) => {
    setCells((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = v;
      return next;
    });
    setError("");
  };
  const setName = (side, v) => { setNames((prev) => ({ ...prev, [side]: v })); setError(""); };

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  }

  function validated({ requireTitle = false } = {}) {
    const res = parseSquareToPuzzle(cells, names, mode, odd);
    if (!res.ok) { setError(res.error); return null; }
    // Attack the puzzle: is it actually solvable and unambiguous?
    const check = validatePuzzle(res.puzzle);
    if (!check.ok) { setError(check.issues[0]); return null; }
    const cleanTitle = title.trim();
    if (requireTitle && !cleanTitle) { setError("Give your puzzle a name first."); return null; }
    const source = {
      mode,
      title: cleanTitle || "Untitled puzzle",
      names: {
        top: names.top.trim(), right: names.right.trim(),
        bottom: names.bottom.trim(), left: names.left.trim(),
      },
      cells: gridToCells(cells, mode),
      odd: mode === "3x3" ? odd.trim() : null,
    };
    return { puzzle: res.puzzle, source };
  }

  function doPlay() {
    const v = validated();
    if (v) onPlay(v.puzzle, v.source);
  }

  function doSave() {
    const v = validated({ requireTitle: true });
    if (v) onSave(v.source);
  }

  function doCheck() {
    const res = parseSquareToPuzzle(cells, names, mode, odd);
    if (!res.ok) { setError(res.error); return; }
    const check = validatePuzzle(res.puzzle);
    if (!check.ok) { setError(check.issues[0]); return; }
    setError("");
    flashToast(mode === "3x3"
      ? "✓ Solvable, unique — odd one out is forced"
      : "✓ Solvable & unique — ship it");
  }

  async function doCopyLink() {
    const v = validated();
    if (!v) return;
    const r = await shareResult(buildShareUrl(v.source));
    flashToast(r === "failed" ? "Couldn't copy link" : r === "shared" ? "Link shared!" : "Link copied!");
  }

  function loadExample() {
    if (mode === "3x3") {
      setCells([
        ["Swift", "Java", "Python"],
        ["Wren", "", "Mamba"],
        ["Falcon", "Civic", "Viper"],
      ]);
      setOdd("Cobra");
      setNames({ top: "Programming languages", right: "Snakes", bottom: "Car models", left: "Birds" });
      setTitle("Slither Square");
    } else {
      const ex = [
        ["Swift", "Java", "Ruby", "Python"],
        ["", "", "", "Adder"],
        ["", "", "", "Mamba"],
        ["Falcon", "Civic", "Beetle", "Viper"],
      ];
      ex[2][0] = "Wren"; ex[1][0] = "Finch";
      setCells(ex.map((row) => [...row]));
      setNames({ top: "Programming languages", right: "Snakes", bottom: "Car models", left: "Birds" });
      setTitle("Founding Four");
    }
    setError("");
  }

  const inputStyle = {
    width: `${CELL}px`, height: `${CELL - 16}px`, boxSizing: "border-box",
    borderRadius: "10px", border: "1px solid #2c2c40", background: "#1a1a28",
    color: "#f0f0f0", textAlign: "center", fontSize: "12px", fontWeight: 700,
    padding: "2px", outline: "none",
  };
  const cornerStyle = { ...inputStyle, border: "1px solid #4a4a70", background: "#20203a" };
  const oddStyle = { ...inputStyle, border: "1px dashed #b8862b", background: "#241d10", color: "#e8b54a" };
  const nameInput = {
    background: "#15151f", border: "1px solid #2c2c40", borderRadius: "8px",
    color: "#eee", fontSize: "12px", fontWeight: 700, padding: "6px 8px", outline: "none",
    textAlign: "center",
  };
  const modeBtn = (on) => ({
    padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 800, cursor: "pointer",
    background: on ? "#2A7AE4" : "#16161f", color: on ? "#fff" : "#9aa",
    border: on ? "none" : "1px solid #2c2c40",
  });

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "22px 16px 48px",
      fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
    }}>
      <div style={{ width: `${ROW_W + 80}px`, maxWidth: "100%", display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #252535", borderRadius: "6px",
          color: "#888", fontSize: "12px", padding: "5px 12px", cursor: "pointer",
        }}>← Menu</button>
      </div>

      <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 8px" }}>
        {editing ? "Edit puzzle" : "Build a puzzle"}
      </h1>

      <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
        <button onClick={() => switchMode("4x4")} style={modeBtn(mode === "4x4")}>Classic 4×4</button>
        <button onClick={() => switchMode("3x3")} style={modeBtn(mode === "3x3")}>Odd one out 3×3</button>
      </div>

      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 4px", textAlign: "center", maxWidth: "440px" }}>
        Fill the square. Each <strong>side</strong> is one category (name it on that edge).
        The four <strong>corner</strong> tiles are shared by the two sides they touch.
        {mode === "3x3" && (
          <> The <strong style={{ color: "#e8b54a" }}>center</strong> tile is the <em>odd one out</em> — a
            word that belongs to no category.</>
        )}
      </p>
      <button onClick={loadExample} style={{
        background: "none", border: "1px solid #252535", borderRadius: "6px",
        color: "#777", fontSize: "12px", padding: "4px 12px", cursor: "pointer", margin: "6px 0 16px",
      }}>Load example</button>

      <input value={title} onChange={(e) => { setTitle(e.target.value); setError(""); }}
        placeholder="Puzzle name (e.g. “Jacob’s Square”)"
        style={{ ...nameInput, width: `${ROW_W}px`, marginBottom: "16px", fontSize: "13px" }} />

      <input value={names.top} onChange={(e) => setName("top", e.target.value)}
        placeholder="Top"
        style={{ ...nameInput, width: `${ROW_W}px`, marginBottom: "6px" }} />

      <div style={{ display: "flex", alignItems: "stretch", gap: "6px" }}>
        <textarea value={names.left} onChange={(e) => setName("left", e.target.value)}
          placeholder="Left"
          style={{ ...nameInput, width: "26px", resize: "none", writingMode: "vertical-rl",
            transform: "rotate(180deg)", lineHeight: 1.1, paddingTop: "8px" }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${N},${CELL}px)`,
          gridTemplateRows: `repeat(${N},${CELL - 16}px)`,
          gap: `${GAP}px`,
        }}>
          {Array.from({ length: N }, (_, r) =>
            Array.from({ length: N }, (_, c) => {
              const key = `${r},${c}`;
              if (geo.INNER_CELLS.has(key)) {
                if (N === 4) {
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
                // 3×3 center: the odd-one-out word.
                return (
                  <input key="odd" value={odd}
                    onChange={(e) => { setOdd(e.target.value); setError(""); }}
                    placeholder="odd one out" style={oddStyle} />
                );
              }
              const isCorner = geo.GRID_CORNERS.has(key);
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
        placeholder="Bottom"
        style={{ ...nameInput, width: `${ROW_W}px`, marginTop: "6px" }} />

      {error && (
        <div style={{
          marginTop: "16px", padding: "10px 16px", borderRadius: "10px",
          background: "#2a0a0a", border: "1px solid #5a1a1a",
          color: "#ff8080", fontSize: "13px", fontWeight: 600, maxWidth: "420px", textAlign: "center",
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={doCheck} style={{
          padding: "12px 22px", borderRadius: "10px",
          background: "#16231a", color: "#7fd69a", fontWeight: 800, fontSize: "15px",
          border: "1px solid #2a4a32", cursor: "pointer",
        }}>Check ✓</button>
        <button onClick={doPlay} style={{
          padding: "12px 28px", borderRadius: "10px",
          background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "15px",
          border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(42,122,228,0.35)",
        }}>Play →</button>
        <button onClick={doSave} style={{
          padding: "12px 24px", borderRadius: "10px",
          background: "#16161f", color: "#ddd", fontWeight: 800, fontSize: "15px",
          border: "1px solid #2c2c40", cursor: "pointer",
        }}>{editing ? "Save changes" : "Save"}</button>
        <button onClick={doCopyLink} style={{
          padding: "12px 24px", borderRadius: "10px",
          background: "#16161f", color: "#ddd", fontWeight: 800, fontSize: "15px",
          border: "1px solid #2c2c40", cursor: "pointer",
        }}>Copy share link</button>
      </div>

      <div style={{ height: "18px", marginTop: "10px", fontSize: "13px", color: "#5CC877", fontWeight: 700 }}>
        {toast}
      </div>

      <p style={{ color: "#444", fontSize: "11px", marginTop: "8px", maxWidth: "420px", textAlign: "center", lineHeight: 1.6 }}>
        {mode === "3x3"
          ? <>Tip: pick a <strong style={{ color: "#7a6a3a" }}>deceptive</strong> odd-one-out — a word that looks
              like it could fit a category but doesn’t. The solver has to spot it.</>
          : <>Tip: the corner tiles (highlighted) are shared by the two sides they touch — the
              top-right corner belongs to both the top and right categories.</>}
        <br /><strong>Save</strong> keeps it in “My Puzzles” on this device. <strong>Copy share
        link</strong> makes a link that contains the whole puzzle — anyone who opens it can play.
      </p>
    </div>
  );
}

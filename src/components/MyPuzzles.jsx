import { useState } from "react";
import { listSaved, deleteSaved } from "../lib/storage.js";
import { buildShareUrl } from "../lib/puzzleCodec.js";
import { shareResult } from "../lib/share.js";
import { PALETTE } from "../engine/geometry.js";

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

export default function MyPuzzles({ onPlay, onEdit, onBuild, onBack }) {
  const [list, setList] = useState(() => listSaved());
  const [toast, setToast] = useState("");

  function flashToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  }

  function remove(id) {
    deleteSaved(id);
    setList(listSaved());
  }

  async function copyLink(rec) {
    const url = buildShareUrl(rec);
    const r = await shareResult(url);
    flashToast(r === "failed" ? "Couldn't copy link" : r === "shared" ? "Link shared!" : "Link copied!");
  }

  const smallBtn = {
    padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
    border: "1px solid #2c2c40", background: "#1a1a28", color: "#ccc", cursor: "pointer",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "22px 16px 48px",
      fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
    }}>
      <div style={{ width: "100%", maxWidth: "440px", display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
        <button onClick={onBack} style={{
          background: "none", border: "1px solid #252535", borderRadius: "6px",
          color: "#888", fontSize: "12px", padding: "5px 12px", cursor: "pointer",
        }}>← Menu</button>
      </div>

      <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 4px" }}>
        My Puzzles
      </h1>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 22px", textAlign: "center" }}>
        {list.length === 0 ? "Saved on this device" : `${list.length} saved on this device`}
      </p>

      {list.length === 0 ? (
        <div style={{
          textAlign: "center", color: "#777", maxWidth: "360px",
          background: "#131320", border: "1px solid #222232", borderRadius: "14px", padding: "28px 22px",
        }}>
          <div style={{ fontSize: "34px", marginBottom: "10px" }}>🧩</div>
          <p style={{ margin: "0 0 18px", fontSize: "14px", lineHeight: 1.6 }}>
            No puzzles yet. Build one and hit <strong>Save</strong> — it’ll show up here,
            ready to replay or share.
          </p>
          <button onClick={onBuild} style={{
            padding: "12px 26px", borderRadius: "10px",
            background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "15px",
            border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(42,122,228,0.35)",
          }}>Build a puzzle</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: "440px" }}>
          {list.map((rec) => (
            <div key={rec.id} style={{
              display: "flex", alignItems: "center", gap: "14px",
              padding: "12px 14px", borderRadius: "12px",
              background: "#131320", border: "1px solid #222232",
            }}>
              <Swatch />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "15px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{rec.title}</span>
                  {rec.mode === "3x3" && (
                    <span style={{ flexShrink: 0, fontSize: "10px", fontWeight: 800, color: "#e8b54a",
                      background: "#241d10", border: "1px solid #4a3a18", borderRadius: "999px", padding: "1px 7px" }}>
                      odd one out
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => onPlay(rec)} style={{ ...smallBtn, background: "#1c2e1c", borderColor: "#2a4a2a", color: "#bfe6bf" }}>▶ Play</button>
                  <button onClick={() => onEdit(rec)} style={smallBtn}>✎ Edit</button>
                  <button onClick={() => copyLink(rec)} style={smallBtn}>🔗 Link</button>
                  <button onClick={() => remove(rec.id)} style={{ ...smallBtn, color: "#c87a7a", borderColor: "#3a2020" }}>🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: "18px", marginTop: "14px", fontSize: "13px", color: "#5CC877", fontWeight: 700 }}>
        {toast}
      </div>
    </div>
  );
}

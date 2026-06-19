import { dailyPuzzle, formatPuzzleDate } from "../data/collection.js";

export default function MenuScreen({ onPlayDaily, onBrowse, onBuild }) {
  const daily = dailyPuzzle();

  return (
    <div style={{
      minHeight: "100vh", background: "#0d0d12",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr",
        width: "56px", height: "56px", borderRadius: "12px", overflow: "hidden", marginBottom: "18px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}>
        <div style={{ background: "#F5C518" }} />
        <div style={{ background: "#E8433A" }} />
        <div style={{ background: "#2A7AE4" }} />
        <div style={{ background: "#2EA84E" }} />
      </div>

      <h1 style={{ fontSize: "clamp(40px,12vw,64px)", fontWeight: 900, letterSpacing: "-2px", margin: "0 0 4px" }}>
        Square&nbsp;Up
      </h1>
      <p style={{ color: "#666", fontSize: "15px", margin: "0 0 40px", textAlign: "center", maxWidth: "360px", lineHeight: 1.5 }}>
        Arrange 12 words into a square. Each side is a category; the corners belong to two.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", width: "100%", maxWidth: "300px" }}>
        <button onClick={() => onPlayDaily(daily)} style={{
          padding: "16px", borderRadius: "14px",
          background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "17px",
          border: "none", cursor: "pointer", boxShadow: "0 6px 20px rgba(42,122,228,0.35)",
          display: "flex", flexDirection: "column", gap: "2px",
        }}>
          <span>Play today's puzzle</span>
          <span style={{ fontSize: "12px", fontWeight: 600, opacity: 0.8 }}>
            #{daily.dayNumber} · {formatPuzzleDate()}
          </span>
        </button>
        <button onClick={onBrowse} style={{
          padding: "16px", borderRadius: "14px",
          background: "#16161f", color: "#ddd", fontWeight: 800, fontSize: "17px",
          border: "1px solid #2c2c40", cursor: "pointer",
        }}>All puzzles</button>
        <button onClick={onBuild} style={{
          padding: "16px", borderRadius: "14px",
          background: "#16161f", color: "#ddd", fontWeight: 800, fontSize: "17px",
          border: "1px solid #2c2c40", cursor: "pointer",
        }}>Build your own</button>
      </div>

      <p style={{ color: "#3a3a4a", fontSize: "11px", marginTop: "40px", textAlign: "center" }}>
        A new puzzle every day.
      </p>
    </div>
  );
}

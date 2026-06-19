import { useState, useRef } from "react";
import {
  OUTER_CELLS, INNER_CELLS, SIDE_CELLS, CORNER_SIDES, GRID_CORNERS,
  CELL_SIDE, CELL, GAP,
} from "../engine/geometry.js";
import {
  isLockedEdge, resolveSide, validateGrid, getCorrectSideMap,
  dealPuzzle, shuffleKeepingLocked,
} from "../engine/engine.js";
import { buildShareText, shareResult } from "../lib/share.js";

const MAX_ATTEMPTS = 4;

const NAG_MESSAGES = [
  { emoji: "😬", text: "Not quite",         sub: "That's not right..." },
  { emoji: "🤔", text: "Still off",         sub: "Keep trying!" },
  { emoji: "💡", text: "Last try!",         sub: "One attempt left." },
  { emoji: "🏳️", text: "Out of attempts",  sub: "Solving it for you..." },
];

export default function PlayPuzzle({ puzzle, subtitle, name, saved, onSave, onBack }) {
  const { colors, cornerWordColors, fallbackGrid } = puzzle;

  const [grid, setGrid]                     = useState(() => dealPuzzle(puzzle));
  const [selected, setSelected]             = useState(null);
  const [correctSideMap, setCorrectSideMap] = useState(null);
  const [solvedSides, setSolvedSides]       = useState(null);
  const [solved, setSolved]                 = useState(false);
  const [shake, setShake]                   = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [wrongCount, setWrongCount]         = useState(0);
  const [nagVisible, setNagVisible]         = useState(false);
  const [revealed, setRevealed]             = useState(false);
  const [revealedSides, setRevealedSides]   = useState(null);
  const [revealAnim, setRevealAnim]         = useState(false);
  const [swapAnim, setSwapAnim]             = useState({});
  const [dragState, setDragState]           = useState(null);
  const [solveAnim, setSolveAnim]           = useState(false);
  const [solving, setSolving]               = useState(false);
  const [justSaved, setJustSaved]           = useState(false);
  const [confirmedCornerWords, setConfirmedCornerWords] = useState(new Set());
  const [shareMsg, setShareMsg]             = useState("");
  const pointerDrag = useRef(null);
  const nagTimer    = useRef(null);
  const cellEls     = useRef({});

  const activeSides = solvedSides || revealedSides;
  const isAnimating = Object.keys(swapAnim).length > 0;
  const canReveal   = !!fallbackGrid;
  const guesses     = wrongCount + (solved ? 1 : 0);
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - wrongCount);
  const isSaved     = saved || justSaved;

  function animateSwap(r1, c1, r2, c2, fromDrag = false, releasePoint = null, force = false) {
    const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;
    if (!force && (isLockedEdge(k1, correctSideMap) || isLockedEdge(k2, correctSideMap))) return;

    const el1 = cellEls.current[k1];
    const el2 = cellEls.current[k2];
    if (!el1 || !el2) {
      setGrid((prev) => {
        const next = prev.map((r) => [...r]);
        [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
        return next;
      });
      return;
    }

    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();
    const dx = rect2.left - rect1.left;
    const dy = rect2.top  - rect1.top;

    setGrid((prev) => {
      const next = prev.map((r) => [...r]);
      [next[r1][c1], next[r2][c2]] = [next[r2][c2], next[r1][c1]];
      return next;
    });

    if (fromDrag) {
      let k1OffsetX = 0, k1OffsetY = 0;
      if (releasePoint) {
        const cx = rect2.left + rect2.width  / 2;
        const cy = rect2.top  + rect2.height / 2;
        k1OffsetX = releasePoint.x - cx;
        k1OffsetY = releasePoint.y - cy;
      }
      setSwapAnim({
        [k2]: { tx: k1OffsetX, ty: k1OffsetY, transition: false },
        [k1]: { tx: dx, ty: dy, transition: false },
      });
    } else {
      setSwapAnim({
        [k1]: { tx: dx,  ty: dy,  transition: false },
        [k2]: { tx: -dx, ty: -dy, transition: false },
      });
    }

    requestAnimationFrame(() => {
      setSwapAnim({
        [k1]: { tx: 0, ty: 0, transition: true },
        [k2]: { tx: 0, ty: 0, transition: true },
      });
      setTimeout(() => setSwapAnim({}), 300);
    });
  }

  function handleCellTap(r, c) {
    if (solved || revealed || isAnimating || solving) return;
    const key = `${r},${c}`;
    if (isLockedEdge(key, correctSideMap)) { setSelected(null); return; }
    if (selected) {
      if (isLockedEdge(`${selected.r},${selected.c}`, correctSideMap)) { setSelected(null); return; }
      if (selected.r === r && selected.c === c) {
        setSelected(null);
      } else {
        const { r: r1, c: c1 } = selected;
        setSelected(null);
        animateSwap(r1, c1, r, c);
      }
    } else {
      setSelected({ r, c });
    }
  }

  function onPointerDown(e, r, c) {
    if (solved || revealed || isAnimating || solving) return;
    if (isLockedEdge(`${r},${c}`, correctSideMap)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDrag.current = {
      r, c, word: grid[r][c],
      pointerId: e.pointerId,
      startX: e.clientX, startY: e.clientY,
      curX: e.clientX, curY: e.clientY,
      moved: false,
    };
  }

  function onPointerMove(e) {
    const drag = pointerDrag.current;
    if (!drag) return;
    drag.curX = e.clientX;
    drag.curY = e.clientY;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 6) {
      drag.moved = true;
      setSelected(null);
    }
    if (drag.moved) {
      setDragState({ word: drag.word, x: e.clientX, y: e.clientY });
    }
  }

  function onPointerUp(e, r, c) {
    const drag = pointerDrag.current;
    if (!drag) return;
    pointerDrag.current = null;

    if (!drag.moved) {
      setDragState(null);
      handleCellTap(r, c);
      return;
    }

    setDragState(null);
    try { e.currentTarget.releasePointerCapture(drag.pointerId); } catch {}
    const el = document.elementFromPoint(e.clientX, e.clientY);
    let targetKey = null;
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.cellKey) { targetKey = node.dataset.cellKey; break; }
      node = node.parentElement;
    }

    if (targetKey) {
      const [tr, tc] = targetKey.split(",").map(Number);
      if (tr !== drag.r || tc !== drag.c) {
        animateSwap(drag.r, drag.c, tr, tc, true, { x: e.clientX, y: e.clientY });
      }
    }
  }

  function onPointerCancel() {
    pointerDrag.current = null;
    setDragState(null);
  }

  // Auto-solve: slide every tile into its correct spot, one swap at a time,
  // then color the solved sides. Used when the player runs out of attempts.
  function autoSolve() {
    const target = fallbackGrid;
    if (!target) return;
    setSolving(true);
    setSelected(null);
    setCorrectSideMap(null); // drop locks so any tile can move

    // Selection-sort the current board toward the solved board, recording the
    // position swaps needed.
    const cur = grid.map((r) => [...r]);
    const swaps = [];
    for (let i = 0; i < OUTER_CELLS.length; i++) {
      const [r, c] = OUTER_CELLS[i];
      if (cur[r][c] === target[r][c]) continue;
      for (let j = i + 1; j < OUTER_CELLS.length; j++) {
        const [r2, c2] = OUTER_CELLS[j];
        if (cur[r2][c2] === target[r][c]) {
          swaps.push([r, c, r2, c2]);
          [cur[r][c], cur[r2][c2]] = [cur[r2][c2], cur[r][c]];
          break;
        }
      }
    }

    const STEP = 360;
    let t = 250;
    for (const [r1, c1, r2, c2] of swaps) {
      setTimeout(() => animateSwap(r1, c1, r2, c2, false, null, true), t);
      t += STEP;
    }
    setTimeout(() => {
      const revSides = {};
      for (const side of Object.keys(SIDE_CELLS)) revSides[side] = resolveSide(puzzle, target, side);
      setRevealedSides(revSides);
      setRevealAnim(true); // tiles are already in place — skip the scale-in pop
      setRevealed(true);
      setSolving(false);
    }, t + 150);
  }

  function checkSolution() {
    if (isAnimating || solving) return;

    setConfirmedCornerWords((prev) => {
      const next = new Set(prev);
      for (const key of GRID_CORNERS) {
        const [r, c] = key.split(",").map(Number);
        const word = grid[r][c];
        if (word && cornerWordColors[word]) next.add(word);
      }
      return next;
    });

    const valid = validateGrid(puzzle, grid);
    if (valid) {
      setSolvedSides(valid.sideCategories);
      setSolved(true);
      setTimeout(() => setSolveAnim(true), 500);
    } else {
      const csm = getCorrectSideMap(puzzle, grid);
      setCorrectSideMap((prev) => {
        const merged = new Map(prev ?? []);
        for (const [side, cat] of csm) merged.set(side, cat);
        return merged;
      });
      const newCount = wrongCount + 1;
      setWrongCount(newCount);
      setShake(true); setTimeout(() => setShake(false), 500);
      clearTimeout(nagTimer.current);
      setNagVisible(true);
      if (newCount >= MAX_ATTEMPTS && canReveal) {
        setSolving(true); // lock the board immediately so nothing desyncs the solve
        setTimeout(() => { setNagVisible(false); autoSolve(); }, 1500);
      } else {
        nagTimer.current = setTimeout(() => setNagVisible(false), 3000);
      }
    }
  }

  function shufflePuzzle() {
    if (solved || revealed || solving || isAnimating) return;
    const lockedKeys = new Set();
    for (const key of OUTER_CELLS.map(([r, c]) => `${r},${c}`)) {
      if (isLockedEdge(key, correctSideMap)) lockedKeys.add(key);
    }
    setGrid((prev) => shuffleKeepingLocked(prev, lockedKeys));
    setSelected(null);
    setSwapAnim({}); setDragState(null);
    setShake(false);
    pointerDrag.current = null;
  }

  function resetPuzzle() {
    if (solving) return; // don't yank the board out from under an in-progress auto-solve
    setGrid(dealPuzzle(puzzle));
    setSelected(null);
    setSolved(false); setSolvedSides(null);
    setCorrectSideMap(null); setConfirmedCornerWords(new Set());
    setWrongCount(0); setNagVisible(false); setShake(false);
    setRevealed(false); setRevealedSides(null); setRevealAnim(false);
    setSwapAnim({}); setDragState(null); setSolveAnim(false);
    setSolving(false);
    setShareMsg("");
    pointerDrag.current = null;
    clearTimeout(nagTimer.current);
  }

  async function onShare() {
    const text = buildShareText({ name, guesses, revealed });
    const r = await shareResult(text);
    setShareMsg(r === "failed" ? "Couldn't copy" : r === "shared" ? "Shared!" : "Copied!");
    setTimeout(() => setShareMsg(""), 2200);
  }

  function getCellColors(r, c, word) {
    const key = `${r},${c}`;
    const isCorner = GRID_CORNERS.has(key);
    const delay = OUTER_CELLS.findIndex(([or, oc]) => or === r && oc === c) * 55;

    if (activeSides) {
      const entering = revealed && !revealAnim;
      if (isCorner) {
        const [bg1, bg2] = CORNER_SIDES[key].map((side) => colors[activeSides[side]].bg);
        return { bg1, bg2, textColor: "#fff", isCornerSplit: true, isLockedEdgeCell: false, entering, delay };
      }
      const side = CELL_SIDE[key];
      return { bg1: colors[activeSides[side]].bg, textColor: "#fff", isCornerSplit: false, isLockedEdgeCell: false, entering, delay };
    }

    if (word && confirmedCornerWords.has(word)) {
      const { bg1, bg2 } = cornerWordColors[word];
      return { bg1, bg2, textColor: "#fff", isCornerSplit: true, isLockedEdgeCell: false, entering: false, delay };
    }

    if (!isCorner && correctSideMap?.size > 0) {
      const side = CELL_SIDE[key];
      if (correctSideMap.has(side)) {
        const cat = correctSideMap.get(side);
        return {
          bg1: colors[cat].bg, bg2: null, textColor: colors[cat].text,
          isCornerSplit: false, isLockedEdgeCell: true, entering: false, delay,
        };
      }
    }

    return {
      bg1: "#2a2a3c", bg2: null, textColor: "#f0f0f0",
      isCornerSplit: false, isLockedEdgeCell: false, entering: false, delay,
    };
  }

  function sideLabelColor(side) {
    if (activeSides) return colors[activeSides[side]].bg;
    if (correctSideMap?.has(side)) return colors[correctSideMap.get(side)].bg;
    return "#333";
  }

  const ghostBtn = {
    background: "none", border: "1px solid #252535", borderRadius: "6px",
    color: "#888", fontSize: "12px", padding: "5px 12px", cursor: "pointer",
  };

  const centerCtrl = {
    width: "70px", height: "30px", borderRadius: "8px",
    background: "#15151f", color: "#8a8a9a", fontWeight: 600, fontSize: "12px",
    border: "1px solid #2a2a3a", transition: "opacity 0.15s",
  };

  const sideLabel = (side) => ({
    fontSize: "15px", fontWeight: 800, letterSpacing: "0.3px", textTransform: "uppercase",
    color: sideLabelColor(side), transition: "color 0.4s",
  });

  return (
    <div
      onPointerMove={onPointerMove}
      style={{
        minHeight: "100vh", background: "#0d0d12",
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "22px 16px 48px",
        fontFamily: "'Segoe UI',system-ui,sans-serif", color: "#f0f0f0",
      }}>

      <div style={{ width: `${4 * CELL + 3 * GAP}px`, maxWidth: "100%", display: "flex", justifyContent: "flex-start", marginBottom: "6px" }}>
        <button onClick={onBack} style={ghostBtn}>← Menu</button>
      </div>

      <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase", color: "#3a3a4a", marginBottom: "4px" }}>
        Square Up
      </div>
      <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 2px", textAlign: "center", maxWidth: "420px", padding: "0 8px" }}>
        {name || "Untitled puzzle"}
      </h1>
      <p style={{ color: "#555", fontSize: "13px", margin: "0 0 12px", textAlign: "center" }}>
        {subtitle}
      </p>

      {onSave && (
        <button
          onClick={isSaved ? undefined : () => { onSave(); setJustSaved(true); }}
          disabled={isSaved}
          style={{
            ...ghostBtn,
            color: isSaved ? "#5CC877" : "#cfa93a",
            borderColor: isSaved ? "#1a3a1a" : "#3a3018",
            cursor: isSaved ? "default" : "pointer",
            marginBottom: "12px",
          }}>
          {isSaved ? "✓ Saved in My Puzzles" : "☆ Save to My Puzzles"}
        </button>
      )}

      <button onClick={() => setShowInstructions((v) => !v)} style={{ ...ghostBtn, color: "#666", padding: "4px 12px", marginBottom: "14px" }}>
        {showInstructions ? "Hide" : "How to play"}
      </button>

      {showInstructions && (
        <div style={{
          background: "#131320", border: "1px solid #222232", borderRadius: "12px",
          padding: "14px 18px", maxWidth: "420px", width: "100%",
          marginBottom: "18px", fontSize: "13px", color: "#999", lineHeight: "1.7",
        }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "#ddd", fontSize: "14px" }}>How to play</p>
          <ul style={{ margin: 0, paddingLeft: "18px" }}>
            <li>All 12 words are on the board — swap them into the right positions</li>
            <li><strong>Tap</strong> a word then <strong>tap</strong> another to swap</li>
            <li>Or <strong>slide</strong> a word onto another to swap</li>
            <li>Each side must form a category · corner words belong to both adjacent sides</li>
            <li>Tap the green <strong>✓</strong> in the center when you're ready</li>
          </ul>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px", minHeight: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#555" }}>
          Attempts
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
            <span key={i} style={{
              width: "10px", height: "10px", borderRadius: "50%",
              background: i < wrongCount ? "#E8433A" : "#2e2e3e",
              boxShadow: i < wrongCount ? "0 0 6px rgba(232,67,58,0.55)" : "none",
              transition: "background 0.3s, box-shadow 0.3s",
            }} />
          ))}
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: solved || revealed ? "#555" : attemptsLeft === 1 && !solving ? "#E8433A" : "#666" }}>
          {solved ? "solved" : revealed ? "answer shown" : solving ? "solving…" : `${attemptsLeft} left`}
        </span>
      </div>

      <div style={{ width: `${4 * CELL + 3 * GAP}px`, textAlign: "center", marginBottom: "5px", minHeight: "20px" }}>
        <span style={sideLabel("top")}>
          {activeSides ? activeSides.top : (correctSideMap?.has("top") ? correctSideMap.get("top") : "")}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          ...sideLabel("left"),
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          width: "22px", textAlign: "center",
        }}>
          {activeSides ? activeSides.left : (correctSideMap?.has("left") ? correctSideMap.get("left") : "")}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(4,${CELL}px)`,
          gridTemplateRows: `repeat(4,${CELL - 16}px)`,
          gap: `${GAP}px`,
          animation: shake ? "shake 0.45s ease" : "none",
        }}>
          {Array.from({ length: 4 }, (_, r) =>
            Array.from({ length: 4 }, (_, c) => {
              if (INNER_CELLS.has(`${r},${c}`)) {
                if (r === 1 && c === 1) {
                  const clickable = !solved && !revealed && !solving;
                  return (
                    <div key="center" style={{
                      gridColumn: "2/4", gridRow: "2/4",
                      display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: "9px",
                    }}>
                      {solved ? (
                        <span style={{ fontSize: "38px" }}>🎉</span>
                      ) : revealed ? (
                        <span style={{ fontSize: "34px" }}>😤</span>
                      ) : (
                        <>
                          <button
                            aria-label="Check"
                            onClick={clickable ? checkSolution : undefined}
                            style={{
                              width: "150px", height: "42px", borderRadius: "10px", padding: 0,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background: "#1d3326", border: "1px solid #2f5d3b",
                              color: "#6cc585",
                              cursor: clickable ? "pointer" : "default",
                              opacity: clickable ? 1 : 0.5,
                              transition: "background 0.15s, border-color 0.15s, opacity 0.15s",
                            }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="5 12.5 10 17.5 19 7" />
                            </svg>
                          </button>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button onClick={shufflePuzzle} disabled={solving}
                              style={{ ...centerCtrl, cursor: solving ? "default" : "pointer", opacity: solving ? 0.4 : 1 }}>
                              Shuffle
                            </button>
                            <button onClick={resetPuzzle} disabled={solving}
                              style={{ ...centerCtrl, cursor: solving ? "default" : "pointer", opacity: solving ? 0.4 : 1 }}>
                              Reset
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              }

              const key  = `${r},${c}`;
              const word = grid[r][c];
              const isSel = selected?.r === r && selected?.c === c;
              const anim = swapAnim[key];
              const { bg1, bg2, textColor, isCornerSplit, isLockedEdgeCell, entering, delay } = getCellColors(r, c, word);
              const isDraggingThis = dragState && pointerDrag.current?.r === r && pointerDrag.current?.c === c;
              const locked = isLockedEdgeCell && !activeSides;

              return (
                <div
                  key={key}
                  data-cell-key={key}
                  ref={(el) => { if (el) cellEls.current[key] = el; }}
                  onPointerDown={(e) => onPointerDown(e, r, c)}
                  onPointerUp={(e) => onPointerUp(e, r, c)}
                  onPointerCancel={onPointerCancel}
                  style={{
                    width: `${CELL}px`, height: `${CELL - 16}px`,
                    borderRadius: "10px", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "13px", fontWeight: 700, textAlign: "center",
                    cursor: solved || revealed ? "default" : locked ? "not-allowed" : "pointer",
                    userSelect: "none", padding: "4px", wordBreak: "break-word", lineHeight: "1.2",
                    position: "relative", touchAction: "none",
                    background: isCornerSplit ? "transparent" : bg1,
                    color: textColor,
                    outline: isSel ? "3px solid #aaaaff" : "none",
                    outlineOffset: "-3px",
                    boxShadow: isSel ? "0 0 0 3px rgba(170,170,255,0.4)" : (bg1 === "#2a2a3c" ? "0 2px 8px rgba(0,0,0,0.4)" : "none"),
                    zIndex: anim ? 10 : "auto",
                    transform: anim
                      ? `translate(${anim.tx}px, ${anim.ty}px)`
                      : entering ? "scale(0.5)" : isSel ? "scale(1.05)" : "scale(1)",
                    opacity: entering ? 0 : isDraggingThis ? 0.25 : locked ? 0.55 : (anim?.opacity ?? 1),
                    transition: entering
                      ? `transform 0.4s ease ${delay}ms, opacity 0.4s ease ${delay}ms`
                      : anim?.transition
                      ? "transform 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                      : anim
                      ? "none"
                      : "background 0.25s, outline 0.1s, box-shadow 0.1s, transform 0.15s, opacity 0.25s",
                    animation: solveAnim ? `ring-pulse 0.6s ease ${delay}ms both` : "none",
                  }}
                >
                  {isCornerSplit && (
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "10px",
                      background: bg2
                        ? `linear-gradient(135deg,${bg1} 50%,${bg2} 50%)`
                        : bg1,
                      transition: "background 0.25s",
                    }} />
                  )}
                  <span style={{
                    position: "relative", zIndex: 1,
                    textShadow: (activeSides || bg1 !== "#2a2a3c") ? "0 1px 3px rgba(0,0,0,0.35)" : "none",
                  }}>
                    {word}
                  </span>
                </div>
              );
            })
          )}
        </div>

        <div style={{
          ...sideLabel("right"),
          writingMode: "vertical-rl", width: "22px", textAlign: "center",
        }}>
          {activeSides ? activeSides.right : (correctSideMap?.has("right") ? correctSideMap.get("right") : "")}
        </div>
      </div>

      <div style={{ width: `${4 * CELL + 3 * GAP}px`, textAlign: "center", marginTop: "5px", marginBottom: "18px", minHeight: "20px" }}>
        <span style={sideLabel("bottom")}>
          {activeSides ? activeSides.bottom : (correctSideMap?.has("bottom") ? correctSideMap.get("bottom") : "")}
        </span>
      </div>

      {solveAnim && (
        <div style={{
          marginBottom: "18px",
          animation: "victory-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "4px" }}>🎉</div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            Squared up!
          </div>
          <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
            {guesses === 1 ? "First try — flawless." : `Solved in ${guesses} guesses.`}
          </div>
        </div>
      )}

      <div style={{
        maxWidth: "400px", width: "100%", overflow: "hidden",
        maxHeight: nagVisible ? "90px" : "0",
        marginBottom: nagVisible ? "14px" : "0",
        transition: "max-height 0.35s ease, margin-bottom 0.35s ease",
      }}>
        {wrongCount > 0 && (
          <div style={{
            padding: "12px 18px",
            background: wrongCount >= 3 ? "#221a0a" : "#1a160a",
            border: `1px solid ${wrongCount >= 3 ? "#5a4520" : "#3a3018"}`,
            borderRadius: "12px", display: "flex", alignItems: "center", gap: "12px",
          }}>
            <span style={{ fontSize: "30px", display: "inline-block" }}>
              {NAG_MESSAGES[Math.min(wrongCount - 1, 3)].emoji}
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: "15px", color: "#d9b14a" }}>
                {NAG_MESSAGES[Math.min(wrongCount - 1, 3)].text}
              </div>
              <div style={{ fontSize: "12px", color: "#998044", marginTop: "2px" }}>
                {NAG_MESSAGES[Math.min(wrongCount - 1, 3)].sub}
              </div>
            </div>
          </div>
        )}
      </div>

      {correctSideMap?.size > 0 && !solved && !revealed && !nagVisible && (
        <div style={{
          marginBottom: "14px", padding: "10px 20px",
          background: "#0d1a0d", border: "1px solid #1a3a1a",
          borderRadius: "10px", textAlign: "center", color: "#aaa", fontSize: "13px", fontWeight: 600,
        }}>
          {correctSideMap.size === 1
            ? "1 side correct — keep swapping!"
            : `${correctSideMap.size} sides correct — keep swapping!`}
        </div>
      )}

      {(solved || revealed) && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", marginTop: "4px" }}>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onShare} style={{
              padding: "11px 26px", borderRadius: "10px",
              background: "#2A7AE4", color: "#fff", fontWeight: 800, fontSize: "14px",
              border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(42,122,228,0.35)",
            }}>Share result</button>
            <button onClick={onBack} style={{
              padding: "11px 26px", borderRadius: "10px",
              background: "#131320", color: "#aaa", fontWeight: 700, fontSize: "14px",
              border: "1px solid #222232", cursor: "pointer",
            }}>Menu</button>
          </div>
          <div style={{ height: "16px", fontSize: "12px", color: "#5CC877", fontWeight: 700 }}>{shareMsg}</div>
        </div>
      )}

      {dragState && (
        <div style={{
          position: "fixed",
          left: dragState.x,
          top: dragState.y,
          transform: "translate(-50%, -50%) scale(1.1)",
          width: `${CELL}px`, height: `${CELL - 16}px`,
          borderRadius: "10px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "13px", fontWeight: 700, textAlign: "center",
          background: "#4a4a66", color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          border: "2px solid #aaaaff",
          pointerEvents: "none", zIndex: 1000, userSelect: "none", transition: "none",
        }}>
          {dragState.word}
        </div>
      )}
    </div>
  );
}

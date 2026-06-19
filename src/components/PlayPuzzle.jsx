import { useState, useRef } from "react";
import {
  OUTER_CELLS, INNER_CELLS, SIDE_CELLS, CORNER_SIDES, GRID_CORNERS,
  CELL_SIDE, CELL, GAP,
} from "../engine/geometry.js";
import {
  resolveSide, validateGrid, dealPuzzle, shuffleKeepingLocked,
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
  const { colors, fallbackGrid } = puzzle;

  const [grid, setGrid]                     = useState(() => dealPuzzle(puzzle));
  const [selected, setSelected]             = useState(null);
  // satisfiedSides: { side: category } — a side is "satisfied" when its 4 words
  // (as a set, position-independent) match a category. Snapshot from the last
  // check; tiles stay movable. Cleared on shuffle/reset.
  const [satisfiedSides, setSatisfiedSides] = useState({});
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
  const satisfiedCount = Object.keys(satisfiedSides).length;

  function animateSwap(r1, c1, r2, c2, fromDrag = false, releasePoint = null) {
    const k1 = `${r1},${c1}`, k2 = `${r2},${c2}`;

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
    if (isFullyLocked(key)) { setSelected(null); return; }
    if (selected) {
      if (selected.r === r && selected.c === c) { setSelected(null); return; }
      const selKey = `${selected.r},${selected.c}`;
      if (canSwap(selKey, key)) {
        const { r: r1, c: c1 } = selected;
        setSelected(null);
        animateSwap(r1, c1, r, c);
      } else {
        setSelected({ r, c }); // not a legal partner — switch selection instead
      }
    } else {
      setSelected({ r, c });
    }
  }

  function onPointerDown(e, r, c) {
    if (solved || revealed || isAnimating || solving) return;
    if (isFullyLocked(`${r},${c}`)) return; // confirmed corners don't move
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
      if ((tr !== drag.r || tc !== drag.c) && canSwap(`${drag.r},${drag.c}`, targetKey)) {
        animateSwap(drag.r, drag.c, tr, tc, true, { x: e.clientX, y: e.clientY });
      }
    }
  }

  function onPointerCancel() {
    pointerDrag.current = null;
    setDragState(null);
  }

  // Which sides are satisfied right now (4 words match a category set).
  function computeSatisfied(g) {
    const sat = {};
    for (const side of Object.keys(SIDE_CELLS)) {
      const cat = resolveSide(puzzle, g, side);
      if (cat) sat[side] = cat;
    }
    return sat;
  }

  // Once a side is confirmed, its tiles bind to it: they may only be swapped
  // with other cells of the same confirmed side (so corners can still be
  // ordered), and a corner confirmed by BOTH its sides is fully locked.
  function confirmedSidesOf(key) {
    const sides = GRID_CORNERS.has(key) ? CORNER_SIDES[key] : [CELL_SIDE[key]];
    return sides.filter((s) => satisfiedSides[s]);
  }
  function isFullyLocked(key) {
    return confirmedSidesOf(key).length >= 2;
  }
  function canSwap(k1, k2) {
    const a = confirmedSidesOf(k1);
    const b = confirmedSidesOf(k2);
    if (a.length >= 2 || b.length >= 2) return false;   // a confirmed corner is fixed
    if (a.length === 0 && b.length === 0) return true;  // both free
    return a.length === 1 && b.length === 1 && a[0] === b[0]; // same confirmed side
  }

  // Auto-solve: slide every tile into its correct spot, one swap at a time,
  // then color the solved sides. Used when the player runs out of attempts.
  function autoSolve() {
    const target = fallbackGrid;
    if (!target) return;
    setSolving(true);
    setSelected(null);

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
      setTimeout(() => animateSwap(r1, c1, r2, c2), t);
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

    const valid = validateGrid(puzzle, grid);
    if (valid) {
      setSatisfiedSides(valid.sideCategories);
      setSolvedSides(valid.sideCategories);
      setSolved(true);
      setTimeout(() => setSolveAnim(true), 500);
      return;
    }

    // Not solved: color whichever sides are full categories, count an attempt.
    setSatisfiedSides(computeSatisfied(grid));
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

  function shufflePuzzle() {
    if (solved || revealed || solving || isAnimating) return;
    setGrid((prev) => shuffleKeepingLocked(prev, new Set())); // shuffle all 12
    setSatisfiedSides({}); // board moved — clear the stale coloring
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
    setSatisfiedSides({});
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

  function getCellColors(r, c) {
    const key = `${r},${c}`;
    const isCorner = GRID_CORNERS.has(key);
    const delay = OUTER_CELLS.findIndex(([or, oc]) => or === r && oc === c) * 55;

    // Full reveal (solved / answer shown): color every side.
    if (activeSides) {
      const entering = revealed && !revealAnim;
      if (isCorner) {
        const [bg1, bg2] = CORNER_SIDES[key].map((side) => colors[activeSides[side]].bg);
        return { bg1, bg2, textColor: "#fff", isCornerSplit: true, entering, delay };
      }
      const side = CELL_SIDE[key];
      return { bg1: colors[activeSides[side]].bg, bg2: null, textColor: "#fff", isCornerSplit: false, entering, delay };
    }

    // In progress: color satisfied sides from the last check.
    if (isCorner) {
      const [sa, sb] = CORNER_SIDES[key];
      const ca = satisfiedSides[sa];
      const cb = satisfiedSides[sb];
      if (ca && cb) {
        // Both adjacent sides satisfied → confirmed corner, two colors.
        return { bg1: colors[ca].bg, bg2: colors[cb].bg, textColor: "#fff", isCornerSplit: true, entering: false, delay };
      }
      const one = ca || cb;
      if (one) {
        return { bg1: colors[one].bg, bg2: null, textColor: colors[one].text, isCornerSplit: false, entering: false, delay };
      }
    } else {
      const cat = satisfiedSides[CELL_SIDE[key]];
      if (cat) {
        return { bg1: colors[cat].bg, bg2: null, textColor: colors[cat].text, isCornerSplit: false, entering: false, delay };
      }
    }

    return { bg1: "#2a2a3c", bg2: null, textColor: "#f0f0f0", isCornerSplit: false, entering: false, delay };
  }

  function sideLabelColor(side) {
    if (activeSides) return colors[activeSides[side]].bg;
    if (satisfiedSides[side]) return colors[satisfiedSides[side]].bg;
    return "#333";
  }

  function sideLabelText(side) {
    if (activeSides) return activeSides[side];
    return satisfiedSides[side] || "";
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

  const sqShare = {
    padding: "7px 16px", borderRadius: "8px", background: "#2A7AE4", color: "#fff",
    fontWeight: 800, fontSize: "12px", border: "none", cursor: "pointer",
  };
  const sqMenu = {
    padding: "7px 16px", borderRadius: "8px", background: "#15151f", color: "#bbb",
    fontWeight: 700, fontSize: "12px", border: "1px solid #2a2a3a", cursor: "pointer",
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
            <li>All 12 words are on the board — swap them into place</li>
            <li><strong>Tap</strong> two words to swap, or <strong>slide</strong> one onto another</li>
            <li>A side lights up when its four words all belong to one category (any order)</li>
            <li>A corner shows <strong>two colors</strong> once both of its sides are right</li>
            <li>Hit the <strong>✓</strong> to check — you get 4 tries</li>
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

      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "18px", minHeight: "16px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#555" }}>
          Sides
        </span>
        <div style={{ display: "flex", gap: "5px" }}>
          {["top", "right", "bottom", "left"].map((side) => (
            <span key={side} style={{
              width: "12px", height: "12px", borderRadius: "3px",
              background: activeSides
                ? colors[activeSides[side]].bg
                : satisfiedSides[side] ? colors[satisfiedSides[side]].bg : "#2e2e3e",
              transition: "background 0.3s",
            }} />
          ))}
        </div>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#888" }}>
          {(activeSides ? 4 : satisfiedCount)}/4
        </span>
      </div>

      <div style={{ width: `${4 * CELL + 3 * GAP}px`, textAlign: "center", marginBottom: "5px", minHeight: "20px" }}>
        <span style={sideLabel("top")}>{sideLabelText("top")}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          ...sideLabel("left"),
          writingMode: "vertical-rl", transform: "rotate(180deg)",
          width: "22px", textAlign: "center",
        }}>
          {sideLabelText("left")}
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
                        <div style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                          animation: "victory-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
                        }}>
                          <div style={{ fontSize: "26px", lineHeight: 1 }}>🎉</div>
                          <div style={{ fontSize: "15px", fontWeight: 800, color: "#fff", letterSpacing: "-0.3px" }}>Squared up!</div>
                          <div style={{ fontSize: "10px", color: "#6f9f78", fontWeight: 600 }}>
                            {guesses === 1 ? "First try!" : `Solved in ${guesses}`}
                          </div>
                          <div style={{ display: "flex", gap: "7px", marginTop: "3px" }}>
                            <button onClick={onShare} style={sqShare}>Share</button>
                            <button onClick={onBack} style={sqMenu}>Menu</button>
                          </div>
                        </div>
                      ) : revealed ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                          <div style={{ fontSize: "26px", lineHeight: 1 }}>😤</div>
                          <div style={{ fontSize: "13px", fontWeight: 800, color: "#dd6a6a" }}>Answer shown</div>
                          <div style={{ display: "flex", gap: "7px", marginTop: "3px" }}>
                            <button onClick={onShare} style={sqShare}>Share</button>
                            <button onClick={onBack} style={sqMenu}>Menu</button>
                          </div>
                        </div>
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
              const { bg1, bg2, textColor, isCornerSplit, entering, delay } = getCellColors(r, c);
              const isDraggingThis = dragState && pointerDrag.current?.r === r && pointerDrag.current?.c === c;
              const fullyLocked = isFullyLocked(key);

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
                    cursor: solved || revealed || fullyLocked ? "default" : "pointer",
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
                    opacity: entering ? 0 : isDraggingThis ? 0.25 : (anim?.opacity ?? 1),
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
          {sideLabelText("right")}
        </div>
      </div>

      <div style={{ width: `${4 * CELL + 3 * GAP}px`, textAlign: "center", marginTop: "5px", marginBottom: "18px", minHeight: "20px" }}>
        <span style={sideLabel("bottom")}>{sideLabelText("bottom")}</span>
      </div>

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

      {satisfiedCount > 0 && !solved && !revealed && !nagVisible && (
        <div style={{
          marginBottom: "14px", padding: "10px 20px",
          background: "#0d1a0d", border: "1px solid #1a3a1a",
          borderRadius: "10px", textAlign: "center", color: "#aaa", fontSize: "13px", fontWeight: 600,
        }}>
          {satisfiedCount === 1
            ? "1 side is a category — now line up the corners!"
            : `${satisfiedCount} sides are categories — now line up the corners!`}
        </div>
      )}

      {shareMsg && (
        <div style={{
          position: "fixed", bottom: "26px", left: "50%", transform: "translateX(-50%)",
          background: "#131320", border: "1px solid #2a4a2a", color: "#5CC877",
          fontWeight: 700, fontSize: "13px", padding: "9px 18px", borderRadius: "10px",
          zIndex: 1100, boxShadow: "0 6px 20px rgba(0,0,0,0.5)",
        }}>
          {shareMsg}
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

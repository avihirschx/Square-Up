import { useState, useEffect } from "react";
import MenuScreen from "./components/MenuScreen.jsx";
import MyPuzzles from "./components/MyPuzzles.jsx";
import BuilderScreen from "./components/BuilderScreen.jsx";
import PlayPuzzle from "./components/PlayPuzzle.jsx";
import { compileSource } from "./engine/builder.js";
import { saveSource, updateSource, isSaved } from "./lib/storage.js";
import { readSharedFromUrl, clearShareHash } from "./lib/puzzleCodec.js";
import { FEATURED_SOURCE } from "./data/featured.js";

let keySeq = 0;
const nextKey = () => `p${++keySeq}`;

const SUBTITLE = "Each side a category · corners link two sides";

function makeActive(puzzle, source) {
  return {
    key: nextKey(),
    puzzle,
    name: source.title,
    subtitle: SUBTITLE,
    source,
    saved: isSaved(source),
  };
}

// If the app was opened from a share link, build the starting state from it.
function bootState() {
  const src = readSharedFromUrl();
  if (src) {
    const res = compileSource(src);
    clearShareHash();
    if (res.ok) return { screen: "play", active: makeActive(res.puzzle, src) };
  }
  return { screen: "menu", active: null };
}

export default function App() {
  const [boot] = useState(bootState);
  const [screen, setScreen] = useState(boot.screen);
  const [active, setActive] = useState(boot.active);
  const [editing, setEditing] = useState(null); // saved rec being edited, or null

  // If a share link is pasted while the app is already open, react to it.
  useEffect(() => {
    function onHash() {
      const src = readSharedFromUrl();
      if (!src) return;
      const res = compileSource(src);
      clearShareHash();
      if (res.ok) { setActive(makeActive(res.puzzle, src)); setScreen("play"); }
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function playSource(source, puzzle) {
    setActive(makeActive(puzzle, source));
    setScreen("play");
  }

  function playSaved(rec) {
    const res = compileSource(rec);
    if (res.ok) playSource(rec, res.puzzle);
  }

  function playFeatured() {
    const res = compileSource(FEATURED_SOURCE);
    if (res.ok) playSource(FEATURED_SOURCE, res.puzzle);
  }

  function saveActive() {
    if (!active?.source) return;
    saveSource(active.source); // de-dupes if already saved
    setActive((a) => ({ ...a, saved: true }));
  }

  if (screen === "menu") {
    return (
      <MenuScreen
        onPlayFeatured={playFeatured}
        featuredTitle={FEATURED_SOURCE.title}
        onMyPuzzles={() => setScreen("myPuzzles")}
        onBuild={() => { setEditing(null); setScreen("build"); }}
      />
    );
  }

  if (screen === "myPuzzles") {
    return (
      <MyPuzzles
        onPlay={playSaved}
        onEdit={(rec) => { setEditing(rec); setScreen("build"); }}
        onBuild={() => { setEditing(null); setScreen("build"); }}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "build") {
    return (
      <BuilderScreen
        key={editing ? editing.id : "new"}
        initial={editing}
        editing={!!editing}
        onBack={() => { const e = editing; setEditing(null); setScreen(e ? "myPuzzles" : "menu"); }}
        onPlay={(puzzle, source) => playSource(source, puzzle)}
        onSave={(source) => {
          if (editing) updateSource(editing.id, source);
          else saveSource(source);
          setEditing(null);
          setScreen("myPuzzles");
        }}
      />
    );
  }

  // screen === "play"
  return (
    <PlayPuzzle
      key={active.key}
      puzzle={active.puzzle}
      subtitle={active.subtitle}
      name={active.name}
      saved={active.saved}
      onSave={saveActive}
      onBack={() => setScreen("menu")}
    />
  );
}

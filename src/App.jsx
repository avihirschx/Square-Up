import { useState } from "react";
import MenuScreen from "./components/MenuScreen.jsx";
import MyPuzzles from "./components/MyPuzzles.jsx";
import BuilderScreen from "./components/BuilderScreen.jsx";
import PlayPuzzle from "./components/PlayPuzzle.jsx";
import { compileSource } from "./engine/builder.js";
import { saveSource } from "./lib/storage.js";
import { readSharedFromUrl, clearShareHash } from "./lib/puzzleCodec.js";

let keySeq = 0;
const nextKey = () => `p${++keySeq}`;

function subtitleFor({ daily, custom }) {
  if (daily) return "Swap words until each side is a category · corners link two sides";
  if (custom) return "Each side a category · corners link two sides";
  return "Swap words until each side is a category · corners link two sides";
}

// If the app was opened from a share link, build the starting state from it.
function bootState() {
  const src = readSharedFromUrl();
  if (src) {
    const res = compileSource(src);
    clearShareHash();
    if (res.ok) {
      return {
        screen: "play",
        active: {
          key: nextKey(),
          puzzle: res.puzzle,
          name: src.title,
          subtitle: subtitleFor({ custom: true }),
          dayNumber: null,
          source: src,     // so it can be saved
          canSave: true,
        },
      };
    }
  }
  return { screen: "menu", active: null };
}

export default function App() {
  const [boot] = useState(bootState);
  const [screen, setScreen] = useState(boot.screen);
  const [active, setActive] = useState(boot.active);

  function playDaily(daily) {
    setActive({
      key: nextKey(),
      puzzle: daily.puzzle,
      name: daily.title,
      subtitle: subtitleFor({ daily: true }),
      dayNumber: daily.dayNumber,
      source: null,
      canSave: false,
    });
    setScreen("play");
  }

  function playSource(source, puzzle, { canSave }) {
    setActive({
      key: nextKey(),
      puzzle,
      name: source.title,
      subtitle: subtitleFor({ custom: true }),
      dayNumber: null,
      source,
      canSave,
    });
    setScreen("play");
  }

  function playSaved(rec) {
    const res = compileSource(rec);
    if (!res.ok) return; // corrupt record — ignore
    // Already in the list, so no save affordance needed.
    playSource(rec, res.puzzle, { canSave: false });
  }

  function saveActive() {
    if (!active?.source) return;
    saveSource(active.source);
    setActive((a) => ({ ...a, canSave: false, justSaved: true }));
  }

  if (screen === "menu") {
    return (
      <MenuScreen
        onPlayDaily={playDaily}
        onMyPuzzles={() => setScreen("myPuzzles")}
        onBuild={() => setScreen("build")}
      />
    );
  }

  if (screen === "myPuzzles") {
    return (
      <MyPuzzles
        onPlay={playSaved}
        onBuild={() => setScreen("build")}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "build") {
    return (
      <BuilderScreen
        onBack={() => setScreen("menu")}
        onPlay={(puzzle, source) => playSource(source, puzzle, { canSave: true })}
        onSave={(source) => { saveSource(source); setScreen("myPuzzles"); }}
      />
    );
  }

  // screen === "play"
  return (
    <PlayPuzzle
      key={active.key}
      puzzle={active.puzzle}
      title="Square Up"
      subtitle={active.subtitle}
      name={active.name}
      dayNumber={active.dayNumber}
      canSave={active.canSave}
      justSaved={active.justSaved}
      onSave={saveActive}
      onBack={() => setScreen("menu")}
    />
  );
}

import { useState } from "react";
import MenuScreen from "./components/MenuScreen.jsx";
import PuzzleSelect from "./components/PuzzleSelect.jsx";
import BuilderScreen from "./components/BuilderScreen.jsx";
import PlayPuzzle from "./components/PlayPuzzle.jsx";

export default function App() {
  const [screen, setScreen] = useState("menu"); // "menu" | "select" | "build" | "play"
  // active = { puzzle, title, subtitle, dayNumber, key }
  const [active, setActive] = useState(null);

  function playEntry(entry, { dayNumber = null } = {}) {
    setActive({
      key: entry.id + ":" + (dayNumber ?? "x"),
      puzzle: entry.puzzle,
      title: "Square Up",
      subtitle: entry.title
        ? `${entry.title} · each side a category, corners link two`
        : "Swap words until each side is a category · corners link two sides",
      dayNumber,
    });
    setScreen("play");
  }

  if (screen === "menu") {
    return (
      <MenuScreen
        onPlayDaily={(daily) => playEntry(daily, { dayNumber: daily.dayNumber })}
        onBrowse={() => setScreen("select")}
        onBuild={() => setScreen("build")}
      />
    );
  }

  if (screen === "select") {
    return (
      <PuzzleSelect
        onPick={(entry) => playEntry(entry)}
        onBack={() => setScreen("menu")}
      />
    );
  }

  if (screen === "build") {
    return (
      <BuilderScreen
        onBack={() => setScreen("menu")}
        onBuild={(puzzle) => {
          setActive({
            key: "custom:" + Date.now(),
            puzzle,
            title: "Square Up",
            subtitle: "Your custom puzzle · each side a category, corners link two",
            dayNumber: null,
          });
          setScreen("play");
        }}
      />
    );
  }

  // screen === "play"
  return (
    <PlayPuzzle
      key={active.key}
      puzzle={active.puzzle}
      title={active.title}
      subtitle={active.subtitle}
      dayNumber={active.dayNumber}
      onBack={() => setScreen("menu")}
    />
  );
}

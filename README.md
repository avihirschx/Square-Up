# Square Up

A daily word-square puzzle. Arrange 12 words into a square where **every side is a
category** and **every corner word belongs to the two categories it touches**.

> e.g. **Python** is both a snake and a programming language, so it sits in the
> corner between those two sides.

Inspired by Connections, but spatial: you don't sort words into groups, you slot
them into a square so all four edges *and* the four shared corners work at once.

## Play

- **Tap** a word, then tap another to swap them — or **drag** one onto another.
- Each side must form a category; the corner tiles are shared by both neighbours.
- Hit **Check** in the centre. Correct sides lock in as a hint.
- A new **daily puzzle** rotates by date, plus a library of others and a builder
  for your own.

## Develop

```bash
npm install
npm run dev        # local dev server
npm run validate   # attack every puzzle through the real engine
npm run build      # validate + production build into dist/
npm run preview    # preview the production build
```

## Project layout

```
src/
  engine/      pure game logic (no React) — geometry, derive/validate/solve
  data/        puzzles.js  ← the puzzle collection (edit here)
               collection.js — compiles puzzles + daily selection
  components/  PlayPuzzle, BuilderScreen, MenuScreen, PuzzleSelect
  lib/         share.js — Wordle-style result sharing
scripts/
  validate-puzzles.mjs   the puzzle "attacker"
```

## Adding or rejecting puzzles

The collection lives in [`src/data/puzzles.js`](src/data/puzzles.js). Every puzzle
is one self-contained block in a simple ring format:

```js
{
  id: "snakes-cars-horses-guns",
  title: "Loaded",
  source: "avihi",
  sides: {
    top:    { cat: "Snakes",   edges: ["Mamba", "Adder"] },
    right:  { cat: "Cars",     edges: ["Civic", "Camry"] },
    bottom: { cat: "Horses",   edges: ["Stallion", "Mare"] },
    left:   { cat: "Handguns", edges: ["Glock", "Luger"] },
  },
  corners: {
    "top-right":    "Viper",   // snake + Dodge car
    "right-bottom": "Mustang", // Ford car + horse
    "bottom-left":  "Colt",    // young horse + Colt firearms
    "left-top":     "Python",  // Colt Python revolver + snake
  },
}
```

- **Reject one:** delete its block. Nothing else depends on it.
- **Add one:** copy the template at the bottom of the file, then run `npm run validate`.

`npm run validate` runs every puzzle through the actual game engine and **fails
loudly** if a puzzle is malformed, unsolvable, or *ambiguous* (has a second valid
arrangement). The build and CI both gate on it, so a bad puzzle can't ship.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which validates the
puzzles, builds, and publishes to GitHub Pages. The build uses a relative base
path, so it works at any repo URL without configuration.

> One-time setup: in the repo, **Settings → Pages → Build and deployment →
> Source: GitHub Actions**.

## Colophon

Original game concept by **Jacob Elspas**. Designed and built by
[@avihirschx](https://github.com/avihirschx), with
[Claude](https://claude.com/claude-code) as a pair-programming assistant.

## License

MIT

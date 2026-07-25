# Fun-Work

A gamified habit and activity tracker — Duolingo-style. Track physical
activities, schoolwork and anything else you define, make small progressive
steps, keep a daily streak, and earn badges.

Everything is stored **on your device**. There is no backend, no account and no
login, and nothing is uploaded.

## Install and run

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

```bash
npm run build
```

Builds to `dist/`. Preview the production build with `npm run preview`.

To use it on your phone during development, run `npm run dev -- --host` and open
the Network URL it prints.

## Installing as an app (PWA)

The app is a PWA, so it installs to your home screen and works offline.

- **iOS (Safari)** — Share → Add to Home Screen
- **Android (Chrome)** — the install prompt, or ⋮ → Install app

Because data lives in the browser's IndexedDB, the installed app and the browser
tab share the same data on the same device, but data does **not** sync between
devices. Use Settings → Export to move it.

## How it works

- **Category** — a top-level grouping ("Physical", "Schoolwork") with a name,
  emoji and color.
- **Activity** — belongs to a category ("Running", "Math AA") and has a ladder
  of progressive levels.
- **Log** — one tap is one session, worth 10 XP. Logs are the only thing
  actually stored; XP, levels, streaks and badges are all derived from them, so
  they can never drift out of sync.
- **Streak** — consecutive calendar days with at least one log. Not having
  logged *today* doesn't break it — you still have the rest of the day.
- **Badges** — awarded automatically for your first log, every level-up,
  streaks of 3/7/14/30/100 days, XP totals, and completing every level of an
  activity.

### Levels

New activities get 10 auto-generated levels that take gradually more sessions
(2, 3, 5, 6, 8…). If you'd rather name your own milestones, tick **Name my own
milestones** when creating the activity and type one per line.

## Bulk import format

Settings → Bulk add (or the button on an empty dashboard) takes a pasted list.

A line starting with `# ` starts a category. Every line under it becomes an
activity in that category:

```
# 💪 Physical
Running
Swimming
Push-ups

# 📚 Schoolwork
Math AA
Physics HL
```

Details:

- Bullets and numbering (`- `, `* `, `1. `) are stripped automatically.
- A leading emoji becomes the category's or activity's icon.
- Lines before the first `# ` heading go into a category called
  "Uncategorized".
- Repeating a category heading merges into the same category rather than
  creating a duplicate.
- Importing a name that already exists **skips** it rather than duplicating —
  so re-pasting an updated list is safe and never touches logged history.

You always get a preview showing exactly what will be created, what will merge
and what will be skipped, before anything is written.

After importing, the **Organize** screen lets you drag activities to reorder
them or move them between categories. It works with a mouse, with touch, and
with the keyboard (Tab to an item, Space to lift, arrows to move, Space to
drop).

## Image import (Anthropic API key)

> Not built yet — planned for Phase 3, see Status below.

The image import will let you upload a screenshot of a list and have Claude
extract it into the bulk format above. It is gated behind an API key you enter
yourself in **Settings**, stored only in your browser's local database.

**No key is ever hardcoded or committed.** If you'd rather not use the feature,
leave the field empty and it stays disabled.

## Project structure

```
src/
  components/   Reusable UI: Button, Card, ProgressBar, ProgressRing,
                LevelNode, Modal, TabBar, pickers
  features/
    activities/ Activity CRUD, the log action, level path, log button
    badges/     Badge cards and the celebration modal
    categories/ Category CRUD and the dashboard section
    import/     Bulk-text parser, import preview, organize logic
    streak/     Streak flame and week strip
  screens/      Home, Activity, Badges, BulkAdd, Organize, Settings
  lib/          db.ts (Dexie), xp.ts, streak.ts, badges.ts, date.ts,
                ordering.ts, palette.ts, router.ts
  hooks/        useData (live queries), useRoute, useConfetti
  store/        Ephemeral UI state (celebration queue)
  types/        Shared types
  styles/       Tailwind theme tokens and animations
```

The rules live in `src/lib` as pure functions over the log history, separate
from the React components that render them — which is why they're
straightforward to test and reason about.

## Data and backups

Settings → **Export** writes a JSON backup, and **Import** restores one
(replacing everything currently stored). **Reset all data** erases everything;
export first if you might want it back.

## Status

- **Phase 1 — MVP:** done. Dashboard, categories and activities, one-tap
  logging with celebrations, level paths, daily streak, badges.
- **Phase 2 — Bulk input:** done. Paste-to-import with preview, and the
  drag-and-drop organize screen.
- **Phase 3 — Enhancements:** not started. Screenshot import via the Anthropic
  API, a level/milestone editor, and stats over time.

## Tech

React 19, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), Zustand,
dnd-kit, canvas-confetti, vite-plugin-pwa.

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
- **Log** — one tap is one session. A session starts at 10 coins and earns more
  when a streak multiplier is active. Sessions, shop purchases, and combat turns
  are the only stored progress history; coin balances, levels, streaks, badges,
  item ownership, and combat state are all derived from that history.
- **Streak** — consecutive calendar days with at least one log. Not having
  logged *today* doesn't break it — you still have the rest of the day.
- **Badges** — awarded automatically for your first log, every level-up,
  streaks of 3/7/14/30/100 days, coin totals, and completing every level of an
  activity.
- **Armory** — spend derived coins on weapons with damage and deterministic
  critical-hit rhythms, healing magic with lower damage, or armour with guard
  and max-health bonuses. A purchase is appended to the same history rather
  than mutating a stored balance.
- **Boss arena** — use an owned weapon-and-armour loadout against a four-boss
  campaign. Bosses counterattack, the player can lose, and a defeat resets the
  current attempt without taking coins. Every turn is a log event, so boss
  health, player health, critical hits, defeats, victories, unlocks and rewards
  are all replayed rather than stored as counters.

### Coins and streak multipliers

Every session starts at 10 coins. Consecutive active days raise the reward for
every session on that day:

- Days 1–2: 1×
- Days 3–6: 1.5×
- Days 7–13: 2×
- Days 14–29: 2.5×
- Day 30 and beyond: 3×

### Levels and the journey

When creating an activity, choose any quick ladder size from 1–30 levels, or
switch to named milestones and type one per line. Every milestone becomes one
level. Activity → **Edit levels** lets you resize the path, rename or reorder
levels, and change how many sessions each one needs at any time.

Levels are laid out as a winding route rather than a list. The route is split
into named chapters — Green Hollow, Stoneford, Ember Ridge and on — each drawn
as its own stretch of ground, with the last stop of a chapter shown as a larger
landmark. Chapters are *derived* from how many levels an activity has (roughly
four per chapter, up to six chapters), so editing levels re-chapters the route
immediately; nothing about chapters is stored.

The route is one ordered list for assistive tech: the decorative nodes are
hidden and each stop announces its name, state and position ("Level 3 of 10").
Under `prefers-reduced-motion` the animations stop but the arrival ring stays
visible, so a level-up still reads without movement.

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

Settings → **Import from an image** takes a photo or screenshot of a list and
uses Claude's vision to extract it, then shows you the same preview as the text
import before anything is written.

It needs your own Anthropic API key, entered in **Settings**:

1. Create a key at https://console.anthropic.com/settings/keys
2. Paste it into Settings → Anthropic API key → Save

**No key is ever hardcoded, committed, or bundled.** It is stored in this
browser's IndexedDB and sent directly from your device to Anthropic — there is
no server in between. It is stored **unencrypted**, so anyone with access to
this device (or anything that can run scripts on the page) can read it: use a
key scoped to just this, and remove it from Settings when you're done. Leave
the field empty and the feature stays disabled; everything else works without
it.

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
    arena/      Boss attack log action
    shop/       Coin-ledger weapon purchase action
    streak/     Streak flame and week strip
  screens/      Home, Activity, Arena, Badges, BulkAdd, ImageImport, Organize,
                Shop, Stats, Settings
  lib/          db.ts (Dexie), bosses.ts, coins.ts, shop.ts, loadout.ts,
                journey.ts, xp.ts, streak.ts, badges.ts, date.ts, ordering.ts,
                palette.ts, router.ts
  hooks/        useData (live queries), useRoute, useConfetti
  store/        Ephemeral UI state (celebration queue)
  types/        Shared types
  styles/       Tailwind theme tokens and animations
```

The rules live in `src/lib` as pure functions over the log history, separate
from the React components that render them — which is why they're
straightforward to test and reason about.

`lib/loadout.ts` is both a shipped module and the balance harness. It measures a
loadout by replaying synthetic hits through the same `computeBossProgress` the
arena uses, so a balance answer can never disagree with a real fight. With the
dev server running you can check the whole catalog from the browser console:

```js
const { BOSSES } = await import('/src/lib/bosses.ts')
const { simulateLoadout } = await import('/src/lib/loadout.ts')
const { getWeapon, getArmour } = await import('/src/lib/shop.ts')
simulateLoadout(BOSSES[3], getWeapon('habit-royalty'), getArmour('aegis-bulwark'))
```

## Data and backups

Settings → **Export** writes a JSON backup, and **Import** restores one
(replacing everything currently stored). **Reset all data** erases everything;
export first if you might want it back.

## Status

- **Phase 1 — MVP:** done. Dashboard, categories and activities, one-tap
  logging with celebrations, level paths, daily streak, badges.
- **Phase 2 — Bulk input:** done. Paste-to-import with preview, and the
  drag-and-drop organize screen.
- **Phase 3 — Enhancements:** done. Screenshot import via the Anthropic API, a
  level/milestone editor (Activity → Edit levels), and a Stats tab.
- **Phase 4 — Quest economy:** done. Adjustable 1–30-level paths, named
  milestone ladders, derived coins with streak multipliers, a reward shop, and
  a richer game-like home and navigation design.
- **Phase 5 — Arena:** done. Functional weapon upgrades, four derived-health
  boss encounters, battle rewards, clean icon-based navigation, animated
  banners and a lighter visual system with fewer decorative emoji.
- **Phase 6 — Combat expansion:** done. CC0 boss and weapon artwork, armour
  loadouts, boss counterattacks, player health, deterministic critical hits,
  defeat/attempt resets, battle records, and offline-cached game art.
- **Phase 7 — Armory rebuild:** done. Individually cropped equipment art,
  nine visibly progressive weapons, four healing-magic options, six armour
  tiers, clearer combat tradeoffs, and mechanically replayed healing.

Verified end to end in a browser, including real pointer drags on the Organize
screen for both same-category reordering and cross-category moves. Image import
itself remains unverified because it requires your API key.

## Tech

React 19, TypeScript, Vite, Tailwind CSS v4, Dexie (IndexedDB), Zustand,
dnd-kit, Lucide, canvas-confetti, vite-plugin-pwa.

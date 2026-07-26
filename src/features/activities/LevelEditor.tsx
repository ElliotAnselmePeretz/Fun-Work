import { useState } from 'react'
import { PixelIcon } from '../../components/PixelIcon'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { arrayMove } from '../../lib/ordering'
import {
  defaultSessionsForLevel,
  MAX_LEVEL_COUNT,
  MIN_LEVEL_COUNT,
} from '../../lib/xp'
import type { Activity, Level } from '../../types'
import { makeLevel, setLevels } from './activityActions'
import { refreshBadges } from './logActions'

interface LevelEditorProps {
  open: boolean
  onClose: () => void
  activity: Activity
  /** Levels already cleared — reordering below this line rewrites history. */
  currentLevelIndex: number
}

/**
 * Rename, reorder, add and remove the rungs of an activity. Progress is
 * derived from the log history, so edits here recompute the current level
 * rather than corrupting it — but that also means changing an already-cleared
 * level can move you backwards, which the warning below calls out.
 */
export function LevelEditor({
  open,
  onClose,
  activity,
  currentLevelIndex,
}: LevelEditorProps) {
  const [levels, setDraft] = useState<Level[]>(activity.levels)

  const update = (index: number, patch: Partial<Level>) =>
    setDraft(levels.map((level, i) => (i === index ? { ...level, ...patch } : level)))

  const move = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= levels.length) return
    setDraft(arrayMove(levels, index, to))
  }

  const resize = (count: number) => {
    const nextCount = Math.min(MAX_LEVEL_COUNT, Math.max(MIN_LEVEL_COUNT, count))
    if (nextCount <= levels.length) {
      setDraft(levels.slice(0, nextCount))
      return
    }
    setDraft([
      ...levels,
      ...Array.from({ length: nextCount - levels.length }, (_, offset) => {
        const index = levels.length + offset
        return makeLevel(
          `Level ${index + 1}`,
          defaultSessionsForLevel(index, activity.difficulty),
        )
      }),
    ])
  }

  const save = async () => {
    const cleaned = levels
      .map((level, index) => ({
        ...level,
        name: level.name.trim() || `Level ${index + 1}`,
        sessionsRequired: Math.max(1, Math.round(level.sessionsRequired) || 1),
      }))
    await setLevels(activity.id, cleaned)
    // Renaming or reordering can retroactively clear (or un-clear) a level.
    await refreshBadges()
    onClose()
  }

  const totalSessions = levels.reduce((sum, level) => sum + level.sessionsRequired, 0)

  return (
    <Modal open={open} onClose={onClose} title="Edit levels">
      <div className="flex flex-col gap-3">
        <p className="text-xs text-ink-soft">
          {levels.length} levels · {totalSessions} sessions to finish. Levels you've
          already cleared are marked — editing those can change what level you're on.
        </p>

        <div className="flex items-center justify-between rounded-2xl bg-polar p-3">
          <span>
            <span className="block text-sm font-extrabold">Level count</span>
            <span className="block text-xs text-ink-soft">Match the path to your milestones.</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => resize(levels.length - 1)}
              disabled={levels.length <= MIN_LEVEL_COUNT}
              aria-label="Remove last level"
              className="level-stepper"
            >
              −
            </button>
            <output className="w-8 text-center text-xl font-black text-sky">
              {levels.length}
            </output>
            <button
              type="button"
              onClick={() => resize(levels.length + 1)}
              disabled={levels.length >= MAX_LEVEL_COUNT}
              aria-label="Add another level"
              className="level-stepper"
            >
              +
            </button>
          </div>
        </div>

        <ul className="flex flex-col gap-2">
          {levels.map((level, index) => {
            const cleared = index < currentLevelIndex
            return (
              <li
                key={level.id}
                className={`flex items-center gap-2 rounded-2xl border-2 p-2 ${
                  cleared ? 'border-gold/50 bg-gold/10' : 'border-swan'
                }`}
              >
                <span className="w-5 shrink-0 text-center text-xs font-extrabold text-ink-soft">
                  {cleared ? <PixelIcon name="crystal" className="h-4 w-4" /> : index + 1}
                </span>

                <input
                  value={level.name}
                  aria-label={`Level ${index + 1} name`}
                  onChange={(event) => update(index, { name: event.target.value })}
                  className="min-w-0 flex-1 rounded-xl border-2 border-transparent bg-[#17142d] px-2 py-1.5 text-sm font-bold text-ink outline-none focus:border-sky"
                />

                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={level.sessionsRequired}
                  aria-label={`Sessions needed for level ${index + 1}`}
                  onChange={(event) =>
                    update(index, { sessionsRequired: Number(event.target.value) })
                  }
                  className="w-14 shrink-0 rounded-xl border-2 border-swan bg-[#17142d] px-2 py-1.5 text-center text-sm font-bold text-ink outline-none focus:border-sky"
                />

                <div className="flex shrink-0 flex-col">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move level ${index + 1} up`}
                    className="px-1 text-xs leading-none text-hare disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === levels.length - 1}
                    aria-label={`Move level ${index + 1} down`}
                    className="px-1 text-xs leading-none text-hare disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <button
                  onClick={() => setDraft(levels.filter((_, i) => i !== index))}
                  aria-label={`Delete level ${index + 1}`}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-hare hover:bg-cardinal/10 hover:text-cardinal"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>

        <Button size="lg" onClick={save} disabled={levels.length === 0}>
          Save levels
        </Button>
      </div>
    </Modal>
  )
}

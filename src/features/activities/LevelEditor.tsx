import { useState } from 'react'
import { Button } from '../../components/Button'
import { Modal } from '../../components/Modal'
import { arrayMove } from '../../lib/ordering'
import { defaultSessionsForLevel } from '../../lib/xp'
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
                  {cleared ? '★' : index + 1}
                </span>

                <input
                  value={level.name}
                  aria-label={`Level ${index + 1} name`}
                  onChange={(event) => update(index, { name: event.target.value })}
                  className="min-w-0 flex-1 rounded-xl border-2 border-transparent bg-white px-2 py-1.5 text-sm font-bold outline-none focus:border-sky"
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
                  className="w-14 shrink-0 rounded-xl border-2 border-swan bg-white px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-sky"
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

        <Button
          variant="ghost"
          className="border-2 border-dashed border-swan"
          onClick={() =>
            setDraft([
              ...levels,
              makeLevel(
                `Level ${levels.length + 1}`,
                defaultSessionsForLevel(levels.length),
              ),
            ])
          }
        >
          + Add level
        </Button>

        <Button size="lg" onClick={save} disabled={levels.length === 0}>
          Save levels
        </Button>
      </div>
    </Modal>
  )
}

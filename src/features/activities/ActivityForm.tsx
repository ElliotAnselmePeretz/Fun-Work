import { useState } from 'react'
import { Button } from '../../components/Button'
import { EmojiPicker } from '../../components/EmojiPicker'
import { Modal } from '../../components/Modal'
import { TextArea, TextField } from '../../components/TextField'
import {
  DEFAULT_LEVEL_COUNT,
  MAX_LEVEL_COUNT,
  MIN_LEVEL_COUNT,
} from '../../lib/xp'
import type { Activity, Category } from '../../types'
import { createActivity, deleteActivity, updateActivity } from './activityActions'

interface ActivityFormProps {
  open: boolean
  onClose: () => void
  category: Category
  /** Omit to create; pass an activity to edit its name and icon. */
  activity?: Activity
}

/**
 * Hybrid level creation: an activity is one field away from existing, and the
 * milestone list is an optional disclosure for when you already know the
 * rungs you want. Levels stay editable afterwards either way.
 */
export function ActivityForm({ open, onClose, category, activity }: ActivityFormProps) {
  const editing = activity !== undefined
  const [name, setName] = useState(activity?.name ?? '')
  const [emoji, setEmoji] = useState(activity?.emoji ?? '⭐')
  const [showMilestones, setShowMilestones] = useState(false)
  const [milestones, setMilestones] = useState('')
  const [levelCount, setLevelCount] = useState(DEFAULT_LEVEL_COUNT)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const milestoneNames = milestones
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const submit = async () => {
    if (!name.trim()) return
    if (editing) {
      await updateActivity(activity.id, { name: name.trim(), emoji })
    } else {
      await createActivity({
        categoryId: category.id,
        name,
        emoji,
        levelNames: showMilestones ? milestoneNames : undefined,
        levelCount: showMilestones ? undefined : levelCount,
      })
    }
    onClose()
  }

  const remove = async () => {
    if (!editing) return
    await deleteActivity(activity.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit activity' : `New activity in ${category.name}`}
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={name}
          autoFocus
          placeholder="e.g. Running"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !showMilestones) void submit()
          }}
        />
        <EmojiPicker value={emoji} onChange={setEmoji} extra={['⭐', '🏃', '📖', '🎹']} />

        {!editing && (
          <div className="rounded-3xl border-2 border-swan bg-polar/70 p-3">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={showMilestones}
                onChange={(event) => setShowMilestones(event.target.checked)}
                className="mt-1 h-5 w-5 shrink-0 accent-sky"
              />
              <span>
                <span className="block text-sm font-extrabold">
                  Build from named milestones
                </span>
                <span className="block text-xs text-ink-soft">
                  Each milestone becomes a level. Leave this off to choose a quick
                  ladder size instead.
                </span>
              </span>
            </label>

            {showMilestones ? (
              <div className="mt-3">
                <TextArea
                  label="One milestone per line"
                  rows={5}
                  value={milestones}
                  placeholder={'5K\n10K\nHalf marathon\nMarathon'}
                  onChange={(event) => setMilestones(event.target.value)}
                />
                <p className="mt-1.5 text-xs text-ink-soft">
                  {milestoneNames.length} milestone
                  {milestoneNames.length === 1 ? '' : 's'}
                  {milestoneNames.length === 0 && ' — falls back to the default ladder'}
                </p>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between rounded-2xl bg-white p-3">
                <span>
                  <span className="block text-sm font-extrabold">Number of levels</span>
                  <span className="block text-xs text-ink-soft">
                    You can rename every level later.
                  </span>
                </span>
                <div className="flex items-center gap-2" aria-label="Number of levels">
                  <button
                    type="button"
                    onClick={() =>
                      setLevelCount((count) => Math.max(MIN_LEVEL_COUNT, count - 1))
                    }
                    disabled={levelCount <= MIN_LEVEL_COUNT}
                    aria-label="Remove one level"
                    className="level-stepper"
                  >
                    −
                  </button>
                  <output className="w-8 text-center text-xl font-black text-sky">
                    {levelCount}
                  </output>
                  <button
                    type="button"
                    onClick={() =>
                      setLevelCount((count) => Math.min(MAX_LEVEL_COUNT, count + 1))
                    }
                    disabled={levelCount >= MAX_LEVEL_COUNT}
                    aria-label="Add one level"
                    className="level-stepper"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <Button size="lg" color={category.color} onClick={submit} disabled={!name.trim()}>
          {editing ? 'Save' : 'Add activity'}
        </Button>

        {editing &&
          (confirmingDelete ? (
            <div className="rounded-2xl border-2 border-cardinal/40 bg-cardinal/5 p-3 text-center">
              <p className="mb-3 text-sm font-bold">
                Delete “{activity.name}” and its logged history?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setConfirmingDelete(false)}
                >
                  Cancel
                </Button>
                <Button variant="danger" className="flex-1" onClick={remove}>
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Delete activity
            </Button>
          ))}
      </div>
    </Modal>
  )
}

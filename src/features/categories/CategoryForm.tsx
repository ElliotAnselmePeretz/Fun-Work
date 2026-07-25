import { useState } from 'react'
import { Button } from '../../components/Button'
import { ColorPicker } from '../../components/ColorPicker'
import { EmojiPicker } from '../../components/EmojiPicker'
import { Modal } from '../../components/Modal'
import { TextField } from '../../components/TextField'
import { nextColor, nextEmoji } from '../../lib/palette'
import type { Category } from '../../types'
import { createCategory, deleteCategory, updateCategory } from './categoryActions'

interface CategoryFormProps {
  open: boolean
  onClose: () => void
  /** Omit to create; pass a category to edit it. */
  category?: Category
  /** Used to pick a non-repeating default color/emoji for new categories. */
  existingCount?: number
}

export function CategoryForm({
  open,
  onClose,
  category,
  existingCount = 0,
}: CategoryFormProps) {
  const editing = category !== undefined
  const [name, setName] = useState(category?.name ?? '')
  const [emoji, setEmoji] = useState(category?.emoji ?? nextEmoji(existingCount))
  const [color, setColor] = useState(category?.color ?? nextColor(existingCount))
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    if (editing) await updateCategory(category.id, { name: name.trim(), emoji, color })
    else await createCategory({ name, emoji, color })
    onClose()
  }

  const remove = async () => {
    if (!editing) return
    await deleteCategory(category.id)
    setConfirmingDelete(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit category' : 'New category'}
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Name"
          value={name}
          autoFocus
          placeholder="e.g. Physical"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submit()
          }}
        />
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <ColorPicker value={color} onChange={setColor} />

        <Button size="lg" color={color} onClick={submit} disabled={!name.trim()}>
          {editing ? 'Save' : 'Create category'}
        </Button>

        {editing &&
          (confirmingDelete ? (
            <div className="rounded-2xl border-2 border-cardinal/40 bg-cardinal/5 p-3 text-center">
              <p className="mb-3 text-sm font-bold text-ink">
                Delete “{category.name}”? Its activities and their logged history go
                too.
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
              Delete category
            </Button>
          ))}
      </div>
    </Modal>
  )
}

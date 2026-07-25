import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { nextOrder, reindex } from '../../lib/ordering'
import { nextColor, nextEmoji } from '../../lib/palette'
import type { Category, Id } from '../../types'

export interface CategoryDraft {
  name: string
  emoji?: string
  color?: string
}

export async function createCategory(draft: CategoryDraft): Promise<Id> {
  const existing = await db.categories.toArray()
  const category: Category = {
    id: newId(),
    name: draft.name.trim(),
    emoji: draft.emoji || nextEmoji(existing.length),
    color: draft.color || nextColor(existing.length),
    order: nextOrder(existing),
    createdAt: Date.now(),
  }
  await db.categories.add(category)
  return category.id
}

export async function updateCategory(
  id: Id,
  patch: Partial<Omit<Category, 'id'>>,
): Promise<void> {
  await db.categories.update(id, patch)
}

/**
 * Deleting a category deletes its activities and their logs — otherwise the
 * logs would keep counting toward XP and streaks with nothing to point at.
 */
export async function deleteCategory(id: Id): Promise<void> {
  await db.transaction('rw', [db.categories, db.activities, db.logs], async () => {
    const activities = await db.activities.where('categoryId').equals(id).toArray()
    const activityIds = activities.map((activity) => activity.id)
    await db.logs.where('activityId').anyOf(activityIds).delete()
    await db.activities.bulkDelete(activityIds)
    await db.categories.delete(id)
  })
}

/** `ordered` is the full category list in its new visual order. */
export async function reorderCategories(ordered: Category[]): Promise<void> {
  const changed = reindex(ordered)
  if (changed.length === 0) return
  await db.categories.bulkPut(changed)
}

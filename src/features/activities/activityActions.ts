import { db } from '../../lib/db'
import { newId } from '../../lib/id'
import { nextOrder, reindex } from '../../lib/ordering'
import { makeDefaultLevels, makeLevelsFromNames } from '../../lib/xp'
import type { Activity, Id, Level } from '../../types'

export interface ActivityDraft {
  categoryId: Id
  name: string
  emoji?: string
  /**
   * Optional custom milestones. Empty or omitted gives the auto-generated
   * ladder, which is the fast path for adding an activity.
   */
  levelNames?: string[]
}

export async function createActivity(draft: ActivityDraft): Promise<Id> {
  const siblings = await db.activities
    .where('categoryId')
    .equals(draft.categoryId)
    .toArray()

  const names = (draft.levelNames ?? []).map((n) => n.trim()).filter(Boolean)

  const activity: Activity = {
    id: newId(),
    categoryId: draft.categoryId,
    name: draft.name.trim(),
    emoji: draft.emoji || '⭐',
    levels: names.length > 0 ? makeLevelsFromNames(names) : makeDefaultLevels(),
    order: nextOrder(siblings),
    createdAt: Date.now(),
  }
  await db.activities.add(activity)
  return activity.id
}

export async function updateActivity(
  id: Id,
  patch: Partial<Omit<Activity, 'id'>>,
): Promise<void> {
  await db.activities.update(id, patch)
}

export async function deleteActivity(id: Id): Promise<void> {
  await db.transaction('rw', [db.activities, db.logs], async () => {
    await db.logs.where('activityId').equals(id).delete()
    await db.activities.delete(id)
  })
}

/** `ordered` is the full activity list for one category, in its new order. */
export async function reorderActivities(ordered: Activity[]): Promise<void> {
  const changed = reindex(ordered)
  if (changed.length === 0) return
  await db.activities.bulkPut(changed)
}

/** Move an activity to another category, placing it at `index` within it. */
export async function moveActivityToCategory(
  activityId: Id,
  categoryId: Id,
  siblingsInNewOrder: Activity[],
): Promise<void> {
  await db.transaction('rw', db.activities, async () => {
    await db.activities.update(activityId, { categoryId })
    const changed = reindex(
      siblingsInNewOrder.map((activity) =>
        activity.id === activityId ? { ...activity, categoryId } : activity,
      ),
    )
    if (changed.length > 0) await db.activities.bulkPut(changed)
  })
}

/** Replace the whole ladder — used by the level editor. */
export async function setLevels(id: Id, levels: Level[]): Promise<void> {
  await db.activities.update(id, { levels })
}

export function makeLevel(name: string, sessionsRequired: number): Level {
  return { id: newId(), name: name.trim(), sessionsRequired }
}

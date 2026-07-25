import { arrayMove } from '../../lib/ordering'
import type { Activity, Id } from '../../types'

/** Activities grouped by category id — the organize screen's working state. */
export type Buckets = Record<Id, Activity[]>

export function toBuckets(categoryIds: Id[], activities: Activity[]): Buckets {
  const buckets: Buckets = Object.fromEntries(categoryIds.map((id) => [id, []]))
  for (const activity of activities) {
    // An activity whose category vanished mid-session would otherwise throw.
    if (buckets[activity.categoryId]) buckets[activity.categoryId].push(activity)
  }
  return buckets
}

/** Which bucket holds `id` — an activity id, or a category id used as a drop target. */
export function containerOf(buckets: Buckets, id: Id): Id | null {
  if (buckets[id]) return id
  return (
    Object.keys(buckets).find((categoryId) =>
      buckets[categoryId].some((activity) => activity.id === id),
    ) ?? null
  )
}

/**
 * Move an activity into another category, inserting it at `overId`'s position
 * (or appending when hovering the empty area of a list). Returns the same
 * object when nothing would change, so callers can skip re-rendering.
 */
export function moveBetweenBuckets(
  buckets: Buckets,
  activeId: Id,
  overId: Id,
): Buckets {
  const from = containerOf(buckets, activeId)
  const to = containerOf(buckets, overId)
  if (!from || !to || from === to) return buckets

  const moved = buckets[from].find((activity) => activity.id === activeId)
  if (!moved) return buckets

  const overIndex = buckets[to].findIndex((activity) => activity.id === overId)
  const insertAt = overIndex >= 0 ? overIndex : buckets[to].length

  return {
    ...buckets,
    [from]: buckets[from].filter((activity) => activity.id !== activeId),
    [to]: [
      ...buckets[to].slice(0, insertAt),
      { ...moved, categoryId: to },
      ...buckets[to].slice(insertAt),
    ],
  }
}

/** Reorder within a single bucket. */
export function reorderWithinBucket(
  buckets: Buckets,
  activeId: Id,
  overId: Id,
): Buckets {
  const container = containerOf(buckets, activeId)
  if (!container) return buckets

  const list = buckets[container]
  const from = list.findIndex((activity) => activity.id === activeId)
  const to = list.findIndex((activity) => activity.id === overId)
  if (from === -1 || to === -1 || from === to) return buckets

  return { ...buckets, [container]: arrayMove(list, from, to) }
}

/**
 * Flatten the on-screen arrangement into the rows to persist. The layout is
 * authoritative, so every activity gets its bucket's category and its
 * position's order rather than a diff.
 */
export function bucketsToRows(buckets: Buckets, step: number): Activity[] {
  return Object.entries(buckets).flatMap(([categoryId, list]) =>
    list.map((activity, index) => ({
      ...activity,
      categoryId,
      order: (index + 1) * step,
    })),
  )
}

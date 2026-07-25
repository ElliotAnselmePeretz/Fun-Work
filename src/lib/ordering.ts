/**
 * Ordering uses a sparse numeric `order` field rather than array position, so
 * a single drag rewrites one row instead of renumbering the whole list.
 */
export const ORDER_STEP = 1000

export interface Ordered {
  order: number
}

export function byOrder<T extends Ordered>(a: T, b: T): number {
  return a.order - b.order
}

/** `order` for a new item appended to the end of `items`. */
export function nextOrder(items: Ordered[]): number {
  if (items.length === 0) return ORDER_STEP
  return Math.max(...items.map((item) => item.order)) + ORDER_STEP
}

/**
 * Renumber a reordered list onto a clean sparse scale. Called after a drag
 * settles; returns only the items whose order actually changed.
 */
export function reindex<T extends Ordered>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, order: (index + 1) * ORDER_STEP }))
    .filter(({ item, order }) => item.order !== order)
    .map(({ item, order }) => ({ ...item, order }))
}

/** Move the item at `from` to index `to`, returning a new array. */
export function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

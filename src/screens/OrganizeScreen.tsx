import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { ScreenHeader } from '../components/ScreenHeader'
import { SortableActivity } from '../features/import/SortableActivity'
import {
  bucketsToRows,
  moveBetweenBuckets,
  reorderWithinBucket,
  toBuckets,
  type Buckets,
} from '../features/import/organizeLogic'
import { useActivities, useCategories } from '../hooks/useData'
import { db } from '../lib/db'
import { ORDER_STEP } from '../lib/ordering'
import { withAlpha } from '../lib/palette'
import { navigate } from '../lib/router'
import type { Id } from '../types'
import { AvatarIcon } from '../components/AvatarIcon'

export function OrganizeScreen() {
  const categories = useCategories()
  const activities = useActivities()
  const [buckets, setBuckets] = useState<Buckets | null>(null)
  const [draggingId, setDraggingId] = useState<Id | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)

  // Dragging needs synchronous local state, so mirror the DB into it — but
  // never while there are unsaved moves, or the live query would yank the
  // lists back from under the drag.
  useEffect(() => {
    if (!categories || !activities || dirty) return
    setBuckets(toBuckets(categories.map((category) => category.id), activities))
  }, [categories, activities, dirty])

  const sensors = useSensors(
    // A small threshold so tapping a card doesn't read as the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    // Space lifts, arrows move, space drops — the whole screen without a mouse.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const draggingActivity = useMemo(() => {
    if (!draggingId || !buckets) return null
    return (
      Object.values(buckets)
        .flat()
        .find((activity) => activity.id === draggingId) ?? null
    )
  }, [draggingId, buckets])

  if (!categories || !activities || !buckets) return null

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <ScreenHeader back title="Organize" />
        <EmptyState
          emoji="📂"
          title="Nothing to organize"
          description="Add some categories and activities first."
        />
      </div>
    )
  }

  const colorFor = (categoryId: Id) =>
    categories.find((category) => category.id === categoryId)?.color ?? '#58cc02'

  const applyMove = (
    event: DragOverEvent | DragEndEvent,
    move: (buckets: Buckets, activeId: Id, overId: Id) => Buckets,
  ) => {
    const { active, over } = event
    if (!over) return
    // Computed outside the updater: the move helpers return the same object
    // when nothing changes, and a state updater must stay side-effect free.
    const next = move(buckets, active.id as Id, over.id as Id)
    if (next === buckets) return
    setBuckets(next)
    setDirty(true)
  }

  const save = async () => {
    await db.activities.bulkPut(bucketsToRows(buckets, ORDER_STEP))
    setDirty(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        back
        title="Organize"
        subtitle="Drag to reorder, or drop into another category"
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={(event: DragStartEvent) => setDraggingId(event.active.id as Id)}
        onDragOver={(event) => applyMove(event, moveBetweenBuckets)}
        onDragEnd={(event) => {
          setDraggingId(null)
          applyMove(event, reorderWithinBucket)
        }}
        onDragCancel={() => setDraggingId(null)}
      >
        <div className="flex flex-col gap-4">
          {categories.map((category) => {
            const list = buckets[category.id] ?? []
            return (
              <section key={category.id}>
                <header
                  className="mb-2 flex items-center gap-2 rounded-2xl px-3 py-2"
                  style={{ backgroundColor: withAlpha(category.color, 0.12) }}
                >
                  <AvatarIcon
                    name={category.name}
                    id={category.id}
                    stored={category.emoji}
                  />
                  <h2
                    className="flex-1 font-extrabold"
                    style={{ color: category.color }}
                  >
                    {category.name}
                  </h2>
                  <span className="text-xs font-bold text-ink-soft">{list.length}</span>
                </header>

                <SortableContext
                  id={category.id}
                  items={list.map((activity) => activity.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="flex min-h-14 flex-col gap-2 rounded-2xl border-2 border-dashed border-swan p-2">
                    {list.length === 0 ? (
                      <li className="py-2 text-center text-xs font-bold text-hare">
                        Drop activities here
                      </li>
                    ) : (
                      list.map((activity) => (
                        <SortableActivity
                          key={activity.id}
                          activity={activity}
                          color={category.color}
                        />
                      ))
                    )}
                  </ul>
                </SortableContext>
              </section>
            )
          })}
        </div>

        <DragOverlay>
          {draggingActivity && (
            <div
              className="flex items-center gap-2 rounded-2xl border-2 border-swan bg-white px-3 py-2.5 shadow-lg"
              style={{
                borderLeftColor: colorFor(draggingActivity.categoryId),
                borderLeftWidth: 6,
              }}
            >
              <AvatarIcon
                name={draggingActivity.name}
                id={draggingActivity.id}
                stored={draggingActivity.emoji}
              />
              <span className="text-sm font-extrabold">{draggingActivity.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <div className="sticky bottom-24">
        <Button size="lg" onClick={save} disabled={!dirty}>
          {saved ? 'Saved ✓' : dirty ? 'Save order' : 'No changes'}
        </Button>
      </div>

      <Button variant="ghost" onClick={() => navigate({ name: 'home' })}>
        Done
      </Button>
    </div>
  )
}

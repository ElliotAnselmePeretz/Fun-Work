import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Activity } from '../../types'
import { AvatarIcon } from '../../components/AvatarIcon'

interface SortableActivityProps {
  activity: Activity
  color: string
}

export function SortableActivity({ activity, color }: SortableActivityProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: activity.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="touch-none"
      {...attributes}
      {...listeners}
    >
      <div
        className="flex items-center gap-2 rounded-2xl border-2 border-swan bg-night px-3 py-2.5"
        style={{ borderLeftColor: color, borderLeftWidth: 6 }}
      >
        <AvatarIcon name={activity.name} id={activity.id} stored={activity.emoji} />
        <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
          {activity.name}
        </span>
        <span className="text-lg text-hare" aria-hidden>
          ⠿
        </span>
      </div>
    </li>
  )
}

import { Card } from '../../components/Card'
import { ProgressRing } from '../../components/ProgressRing'
import { navigate } from '../../lib/router'
import { levelFraction } from '../../lib/xp'
import type { Activity, ActivityProgress } from '../../types'
import { LogButton } from './LogButton'

interface ActivityCardProps {
  activity: Activity
  progress: ActivityProgress
  color: string
}

/** A row on the dashboard: current level, a ring, and a one-tap quick-log. */
export function ActivityCard({ activity, progress, color }: ActivityCardProps) {
  const levelName = progress.isComplete
    ? 'All levels complete'
    : (activity.levels[progress.currentLevelIndex]?.name ??
      `Level ${progress.currentLevelIndex + 1}`)

  return (
    <Card className="activity-card flex items-center gap-3 p-3">
      <button
        type="button"
        onClick={() => navigate({ name: 'activity', activityId: activity.id })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ProgressRing value={levelFraction(progress)} color={color} size={52}>
          <span className="text-xl" aria-hidden>
            {activity.emoji}
          </span>
        </ProgressRing>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-extrabold">{activity.name}</span>
          <span className="block truncate text-xs font-bold text-ink-soft">
            {progress.isComplete ? (
              <span className="text-gold">🏆 {levelName}</span>
            ) : (
              <>
                {levelName} · {progress.sessionsIntoLevel}/{progress.sessionsForLevel}
              </>
            )}
          </span>
        </span>
      </button>

      <LogButton activityId={activity.id} color={color} label="+1" size="sm" />
    </Card>
  )
}

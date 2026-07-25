import { Card } from '../../components/Card'
import { ProgressRing } from '../../components/ProgressRing'
import { avatarSrcFor } from '../../lib/avatars'
import { navigate } from '../../lib/router'
import { activityDifficulty, difficultyDefinition, levelFraction } from '../../lib/xp'
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
  const difficulty = difficultyDefinition(activityDifficulty(activity))

  return (
    <Card className="activity-card flex items-center gap-3 p-3">
      <button
        type="button"
        onClick={() => navigate({ name: 'activity', activityId: activity.id })}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <ProgressRing value={levelFraction(progress)} color={color} size={52}>
          <img
            src={avatarSrcFor(activity.name, activity.id, activity.emoji)}
            alt=""
            className="pixel-art h-7 w-7"
          />
        </ProgressRing>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-extrabold">{activity.name}</span>
          <span className="block truncate text-xs font-bold text-ink-soft">
            {progress.isComplete ? (
              <span className="text-gold-dark">{levelName}</span>
            ) : (
              <>
                {levelName} · {progress.sessionsIntoLevel}/{progress.sessionsForLevel}
              </>
            )}
          </span>
          <span className="mt-0.5 block text-[9px] font-black uppercase tracking-wider text-violet">
            {difficulty.name} quest
          </span>
        </span>
      </button>

      <LogButton activityId={activity.id} color={color} label="+1" size="sm" />
    </Card>
  )
}

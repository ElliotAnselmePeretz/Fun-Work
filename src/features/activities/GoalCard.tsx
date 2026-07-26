import type { GoalProgress, GoalTrack } from '../../lib/goals'

interface GoalCardProps {
  goals: GoalProgress
}

function GoalRow({ label, unit, track }: { label: string; unit: string; track: GoalTrack }) {
  return (
    <li className={`goal-row ${track.met ? 'goal-row-met' : ''}`}>
      <span className="goal-row-label">{label}</span>
      <span className="goal-row-bar" aria-hidden>
        <i style={{ width: `${track.fraction * 100}%` }} />
      </span>
      <span className="goal-row-value">
        <strong>{track.done}</strong>
        <small>
          /{track.target} {unit}
        </small>
      </span>
    </li>
  )
}

/** What a habit is aiming at. Targets are stored; every number here is derived. */
export function GoalCard({ goals }: GoalCardProps) {
  if (goals.empty) return null

  return (
    <section className="goal-card">
      <p className="section-kicker mb-2">Goals</p>
      <ul className="flex flex-col gap-2.5">
        {goals.streak && (
          <GoalRow label="Streak" unit="days" track={goals.streak} />
        )}
        {goals.weekly && (
          <GoalRow label="This week" unit="sessions" track={goals.weekly} />
        )}
        {goals.total && (
          <GoalRow label="Lifetime" unit="sessions" track={goals.total} />
        )}
      </ul>
    </section>
  )
}

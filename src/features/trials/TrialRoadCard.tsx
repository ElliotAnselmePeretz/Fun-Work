import { GameIcon } from '../../components/GameIcon'
import type { TrialRoad } from '../../lib/trials'

interface TrialRoadCardProps {
  road: TrialRoad
  title: string
  /** One line explaining which streak drives this road. */
  caption: string
}

/**
 * A road of streak trials — bosses you beat by showing up.
 *
 * Beaten state comes from the *longest* run, so a broken streak dims the road
 * ahead without ever taking a cleared trial away. That is the whole emotional
 * point: consistency is rewarded, but a bad week is not punished twice.
 */
export function TrialRoadCard({ road, title, caption }: TrialRoadCardProps) {
  const { next } = road

  return (
    <section className="trial-road">
      <header className="trial-road-head">
        <div className="min-w-0">
          <p className="section-kicker">{title}</p>
          <p className="trial-road-caption">{caption}</p>
        </div>
        <div className="trial-streak" aria-label={`${road.current} day streak`}>
          <GameIcon name="flame" size={15} />
          <strong>{road.current}</strong>
          <small>best {road.longest}</small>
        </div>
      </header>

      <ol className="trial-track">
        {road.trials.map((entry) => (
          <li
            key={entry.trial.id}
            className={`trial-node ${entry.beaten ? 'trial-node-beaten' : ''} ${
              entry === next ? 'trial-node-next' : ''
            }`}
            style={{ '--trial-accent': entry.trial.accent } as React.CSSProperties}
          >
            <span className="trial-node-face" aria-hidden>
              <GameIcon name={entry.trial.icon} size={19} strokeWidth={2.4} />
            </span>
            <span className="trial-node-name">{entry.trial.name}</span>
            <span className="trial-node-days">
              {entry.beaten ? 'Cleared' : `${entry.trial.days}d`}
            </span>
            {entry === next && (
              <span className="trial-node-bar" aria-hidden>
                <i style={{ width: `${entry.fraction * 100}%` }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="trial-road-next">
        {next
          ? `${next.remaining} more day${next.remaining === 1 ? '' : 's'} to face ${next.trial.name} · +${next.trial.coinReward} coins`
          : 'Every trial on this road has been cleared.'}
      </p>
    </section>
  )
}

import { PixelIcon } from '../../components/PixelIcon'
import { repeatBounty, type TrialRoad } from '../../lib/trials'

interface TrialRoadCardProps {
  road: TrialRoad
  title: string
  /** One line explaining which streak drives this road. */
  caption: string
}

/**
 * A road of streak trials — bosses you beat by showing up.
 *
 * Two things are true of every trial at once, and the card shows both. It is
 * *cleared* off your longest run ever, so a trophy is permanent. And it is
 * *held* only while your current run still reaches it, which is what gives a
 * finished road something live to care about: lapse and the standing drops,
 * rebuild and it pays a bounty to take it back.
 */
export function TrialRoadCard({ road, title, caption }: TrialRoadCardProps) {
  const { next, held, regain } = road

  const status = regain
    ? `Rebuild ${regain.remaining} day${regain.remaining === 1 ? '' : 's'} to retake ${regain.trial.name} · +${repeatBounty(regain.trial)} coins`
    : next
      ? `${next.remaining} more day${next.remaining === 1 ? '' : 's'} to face ${next.trial.name} · +${next.trial.coinReward} coins`
      : 'Every trial on this road is cleared and held.'

  return (
    <section className="trial-road">
      <header className="trial-road-head">
        <div className="min-w-0">
          <p className="section-kicker">{title}</p>
          <p className="trial-road-caption">{caption}</p>
        </div>
        <div className="trial-streak" aria-label={`${road.current} day streak`}>
          <PixelIcon name="flame" className="h-4 w-4" />
          <strong>{road.current}</strong>
          <small>best {road.longest}</small>
        </div>
      </header>

      {held ? (
        <p className="trial-held">
          <img src={held.trial.art} alt="" className="pixel-art h-6 w-6" />
          Holding <strong>{held.trial.name}</strong>
          {held.times > 1 && <span className="trial-times">×{held.times}</span>}
        </p>
      ) : (
        <p className="trial-held trial-held-none">
          <PixelIcon name="check-dim" className="h-5 w-5" />
          No standing held — a run of {road.trials[0]?.trial.days ?? 3} days takes
          the first.
        </p>
      )}

      <ol className="trial-track">
        {road.trials.map((entry) => (
          <li
            key={entry.trial.id}
            className={`trial-node ${entry.beaten ? 'trial-node-beaten' : ''} ${
              entry.held ? 'trial-node-held' : ''
            } ${entry === next || entry === regain ? 'trial-node-next' : ''}`}
            style={{ '--trial-accent': entry.trial.accent } as React.CSSProperties}
          >
            <span className="trial-node-face" aria-hidden>
              <img
                src={entry.trial.art}
                alt=""
                className="pixel-art h-full w-full object-contain"
                draggable={false}
              />
              {entry.times > 1 && (
                <span className="trial-node-times">×{entry.times}</span>
              )}
            </span>
            <span className="trial-node-name">{entry.trial.name}</span>
            <span className="trial-node-days">
              {entry.held ? 'Held' : entry.beaten ? 'Cleared' : `${entry.trial.days}d`}
            </span>
            {(entry === next || entry === regain) && (
              <span className="trial-node-bar" aria-hidden>
                <i style={{ width: `${entry.fraction * 100}%` }} />
              </span>
            )}
          </li>
        ))}
      </ol>

      <p className="trial-road-next">{status}</p>
    </section>
  )
}

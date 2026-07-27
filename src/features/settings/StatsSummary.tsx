import { PixelIcon, type PixelIconName } from '../../components/PixelIcon'
import { computeBossProgress } from '../../lib/bosses'
import type { CoinSummary } from '../../lib/coins'
import { isHabit, isWork } from '../../lib/goals'
import { navigate } from '../../lib/router'
import { worldTrialRoad } from '../../lib/trials'
import type { Activity, LogEntry, StreakInfo } from '../../types'

interface StatsSummaryProps {
  activities: Activity[]
  ledger: LogEntry[]
  coins: CoinSummary
  streak: StreakInfo
  badgeCount: number
}

function Tile({
  icon,
  value,
  label,
}: {
  icon: PixelIconName
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="stat-tile">
      <PixelIcon name={icon} className="h-6 w-6" />
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

/**
 * The at-a-glance numbers, surfaced in Settings so the things you'd want before
 * exporting or resetting — how much history there is, and what it is worth —
 * are on the same screen as those buttons.
 */
export function StatsSummary({
  activities,
  ledger,
  coins,
  streak,
  badgeCount,
}: StatsSummaryProps) {
  const bosses = computeBossProgress(ledger)
  const defeated = bosses.filter((progress) => progress.defeated).length
  const trials = worldTrialRoad(ledger, activities)

  return (
    <section className="stat-grid">
      <Tile icon="flame" value={streak.current} label="Day streak" />
      <Tile icon="chart" value={streak.longest} label="Best streak" />
      {/* The tile already shows a coin, so the figure stays bare here. */}
      <Tile icon="coin" value={coins.balance.toLocaleString()} label="Coins" />
      <Tile icon="check" value={activities.filter(isHabit).length} label="Habits" />
      <Tile icon="book" value={activities.filter(isWork).length} label="Work" />
      <Tile
        icon="swords"
        value={`${defeated}/${bosses.length}`}
        label="Bosses beaten"
      />
      <Tile
        icon="crystal"
        value={`${trials.beatenCount}/${trials.trials.length}`}
        label="Trials cleared"
      />
      <Tile icon="chest" value={badgeCount} label="Badges" />

      <button
        type="button"
        onClick={() => navigate({ name: 'stats' })}
        className="stat-tile stat-tile-link"
      >
        <PixelIcon name="map" className="h-6 w-6" />
        <strong>Full stats</strong>
        <span>Per category and week</span>
      </button>
    </section>
  )
}

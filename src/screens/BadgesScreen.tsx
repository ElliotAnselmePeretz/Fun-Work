import { Card } from '../components/Card'
import { EmptyState } from '../components/EmptyState'
import { ScreenHeader } from '../components/ScreenHeader'
import { BadgeCard } from '../features/badges/BadgeCard'
import { useBadges } from '../hooks/useData'
import { badgeId, COIN_THRESHOLDS, STREAK_THRESHOLDS } from '../lib/badges'

/**
 * Locked placeholders for the badges whose targets are knowable up front.
 * Level-up and mastery badges depend on the user's own activities, so they
 * only appear once earned.
 */
const LOCKED_PLACEHOLDERS = [
  {
    id: badgeId.firstLog(),
    title: 'First Step',
    description: 'Log your very first session.',
    emoji: '👟',
  },
  ...STREAK_THRESHOLDS.map((days) => ({
    id: badgeId.streak(days),
    title: `${days}-Day Streak`,
    description: `Keep the flame alive ${days} days running.`,
    emoji: days >= 30 ? '🔥' : '✨',
  })),
  ...COIN_THRESHOLDS.map((coins) => ({
    id: badgeId.coinTotal(coins),
    title: `${coins.toLocaleString()} Coins`,
    description: `Earn ${coins.toLocaleString()} total coins.`,
    emoji: '🪙',
  })),
]

export function BadgesScreen() {
  const badges = useBadges()
  if (!badges) return null

  const earnedIds = new Set(badges.map((badge) => badge.id))
  const locked = LOCKED_PLACEHOLDERS.filter((badge) => !earnedIds.has(badge.id))

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader
        title="Achievements"
        subtitle={`${badges.length} earned`}
      />

      {badges.length === 0 ? (
        <EmptyState
          emoji="🏅"
          title="No badges yet"
          description="Log your first session and the shelf starts filling up."
        />
      ) : (
        <section>
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            Earned
          </h2>
          <Card className="grid grid-cols-3 gap-2 p-3">
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </Card>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            Up next
          </h2>
          <Card className="grid grid-cols-3 gap-2 p-3">
            {locked.map((badge) => (
              <BadgeCard key={badge.id} placeholder={badge} />
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

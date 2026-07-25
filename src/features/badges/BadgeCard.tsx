import type { Badge } from '../../types'
import { relativeDayLabel } from '../../lib/date'
import { dayKey } from '../../lib/date'

interface BadgeCardProps {
  badge?: Badge
  /** Shown greyed out with a lock when the badge isn't earned yet. */
  placeholder?: { title: string; description: string; emoji: string }
}

export function BadgeCard({ badge, placeholder }: BadgeCardProps) {
  const earned = badge !== undefined
  const title = badge?.title ?? placeholder?.title ?? ''
  const description = badge?.description ?? placeholder?.description ?? ''
  const emoji = badge?.emoji ?? placeholder?.emoji ?? '🔒'

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center ${
        earned ? 'border-gold/50 bg-gold/10' : 'border-swan bg-night/80'
      }`}
    >
      <span className={`text-3xl ${earned ? '' : 'opacity-30 grayscale'}`} aria-hidden>
        {emoji}
      </span>
      <span
        className={`line-clamp-2 text-xs font-extrabold leading-tight ${
          earned ? 'text-ink' : 'text-hare'
        }`}
      >
        {title}
      </span>
      <span className="line-clamp-2 text-[10px] leading-tight text-ink-soft">
        {description}
      </span>
      {badge && (
        <span className="text-[10px] font-bold text-hare">
          {relativeDayLabel(dayKey(badge.earnedAt))}
        </span>
      )}
    </div>
  )
}

import { PixelIcon } from './PixelIcon'

interface CoinAmountProps {
  value: number
  /** Prefixes a `+` — for a reward you are about to earn. */
  gain?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: { text: 'text-[11px]', icon: 'h-3.5 w-3.5' },
  md: { text: 'text-sm', icon: 'h-4 w-4' },
  lg: { text: 'text-lg', icon: 'h-6 w-6' },
}

/**
 * A coin figure, always shown with the coin sprite so an amount is never a
 * bare number the user has to guess the units of.
 */
export function CoinAmount({
  value,
  gain,
  size = 'md',
  className = '',
}: CoinAmountProps) {
  const { text, icon } = SIZES[size]
  return (
    <span className={`coin-amount ${text} ${className}`}>
      <PixelIcon name="coin" className={icon} />
      <span>
        {gain ? '+' : ''}
        {value.toLocaleString()}
      </span>
    </span>
  )
}

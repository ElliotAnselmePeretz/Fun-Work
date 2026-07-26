import { PixelIcon } from './PixelIcon'

interface CoinPopupProps {
  /** Bump this to retrigger the animation; null renders nothing. */
  token: number | null
  amount: number
}

/** A floating coin reward, keyed so every tap restarts the animation. */
export function CoinPopup({ token, amount }: CoinPopupProps) {
  if (token === null) return null
  return (
    <span
      key={token}
      aria-hidden
      className="animate-float-up pointer-events-none absolute left-1/2 top-0 z-20 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-lg font-black text-gold drop-shadow"
    >
      <PixelIcon name="coin" className="h-5 w-5" />
      +{amount}
    </span>
  )
}

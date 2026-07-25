interface XpPopupProps {
  /** Bump this to retrigger the animation; null renders nothing. */
  token: number | null
  amount: number
}

/**
 * The "+10 XP" that floats up off a tapped button. Keyed on `token` so React
 * remounts it on every tap, which restarts the CSS animation — retriggering
 * an animation on the same element otherwise requires a reflow hack.
 */
export function XpPopup({ token, amount }: XpPopupProps) {
  if (token === null) return null
  return (
    <span
      key={token}
      aria-hidden
      className="animate-float-up pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 text-lg font-extrabold text-gold drop-shadow"
    >
      +{amount} XP
    </span>
  )
}

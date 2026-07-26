/**
 * The app's icon set: real pixel-art sprites rather than font symbols.
 *
 * Most come straight from the same CC0 tileset as the gear and bosses, so a
 * coin in the header is the same object as a coin in the world. The tick and
 * plus are drawn to match, because no tile in the pack reads as either.
 */
export const PIXEL_ICONS = [
  'check',
  'check-dim',
  'coin',
  'chest',
  'crystal',
  'flame',
  'heart',
  'key',
  'lamp',
  'map',
  'mirror',
  'plus',
  'scroll',
] as const

export type PixelIconName = (typeof PIXEL_ICONS)[number]

interface PixelIconProps {
  name: PixelIconName
  className?: string
  /** Set when the icon carries meaning no nearby text already gives. */
  label?: string
}

export function PixelIcon({ name, className = 'h-5 w-5', label }: PixelIconProps) {
  return (
    <img
      src={`/assets/ui/${name}.png`}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      className={`pixel-art shrink-0 ${className}`}
      draggable={false}
    />
  )
}

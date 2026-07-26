import type { ReactNode } from 'react'
import { PixelIcon, type PixelIconName } from './PixelIcon'

interface EmptyStateProps {
  /** A sprite from the pixel icon set — never a font symbol. */
  icon: PixelIconName
  title: string
  description: string
  children?: ReactNode
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-swan bg-night/80 px-6 py-10 text-center">
      <PixelIcon name={icon} className="h-14 w-14 opacity-90" />
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="max-w-xs text-sm text-ink-soft">{description}</p>
      {children}
    </div>
  )
}

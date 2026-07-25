import type { ReactNode } from 'react'
import { goBack } from '../lib/router'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  /** Shows a back chevron for pushed screens. */
  back?: boolean
  action?: ReactNode
}

export function ScreenHeader({ title, subtitle, back, action }: ScreenHeaderProps) {
  return (
    <header className="mb-4 flex items-center gap-2">
      {back && (
        <button
          onClick={goBack}
          aria-label="Back"
          className="-ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-ink-soft hover:bg-swan/60"
        >
          ‹
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-extrabold">{title}</h1>
        {subtitle && (
          <p className="truncate text-sm font-bold text-ink-soft">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  )
}

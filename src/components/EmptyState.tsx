import type { ReactNode } from 'react'

interface EmptyStateProps {
  emoji: string
  title: string
  description: string
  children?: ReactNode
}

export function EmptyState({ emoji, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-swan bg-white/60 px-6 py-10 text-center">
      <span className="text-5xl" aria-hidden>
        {emoji}
      </span>
      <h2 className="text-lg font-extrabold">{title}</h2>
      <p className="max-w-xs text-sm text-ink-soft">{description}</p>
      {children}
    </div>
  )
}

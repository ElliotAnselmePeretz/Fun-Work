import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

/** The standard purple quest surface with a soft elevated edge. */
export function Card({ children, className = '', style, onClick }: CardProps) {
  const interactive = onClick !== undefined
  return (
    <div
      className={`game-card rounded-3xl border-2 border-swan/90 bg-night/90 ${
        interactive ? 'cursor-pointer active:translate-y-[2px] transition-transform' : ''
      } ${className}`}
      style={style}
      onClick={onClick}
      {...(interactive
        ? {
            role: 'button',
            tabIndex: 0,
            onKeyDown: (event: React.KeyboardEvent) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            },
          }
        : {})}
    >
      {children}
    </div>
  )
}

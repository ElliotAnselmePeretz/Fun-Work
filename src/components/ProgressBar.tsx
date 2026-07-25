interface ProgressBarProps {
  /** 0..1 */
  value: number
  color?: string
  className?: string
  label?: string
}

export function ProgressBar({
  value,
  color = '#58cc02',
  className = '',
  label,
}: ProgressBarProps) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div
      className={`h-4 w-full overflow-hidden rounded-full bg-swan ${className}`}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color }}
      >
        {/* Glossy highlight — the small detail that makes the bar feel candy-like. */}
        <div className="mt-[3px] ml-[6px] h-[4px] rounded-full bg-white/35" />
      </div>
    </div>
  )
}

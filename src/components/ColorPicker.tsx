import { CATEGORY_COLORS } from '../lib/palette'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div>
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
        Color
      </span>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            aria-label={`Color ${color}`}
            aria-pressed={color === value}
            className={`h-11 w-11 rounded-xl border-4 transition-transform ${
              color === value ? 'scale-110 border-ink' : 'border-transparent'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  )
}

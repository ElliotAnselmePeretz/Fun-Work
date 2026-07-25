import { CATEGORY_EMOJI } from '../lib/palette'

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  /** Extra choices merged ahead of the defaults, e.g. the current value. */
  extra?: string[]
}

export function EmojiPicker({ value, onChange, extra = [] }: EmojiPickerProps) {
  const options = [...new Set([...extra, value, ...CATEGORY_EMOJI])].filter(Boolean)

  return (
    <div>
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
        Icon
      </span>
      <div className="flex flex-wrap gap-2">
        {options.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            aria-label={`Icon ${emoji}`}
            aria-pressed={emoji === value}
            className={`grid h-11 w-11 place-items-center rounded-xl border-2 text-xl transition-colors ${
              emoji === value
                ? 'border-sky bg-sky/10'
                : 'border-swan bg-white hover:bg-polar'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

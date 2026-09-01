import { useMemo, useState } from 'react'
import { AVATARS, avatarFor, avatarSrc, avatarToken } from '../lib/avatars'

interface IconPickerProps {
  /** The stored icon value, which may still be a legacy emoji character. */
  value: string
  onChange: (value: string) => void
  /** Used to show which icon the name would pick on its own. */
  name: string
  id?: string
}

/**
 * Picks one of the game's own sprites for an activity or category.
 *
 * The icons here are the same art the cards actually draw, so what you choose
 * is what you get. Until something is chosen the app derives an icon from the
 * name, and that guess is shown as the selected tile so the row never looks
 * unset — picking simply pins it.
 *
 * The set is large enough that a plain wrap became a wall, so it scrolls inside
 * a fixed height with a search box. The currently selected icon is always
 * pulled to the front, so it stays visible no matter what is typed.
 */
export function IconPicker({ value, onChange, name, id = '' }: IconPickerProps) {
  const [query, setQuery] = useState('')
  const selected = avatarFor(name, id, value)

  const shown = useMemo(() => {
    const term = query.trim().toLowerCase()
    const matches = term
      ? AVATARS.filter((avatar) => avatar.includes(term))
      : [...AVATARS]
    // Keep the selection reachable even when it does not match the search.
    return matches.includes(selected)
      ? [selected, ...matches.filter((avatar) => avatar !== selected)]
      : [selected, ...matches]
  }, [query, selected])

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Icon
        </span>
        <span className="text-[10px] font-bold text-hare">
          {AVATARS.length} to choose from
        </span>
      </div>

      <input
        type="search"
        value={query}
        placeholder="Search icons…"
        aria-label="Search icons"
        onChange={(event) => setQuery(event.target.value)}
        className="icon-picker-search"
      />

      <div className="icon-picker-grid">
        {shown.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => onChange(avatarToken(avatar))}
            aria-label={avatar}
            title={avatar}
            aria-pressed={avatar === selected}
            className={`icon-picker-option ${
              avatar === selected ? 'icon-picker-option-active' : ''
            }`}
          >
            <img
              src={avatarSrc(avatar)}
              alt=""
              className="pixel-art h-7 w-7"
              draggable={false}
            />
          </button>
        ))}

        {shown.length === 1 && query.trim() && (
          <p className="icon-picker-empty">
            Nothing matches “{query.trim()}”. Clear the search to see them all.
          </p>
        )}
      </div>
    </div>
  )
}

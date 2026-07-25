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
 */
export function IconPicker({ value, onChange, name, id = '' }: IconPickerProps) {
  const selected = avatarFor(name, id, value)

  return (
    <div>
      <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
        Icon
      </span>
      <div className="flex flex-wrap gap-2">
        {AVATARS.map((avatar) => (
          <button
            key={avatar}
            type="button"
            onClick={() => onChange(avatarToken(avatar))}
            aria-label={avatar}
            aria-pressed={avatar === selected}
            className={`grid h-11 w-11 place-items-center rounded-xl border-2 transition-colors ${
              avatar === selected
                ? 'border-sky bg-sky/10'
                : 'border-swan bg-[#17142d] hover:bg-polar'
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
      </div>
    </div>
  )
}

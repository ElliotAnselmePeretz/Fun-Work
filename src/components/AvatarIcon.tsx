import { avatarSrcFor } from '../lib/avatars'

interface AvatarIconProps {
  name: string
  id?: string
  /**
   * The row's stored icon. A pinned `avatar:` token wins; anything else —
   * including a legacy emoji character — falls through to the name.
   */
  stored?: string
  className?: string
}

/** One activity's or category's sprite, wherever a small icon is needed. */
export function AvatarIcon({
  name,
  id = '',
  stored,
  className = 'h-5 w-5',
}: AvatarIconProps) {
  return (
    <img
      src={avatarSrcFor(name, id, stored)}
      alt=""
      className={`pixel-art shrink-0 ${className}`}
      draggable={false}
    />
  )
}

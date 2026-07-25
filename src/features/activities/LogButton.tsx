import type { MouseEvent } from 'react'
import { Button } from '../../components/Button'
import { XpPopup } from '../../components/XpPopup'
import { XP_PER_SESSION } from '../../lib/xp'
import { useLogSession } from './useLogSession'

interface LogButtonProps {
  activityId: string
  color: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

/** One tap = one session. The main verb of the whole app. */
export function LogButton({
  activityId,
  color,
  label = '+1 Session',
  size = 'md',
  className = '',
}: LogButtonProps) {
  const { log, popupToken, pending } = useLogSession()

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    void log(activityId, { clientX: event.clientX, clientY: event.clientY }, color)
  }

  return (
    <span
      className={`relative inline-block ${size === 'lg' ? 'w-full' : ''} ${className}`}
    >
      <XpPopup token={popupToken} amount={XP_PER_SESSION} />
      <Button color={color} size={size} onClick={onClick} disabled={pending}>
        {label}
      </Button>
    </span>
  )
}

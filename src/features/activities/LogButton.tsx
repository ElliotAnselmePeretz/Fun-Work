import type { MouseEvent } from 'react'
import { Button } from '../../components/Button'
import { CoinPopup } from '../../components/CoinPopup'
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
  const { log, popupToken, popupCoins, pending } = useLogSession()

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    void log(activityId, { clientX: event.clientX, clientY: event.clientY }, color)
  }

  return (
    <span
      className={`relative inline-block ${size === 'lg' ? 'w-full' : ''} ${className}`}
    >
      <CoinPopup token={popupToken} amount={popupCoins} />
      <Button color={color} size={size} onClick={onClick} disabled={pending}>
        {label}
      </Button>
    </span>
  )
}

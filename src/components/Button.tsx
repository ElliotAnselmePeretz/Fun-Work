import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { shade } from '../lib/palette'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANT_COLOR: Record<Exclude<Variant, 'ghost'>, string> = {
  primary: '#58cc02',
  secondary: '#1cb0f6',
  danger: '#ff4b4b',
}

const SIZE_CLASS: Record<Size, string> = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-6 py-4 text-base w-full',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  /** Overrides the variant color — used to tint a button to its category. */
  color?: string
  children: ReactNode
}

/**
 * The chunky pressable button. The solid bottom edge collapses on press,
 * which is what makes taps feel physical rather than flat.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  color,
  className = '',
  style,
  children,
  ...rest
}: ButtonProps) {
  if (variant === 'ghost') {
    return (
      <button
        className={`btn-3d text-ink-soft hover:bg-swan/60 ${SIZE_CLASS[size]} ${className}`}
        style={style}
        {...rest}
      >
        {children}
      </button>
    )
  }

  const base = color ?? VARIANT_COLOR[variant]

  return (
    <button
      className={`btn-3d text-white ${SIZE_CLASS[size]} ${className}`}
      style={
        {
          backgroundColor: base,
          '--btn-edge': shade(base, 0.78),
          ...style,
        } as CSSProperties
      }
      {...rest}
    >
      {children}
    </button>
  )
}

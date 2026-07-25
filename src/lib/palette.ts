/** Category accent colors. Bright and clearly distinguishable from each other. */
export const CATEGORY_COLORS = [
  '#58cc02', // grass
  '#1cb0f6', // sky
  '#ff9600', // flame
  '#ce82ff', // beetle
  '#ff4b4b', // cardinal
  '#ffc800', // gold
  '#2ec4b6', // teal
  '#f77fbe', // pink
] as const

export const CATEGORY_EMOJI = [
  '💪', '📚', '🎹', '🏃', '🧠', '🎨', '🌱', '⚽',
  '🧘', '💻', '🔬', '✍️', '🎯', '🍳', '🎸', '🗣️',
]

/** Deterministic pick so a new category never repeats the previous one. */
export function nextColor(usedCount: number): string {
  return CATEGORY_COLORS[usedCount % CATEGORY_COLORS.length]
}

export function nextEmoji(usedCount: number): string {
  return CATEGORY_EMOJI[usedCount % CATEGORY_EMOJI.length]
}

/**
 * Category colors are user-chosen, so text on top of them has to adapt.
 * Uses perceived luminance rather than a naive average.
 */
export function readableTextOn(hex: string): '#ffffff' | '#3c3c3c' {
  const { r, g, b } = hexToRgb(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#3c3c3c' : '#ffffff'
}

/** `alpha` in 0..1 — for tinted card backgrounds. */
export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Darker variant used for the 3D button edge. */
export function shade(hex: string, amount = 0.8): string {
  const { r, g, b } = hexToRgb(hex)
  const f = (c: number) => Math.round(Math.max(0, Math.min(255, c * amount)))
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let value = hex.replace('#', '')
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const int = parseInt(value, 16)
  if (Number.isNaN(int)) return { r: 88, g: 204, b: 2 }
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 }
}

import {
  Axe,
  BarChart3,
  Castle,
  Check,
  Coins,
  Crown,
  Flame,
  Hammer,
  Home,
  LockKeyhole,
  Settings,
  Shield,
  Sparkles,
  Store,
  Sword,
  Swords,
  Target,
  Trophy,
  Zap,
  type LucideProps,
} from 'lucide-react'

export type GameIconName =
  | 'axe'
  | 'chart'
  | 'castle'
  | 'check'
  | 'coins'
  | 'crown'
  | 'flame'
  | 'hammer'
  | 'home'
  | 'lock'
  | 'settings'
  | 'shield'
  | 'sparkles'
  | 'store'
  | 'sword'
  | 'swords'
  | 'target'
  | 'trophy'
  | 'zap'

const ICONS = {
  axe: Axe,
  chart: BarChart3,
  castle: Castle,
  check: Check,
  coins: Coins,
  crown: Crown,
  flame: Flame,
  hammer: Hammer,
  home: Home,
  lock: LockKeyhole,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  store: Store,
  sword: Sword,
  swords: Swords,
  target: Target,
  trophy: Trophy,
  zap: Zap,
} satisfies Record<GameIconName, React.ComponentType<LucideProps>>

interface GameIconProps extends LucideProps {
  name: GameIconName
}

export function GameIcon({ name, ...props }: GameIconProps) {
  const Icon = ICONS[name]
  return <Icon aria-hidden="true" {...props} />
}

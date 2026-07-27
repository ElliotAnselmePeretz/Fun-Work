import { PixelIcon, type PixelIconName } from './PixelIcon'
import { hrefFor, type Route } from '../lib/router'

const TABS: {
  route: Route
  label: string
  image: PixelIconName
  color: string
}[] = [
  { route: { name: 'home' }, label: 'Habits', image: 'check', color: 'text-grass-dark' },
  { route: { name: 'work' }, label: 'Work', image: 'book', color: 'text-flame-dark' },
  { route: { name: 'arena' }, label: 'Arena', image: 'swords', color: 'text-cardinal' },
  { route: { name: 'shop' }, label: 'Armory', image: 'shop', color: 'text-gold-dark' },
  { route: { name: 'stats' }, label: 'Stats', image: 'chart', color: 'text-sky-dark' },
  { route: { name: 'settings' }, label: 'Settings', image: 'cog', color: 'text-beetle-dark' },
]

interface TabBarProps {
  current: Route
}

/** Fixed bottom nav — thumb-reachable, and stays clear of the home indicator. */
export function TabBar({ current }: TabBarProps) {
  return (
    <nav className="game-tab-bar safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-violet/30 bg-night/95 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-md">
        {TABS.map((tab) => {
          const active = tab.route.name === current.name
          return (
            <li key={tab.label} className="flex-1">
              <a
                href={hrefFor(tab.route)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-black uppercase tracking-wide transition-all ${
                  active ? tab.color : 'text-hare'
                }`}
              >
                <span className={`tab-art-frame ${active ? 'tab-art-frame-active' : ''}`} aria-hidden>
                  <PixelIcon
                    name={tab.image}
                    className={`tab-art ${active ? 'tab-art-active' : ''}`}
                  />
                </span>
                {tab.label}
                {active && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-current" aria-hidden />
                )}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

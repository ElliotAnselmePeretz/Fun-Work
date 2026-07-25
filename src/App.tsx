import { TabBar } from './components/TabBar'
import { CelebrationModal } from './features/badges/CelebrationModal'
import { useRoute } from './hooks/useRoute'
import { ActivityScreen } from './screens/ActivityScreen'
import { BadgesScreen } from './screens/BadgesScreen'
import { BulkAddScreen } from './screens/BulkAddScreen'
import { HomeScreen } from './screens/HomeScreen'
import { ImageImportScreen } from './screens/ImageImportScreen'
import { OrganizeScreen } from './screens/OrganizeScreen'
import { SettingsScreen } from './screens/SettingsScreen'
import { StatsScreen } from './screens/StatsScreen'

function CurrentScreen() {
  const route = useRoute()

  switch (route.name) {
    case 'activity':
      // Keyed so switching activities remounts rather than reusing scroll and
      // level-path state from the previous one.
      return <ActivityScreen key={route.activityId} activityId={route.activityId} />
    case 'badges':
      return <BadgesScreen />
    case 'bulk-add':
      return <BulkAddScreen />
    case 'image-add':
      return <ImageImportScreen />
    case 'organize':
      return <OrganizeScreen />
    case 'stats':
      return <StatsScreen />
    case 'settings':
      return <SettingsScreen />
    default:
      return <HomeScreen />
  }
}

export default function App() {
  const route = useRoute()

  return (
    <div className="mx-auto min-h-full max-w-md">
      {/* Bottom padding clears the fixed tab bar. */}
      <main className="safe-top px-4 pb-28 pt-4">
        <CurrentScreen />
      </main>
      <TabBar current={route} />
      <CelebrationModal />
    </div>
  )
}

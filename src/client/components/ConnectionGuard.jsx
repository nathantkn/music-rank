import { useSyncExternalStore } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeToConnection, isConnectionDown, markConnectionRestored } from '../lib/connection'
import ConnectionError from '../views/ConnectionError'

// Sits above the router rather than inside any one view. A sleeping database
// fails every request at once, so the reasonable response is to take over the
// whole page — handling it view by view would mean the same block of error
// handling in eight places and would still leave whichever view forgot it
// showing an empty screen forever.
export default function ConnectionGuard({ children }) {
  const queryClient = useQueryClient()
  const isDown = useSyncExternalStore(subscribeToConnection, isConnectionDown, () => false)

  if (!isDown) return children

  // Everything below this point is unmounted while the error screen is up, so
  // recovery is mostly just remounting: the views that load in an effect run
  // their effects again. Clearing the cache is what covers the react-query
  // ones, which would otherwise remount straight onto their stored error.
  const retry = () => {
    queryClient.clear()
    markConnectionRestored()
  }

  return <ConnectionError onRetry={retry} />
}

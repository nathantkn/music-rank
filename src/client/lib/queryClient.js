import { QueryClient } from '@tanstack/react-query'

// Nothing here goes stale on a clock — it goes stale when someone writes. The
// minute of staleTime only exists to stop ordinary back-and-forth navigation
// from refetching; every mutation calls invalidateAll() to close the gap.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      // A hobby app with a handful of writers doesn't need a refetch every
      // time the tab regains focus; the write hooks already cover freshness.
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

// Blunt on purpose. With this few endpoints a global sweep after a write is far
// harder to get subtly wrong than per-key invalidation, and it costs one extra
// query on a page nobody is looking at yet. Narrow it only if that ever shows up
// in a profile.
//
// refetchType: 'all' is the part that matters. The default is 'active', which
// only refetches queries something is currently rendering — the home hero's
// queries are inactive while you're on a cycle detail page, so promoting a
// cycle would mark them stale but leave the old data sitting there. Navigating
// home would then paint the previous active cycle and correct itself a beat
// later. Refreshing inactive entries too means home is already right when you
// get there.
export function invalidateAll() {
  queryClient.invalidateQueries({ refetchType: 'all' })
}

// Query definitions live here so two views asking for the same endpoint share a
// cache entry rather than each fetching their own copy — /api/stats is read by
// both the home hero and the cycles archive.

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} failed: HTTP ${res.status}`)
  return res.json()
}

export const cyclesQuery = () => ({
  queryKey: ['cycles'],
  queryFn: () => getJson('/api/cycles'),
})

export const statsQuery = () => ({
  queryKey: ['stats'],
  queryFn: async () => {
    const res = await fetch('/api/stats')
    // Nothing computed yet is an empty archive, not a failure.
    if (res.status === 404) return []
    if (!res.ok) throw new Error(`/api/stats failed: HTTP ${res.status}`)
    return res.json()
  },
})

export const bigThreeSweepQuery = () => ({
  queryKey: ['achievements', 'big-three-sweep'],
  queryFn: () => getJson('/api/achievements/big-three-sweep'),
})

// Both of the per-cycle queries stay parked until a cycle id is known, so the
// caller can declare them unconditionally and let the hook handle the gate.
export const nominationsQuery = (cycleId) => ({
  queryKey: ['nominations', cycleId],
  queryFn: () => getJson(`/api/cycles/${cycleId}/nominations`),
  enabled: cycleId != null,
})

export const highlightsQuery = (cycleId) => ({
  queryKey: ['highlights', cycleId],
  queryFn: () => getJson(`/api/cycles/${cycleId}/highlights`),
  enabled: cycleId != null,
})

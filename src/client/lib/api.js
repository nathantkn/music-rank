// Query definitions live here so two views asking for the same endpoint share a
// cache entry rather than each fetching their own copy — /api/stats is read by
// both the home hero and the cycles archive.

import { DATABASE_UNAVAILABLE } from '../../shared/apiErrors.js'
import { markConnectionDown } from './connection.js'

// Every failure that leaves this module is one of these, so a caller can ask
// what kind of failure it was instead of pattern-matching a message string.
export class ApiError extends Error {
  constructor(message, { status = 0, code = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Turns a non-ok response into an ApiError, reading the server's { error, code }
// body when there is one. A paused Supabase project answers every endpoint the
// same way, so this is the one place that has to recognise it.
async function toApiError(url, res) {
  let body = null
  try {
    body = await res.json()
  } catch {
    // An error page from a proxy, or an empty body. Status is enough.
  }
  return new ApiError(body?.error ?? `${url} failed: HTTP ${res.status}`, {
    status: res.status,
    code: body?.code ?? null,
  })
}

// Drop-in for fetch that notices an unreachable database on the way past. It
// still hands back the raw Response, so the views that do their own res.ok /
// status checks keep working as written — they just don't each need to know
// what a sleeping database looks like.
export async function apiFetch(url, options) {
  let res
  try {
    res = await fetch(url, options)
  } catch (err) {
    // fetch only rejects when the request never got an answer — offline, DNS,
    // or the server itself being down. From the user's side that's the same
    // "can't reach the data" situation as a sleeping database, so it gets the
    // same treatment.
    markConnectionDown()
    throw new ApiError(err.message || 'Network request failed', {
      status: 0,
      code: DATABASE_UNAVAILABLE,
    })
  }

  if (res.status === 503) {
    // Clone: the caller still owns the body, and reading it here would leave
    // them with a consumed stream.
    const body = await res.clone().json().catch(() => null)
    if (body?.code === DATABASE_UNAVAILABLE) markConnectionDown()
  }

  return res
}

// `notFound` names the value a 404 should resolve to for endpoints where "there
// isn't one" is an answer rather than a failure; leave it off and a 404 throws.
async function getJson(url, { notFound } = {}) {
  const res = await apiFetch(url)
  if (res.status === 404 && notFound !== undefined) return notFound
  if (!res.ok) throw await toApiError(url, res)
  return res.json()
}

// True when a failure means "the data is unreachable right now" rather than
// "this particular request was wrong".
export function isConnectionError(error) {
  return error?.code === DATABASE_UNAVAILABLE
}

// A bare reachability check with no caching, used by the error screen's retry.
// Deliberately not routed through apiFetch — a failed probe shouldn't re-arm
// the state the probe exists to clear.
export async function checkHealth() {
  try {
    const res = await fetch('/api/health', { cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}

export const cyclesQuery = () => ({
  queryKey: ['cycles'],
  queryFn: () => getJson('/api/cycles'),
})

export const statsQuery = () => ({
  queryKey: ['stats'],
  // Nothing computed yet is an empty archive, not a failure.
  queryFn: () => getJson('/api/stats', { notFound: [] }),
})

export const artistsQuery = () => ({
  queryKey: ['artists'],
  queryFn: () => getJson('/api/artists'),
})

// Parked until the route param has been read, same as the per-cycle queries.
//
// An id that isn't an artist comes back as null rather than an error, the same
// way /api/stats treats its 404 as an empty archive. It's a definitive answer,
// not a failure — routing it through the error path would put the "no such
// artist" screen behind a retry that a paused or slow network can hold up.
export const artistQuery = (artistId) => ({
  queryKey: ['artist', artistId],
  queryFn: () => getJson(`/api/artists/${artistId}`, { notFound: null }),
  enabled: artistId != null,
})

export const bigThreeSweepQuery = () => ({
  queryKey: ['achievements', 'big-three-sweep'],
  queryFn: () => getJson('/api/achievements/big-three-sweep'),
})

// One entry per board, keyed by metric. The Records page mounts nine of these
// at once, so they cache and expire independently — and the collapsed preview
// and the expanded table read the same entry rather than fetching twice.
export const leaderboardQuery = (metric) => ({
  queryKey: ['leaderboards', metric],
  queryFn: () => getJson(`/api/leaderboards/${metric}`),
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

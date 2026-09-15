// A one-bit store: can the app reach its data or not.
//
// Every request in the app goes through apiFetch, and any of them can be the
// one that discovers the database is asleep — the home hero's stats call, a
// cycle detail's nomination list, a rank being saved. Rather than have each
// caller decide what to do about it, they all flip this bit and ConnectionGuard
// (the only subscriber) swaps the page for the error screen.

const listeners = new Set()
let down = false

export function subscribeToConnection(onChange) {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

// Must stay a plain boolean: useSyncExternalStore compares snapshots by
// identity and would loop forever on a fresh object.
export function isConnectionDown() {
  return down
}

function set(next) {
  if (down === next) return
  down = next
  listeners.forEach(listener => listener())
}

export function markConnectionDown() {
  set(true)
}

// Called by the error screen once a health check has come back clean.
export function markConnectionRestored() {
  set(false)
}

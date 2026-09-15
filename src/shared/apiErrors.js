// Shared between the Express handlers and the React client so the two can't
// drift on the spelling of an error the UI branches on.

// The database is up as far as the process is concerned but unreachable —
// almost always Supabase having paused the project after a week idle.
export const DATABASE_UNAVAILABLE = 'DATABASE_UNAVAILABLE'

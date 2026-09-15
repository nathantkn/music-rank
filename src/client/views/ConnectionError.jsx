import { useState } from 'react'
import { checkHealth } from '../lib/api'
import '../styles/ConnectionError.css'

// Shown in place of the whole app when the API can't reach the database. The
// usual cause is Supabase pausing a free project after a week without traffic,
// which resolves itself a minute or so after someone resumes it — so the screen
// is built around retrying rather than around apologising.
export default function ConnectionError({ onRetry }) {
  const [state, setState] = useState('idle')

  async function retry() {
    setState('checking')
    // Ask the health endpoint first. Clearing the failed queries while the
    // database is still asleep would just flash the app and land back here.
    const ok = await checkHealth().catch(() => false)
    if (ok) {
      onRetry()
      return
    }
    setState('still-down')
  }

  return (
    <main className="conn-error">
      <div className="conn-error-card">
        <span className="conn-error-eyebrow">Connection lost</span>
        <h1 className="conn-error-title">The database is taking a nap.</h1>
        <p className="conn-error-body">
          Music Ranker can&rsquo;t reach its database right now. Hosting pauses the
          database after a stretch of inactivity, so it usually just needs to be
          resumed &mdash; give it a minute and try again.
        </p>

        <div className="conn-error-actions">
          <button
            className="conn-error-retry"
            onClick={retry}
            disabled={state === 'checking'}
          >
            {state === 'checking' ? 'Checking…' : 'Try again'}
          </button>
        </div>

        {state === 'still-down' && (
          <p className="conn-error-note" role="status">
            Still no answer. If you own this project, resume the database in the
            Supabase dashboard and retry.
          </p>
        )}
      </div>
    </main>
  )
}

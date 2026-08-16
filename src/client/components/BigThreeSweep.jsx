import { useQuery } from '@tanstack/react-query';
import { bigThreeSweepQuery } from '../lib/api.js';
import '../styles/BigThreeSweep.css';

// Order matters — it reads as the story of the sweep, and the short codes keep
// three badges on one line on a phone.
const AWARDS = [
    { key: 'trackOfCycleWins', code: 'TOC', label: 'Track of the Cycle' },
    { key: 'artistOfCycleWins', code: 'AOC', label: 'Artist of the Cycle' },
    { key: 'bestNewArtistWins', code: 'BNA', label: 'Best New Artist' },
];

export default function BigThreeSweep() {
    const { data: artists, isPending, isError } = useQuery(bigThreeSweepQuery());

    return (
        <section className="sweep">
            <div className="sweep-head">
                <div>
                    <h2 className="sweep-title">Big Three Sweep</h2>
                    <p className="sweep-sub">
                        Track of the Cycle, Artist of the Cycle and Best New Artist — all
                        three, at any point.
                    </p>
                </div>
                {artists?.length > 0 && (
                    <span className="sweep-count">
                        {artists.length} {artists.length === 1 ? 'member' : 'members'}
                    </span>
                )}
            </div>

            {isPending ? (
                <p className="sweep-empty">Loading…</p>
            ) : isError ? (
                <p className="sweep-empty">Couldn&apos;t load the sweep.</p>
            ) : artists.length === 0 ? (
                <p className="sweep-empty">Nobody has taken all three yet.</p>
            ) : (
                <div className="sweep-grid">
                    {artists.map(artist => (
                        <article key={artist.subjectId} className="sweep-card">
                            <div className="sweep-art art-tile">
                                {artist.subjectImage && (
                                    <img
                                        src={artist.subjectImage}
                                        alt=""
                                        loading="lazy"
                                        onError={e => { e.currentTarget.style.display = 'none' }}
                                    />
                                )}
                            </div>

                            <div className="sweep-body">
                                <h3 className="sweep-name">{artist.subjectName}</h3>
                                <p className="sweep-when">
                                    Completed in{' '}
                                    {artist.sweptAtCycleName || `Cycle ${artist.sweptAtCycleId}`}
                                </p>

                                <div className="sweep-badges">
                                    {AWARDS.map(award => (
                                        <span
                                            key={award.key}
                                            className="sweep-badge"
                                            title={`${award.label} — ${artist[award.key]}×`}
                                        >
                                            {award.code}
                                            {artist[award.key] > 1 && (
                                                <em className="sweep-badge-mult">
                                                    ×{artist[award.key]}
                                                </em>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

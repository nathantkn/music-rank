import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bigThreeSweepQuery } from '../lib/api.js';
import '../styles/BigThreeSweep.css';

// Array.from, not name[0] — indexing a string splits surrogate pairs, so names
// outside the BMP would render half a character.
function initial(name) {
    return (Array.from(name ?? '')[0] ?? '?').toUpperCase();
}

function SweepMember({ artist }) {
    // A broken image URL falls back to the monogram rather than a hole in the
    // wall, so the failure needs to survive the img's error event.
    const [imageFailed, setImageFailed] = useState(false);
    const showMonogram = !artist.subjectImage || imageFailed;
    const cycle = artist.sweptAtCycleName || `Cycle ${artist.sweptAtCycleId}`;

    return (
        <article className="sweep-member" title={`Completed in ${cycle}`}>
            <div className="sweep-art">
                <div className={`sweep-art-inner ${showMonogram ? 'is-monogram' : ''}`}>
                    {showMonogram ? (
                        <span className="sweep-initial">{initial(artist.subjectName)}</span>
                    ) : (
                        <img
                            src={artist.subjectImage}
                            alt=""
                            loading="lazy"
                            onError={() => setImageFailed(true)}
                        />
                    )}
                </div>
            </div>

            <h3 className="sweep-name">{artist.subjectName}</h3>
            <p className="sweep-when">{cycle}</p>
        </article>
    );
}

export default function BigThreeSweep() {
    const { data: artists, isPending, isError } = useQuery(bigThreeSweepQuery());

    return (
        <section className="sweep">
            <h2 className="sweep-title">Big Three Sweep</h2>

            {isPending ? (
                <p className="sweep-empty">Loading…</p>
            ) : isError ? (
                <p className="sweep-empty">Couldn&apos;t load the sweep.</p>
            ) : artists.length === 0 ? (
                <p className="sweep-empty">Nobody has taken all three yet.</p>
            ) : (
                // Left to right in the order the API returns: earliest sweep first.
                <div className="sweep-grid">
                    {artists.map(artist => (
                        <SweepMember key={artist.subjectId} artist={artist} />
                    ))}
                </div>
            )}
        </section>
    );
}

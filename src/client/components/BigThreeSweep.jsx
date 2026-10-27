import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { bigThreeQuery } from '../lib/api.js';
import { initial } from '../lib/artists.js';
import '../styles/BigThreeSweep.css';

function WallMember({ artist, verb }) {
    // A broken image URL falls back to the monogram rather than a hole in the
    // wall, so the failure needs to survive the img's error event.
    const [imageFailed, setImageFailed] = useState(false);
    const showMonogram = !artist.subjectImage || imageFailed;
    const cycle = artist.achievedAtCycleName || `Cycle ${artist.achievedAtCycleId}`;

    return (
        <article className="sweep-member" title={`${verb} in ${cycle}`}>
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

            <h3 className="sweep-name">
                <Link className="artist-link" to={`/artists/${artist.subjectId}`}>
                    {artist.subjectName}
                </Link>
            </h3>
            <p className="sweep-when">{cycle}</p>
        </article>
    );
}

// One wall. `variant` picks the treatment: the sweep is the headline, the
// completed wall sits beneath it in a quieter, silver register.
function Wall({ variant, title, verb, emptyText, artists, isPending, isError }) {
    return (
        <section className={`sweep sweep--${variant}`}>
            <h2 className="sweep-title">{title}</h2>

            {isPending ? (
                <p className="sweep-empty">Loading…</p>
            ) : isError ? (
                <p className="sweep-empty">Couldn&apos;t load this list.</p>
            ) : artists.length === 0 ? (
                <p className="sweep-empty">{emptyText}</p>
            ) : (
                // Left to right in the order the API returns: earliest first.
                <div className="sweep-grid">
                    {artists.map(artist => (
                        <WallMember key={artist.subjectId} artist={artist} verb={verb} />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function BigThreeSweep() {
    const { data, isPending, isError } = useQuery(bigThreeQuery());

    return (
        <>
            <Wall
                variant="sweep"
                title="Big Three Sweep"
                verb="Swept"
                emptyText="Nobody has swept all three in a single cycle yet."
                artists={data?.sweep}
                isPending={isPending}
                isError={isError}
            />
            <Wall
                variant="completed"
                title="Big Three"
                verb="Completed"
                emptyText="Nobody has collected all three yet."
                artists={data?.completed}
                isPending={isPending}
                isError={isError}
            />
        </>
    );
}

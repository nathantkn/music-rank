import { useQuery } from '@tanstack/react-query';
import Leaderboard, { formatValue } from './Leaderboard.jsx';
import { leaderboardQuery } from '../lib/api.js';
import '../styles/LeaderboardPreview.css';

function LeaderboardPreview({
    index,
    metric,
    title,
    unit,
    format,
    isExpanded,
    onToggle,
}) {
    // One query per board — the collapsed preview and the expanded table share
    // it, and so does every later visit to this page.
    //
    // isPending rather than isFetching on purpose: a board that already has
    // rows should keep showing them while a background refresh runs, instead of
    // blanking out to "Loading…" on every return to the page.
    const { data: rows, isPending } = useQuery(leaderboardQuery(metric));

    const firstPlace = rows && rows.length > 0 ? rows[0] : null;

    return (
        <div className={`board ${isExpanded ? 'expanded' : ''}`}>
            {/* The header is the only click target */}
            <div className="board-head" onClick={onToggle}>
                <div className="board-head-left">
                    <span className="board-index">{String(index).padStart(2, '0')}</span>
                    <h3 className="board-title">{title}</h3>
                </div>

                <div className="board-leader">
                    {isPending ? (
                        <span className="board-muted">Loading…</span>
                    ) : firstPlace ? (
                        <>
                            <div className="board-leader-text">
                                <div className="board-leader-name">{firstPlace.subjectName}</div>
                                <div className="board-leader-value">
                                    {formatValue(firstPlace.value, format)}
                                    {format === 'duration' ? '' : ` ${unit.toLowerCase()}`}
                                </div>
                            </div>
                            <div className="board-leader-art art-tile">
                                {firstPlace.subjectImage && (
                                    <img
                                        src={firstPlace.subjectImage}
                                        alt=""
                                        loading="lazy"
                                        onError={e => { e.currentTarget.style.display = 'none' }}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <span className="board-muted">No data</span>
                    )}
                </div>

                <span className="board-chevron">{isExpanded ? '−' : '+'}</span>
            </div>

            {isExpanded && (
                <Leaderboard rows={rows} unit={unit} format={format} loading={isPending} />
            )}
        </div>
    );
}

export default LeaderboardPreview;

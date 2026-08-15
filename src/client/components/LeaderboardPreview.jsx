import { useEffect, useState } from 'react';
import Leaderboard, { formatValue } from './Leaderboard.jsx';
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
    // One fetch per board — the collapsed preview and the expanded table share it
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBoard() {
            setLoading(true);

            try {
                const res = await fetch(`/api/leaderboards/${metric}`);
                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `HTTP ${res.status}`);
                }
                const data = await res.json();
                setRows(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchBoard();
    }, [metric]);

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
                    {loading ? (
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
                <Leaderboard rows={rows} unit={unit} format={format} loading={loading} />
            )}
        </div>
    );
}

export default LeaderboardPreview;
